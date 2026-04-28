import type { ProfileRow } from "./types";

export type ProfileCompleteness = {
  percent: number;
  summary: string;
  missing: string[];
  lastPeriodCaptured: boolean;
};

export function isProfileComplete(profile: ProfileRow | null): boolean {
  if (!profile) return false;
  const hasCycleLength =
    profile.average_cycle_length != null &&
    Number.isFinite(profile.average_cycle_length) &&
    profile.average_cycle_length >= 15 &&
    profile.average_cycle_length <= 60;

  return Boolean(
    profile.full_name?.trim() &&
      profile.age != null &&
      profile.age >= 13 &&
      profile.age <= 120 &&
      profile.location?.trim() &&
      Boolean(profile.last_period_start) &&
      profile.cycle_regular !== null &&
      hasCycleLength,
  );
}

/** Warm, human-readable completion — not clinical scoring. */
export function getProfileCompleteness(profile: ProfileRow | null): ProfileCompleteness {
  if (!profile) {
    return {
      percent: 0,
      summary: "Your profile has not been saved yet.",
      missing: ["Complete onboarding to unlock your home space."],
      lastPeriodCaptured: false,
    };
  }

  const checks: { label: string; ok: boolean }[] = [
    { label: "Your name", ok: Boolean(profile.full_name?.trim()) },
    { label: "Age", ok: profile.age != null && profile.age > 0 },
    { label: "Location", ok: Boolean(profile.location?.trim()) },
    { label: "Last period start", ok: Boolean(profile.last_period_start) },
    { label: "Cycle regularity", ok: profile.cycle_regular !== null },
    {
      label: "Cycle length",
      ok:
        profile.average_cycle_length != null &&
        profile.average_cycle_length >= 15 &&
        profile.average_cycle_length <= 60,
    },
  ];

  const requiredOk = checks.filter((c) => c.ok).length;
  const requiredTotal = checks.length;
  const percent = Math.round((requiredOk / requiredTotal) * 100);

  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  const lastPeriodCaptured = Boolean(profile.last_period_start);

  let summary: string;
  if (percent >= 100) {
    summary = lastPeriodCaptured
      ? "Your basics look complete — thank you for sharing your last period, too."
      : "Your basics look complete. You can add your last period whenever you remember it.";
  } else if (percent >= 70) {
    summary = "You are most of the way there — a few gentle prompts remain.";
  } else if (percent >= 40) {
    summary = "We are still learning about you — small steps keep this manageable.";
  } else {
    summary = "Your profile is just getting started.";
  }

  return { percent, summary, missing, lastPeriodCaptured };
}
