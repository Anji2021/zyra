"use client";

import { useActionState } from "react";
import { type LogCycleState, logPeriod } from "./actions";

export function LogPeriodForm() {
  const [state, formAction, pending] = useActionState<LogCycleState, FormData>(logPeriod, {});

  return (
    <form action={formAction} className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="cycle-start">
          Start date
        </label>
        <p className="text-xs text-muted">The first day of this period.</p>
        <input
          id="cycle-start"
          name="start_date"
          type="date"
          required
          className="w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="cycle-end">
          End date <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="cycle-end"
          name="end_date"
          type="date"
          className="w-full max-w-xs rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="cycle-notes">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="cycle-notes"
          name="notes"
          rows={3}
          placeholder="Flow, mood, pain — whatever feels helpful to remember."
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          {state.error}
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
