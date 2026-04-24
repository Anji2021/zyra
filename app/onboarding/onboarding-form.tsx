"use client";

import { useActionState } from "react";
import { CONDITION_OPTIONS } from "@/lib/profiles/condition-options";
import { ZYRA } from "@/lib/zyra/site";
import { type OnboardingActionState, saveOnboardingProfile } from "./actions";

type OnboardingFormProps = {
  defaultFullName: string;
};

export function OnboardingForm({ defaultFullName }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState<
    OnboardingActionState,
    FormData
  >(saveOnboardingProfile, {});

  return (
    <form action={formAction} className="space-y-8">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          defaultValue={defaultFullName}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor="age">
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min={13}
            max={120}
            required
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            placeholder="City or region you feel comfortable sharing"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-foreground" htmlFor="health_goals">
          Health goals
        </label>
        <p className="text-xs text-muted">
          One idea per line — for example, “understand my cycle” or “prepare for my next
          visit.”
        </p>
        <textarea
          id="health_goals"
          name="health_goals"
          required
          rows={4}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Known conditions</legend>
        <p className="text-xs text-muted">Choose any that apply. You can update this later.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONDITION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm transition hover:border-accent/40"
            >
              <input type="checkbox" name="conditions" value={opt.value} className="size-4 accent-accent" />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted" htmlFor="condition_other">
            If you chose “Other”, add a short note
          </label>
          <input
            id="condition_other"
            name="condition_other"
            type="text"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Cycle regularity</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
            <input type="radio" name="cycle_regular" value="true" required className="size-4 accent-accent" />
            <span>Usually regular</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
            <input type="radio" name="cycle_regular" value="false" className="size-4 accent-accent" />
            <span>Often irregular</span>
          </label>
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="block text-sm font-semibold text-foreground"
            htmlFor="average_cycle_length"
          >
            Average cycle length (days)
          </label>
          <p className="text-xs text-muted">Optional if your cycle is regular; helpful if not.</p>
          <input
            id="average_cycle_length"
            name="average_cycle_length"
            type="number"
            inputMode="numeric"
            min={15}
            max={60}
            placeholder="e.g. 28"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-sm font-semibold text-foreground"
            htmlFor="last_period_start"
          >
            Last period start
          </label>
          <p className="text-xs text-muted">Optional — add it if you remember the date.</p>
          <input
            id="last_period_start"
            name="last_period_start"
            type="date"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Your health information is private and only used to personalize your {ZYRA.name}{" "}
        experience.
      </p>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save and continue"}
        </button>
        <p className="text-center text-xs text-muted sm:text-left">
          You can revisit these details later from Profile.
        </p>
      </div>
    </form>
  );
}
