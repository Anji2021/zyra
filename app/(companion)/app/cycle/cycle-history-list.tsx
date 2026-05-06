"use client";

import { useActionState, useState } from "react";
import { formatCycleDateSafe } from "@/lib/cycles/format";
import type { CycleRow } from "@/lib/cycles/types";
import { calendarTodayIso, periodInclusiveDayCount, validateCycleEntry } from "@/lib/cycles/validation";
import { deleteCycleEntry, updateCycleEntryAction } from "./actions";

const actionBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm";

function closedBleedLengthLabel(c: CycleRow): string | null {
  if (!c.end_date) return null;
  if (c.end_date < c.start_date) return "Range needs review";
  try {
    const n = periodInclusiveDayCount(c.start_date, c.end_date);
    if (!Number.isFinite(n) || n < 1) return null;
    return `${n} day${n === 1 ? "" : "s"}`;
  } catch {
    return null;
  }
}

function CycleRowEdit({
  cycle,
  allCycles,
  onCancel,
}: {
  cycle: CycleRow;
  allCycles: CycleRow[];
  onCancel: () => void;
}) {
  const today = calendarTodayIso();
  const [state, formAction, pending] = useActionState(updateCycleEntryAction, {});
  const [clientError, setClientError] = useState<string | null>(null);
  const displayError = clientError ?? state.error;

  return (
    <form
      action={formAction}
      className="min-w-0 space-y-3"
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const startRaw = String(fd.get("start_date") ?? "").trim();
        const endRaw = String(fd.get("end_date") ?? "").trim();
        const endParsed = endRaw.length > 0 ? endRaw : null;
        const v = validateCycleEntry({
          existing: allCycles,
          draft: { start_date: startRaw, end_date: endParsed },
          excludeId: cycle.id,
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
      <input type="hidden" name="cycle_id" value={cycle.id} />
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <label className="text-xs font-semibold text-foreground" htmlFor={`cycle-start-${cycle.id}`}>
            Start date
          </label>
          <input
            id={`cycle-start-${cycle.id}`}
            name="start_date"
            type="date"
            required
            max={today}
            defaultValue={cycle.start_date}
            className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div className="min-w-0 space-y-1">
          <label className="text-xs font-semibold text-foreground" htmlFor={`cycle-end-${cycle.id}`}>
            End date
          </label>
          <p className="text-[11px] leading-snug text-muted">Leave blank only if this row is active.</p>
          <input
            id={`cycle-end-${cycle.id}`}
            name="end_date"
            type="date"
            max={today}
            defaultValue={cycle.end_date ?? ""}
            className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
          />
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <label className="text-xs font-semibold text-foreground" htmlFor={`cycle-notes-${cycle.id}`}>
          Notes
        </label>
        <textarea
          id={`cycle-notes-${cycle.id}`}
          name="notes"
          rows={2}
          defaultValue={cycle.notes ?? ""}
          className="min-h-[4.25rem] w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2"
        />
      </div>
      {displayError ? (
        <p className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-950" role="alert">
          {displayError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className={`${actionBtn} border-border bg-surface text-accent hover:border-accent/40 disabled:opacity-60`}
          aria-busy={pending}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${actionBtn} border-border bg-background text-foreground hover:border-border/90`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CycleHistoryList({ cycles }: { cycles: CycleRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ul className="mt-4 flex min-w-0 flex-col gap-3 sm:mt-5">
      {cycles.map((c) => {
        const isEditing = editingId === c.id;
        const isOpen = c.end_date == null || String(c.end_date).trim() === "";
        const durationLabel = closedBleedLengthLabel(c);

        return (
          <li
            key={c.id}
            className="min-w-0 rounded-xl border border-border/60 bg-background/85 p-3.5 sm:rounded-2xl sm:p-4"
          >
            {isEditing ? (
              <CycleRowEdit cycle={c} allCycles={cycles} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    {isOpen ? (
                      <span className="rounded-full bg-soft-rose/55 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                        Active
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold text-foreground">
                      <time dateTime={c.start_date}>{formatCycleDateSafe(c.start_date)}</time>
                      <span className="mx-2 font-normal text-muted">→</span>
                      {c.end_date ? (
                        <time dateTime={c.end_date}>{formatCycleDateSafe(c.end_date)}</time>
                      ) : (
                        <span className="text-accent">Still open</span>
                      )}
                    </span>
                  </div>
                  {durationLabel ? (
                    <p className="text-xs font-medium text-muted">Bleed duration: {durationLabel}</p>
                  ) : null}
                  {c.notes ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted">{c.notes}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => setEditingId(c.id)}
                    className={`${actionBtn} min-w-[4.75rem] border-border bg-surface text-accent hover:border-accent/40`}
                  >
                    Edit
                  </button>
                  <form
                    action={deleteCycleEntry.bind(null, c.id)}
                    className="min-w-0"
                    onSubmit={(event) => {
                      if (!window.confirm("Are you sure you want to delete this cycle entry?")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className={`${actionBtn} w-full border-border bg-background text-foreground hover:border-red-200/80 hover:bg-red-50/50 sm:w-auto`}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
