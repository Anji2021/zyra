"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Star } from "lucide-react";
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
import { CarePrepVideoCard } from "@/components/specialists/care-prep-video-card";

type PlacesResult = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  mapsUrl: string;
  distanceMiles?: number | null;
};

const DISCLAIMER =
  "Listings are informational. Confirm quality, insurance, and availability directly with each provider.";
const EXAMPLE_SYMPTOMS = [
  "Irregular periods",
  "PCOS symptoms",
  "Pelvic pain",
  "Stomach pain",
  "Hormonal acne",
] as const;

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

function CareAccordion({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-lg border border-border/60 bg-background/85"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-accent [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-border/40 px-3 py-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
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
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [placesResults, setPlacesResults] = useState<PlacesResult[] | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [symptomError, setSymptomError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function generateMatchAndNearby() {
    const combinedSymptoms = symptoms.join(", ").trim();
    const loc = location.trim();
    if (generateLoading || placesLoading) return;

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
    setPlacesResults(null);

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
      const data = (await res.json()) as { results?: PlacesResult[]; error?: string };

      if (!res.ok) {
        if (data.error) console.error("[SpecialistsSearch] places error:", data.error);
        setPlacesError("We couldn't load nearby options right now. You can still review the recommendation.");
        setPlacesResults([]);
        return;
      }

      setPlacesResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("[SpecialistsSearch] places exception:", err);
      setPlacesError("We couldn't load nearby options right now. You can still review the recommendation.");
      setPlacesResults([]);
    } finally {
      setPlacesLoading(false);
      setGenerateLoading(false);
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

  const topNearbyPlaces = placesResults?.slice(0, 3) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-4 sm:space-y-5">
      <header className="space-y-0.5">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your Care Plan
        </h1>
        <p className="text-sm text-muted">Based on your symptoms, here&apos;s what to do next</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,260px)] lg:items-start lg:gap-5">
        <aside className="mx-auto w-full max-w-[300px] lg:mx-0 lg:max-w-none lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-xl border border-border/80 bg-surface/90 p-3.5 shadow-sm sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Your inputs</p>
            <div>
              <label
                htmlFor="doctor-match-input"
                className="block text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Symptoms
              </label>
              <div className="mt-1.5 rounded-lg border border-border bg-background px-2.5 py-2">
                {symptoms.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-soft-rose/60 px-2 py-0.5 text-[11px] text-foreground"
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
              {symptomError ? <p className="mt-1 text-xs text-red-700">{symptomError}</p> : null}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {EXAMPLE_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => {
                      addSymptomChip(symptom);
                    }}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-accent/35 hover:bg-soft-rose/30 hover:text-foreground"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="specialist-location"
                className="block text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Location
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
                placeholder="City or ZIP"
                autoComplete="postal-code"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2"
              />
              {locationError ? <p className="mt-1 text-xs text-red-700">{locationError}</p> : null}
            </div>

            <div>
              <label
                htmlFor="specialist-type"
                className="block text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Specialist type
              </label>
              <select
                id="specialist-type"
                value={specialistType}
                onChange={(e) => setSpecialistType(e.target.value as SpecialistTypeValue)}
                disabled={generateLoading || placesLoading}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none ring-accent/25 transition focus:ring-2 disabled:opacity-60"
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
              className="flex h-10 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate plan
            </button>
          </div>
        </aside>

        <section className="min-w-0" aria-labelledby="care-insight-heading">
          <h2 id="care-insight-heading" className="sr-only">
            Care insight
          </h2>
          {(generateLoading || placesLoading) && hasGenerated ? (
            <div className="rounded-xl border border-dashed border-accent/25 bg-soft-rose/15 px-4 py-10 text-center text-sm text-muted">
              Updating your plan and nearby listings…
            </div>
          ) : !hasGenerated ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-10 text-center text-sm text-muted">
              Add symptoms and location, then tap <span className="font-medium text-foreground">Generate plan</span>.
            </div>
          ) : doctorMatchResult ? (
            <div className="rounded-xl border border-border/80 bg-surface/90 p-3.5 shadow-sm sm:p-4">
              <div className="space-y-3 rounded-lg border border-accent/20 bg-soft-rose/35 p-3">
                {doctorMatchResult.pattern ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">Possible pattern</p>
                    <p className="mt-1 text-sm font-medium leading-snug text-foreground">
                      {doctorMatchResult.pattern}
                    </p>
                  </div>
                ) : null}
                <div className={doctorMatchResult.pattern ? "border-t border-border/40 pt-3" : ""}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">Recommended specialist</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{doctorMatchResult.specialist}</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <CareAccordion title="Why this match" defaultOpen>
                  <p>{doctorMatchResult.reason}</p>
                </CareAccordion>
                <CareAccordion title="Suggested next steps">
                  <ul className="space-y-1.5">
                    {doctorMatchResult.carePath.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-accent" aria-hidden>
                          ·
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CareAccordion>
                <CareAccordion title="Questions to ask">
                  <ul className="space-y-1.5">
                    {doctorMatchResult.questionsToAsk.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-accent" aria-hidden>
                          ·
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CareAccordion>
                <CareAccordion title="Seek urgent care if">
                  <p>{doctorMatchResult.urgentCareWarning}</p>
                </CareAccordion>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-8 text-center text-sm text-muted">
              No recommendation yet.
            </div>
          )}
        </section>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start" aria-labelledby="nearby-specialists-heading">
          <div className="rounded-xl border border-border/80 bg-surface/90 p-3 shadow-sm sm:p-3.5">
            <h2 id="nearby-specialists-heading" className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Nearby specialists
            </h2>
            <p className="mt-1 text-[10px] leading-snug text-muted/90">Google Places · top 3</p>

            {!hasGenerated ? (
              <p className="mt-3 text-xs text-muted">Generate your plan to see options.</p>
            ) : placesLoading ? (
              <p className="mt-3 text-xs text-muted">Loading…</p>
            ) : placesResults === null ? (
              <p className="mt-3 text-xs text-muted">—</p>
            ) : placesError ? (
              <p className="mt-3 rounded-lg border border-red-200/80 bg-red-50/90 px-2.5 py-2 text-xs text-red-950">
                {placesError}
              </p>
            ) : topNearbyPlaces.length === 0 ? (
              <p className="mt-3 text-xs text-muted">No listings. Try another location.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {topNearbyPlaces.map((place) => (
                  <li
                    key={place.placeId || `${place.name}-${place.address}`}
                    className="rounded-lg border border-border/60 bg-background/90 p-2.5"
                  >
                    <p className="text-sm font-semibold leading-snug text-foreground">{place.name}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{place.address}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {place.rating != null && !Number.isNaN(place.rating) ? (
                        <>
                          <StarsRow rating={place.rating} />
                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {place.rating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-muted">No rating</span>
                      )}
                    </div>
                    <a
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex min-h-9 w-full items-center justify-center rounded-full border border-border bg-surface px-3 text-[11px] font-semibold text-accent transition hover:border-accent/40"
                    >
                      Open in Maps
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {doctorMatchResult ? (
        <section
          className="rounded-xl border border-accent/35 bg-gradient-to-br from-soft-rose/50 via-soft-rose/25 to-background p-3 shadow-[0_8px_30px_-12px_rgba(233,109,154,0.35)] ring-1 ring-accent/15 sm:p-4"
          aria-label="CarePrep video"
        >
          <CarePrepVideoCard symptoms={symptoms} recommendation={doctorMatchResult} />
        </section>
      ) : null}

      <p className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-center text-[11px] leading-snug text-muted">
        {DISCLAIMER}
      </p>
    </div>
  );
}
