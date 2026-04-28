"use client";

import { useActionState, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ProfileRow } from "@/lib/profiles/types";
import { ZYRA } from "@/lib/zyra/site";
import { type OnboardingActionState, saveOnboardingProfile } from "./actions";

const HEALTH_FOCUS_OPTIONS = [
  "Irregular periods",
  "PCOS/PCOD",
  "Period pain",
  "Fertility planning",
  "Hormonal health",
  "Medication tracking",
  "General wellness",
] as const;

const GOAL_OPTIONS = [
  "Understand my cycle",
  "Track symptoms",
  "Remember medicines",
  "Find specialists",
  "Learn about women’s health",
] as const;

type OnboardingFormProps = {
  defaultFullName: string;
  existingProfile: ProfileRow | null;
};

const TOTAL_STEPS = 6;

function progressLabel(step: number): string {
  return `Step ${step} of ${TOTAL_STEPS}`;
}

function RequirementBadge({ required }: { required: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        required ? "bg-soft-rose/60 text-accent" : "bg-background text-muted"
      }`}
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}

export function OnboardingForm({ defaultFullName, existingProfile }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState<
    OnboardingActionState,
    FormData
  >(saveOnboardingProfile, {});
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(existingProfile?.full_name ?? defaultFullName);
  const [age, setAge] = useState(existingProfile?.age?.toString() ?? "");
  const [location, setLocation] = useState(existingProfile?.location ?? "");
  const [conditions, setConditions] = useState<string[]>(existingProfile?.conditions ?? []);
  const [lastPeriodStart, setLastPeriodStart] = useState(existingProfile?.last_period_start ?? "");
  const [averageCycleLength, setAverageCycleLength] = useState(
    existingProfile?.average_cycle_length?.toString() ?? "",
  );
  const [cycleRegular, setCycleRegular] = useState<"true" | "false" | "">(
    existingProfile?.cycle_regular === null ? "" : existingProfile?.cycle_regular ? "true" : "false",
  );
  const [healthGoals, setHealthGoals] = useState<string[]>(existingProfile?.health_goals ?? []);

  const canContinue = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return Boolean(fullName.trim() && age.trim() && location.trim());
    if (step === 3) return true;
    if (step === 4) return Boolean(cycleRegular && averageCycleLength.trim() && lastPeriodStart.trim());
    if (step === 5) return true;
    return true;
  }, [step, fullName, age, location, cycleRegular, averageCycleLength, lastPeriodStart]);

  function toggleItem(setter: Dispatch<SetStateAction<string[]>>, value: string) {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{progressLabel(step)}</p>
        <div className="h-1.5 w-full rounded-full bg-soft-rose/40">
          <div
            className="h-1.5 rounded-full bg-accent transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <p className="rounded-2xl border border-border/70 bg-soft-rose/15 px-4 py-3 text-xs leading-relaxed text-muted">
          Only answer what you’re comfortable sharing. Zyra uses this to personalize your experience.
        </p>
      </div>

      {step === 1 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome to Zyra
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Track your health, understand patterns, and take thoughtful next steps with support that
            feels personal.
          </p>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Basic profile
          </h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground" htmlFor="full_name">
              Full name <RequirementBadge required />
            </label>
            <p className="text-xs text-muted">Used to personalize your Zyra experience.</p>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Anjali"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground" htmlFor="age">
                Age <RequirementBadge required />
              </label>
              <p className="text-xs text-muted">Helps Zyra provide age-aware educational context.</p>
              <input
                id="age"
                name="age"
                type="number"
                inputMode="numeric"
                min={13}
                max={120}
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="29"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground" htmlFor="location">
                Location <RequirementBadge required />
              </label>
              <p className="text-xs text-muted">Used later to help find nearby specialists.</p>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Santa Clara, CA"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
              />
            </div>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Health focus
          </h2>
          <div className="flex items-center gap-2">
            <RequirementBadge required={false} />
            <p className="text-sm text-muted">
              Select any areas you want Zyra to support. You can change this later.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {HEALTH_FOCUS_OPTIONS.map((label) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm transition hover:border-accent/40"
              >
                <input
                  type="checkbox"
                  name="conditions"
                  value={label}
                  checked={conditions.includes(label)}
                  onChange={() => toggleItem(setConditions, label)}
                  className="size-4 accent-accent"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Cycle baseline
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground" htmlFor="last_period_start">
                Last period start date <RequirementBadge required />
              </label>
              <p className="text-xs text-muted">This helps estimate your next cycle. You can update it anytime.</p>
              <input
                id="last_period_start"
                name="last_period_start"
                type="date"
                required
                value={lastPeriodStart}
                onChange={(event) => setLastPeriodStart(event.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground" htmlFor="average_cycle_length">
                Average cycle length <RequirementBadge required />
              </label>
              <p className="text-xs text-muted">Most cycles are around 21–35 days. If unsure, use 28.</p>
              <input
                id="average_cycle_length"
                name="average_cycle_length"
                type="number"
                inputMode="numeric"
                min={15}
                max={60}
                required
                value={averageCycleLength}
                onChange={(event) => setAverageCycleLength(event.target.value)}
                placeholder="28"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-accent/30 transition focus:ring-2"
              />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
              Cycle regularity <RequirementBadge required />
            </legend>
            <p className="text-xs text-muted">Choose what best matches your usual pattern.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
                <input
                  type="radio"
                  name="cycle_regular"
                  value="true"
                  checked={cycleRegular === "true"}
                  onChange={() => setCycleRegular("true")}
                  className="size-4 accent-accent"
                />
                <span>Usually regular</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-sm">
                <input
                  type="radio"
                  name="cycle_regular"
                  value="false"
                  checked={cycleRegular === "false"}
                  onChange={() => setCycleRegular("false")}
                  className="size-4 accent-accent"
                />
                <span>Often irregular</span>
              </label>
            </div>
          </fieldset>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Personalization goals
          </h2>
          <div className="flex items-center gap-2">
            <RequirementBadge required={false} />
            <p className="text-xs text-muted">These help personalize your home insights and reminders.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {GOAL_OPTIONS.map((label) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm transition hover:border-accent/40"
              >
                <input
                  type="checkbox"
                  name="health_goals"
                  value={label}
                  checked={healthGoals.includes(label)}
                  onChange={() => toggleItem(setHealthGoals, label)}
                  className="size-4 accent-accent"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {step === 6 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            You&apos;re all set
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Thanks for sharing this. {ZYRA.name} will use it to personalize your home, reminders, and
            next steps.
          </p>
        </section>
      ) : null}

      <input type="hidden" name="full_name" value={fullName} />
      <input type="hidden" name="age" value={age} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="last_period_start" value={lastPeriodStart} />
      <input type="hidden" name="average_cycle_length" value={averageCycleLength} />
      <input type="hidden" name="cycle_regular" value={cycleRegular} />
      {conditions.map((value) => (
        <input key={`condition-${value}`} type="hidden" name="conditions" value={value} />
      ))}
      {healthGoals.map((value) => (
        <input key={`goal-${value}`} type="hidden" name="health_goals" value={value} />
      ))}

      <p className="text-xs leading-relaxed text-muted">
        Your health information is private and only visible to you.
      </p>

      {state.error ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 1 || pending}
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            disabled={!canContinue || pending}
            onClick={() => setStep((current) => Math.min(TOTAL_STEPS, current + 1))}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Go to Zyra"}
          </button>
        )}
      </div>
    </form>
  );
}
