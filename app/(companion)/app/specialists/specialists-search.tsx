"use client";

import { useEffect, useState } from "react";
import type { SpecialistEnrichment } from "@/lib/specialists/enrichment-types";
import {
  ENRICHMENT_DISCLAIMER,
  ENRICHMENT_FAILED_MESSAGE,
  NO_WEBSITE_MESSAGE,
} from "@/lib/specialists/enrichment-types";
import { SPECIALIST_OPTIONS, type SpecialistTypeValue } from "@/lib/specialists/search-query";
import { ZYRA } from "@/lib/zyra/site";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

type SpecialistResult = {
  placeId: string;
  place_id?: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  userRatingsTotal: number | null;
  openNow: boolean | null;
  mapsUrl: string;
  phone: string | null;
  website: string | null;
};

const DISCLAIMER =
  "Zyra helps you discover providers, but does not verify medical quality, insurance coverage, availability, or clinical fit. Please confirm details directly with the provider.";

type SpecialistsSearchProps = {
  initialSavedPlaceIds: string[];
};

type EnrichState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "no_website"; message: string }
  | { status: "done"; data: SpecialistEnrichment }
  | { status: "error"; message: string };

function cardKey(r: SpecialistResult): string {
  return r.placeId?.trim() || `${r.name}-${r.address}`;
}

const TOPIC_ORDER: { key: keyof SpecialistEnrichment["topics"]; label: string }[] = [
  { key: "pcos", label: "PCOS" },
  { key: "irregular_periods", label: "Irregular periods" },
  { key: "fertility", label: "Fertility" },
  { key: "gynecology", label: "Gynecology" },
  { key: "hormone_care", label: "Hormone care" },
  { key: "womens_health", label: "Women’s health" },
];

function topicLabels(topics: SpecialistEnrichment["topics"]) {
  return TOPIC_ORDER.filter(({ key }) => topics[key]);
}

