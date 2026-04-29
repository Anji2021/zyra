"use client";

import { useActionState } from "react";
import { createReminder, type ReminderActionState } from "./actions";

const REMINDER_TYPES = [
  "Period reminder",
  "Medicine reminder",
  "Symptom check-in",
  "Doctor appointment",
  "Custom reminder",
] as const;

const FREQUENCIES = ["once", "daily", "weekly", "monthly"] as const;

type ReminderFormDefaults = {
  type?: string;
  frequency?: string;
  title?: string;
  message?: string;
  reminderDate?: string;
  reminderTime?: string;
};

function localDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localTimeInputValue(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function ReminderForm({ defaults }: { defaults?: ReminderFormDefaults }) {
  const [state, formAction, pending] = useActionState<ReminderActionState, FormData>(createReminder, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="reminder-type">
            Type
          </label>
          <select
            id="reminder-type"
            name="type"
            defaultValue={defaults?.type || REMINDER_TYPES[0]}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
            required
          >
            {REMINDER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="reminder-frequency">
            Frequency
          </label>
          <select
            id="reminder-frequency"
            name="frequency"
            defaultValue={defaults?.frequency || "once"}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
            required
          >
            {FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="reminder-title">
          Title
        </label>
        <input
          id="reminder-title"
          name="title"
          type="text"
          required
          defaultValue={defaults?.title || ""}
          placeholder="e.g. Evening medicine"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="reminder-message">
          Message <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="reminder-message"
          name="message"
          rows={2}
          defaultValue={defaults?.message || ""}
          placeholder="A gentle note for your future self."
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="reminder-date">
            Date
          </label>
          <input
            id="reminder-date"
            name="reminder_date"
            type="date"
            required
            defaultValue={defaults?.reminderDate || localDateInputValue()}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="reminder-time">
            Time
          </label>
          <input
            id="reminder-time"
            name="reminder_time"
            type="time"
            required
            defaultValue={defaults?.reminderTime || localTimeInputValue()}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
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
        {pending ? "Saving…" : "Save reminder"}
      </button>
    </form>
  );
}
