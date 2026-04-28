"use client";

import { useState } from "react";
import { formatCycleDate } from "@/lib/cycles/format";
import type { CycleRow } from "@/lib/cycles/types";
import { deleteCycleEntry, updateCycleEntry } from "./actions";

export function CycleHistoryList({ cycles }: { cycles: CycleRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ul className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
      {cycles.map((c) => {
        const isEditing = editingId === c.id;
        return (
          <li
            key={c.id}
            className="rounded-xl border border-border/60 bg-background/85 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4"
          >
            {isEditing ? (
              <form action={updateCycleEntry.bind(null, c.id)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground" htmlFor={`cycle-start-${c.id}`}>
                      Start date
                    </label>
                    <input
                      id={`cycle-start-${c.id}`}
                      name="start_date"
                      type="date"
                      required
                      defaultValue={c.start_date}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground" htmlFor={`cycle-end-${c.id}`}>
                      End date
                    </label>
                    <input
                      id={`cycle-end-${c.id}`}
                      name="end_date"
                      type="date"
                      defaultValue={c.end_date ?? ""}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground" htmlFor={`cycle-notes-${c.id}`}>
                    Notes
                  </label>
                  <textarea
                    id={`cycle-notes-${c.id}`}
                    name="notes"
                    rows={2}
                    defaultValue={c.notes ?? ""}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-border/90 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {formatCycleDate(c.start_date)}
                  <span className="mx-2 font-normal text-muted">→</span>
                  {c.end_date ? formatCycleDate(c.end_date) : <span className="text-muted">still open</span>}
                </p>
                {c.notes ? <p className="mt-2 text-sm leading-relaxed text-muted">{c.notes}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(c.id)}
                    className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
                  >
                    Edit
                  </button>
                  <form
                    action={deleteCycleEntry.bind(null, c.id)}
                    onSubmit={(event) => {
                      if (!window.confirm("Are you sure you want to delete this cycle entry?")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-red-200/80 hover:bg-red-50/50 sm:text-sm"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