export function SpecialistsSearch({ initialSavedPlaceIds }: SpecialistsSearchProps) {
  const [location, setLocation] = useState("");
  const [specialistType, setSpecialistType] = useState<SpecialistTypeValue>("gynecologist");
  const [results, setResults] = useState<SpecialistResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState(() => new Set(initialSavedPlaceIds));
  const [togglePid, setTogglePid] = useState<string | null>(null);
  const [enrichByKey, setEnrichByKey] = useState<Record<string, EnrichState>>({});

  const savedKey = initialSavedPlaceIds.slice().sort().join("|");
  useEffect(() => {
    setSavedPlaceIds(new Set(initialSavedPlaceIds));
  }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when server-sourced id list changes

  useEffect(() => {
    if (error) console.error("[SpecialistsSearch]", error);
  }, [error]);

  async function search() {
    const loc = location.trim();
    if (!loc || loading) return;

    setError(null);
    setResults(null);
    setEnrichByKey({});
    setLoading(true);

    try {
      const res = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, specialistType }),
      });
      const data = (await res.json()) as { results?: SpecialistResult[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? FRIENDLY_TRY_AGAIN);
        return;
      }

      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setError(FRIENDLY_TRY_AGAIN);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSave(r: SpecialistResult) {
    const pid = r.placeId?.trim();
    if (!pid) return;
    setError(null);
    setTogglePid(pid);
    try {
      const res = await fetch("/api/specialists/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: pid,
          name: r.name,
          address: r.address,
          rating: r.rating,
        }),
      });
      const data = (await res.json()) as { saved?: boolean; place_id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? FRIENDLY_TRY_AGAIN);
        return;
      }
      if (typeof data.saved === "boolean" && data.place_id) {
        setSavedPlaceIds((prev) => {
          const next = new Set(prev);
          if (data.saved) next.add(data.place_id!);
          else next.delete(data.place_id!);
          return next;
        });
      }
    } catch {
      setError(FRIENDLY_TRY_AGAIN);
    } finally {
      setTogglePid(null);
    }
  }

  async function analyzeClinic(r: SpecialistResult) {
    const key = cardKey(r);
    setEnrichByKey((prev) => ({ ...prev, [key]: { status: "loading" } }));
    try {
      const res = await fetch("/api/specialists/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: r.name,
          address: r.address,
          website: r.website ?? undefined,
          place_id: r.placeId || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        noWebsite?: boolean;
        message?: string;
        enrichment?: SpecialistEnrichment;
        error?: string;
      };

      if (!res.ok) {
        console.error("[SpecialistsSearch] enrich HTTP", res.status, data);
        setEnrichByKey((prev) => ({
          ...prev,
          [key]: { status: "error", message: data.error ?? ENRICHMENT_FAILED_MESSAGE },
        }));
        return;
      }

      if (data.noWebsite) {
        setEnrichByKey((prev) => ({
          ...prev,
          [key]: { status: "no_website", message: data.message ?? NO_WEBSITE_MESSAGE },
        }));
        return;
      }

      if (data.enrichment) {
        setEnrichByKey((prev) => ({
          ...prev,
          [key]: { status: "done", data: data.enrichment! },
        }));
        return;
      }

      setEnrichByKey((prev) => ({
        ...prev,
        [key]: { status: "error", message: ENRICHMENT_FAILED_MESSAGE },
      }));
    } catch (e) {
      console.error("[SpecialistsSearch] enrich", e);
      setEnrichByKey((prev) => ({
        ...prev,
        [key]: { status: "error", message: ENRICHMENT_FAILED_MESSAGE },
      }));
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/80 bg-surface/90 p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          <div className="sm:col-span-2">
            <label htmlFor="specialist-location" className="block text-xs font-semibold uppercase tracking-wide text-muted">
              Location
            </label>
            <input
              id="specialist-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state, or ZIP code"
              disabled={loading}
              autoComplete="postal-code"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2 disabled:opacity-60"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="specialist-type" className="block text-xs font-semibold uppercase tracking-wide text-muted">
              Specialist type
            </label>
            <select
              id="specialist-type"
              value={specialistType}
              onChange={(e) => setSpecialistType(e.target.value as SpecialistTypeValue)}
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2 disabled:opacity-60"
            >
              {SPECIALIST_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void search()}
          disabled={loading || !location.trim()}
          className="mt-6 w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
        >
          {loading ? "Searching…" : "Search specialists"}
        </button>
      </div>

      <p className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-center text-xs leading-relaxed text-muted sm:text-sm">
        {DISCLAIMER}
      </p>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-center text-sm text-red-950"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-background/50 py-16 text-sm text-muted">
          <span
            className="size-9 animate-spin rounded-full border-2 border-accent border-t-transparent"
            aria-hidden
          />
          <p>Searching nearby providers…</p>
        </div>
      ) : null}

      {!loading && results !== null && results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-background/60 px-5 py-12 text-center">
          <p className="font-serif text-lg font-medium text-foreground">No providers found</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Try a broader location or a different specialist type. {ZYRA.name} only surfaces what
            Google returns — it cannot guarantee matches in every area.
          </p>
        </div>
      ) : null}

      {!loading && results !== null && results.length > 0 ? (
        <ul className="space-y-4">
          {results.map((r) => {
            const pid = r.placeId?.trim() ?? "";
            const canSave = pid.length > 0;
            const isSaved = canSave && savedPlaceIds.has(pid);
            const toggling = togglePid === pid;
            const key = cardKey(r);
            const enrich = enrichByKey[key] ?? { status: "idle" as const };
            const canAnalyze = Boolean(pid || (r.website && r.website.trim()));

            return (
              <li key={key} className="rounded-2xl border border-border/70 bg-background/90 p-5 shadow-sm sm:p-6">
                <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">{r.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.address}</p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
                  {r.rating != null ? (
                    <span className="font-medium text-foreground">Rating: {r.rating.toFixed(1)}</span>
                  ) : (
                    <span>Rating: not shown</span>
                  )}
                  {(r.reviewCount ?? r.userRatingsTotal) != null ? (
                    <span>
                      {(r.reviewCount ?? r.userRatingsTotal)!} review
                      {(r.reviewCount ?? r.userRatingsTotal) === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {r.openNow === true ? (
                    <span className="text-emerald-700">Open now</span>
                  ) : r.openNow === false ? (
                    <span>May be closed now</span>
                  ) : null}
                </div>

                {r.website ? (
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-medium text-foreground/80">Website: </span>
                    <a
                      href={r.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-accent underline-offset-2 hover:underline"
                    >
                      {r.website}
                    </a>
                  </p>
                ) : null}

                <p className="mt-3 text-sm text-foreground">
                  <span className="text-muted">Phone: </span>
                  {r.phone ?? "Phone not available"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={r.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent/40"
                  >
                    Open in Google Maps
                  </a>
                  {canSave ? (
                    <button
                      type="button"
                      onClick={() => void toggleSave(r)}
                      disabled={toggling}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Remove from saved" : "Save specialist"}
                      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        isSaved
                          ? "border-accent/40 bg-soft-rose/50 text-accent hover:bg-soft-rose/70"
                          : "border-border bg-background text-foreground hover:border-accent/40 hover:bg-soft-rose/25"
                      }`}
                    >
                      {toggling ? "…" : isSaved ? "Saved" : "Save"}
                    </button>
                  ) : null}
                  {canAnalyze ? (
                    <button
                      type="button"
                      onClick={() => void analyzeClinic(r)}
                      disabled={enrich.status === "loading"}
                      className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-soft-rose/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {enrich.status === "loading" ? "Checking…" : "Analyze clinic website"}
                    </button>
                  ) : null}
                </div>

                {enrich.status === "loading" ? (
                  <p className="mt-4 text-sm italic text-muted" role="status">
                    Zyra is checking the clinic website…
                  </p>
                ) : null}

                {enrich.status === "no_website" ? (
                  <p className="mt-4 rounded-2xl border border-border/60 bg-soft-rose/25 px-4 py-3 text-sm text-muted">
                    {enrich.message || NO_WEBSITE_MESSAGE}
                  </p>
                ) : null}

                {enrich.status === "error" ? (
                  <p className="mt-4 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-950">
                    {enrich.message}
                  </p>
                ) : null}

                {enrich.status === "done" ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-surface/80 p-4 sm:p-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Summary</p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">{enrich.data.summary}</p>
                    </div>
                    {enrich.data.services_offered.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Services mentioned</p>
                        <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                          {enrich.data.services_offered.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {topicLabels(enrich.data.topics).length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                          Women’s health topics mentioned on the site
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {topicLabels(enrich.data.topics)
                            .map((t) => t.label)
                            .join(" · ")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">No specific women’s health topics were clearly flagged on the page.</p>
                    )}
                    {enrich.data.appointment_url ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Appointments</p>
                        <a
                          href={enrich.data.appointment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block break-all text-sm font-semibold text-accent underline-offset-2 hover:underline"
                        >
                          {enrich.data.appointment_url}
                        </a>
                      </div>
                    ) : null}
                    {enrich.data.phone_listed ? (
                      <p className="text-sm text-foreground">
                        <span className="text-muted">Phone on site: </span>
                        {enrich.data.phone_listed}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted">
                      <span className="font-medium text-foreground/80">Source: </span>
                      <a
                        href={enrich.data.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-accent underline-offset-2 hover:underline"
                      >
                        {enrich.data.source_url}
                      </a>
                    </p>
                    <p className="border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted">
                      {ENRICHMENT_DISCLAIMER}
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
