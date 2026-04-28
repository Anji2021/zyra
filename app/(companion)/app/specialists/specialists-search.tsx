"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { SPECIALIST_OPTIONS, type SpecialistTypeValue } from "@/lib/specialists/search-query";

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

type RatingFilter = "any" | "4.0" | "4.5";

type SpecialistsSearchProps = {
  initialSavedPlaceIds: string[];
  /** When true, first cards can show a “good match” style badge */
  hasHealthContext: boolean;
};

function StarsRow({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 shrink-0 sm:size-4 ${
            i < full ? "fill-accent text-accent" : "fill-transparent text-border/55"
          }`}
          strokeWidth={1.35}
        />
      ))}
    </span>
  );
}

function FilterChip({
  selected,
  children,
  onClick,
  disabled,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
        selected
          ? "border-accent/50 bg-soft-rose/60 text-foreground"
          : "border-border/80 bg-background/90 text-muted hover:border-accent/30 hover:bg-soft-rose/30"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function SpecialistsSearch({ initialSavedPlaceIds, hasHealthContext }: SpecialistsSearchProps) {
  const [location, setLocation] = useState("");
  const [specialistType, setSpecialistType] = useState<SpecialistTypeValue>("gynecologist");
  const [results, setResults] = useState<SpecialistResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState(() => new Set(initialSavedPlaceIds));
  const [togglePid, setTogglePid] = useState<string | null>(null);

  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("any");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);

  const resetFilters = useCallback(() => {
    setRatingFilter("any");
    setOpenNowOnly(false);
    setSavedOnly(false);
  }, []);

  const savedKey = initialSavedPlaceIds.slice().sort().join("|");
  useEffect(() => {
    setSavedPlaceIds(new Set(initialSavedPlaceIds));
  }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when server-sourced id list changes

  useEffect(() => {
    if (error) console.error("[SpecialistsSearch]", error);
  }, [error]);

  const visibleResults = useMemo(() => {
    if (!results) return null;
    return results.filter((r) => {
      const pid = r.placeId?.trim() ?? "";
      if (savedOnly && (!pid || !savedPlaceIds.has(pid))) return false;
      if (openNowOnly && r.openNow !== true) return false;
      if (ratingFilter === "4.5" && (r.rating == null || r.rating < 4.5)) return false;
      if (ratingFilter === "4.0" && (r.rating == null || r.rating < 4.0)) return false;
      return true;
    });
  }, [results, savedOnly, openNowOnly, ratingFilter, savedPlaceIds]);

  async function search() {
    const loc = location.trim();
    if (!loc || loading) return;

    setError(null);
    setResults(null);
    resetFilters();
    setLoading(true);

    try {
      const res = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, specialistType }),
      });
      const data = (await res.json()) as { results?: SpecialistResult[]; error?: string };

      if (!res.ok) {
        if (data.error) console.error("[SpecialistsSearch] search error:", data.error);
        setError("Something went wrong. Please try again.");
        return;
      }

      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("[SpecialistsSearch] search exception:", err);
      setError("Something went wrong. Please try again.");
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
        if (data.error) console.error("[SpecialistsSearch] save error:", data.error);
        setError("Something went wrong. Please try again.");
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
    } catch (err) {
      console.error("[SpecialistsSearch] save exception:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setTogglePid(null);
    }
  }

  const filtersActive = ratingFilter !== "any" || openNowOnly || savedOnly;
  const filteredEmpty =
    results != null && results.length > 0 && visibleResults != null && visibleResults.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
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
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2 disabled:opacity-60 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-3"
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
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2 disabled:opacity-60 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-3"
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
          className="mt-4 w-full rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6 sm:max-w-xs sm:py-3.5"
        >
          {loading ? "Searching…" : "Search specialists"}
        </button>
      </div>

      <p className="rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-center text-[11px] leading-relaxed text-muted sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/50 py-10 text-sm text-muted sm:gap-3 sm:rounded-3xl sm:py-16">
          <span
            className="size-9 animate-spin rounded-full border-2 border-accent border-t-transparent"
            aria-hidden
          />
          <p>Searching nearby providers…</p>
        </div>
      ) : null}

      {!loading && results !== null && results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-8 text-center sm:rounded-3xl sm:px-5 sm:py-10">
          <p className="font-serif text-base font-semibold text-foreground sm:text-lg">
            No specialists found nearby
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Try a different search phrase, broaden your location, or check again later. Google may
            return fewer results in some areas.
          </p>
        </div>
      ) : null}

      {!loading && results !== null && results.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-surface/80 p-3 shadow-sm sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs">
              Filter results
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
              <div className="flex w-full min-w-0 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-auto sm:flex-1 [&::-webkit-scrollbar]:hidden">
                <FilterChip selected={ratingFilter === "any"} onClick={() => setRatingFilter("any")}>
                  Any rating
                </FilterChip>
                <FilterChip
                  selected={ratingFilter === "4.0"}
                  onClick={() => setRatingFilter("4.0")}
                >
                  4.0+ stars
                </FilterChip>
                <FilterChip
                  selected={ratingFilter === "4.5"}
                  onClick={() => setRatingFilter("4.5")}
                >
                  4.5+ stars
                </FilterChip>
                <FilterChip
                  selected={openNowOnly}
                  onClick={() => setOpenNowOnly((v) => !v)}
                >
                  Open now
                </FilterChip>
                <FilterChip selected={savedOnly} onClick={() => setSavedOnly((v) => !v)}>
                  Saved only
                </FilterChip>
              </div>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="shrink-0 text-[11px] font-semibold text-accent underline-offset-2 hover:underline sm:text-xs"
                >
                  Reset
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted">
              Distance sorting isn&apos;t available — Google Places text search doesn&apos;t return
              miles in this view.
            </p>
          </div>

          {filteredEmpty ? (
            <div
              className="rounded-xl border border-dashed border-border/80 bg-background/65 px-4 py-6 text-center"
              role="status"
            >
              <p className="text-sm font-medium text-foreground">No specialists match these filters</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-sm font-semibold text-accent underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="space-y-2.5 sm:space-y-3">
              {(visibleResults ?? []).map((r, index) => {
                const pid = r.placeId?.trim() ?? "";
                const canSave = pid.length > 0;
                const isSaved = canSave && savedPlaceIds.has(pid);
                const toggling = togglePid === pid;
                const key = pid || `${r.name}-${r.address}`;
                const showBadge = index < 2;
                const badgeLabel = hasHealthContext
                  ? "Good match for your needs"
                  : "Suggested starting point";

                return (
                  <li
                    key={key}
                    className="relative rounded-xl border border-border/70 bg-background/90 p-3.5 shadow-sm sm:rounded-2xl sm:p-4"
                  >
                    {showBadge ? (
                      <span className="mb-2 inline-block rounded-full border border-accent/25 bg-soft-rose/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        {badgeLabel}
                      </span>
                    ) : null}

                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <h2 className="min-w-0 font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
                        {r.name}
                      </h2>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {r.rating != null && !Number.isNaN(r.rating) ? (
                        <>
                          <StarsRow rating={r.rating} />
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {r.rating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted">No rating</span>
                      )}
                      {(r.reviewCount ?? r.userRatingsTotal) != null ? (
                        <span className="text-xs text-muted">
                          ({(r.reviewCount ?? r.userRatingsTotal)} review
                          {(r.reviewCount ?? r.userRatingsTotal) === 1 ? "" : "s"})
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-snug text-muted sm:text-sm">
                      {r.address}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                      {r.openNow === true ? (
                        <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 font-medium text-emerald-900">
                          Open now
                        </span>
                      ) : r.openNow === false ? (
                        <span className="rounded-full bg-border/50 px-2 py-0.5 font-medium text-muted">
                          May be closed now
                        </span>
                      ) : (
                        <span className="text-muted">Hours unknown</span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[11px] text-muted sm:text-xs">
                      <span>
                        <span className="font-medium text-foreground/80">Phone: </span>
                        {r.phone ?? "—"}
                      </span>
                      {r.website ? (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-accent underline-offset-2 hover:underline"
                        >
                          Website
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={r.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 sm:min-h-0 sm:flex-none sm:text-sm"
                      >
                        Maps
                      </a>
                      {canSave ? (
                        <button
                          type="button"
                          onClick={() => void toggleSave(r)}
                          disabled={toggling}
                          aria-pressed={isSaved}
                          aria-label={isSaved ? "Remove from saved" : "Save specialist"}
                          className={`inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:flex-none sm:text-sm ${
                            isSaved
                              ? "border-accent/40 bg-soft-rose/50 text-accent hover:bg-soft-rose/70"
                              : "border-border bg-background text-foreground hover:border-accent/40 hover:bg-soft-rose/25"
                          }`}
                        >
                          {toggling ? "…" : isSaved ? "Saved" : "Save"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
