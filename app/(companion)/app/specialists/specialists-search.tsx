"use client";

import { useMemo, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { FilterChipsRow } from "@/components/product/page-system";
import {
  normalizeDoctorMatchResponse,
  recommendSpecialistFromSymptoms,
  type DoctorMatchRecommendation,
} from "@/lib/specialists/doctor-match";
import {
  getSpecialistLabel,
  SPECIALIST_OPTIONS,
  type SpecialistTypeValue,
} from "@/lib/specialists/search-query";

type PlacesResult = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  lat: number | null;
  lng: number | null;
  distanceMiles: number | null;
  mapsUrl: string;
  apiOrder: number;
};

type PlacesApiRow = Omit<PlacesResult, "apiOrder">;

type RatingFilter = "all" | "4" | "4.5";
type DistanceFilter = "all" | "15" | "10" | "5";
type SortKey = "relevance" | "rating" | "reviews" | "distance";

const DISCLAIMER =
  "Listings are informational. Confirm quality, insurance, and availability directly with each provider.";
const EXAMPLE_SYMPTOMS = [
  "Irregular periods",
  "PCOS symptoms",
  "Pelvic pain",
  "Stomach pain",
  "Hormonal acne",
] as const;

const EDUCATIONAL_LINE = "Educational suggestion — confirm with a licensed clinician.";

