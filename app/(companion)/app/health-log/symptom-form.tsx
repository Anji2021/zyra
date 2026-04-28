"use client";

import { useActionState, useEffect } from "react";
import { type LogSymptomState, logSymptom } from "./actions";

function localDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function SymptomForm() {
  const [state, formAction, pending] = useActionState<LogSymptomState, FormData>(logSymptom, {});

  useEffect(() => {
    if (state.error) console.error("[SymptomForm]", state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="sym-name">
          Symptom
        </label>
        <input
          id="sym-name"
          name="symptom"
          type="text"
          required
          placeholder="e.g. cramps, headache, fatigue"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="sym-severity">
            Severity <span className="font-normal text-muted">(optional, 1–5)</span>
          </label>
          <select
            id="sym-severity"
            name="severity"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
            defaultValue=""
          >
            <option value="">Not sure / skip</option>
            <option value="1">1 — very mild</option>
            <option value="2">2</option>
            <option value="3">3 — moderate</option>
            <option value="4">4</option>
            <option value="5">5 — intense</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="sym-date">
            Logged date
          </label>
          <input
            id="sym-date"
            name="logged_date"
            type="date"
            required
            defaultValue={localDateInputValue()}
            className="w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="sym-notes">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="sym-notes"
          name="notes"
          rows={2}
          placeholder="Context that might help you or your clinician later."
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>
      {state.error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          Something went wrong. Please try again.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
