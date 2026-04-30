"use client";

import { useState } from "react";
import {
  normalizeDoctorMatchResponse,
  recommendSpecialistFromSymptoms,
  type DoctorMatchRecommendation,
} from "@/lib/specialists/doctor-match";

export function LandingDoctorMatch() {
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoctorMatchRecommendation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleGenerate() {
    const s = symptoms.trim();
    const loc = location.trim();
    if (!s) {
      setFormError("Add at least one symptom.");
      setResult(null);
      return;
    }
    if (!loc) {
      setFormError("Add your ZIP or city.");
      setResult(null);
      return;
    }
    setFormError(null);
    setLoading(true);
    setResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/doctor-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ symptoms: s }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
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
        setResult(normalized ?? recommendSpecialistFromSymptoms(s));
      } else {
        setResult(recommendSpecialistFromSymptoms(s));
      }
    } catch {
      setResult(recommendSpecialistFromSymptoms(s));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">DoctorMatch</p>
      <p className="mt-1 text-xs text-muted">
        Educational only — not medical advice. Same engine as inside Zyra.
      </p>

      <label htmlFor="landing-symptoms" className="mt-4 block text-xs font-semibold text-foreground">
        Symptoms
      </label>
      <textarea
        id="landing-symptoms"
        value={symptoms}
        onChange={(e) => {
          setSymptoms(e.target.value);
          if (formError) setFormError(null);
        }}
        rows={3}
        placeholder="e.g. irregular periods, bloating, fatigue"
        className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/20 focus:ring-2"
      />

      <label htmlFor="landing-location" className="mt-3 block text-xs font-semibold text-foreground">
        ZIP or city
      </label>
      <input
        id="landing-location"
        type="text"
        value={location}
        onChange={(e) => {
          setLocation(e.target.value);
          if (formError) setFormError(null);
        }}
        placeholder="94107 or Austin, TX"
        autoComplete="postal-code"
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/20 focus:ring-2"
      />

      {formError ? <p className="mt-2 text-xs text-red-700">{formError}</p> : null}

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={loading}
        className="mt-4 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate match"}
      </button>

      {result ? (
        <div className="mt-4 rounded-xl border border-border/70 bg-background/90 p-3 text-sm">
          {result.pattern ? (
            <p className="text-xs text-muted">
              <span className="font-semibold text-foreground">Pattern: </span>
              {result.pattern}
            </p>
          ) : null}
          <p className={`text-xs text-muted ${result.pattern ? "mt-2" : ""}`}>
            <span className="font-semibold text-foreground">Specialist: </span>
            {result.specialist}
          </p>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Sign in to save history, search nearby providers, and use the full Clarity Plan.
          </p>
        </div>
      ) : null}
    </div>
  );
}