function oneLineReason(reason: string, max = 160): string {
  const t = reason.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function withApiOrder(rows: PlacesApiRow[], start: number): PlacesResult[] {
  return rows.map((r, i) => ({ ...r, apiOrder: start + i }));
}

function StarsRow({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3 shrink-0 ${
            i < full ? "fill-accent text-accent" : "fill-transparent text-border/55"
          }`}
          strokeWidth={1.35}
        />
      ))}
    </span>
  );
}

function ResultCardSkeleton() {
  return (
    <li className="flex h-full min-h-[11rem] animate-pulse flex-col rounded-xl border border-border/50 bg-background/60 p-3">
      <div className="h-4 w-[70%] rounded bg-border/70" />
      <div className="mt-3 h-3 w-[40%] rounded bg-border/60" />
      <div className="mt-3 h-3 w-full flex-1 rounded bg-border/50" />
      <div className="mt-4 h-9 w-full rounded-full bg-border/50" />
    </li>
  );
}

export function SpecialistsSearch() {
  const [location, setLocation] = useState("");
  const [specialistType, setSpecialistType] = useState<SpecialistTypeValue>("gynecologist");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [doctorMatchResult, setDoctorMatchResult] = useState<DoctorMatchRecommendation | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesLoadingMore, setPlacesLoadingMore] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [placesRaw, setPlacesRaw] = useState<PlacesResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [symptomError, setSymptomError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("relevance");

  const hasAnyDistance = useMemo(
    () => placesRaw.some((p) => p.distanceMiles != null && p.distanceMiles > 0),
    [placesRaw],
  );

  const filteredSorted = useMemo(() => {
    let list = [...placesRaw];

    if (ratingFilter === "4.5") {
      list = list.filter((p) => p.rating != null && p.rating >= 4.5);
    } else if (ratingFilter === "4") {
      list = list.filter((p) => p.rating != null && p.rating >= 4.0);
    }

    if (distanceFilter !== "all" && hasAnyDistance) {
      const maxMi = Number(distanceFilter);
      list = list.filter((p) => p.distanceMiles != null && p.distanceMiles <= maxMi);
    }

    if (sortKey === "rating") {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.apiOrder - b.apiOrder);
    } else if (sortKey === "reviews") {
      list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || a.apiOrder - b.apiOrder);
    } else if (sortKey === "distance" && hasAnyDistance) {
      list.sort((a, b) => {
        const da = a.distanceMiles ?? 1e9;
        const db = b.distanceMiles ?? 1e9;
        return da - db || a.apiOrder - b.apiOrder;
      });
    } else if (sortKey === "relevance" || (sortKey === "distance" && !hasAnyDistance)) {
      list.sort((a, b) => a.apiOrder - b.apiOrder);
    }

    return list;
  }, [placesRaw, ratingFilter, distanceFilter, sortKey, hasAnyDistance]);

  function mapApiResults(rows: PlacesApiRow[]): PlacesApiRow[] {
    return rows.map((r) => ({
      placeId: r.placeId,
      name: r.name,
      address: r.address,
      rating: r.rating,
      reviewCount: r.reviewCount,
      openNow: r.openNow ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
      distanceMiles: r.distanceMiles ?? null,
      mapsUrl: r.mapsUrl,
    }));
  }

  async function generateMatchAndNearby() {
    const combinedSymptoms = symptoms.join(", ").trim();
    const loc = location.trim();
    if (generateLoading || placesLoading || placesLoadingMore) return;

    setSymptomError(combinedSymptoms ? null : "Please add at least one symptom");
    setLocationError(loc ? null : "Please enter your city or ZIP code.");
    if (!combinedSymptoms || !loc) {
      if (!combinedSymptoms) {
        const symptomField = document.getElementById("doctor-match-input") as HTMLInputElement | null;
        symptomField?.focus();
      } else {
        const locationField = document.getElementById("specialist-location") as HTMLInputElement | null;
        locationField?.focus();
      }
      return;
    }

    setHasGenerated(true);
    setGenerateLoading(true);
    setPlacesLoading(true);
    setPlacesError(null);
    setPlacesRaw([]);
    setNextPageToken(null);

    let recommendation: DoctorMatchRecommendation;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/doctor-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: combinedSymptoms }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        recommendation = recommendSpecialistFromSymptoms(combinedSymptoms);
      } else {
        const data = (await res.json()) as { recommendation?: unknown };
        const normalized = normalizeDoctorMatchResponse(
          (data.recommendation ?? null) as {
            pattern?: unknown;
            specialist?: unknown;
            reason?: unknown;
            carePath?: unknown;
            questionsToAsk?: unknown;
            urgentCareWarning?: unknown;
            searchTerm?: unknown;
          } | null,
        );
        recommendation = normalized ?? recommendSpecialistFromSymptoms(combinedSymptoms);
      }
    } catch {
      recommendation = recommendSpecialistFromSymptoms(combinedSymptoms);
    }

    setDoctorMatchResult(recommendation);
    const cleanedSpecialistType = recommendation.specialistType;
    const cleanedSearchLabel = getSpecialistLabel(cleanedSpecialistType);
    setSpecialistType(cleanedSpecialistType);

    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: cleanedSearchLabel,
          location: loc,
        }),
      });
      const data = (await res.json()) as {
        results?: PlacesApiRow[];
        nextPageToken?: string | null;
        error?: string;
      };

      if (!res.ok) {
        if (data.error) console.error("[SpecialistsSearch] places error:", data.error);
        setPlacesError("We couldn't load nearby options right now. Try again in a moment.");
        setPlacesRaw([]);
        setNextPageToken(null);
        return;
      }

      const rows = mapApiResults(Array.isArray(data.results) ? data.results : []);
      setPlacesRaw(withApiOrder(rows, 0));
      setNextPageToken(typeof data.nextPageToken === "string" && data.nextPageToken ? data.nextPageToken : null);
    } catch (err) {
      console.error("[SpecialistsSearch] places exception:", err);
      setPlacesError("We couldn't load nearby options right now. Try again in a moment.");
      setPlacesRaw([]);
      setNextPageToken(null);
    } finally {
      setPlacesLoading(false);
      setGenerateLoading(false);
    }
  }

  async function loadMoreDoctors() {
    const loc = location.trim();
    if (!nextPageToken || placesLoadingMore || !loc) return;

    setPlacesLoadingMore(true);
    setPlacesError(null);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageToken: nextPageToken,
          location: loc,
        }),
      });
      const data = (await res.json()) as {
        results?: PlacesApiRow[];
        nextPageToken?: string | null;
        error?: string;
      };

      if (!res.ok) {
        if (data.error) console.error("[SpecialistsSearch] load more:", data.error);
        setPlacesError("Could not load more right now. Try again shortly.");
        return;
      }

      const rows = mapApiResults(Array.isArray(data.results) ? data.results : []);
      setPlacesRaw((prev) => {
        const keyOf = (p: PlacesApiRow) => (p.placeId ? p.placeId : `${p.name}|${p.address}`);
        const seen = new Set(prev.map(keyOf));
        const unique = rows.filter((r) => !seen.has(keyOf(r)));
        unique.forEach((r) => seen.add(keyOf(r)));
        const start = prev.length;
        return [...prev, ...withApiOrder(unique, start)];
      });
      setNextPageToken(typeof data.nextPageToken === "string" && data.nextPageToken ? data.nextPageToken : null);
    } catch (err) {
      console.error("[SpecialistsSearch] load more exception:", err);
      setPlacesError("Could not load more right now. Try again shortly.");
    } finally {
      setPlacesLoadingMore(false);
    }
  }

  function addSymptomChip(rawValue: string) {
    const value = rawValue.trim();
    if (!value) return;
    setSymptoms((prev) => {
      if (prev.some((item) => item.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
    setSymptomInput("");
    setSymptomError(null);
  }

  function removeSymptomChip(symptom: string) {
    setSymptoms((prev) => prev.filter((item) => item !== symptom));
  }

  const locDisplay = location.trim() || "your area";
  const rawCount = placesRaw.length;
  const shownCount = filteredSorted.length;
  const showingLabel =
    rawCount === 0
      ? null
      : rawCount >= 10
        ? `Showing 10+ doctors near ${locDisplay}`
        : `Showing ${shownCount} doctor${shownCount === 1 ? "" : "s"} near ${locDisplay}`;

  const filterChip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:py-2 ${
      active
        ? "border-accent/50 bg-soft-rose/50 text-foreground"
        : "border-border/70 bg-background/90 text-muted hover:border-accent/30"
    }`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] space-y-3 pb-2 sm:space-y-4 sm:pb-3">
      <header className="space-y-0.5">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Find the right specialist
        </h1>
        <p className="text-sm text-muted">
          Based on your symptoms, here&apos;s who you can consult next.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        {/* Left: inputs — fixed ~320px on desktop, sticky */}
        <aside className="order-1 w-full min-w-0 lg:sticky lg:top-[4.75rem] lg:z-0 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:pr-1">
          <div className="space-y-2.5 rounded-xl border border-border/80 bg-surface/90 p-3 shadow-sm sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Inputs</p>
            <div>
              <label
                htmlFor="doctor-match-input"
                className="block text-[10px] font-semibold uppercase tracking-wide text-muted"
              >
                Symptoms
              </label>
              <div className="mt-1 rounded-lg border border-border bg-background px-2 py-1.5">
                {symptoms.length > 0 ? (
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    {symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="inline-flex items-center gap-0.5 rounded-full border border-accent/25 bg-soft-rose/60 px-1.5 py-0.5 text-[10px] text-foreground"
                      >
                        {symptom}
                        <button
                          type="button"
                          onClick={() => removeSymptomChip(symptom)}
                          className="rounded-full text-muted transition hover:text-foreground"
                          aria-label={`Remove ${symptom}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <input
                  id="doctor-match-input"
                  type="text"
                  value={symptomInput}
                  onChange={(event) => {
                    setSymptomInput(event.target.value);
                    if (symptomError) setSymptomError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSymptomChip(symptomInput);
                    }
                  }}
                  placeholder="e.g. irregular periods, fatigue"
                  className="w-full border-0 bg-transparent p-0 text-sm text-foreground outline-none ring-0 placeholder:text-muted/75"
                />
              </div>
              {symptomError ? <p className="mt-0.5 text-[11px] text-red-700">{symptomError}</p> : null}
              <div className="mt-1 flex flex-wrap gap-1">
                {EXAMPLE_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => {
                      addSymptomChip(symptom);
                    }}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted transition hover:border-accent/35 hover:bg-soft-rose/30 hover:text-foreground"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="specialist-location"
                className="block text-[10px] font-semibold uppercase tracking-wide text-muted"
              >
                Location (ZIP or city)
              </label>
              <input
                id="specialist-location"
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (locationError) setLocationError(null);
                  if (placesError) setPlacesError(null);
                }}
                placeholder="ZIP or city"
                autoComplete="postal-code"
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2"
              />
              {locationError ? <p className="mt-0.5 text-[11px] text-red-700">{locationError}</p> : null}
            </div>

            <div>
              <label
                htmlFor="specialist-type"
                className="block text-[10px] font-semibold uppercase tracking-wide text-muted"
              >
                Specialist type
              </label>
              <select
                id="specialist-type"
                value={specialistType}
                onChange={(e) => setSpecialistType(e.target.value as SpecialistTypeValue)}
                disabled={generateLoading || placesLoading}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2 disabled:opacity-60"
              >
                {SPECIALIST_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void generateMatchAndNearby()}
              disabled={generateLoading || placesLoading}
              className="flex min-h-10 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Find specialists
            </button>
          </div>
        </aside>

        {/* Right: suggested (full width) + results (full width) */}
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:gap-5">
          <section aria-labelledby="suggested-specialist-heading">
            <h2 id="suggested-specialist-heading" className="sr-only">
              Suggested specialist
            </h2>
            {(generateLoading || placesLoading) && hasGenerated ? (
              <div className="rounded-xl border border-dashed border-accent/25 bg-soft-rose/15 px-4 py-6 text-center text-sm text-muted sm:py-7">
                Finding a match and nearby practices…
              </div>
            ) : !hasGenerated ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-6 text-center text-sm text-muted sm:py-8">
                Add symptoms and location, then tap{" "}
                <span className="font-medium text-foreground">Find specialists</span>.
              </div>
            ) : doctorMatchResult ? (
              <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3 shadow-sm sm:px-5 sm:py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Suggested specialist</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-semibold leading-tight text-foreground sm:text-xl">
                      {getSpecialistLabel(doctorMatchResult.specialistType)}
                    </p>
                    <p className="mt-1.5 text-sm leading-snug text-foreground/90">{oneLineReason(doctorMatchResult.reason)}</p>
                  </div>
                  <p className="shrink-0 text-[10px] leading-snug text-muted sm:max-w-[14rem] sm:text-right">
                    {EDUCATIONAL_LINE}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-5 text-center text-sm text-muted">
                No recommendation yet.
              </div>
            )}
          </section>

          <section
            className="rounded-xl border border-border/80 bg-surface/90 p-3 shadow-sm sm:p-4 lg:p-5"
            aria-labelledby="nearby-specialists-heading"
          >
            <h2 id="nearby-specialists-heading" className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Nearby specialists
            </h2>
            <p className="mt-0.5 text-[10px] leading-snug text-muted/90">Google Places · up to 20 per page</p>

            {!hasGenerated ? (
              <p className="mt-2 text-[11px] text-muted">Run a search to see practices near you.</p>
            ) : (
              <>
                {showingLabel ? (
                  <p className="mt-2 text-xs font-medium text-foreground">{showingLabel}</p>
                ) : null}

                {/* Mobile: horizontal scroll; desktop: wrap so chips are never clipped */}
                <FilterChipsRow className="mt-3" label="Filter results">
                  <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                    ⭐
                  </span>
                  {(
                    [
                      { k: "all" as const, label: "All ratings" },
                      { k: "4" as const, label: "4.0+" },
                      { k: "4.5" as const, label: "4.5+" },
                    ] as const
                  ).map(({ k, label }) => (
                    <button key={k} type="button" className={filterChip(ratingFilter === k)} onClick={() => setRatingFilter(k)}>
                      {label}
                    </button>
                  ))}
                  <span className="mx-1 shrink-0 self-center text-border/60" aria-hidden>
                    |
                  </span>
                  <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                    📍
                  </span>
                  {(
                    [
                      { k: "all" as const, label: "Any distance" },
                      { k: "15" as const, label: "≤15 mi" },
                      { k: "10" as const, label: "≤10 mi" },
                      { k: "5" as const, label: "≤5 mi" },
                    ] as const
                  ).map(({ k, label }) => (
                    <button
                      key={k}
                      type="button"
                      disabled={k !== "all" && !hasAnyDistance}
                      className={`${filterChip(distanceFilter === k)} ${k !== "all" && !hasAnyDistance ? "cursor-not-allowed opacity-40" : ""}`}
                      onClick={() => setDistanceFilter(k)}
                    >
                      {label}
                    </button>
                  ))}
                  <span className="mx-1 shrink-0 self-center text-border/60" aria-hidden>
                    |
                  </span>
                  <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                    🩺
                  </span>
                  <select
                    aria-label="Specialist type filter"
                    value={specialistType}
                    onChange={(e) => setSpecialistType(e.target.value as SpecialistTypeValue)}
                    disabled={generateLoading || placesLoading}
                    className="min-h-9 shrink-0 rounded-full border border-border/70 bg-background px-2.5 text-xs font-semibold text-foreground"
                  >
                    {SPECIALIST_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="mx-1 shrink-0 self-center text-border/60" aria-hidden>
                    |
                  </span>
                  <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                    🔤
                  </span>
                  {(
                    [
                      { k: "relevance" as const, label: "Relevance" },
                      { k: "rating" as const, label: "Highest rated" },
                      { k: "reviews" as const, label: "Most reviewed" },
                      { k: "distance" as const, label: "Closest" },
                    ] as const
                  ).map(({ k, label }) => (
                    <button
                      key={k}
                      type="button"
                      disabled={k === "distance" && !hasAnyDistance}
                      className={`${filterChip(sortKey === k)} ${k === "distance" && !hasAnyDistance ? "cursor-not-allowed opacity-40" : ""}`}
                      onClick={() => setSortKey(k)}
                    >
                      {label}
                    </button>
                  ))}
                </FilterChipsRow>
                {!hasAnyDistance ? (
                  <p className="mt-1 text-[10px] text-muted">Distance filters and “Closest” sort use your location when coordinates are available.</p>
                ) : null}

                {placesError ? (
                  <p className="mt-2 rounded-lg border border-red-200/80 bg-red-50/90 px-2 py-1.5 text-[11px] text-red-950">
                    {placesError}
                  </p>
                ) : null}

                {placesLoading ? (
                  <ul
                    className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
                    aria-busy="true"
                    aria-label="Loading results"
                  >
                    {Array.from({ length: 6 }, (_, i) => (
                      <ResultCardSkeleton key={i} />
                    ))}
                  </ul>
                ) : placesRaw.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No listings. Try another location.</p>
                ) : filteredSorted.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No doctors match these filters. Loosen filters or load more.</p>
                ) : (
                  <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-stretch md:gap-4">
                    {filteredSorted.map((place) => (
                      <li
                        key={place.placeId || `${place.name}-${place.address}-${place.apiOrder}`}
                        className="flex h-full min-h-0 flex-col rounded-xl border border-border/55 bg-background/95 p-3 sm:p-4"
                      >
                        <p className="text-[15px] font-semibold leading-snug text-foreground">{place.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {place.rating != null && !Number.isNaN(place.rating) ? (
                            <>
                              <StarsRow rating={place.rating} />
                              <span className="text-xs font-semibold tabular-nums text-foreground">
                                {place.rating.toFixed(1)}
                              </span>
                              {place.reviewCount != null && place.reviewCount > 0 ? (
                                <span className="text-[11px] text-muted">
                                  ({place.reviewCount.toLocaleString()} reviews)
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-[11px] text-muted">No rating yet</span>
                          )}
                        </div>
                        <p className="mt-2 flex min-h-0 flex-1 gap-1.5 text-xs leading-snug text-muted">
                          <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent/70" aria-hidden />
                          <span className="min-w-0 break-words">{place.address}</span>
                        </p>
                        {place.distanceMiles != null && place.distanceMiles > 0 ? (
                          <p className="mt-1.5 text-[11px] text-muted">~{place.distanceMiles.toFixed(1)} mi</p>
                        ) : null}
                        <a
                          href={place.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full border border-accent/40 bg-background px-3 text-xs font-semibold text-accent transition hover:bg-soft-rose/40 sm:mt-auto"
                        >
                          Open in Maps
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {nextPageToken ? (
                  <button
                    type="button"
                    onClick={() => void loadMoreDoctors()}
                    disabled={placesLoadingMore || placesLoading}
                    className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-soft-rose/35 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {placesLoadingMore ? "Loading more…" : "Load more doctors"}
                  </button>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>

      <p className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-1.5 text-center text-[10px] leading-snug text-muted">
        {DISCLAIMER}
      </p>
    </div>
  );
}
