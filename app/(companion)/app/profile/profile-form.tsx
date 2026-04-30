"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ProfileRow } from "@/lib/profiles/types";
import {
  HEALTH_CONCERN_OPTIONS,
  inferKnownConditionsFromLegacy,
  KNOWN_CONDITION_OPTIONS,
  LEGACY_HEALTH_GOAL_TO_SLUG,
  PROFILE_GOAL_OPTIONS,
  PROFILE_GOAL_SLUG_SET,
  SEARCH_RADIUS_OPTIONS,
  SYMPTOM_BASELINE_OPTIONS,
} from "@/lib/profiles/profile-clarity-options";
import { type ProfileSaveState, saveProfile } from "./actions";

function sectionCard(title: string, children: React.ReactNode) {
  return (
    <section className="rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
        selected
          ? "border-accent/50 bg-soft-rose/60 text-foreground"
          : "border-border bg-background text-muted hover:border-accent/35 hover:bg-soft-rose/25"
      }`}
    >
      {label}
    </button>
  );
}

function initialProfileGoalSlugs(profile: ProfileRow): string[] {
  const slugs = new Set<string>();
  for (const g of profile.health_goals) {
    if (PROFILE_GOAL_SLUG_SET.has(g)) slugs.add(g);
    const mapped = LEGACY_HEALTH_GOAL_TO_SLUG[g];
    if (mapped) slugs.add(mapped);
  }
  return [...slugs];
}

function initialKnown(profile: ProfileRow): string[] {
  return profile.known_conditions.length > 0
    ? [...profile.known_conditions]
    : inferKnownConditionsFromLegacy(profile);
}

type ProfileFormProps = {
  profile: ProfileRow;
  variant: "setup" | "edit";
  onCancel?: () => void;
  /** Called once after successful save (e.g. refresh + return to summary). */
  onSaved?: () => void;
};

export function ProfileForm({ profile, variant, onCancel, onSaved }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileSaveState, FormData>(saveProfile, {});
  const didFireSavedRef = useRef(false);

  useEffect(() => {
    if (!state.success) {
      didFireSavedRef.current = false;
      return;
    }
    if (didFireSavedRef.current) return;
    didFireSavedRef.current = true;
    onSaved?.();
  }, [state.success, onSaved]);

  const [knownConditions, setKnownConditions] = useState<string[]>(() => initialKnown(profile));
  const [healthConcerns, setHealthConcerns] = useState<string[]>(() => [...profile.health_concerns]);
  const [symptomBaselines, setSymptomBaselines] = useState<string[]>(() => [...profile.symptom_baselines]);
  const [profileGoals, setProfileGoals] = useState<string[]>(() => initialProfileGoalSlugs(profile));

  const [cycleReg, setCycleReg] = useState<"regular" | "irregular" | "unsure">(() => profile.cycle_regularity);

  function toggleList(list: string[], setList: (v: string[]) => void, slug: string) {
    setList(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
  }

  function toggleKnown(slug: string) {
    if (slug === "none") {
      setKnownConditions(["none"]);
      return;
    }
    setKnownConditions((prev) => {
      const withoutNone = prev.filter((s) => s !== "none");
      if (withoutNone.includes(slug)) return withoutNone.filter((s) => s !== slug);
      return [...withoutNone, slug];
    });
  }

  return (
    <form action={formAction} className="space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-accent/25 bg-soft-rose/35 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Clarity Plan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Zyra uses your profile plus DoctorMatch history to detect patterns and personalize guidance —
          educational only, not a diagnosis.
        </p>
      </div>

      {sectionCard(
        "Profile overview",
        <>
          <div>
            <label htmlFor="full_name" className="text-xs font-semibold text-muted">
              Name
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              defaultValue={profile.full_name ?? ""}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/20 focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="age" className="text-xs font-semibold text-muted">
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                required
                min={13}
                max={120}
                defaultValue={profile.age ?? ""}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/20 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="location" className="text-xs font-semibold text-muted">
                Location (city / ZIP)
              </label>
              <input
                id="location"
                name="location"
                required
                defaultValue={profile.location ?? ""}
                placeholder="City or ZIP"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/20 focus:ring-2"
              />
            </div>
          </div>
        </>,
      )}

      {sectionCard(
        "Health context",
        <div className="flex flex-wrap gap-2">
          {KNOWN_CONDITION_OPTIONS.map(({ slug, label }) => (
            <ChipToggle
              key={slug}
              label={label}
              selected={knownConditions.includes(slug)}
              onClick={() => toggleKnown(slug)}
            />
          ))}
          {knownConditions.map((slug) => (
            <input key={`kc-${slug}`} type="hidden" name="known_conditions" value={slug} />
          ))}
        </div>,
      )}

      {sectionCard(
        "Current concerns",
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONCERN_OPTIONS.map(({ slug, label }) => (
            <ChipToggle
              key={slug}
              label={label}
              selected={healthConcerns.includes(slug)}
              onClick={() => toggleList(healthConcerns, setHealthConcerns, slug)}
            />
          ))}
          {healthConcerns.map((slug) => (
            <input key={`hc-${slug}`} type="hidden" name="health_concerns" value={slug} />
          ))}
        </div>,
      )}

      {sectionCard(
        "Cycle & hormones",
        <>
          <fieldset>
            <legend className="text-xs font-semibold text-muted">Cycle regularity</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["regular", "Regular"],
                  ["irregular", "Irregular"],
                  ["unsure", "Unsure"],
                ] as const
              ).map(([value, lab]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm ${
                    cycleReg === value
                      ? "border-accent/50 bg-soft-rose/60 text-foreground"
                      : "border-border bg-background text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="cycle_regularity"
                    value={value}
                    checked={cycleReg === value}
                    onChange={() => setCycleReg(value)}
                    className="sr-only"
                  />
                  {lab}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="average_cycle_length" className="text-xs font-semibold text-muted">
                Average cycle length (days, optional)
              </label>
              <input
                id="average_cycle_length"
                name="average_cycle_length"
                type="number"
                min={15}
                max={60}
                placeholder={profile.average_cycle_length?.toString() ?? "28"}
                defaultValue={profile.average_cycle_length ?? ""}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/20 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="last_period_start" className="text-xs font-semibold text-muted">
                Last period start (optional)
              </label>
              <input
                id="last_period_start"
                name="last_period_start"
                type="date"
                defaultValue={profile.last_period_start ?? ""}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/20 focus:ring-2"
              />
            </div>
          </div>
        </>,
      )}

      {sectionCard(
        "Goals",
        <div className="flex flex-wrap gap-2">
          {PROFILE_GOAL_OPTIONS.map(({ slug, label }) => (
            <ChipToggle
              key={slug}
              label={label}
              selected={profileGoals.includes(slug)}
              onClick={() => toggleList(profileGoals, setProfileGoals, slug)}
            />
          ))}
          {profileGoals.map((slug) => (
            <input key={`pg-${slug}`} type="hidden" name="profile_health_goals" value={slug} />
          ))}
        </div>,
      )}

      {sectionCard(
        "Symptoms (baseline tendencies)",
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_BASELINE_OPTIONS.map(({ slug, label }) => (
            <ChipToggle
              key={slug}
              label={label}
              selected={symptomBaselines.includes(slug)}
              onClick={() => toggleList(symptomBaselines, setSymptomBaselines, slug)}
            />
          ))}
          {symptomBaselines.map((slug) => (
            <input key={`sb-${slug}`} type="hidden" name="symptom_baselines" value={slug} />
          ))}
        </div>,
      )}

      {sectionCard(
        "Preferences",
        <fieldset>
          <legend className="text-xs font-semibold text-muted">Preferred search radius</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEARCH_RADIUS_OPTIONS.map((miles) => (
              <label
                key={miles}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm ${
                  profile.search_radius_miles === miles
                    ? "border-accent/50 bg-soft-rose/60 text-foreground"
                    : "border-border bg-background text-muted"
                }`}
              >
                <input
                  type="radio"
                  name="search_radius_miles"
                  value={miles}
                  defaultChecked={profile.search_radius_miles === miles}
                  className="sr-only"
                />
                {miles} mi
              </label>
            ))}
          </div>
        </fieldset>,
      )}

      {state.success ? (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
          {variant === "edit" ? "Changes saved." : "Profile saved — you’re ready to personalize Zyra."}
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {variant === "edit" && onCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition hover:border-accent/35 hover:bg-soft-rose/25 disabled:opacity-60 sm:w-auto sm:order-first"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Saving…" : variant === "edit" ? "Save changes" : "Save profile"}
        </button>
      </div>

      {variant === "setup" ? (
        <p className="text-xs text-muted">
          Onboarding answers stay linked to your account; structured fields here refine DoctorMatch and future
          insights.
        </p>
      ) : null}
    </form>
  );
}
