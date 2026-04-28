"use client";

import { useActionState, useEffect } from "react";
import { type LogMedicineState, logMedicine } from "./actions";

export function MedicineForm() {
  const [state, formAction, pending] = useActionState<LogMedicineState, FormData>(logMedicine, {});

  useEffect(() => {
    if (state.error) console.error("[MedicineForm]", state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="med-name">
          Medicine name
        </label>
        <input
          id="med-name"
          name="name"
          type="text"
          required
          autoComplete="off"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="med-dosage">
            Dosage <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="med-dosage"
            name="dosage"
            type="text"
            placeholder="e.g. 500 mg"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="med-frequency">
            Frequency <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="med-frequency"
            name="frequency"
            type="text"
            placeholder="e.g. Once daily"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="med-start">
            Start date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="med-start"
            name="start_date"
            type="date"
            className="w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="med-end">
            End date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="med-end"
            name="end_date"
            type="date"
            className="w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="med-notes">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="med-notes"
          name="notes"
          rows={2}
          placeholder="How it felt, changes, or reminders for your clinician."
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
