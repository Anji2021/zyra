"use client";

import { useActionState, useState } from "react";
import { calendarTodayIso, validateCycleEntry } from "@/lib/cycles/validation";
import type { CycleRow } from "@/lib/cycles/types";
import { type LogCycleState, logPeriod } from "./actions";

type LogPeriodFormProps = {
  cycles: CycleRow[];
};

export function LogPeriodForm({ cycles }: LogPeriodFormProps) {
  const [state, formAction, pending] = useActionState<LogCycleState, FormData>(logPeriod, {});
  const [clientError, setClientError] = useState<string | null>(null);

  const displayError = clientError ?? state.error;

  return (
    <form
      action={formAction}
      className="min-w-0 space-y-4 sm:space-y-5"
      onSubmit={(e) => {
        const form = e.currentTarget;
        const fd = new FormData(form);
        const startRaw = String(fd.get("start_date") ?? "").trim();
        const endRaw = String(fd.get("end_date") ?? "").trim();
        const endParsed = endRaw.length > 0 ? endRaw : null;
        const today = calendarTodayIso();
        const v = validateCycleEntry({
          existing: cycles,
          draft: { start_date: startRaw, end_date: endParsed },
          today,
        });
        if (!v.ok) {
          e.preventDefault();
          setClientError(v.error);
          return;
        }
        setClientError(null);
      }}
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="min-w-0 space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="cycle-start">
            Start date
          </label>
          <p className="text-xs text-muted">The first day of this period (today or earlier).</p>
          <input
            id="cycle-start"
            name="start_date"
            type="date"
            required
            max={calendarTodayIso()}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2 sm:py-3"
          />
        </div>

        <div className="min-w-0 space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="cycle-end">
            End date <span className="font-normal text-muted">(optional)</span>
          </label>
          <p className="text-xs leading-relaxed text-muted">Leave blank only if this period is currently active.</p>
          <input
            id="cycle-end"
            name="end_date"
            type="date"
            max={calendarTodayIso()}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2 sm:py-3"
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="cycle-notes">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="cycle-notes"
          name="notes"
          rows={3}
          placeholder="Flow, mood, pain — whatever feels helpful to remember."
          className="min-h-[5.5rem] w-full min-w-0 rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      {displayError ? (
        <p
          className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-950"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          aria-busy={pending}
        >
          {pending ? "Saving…" : "Save entry"}
        </button>
        {pending ? <span className="text-xs text-muted">Saving your entry…</span> : null}
      </div>
    </form>
  );
}
