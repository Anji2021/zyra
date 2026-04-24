import type { ProfileRow } from "./types";

export type ProfileCompleteness = {
  percent: number;
  summary: string;
  missing: string[];
  lastPeriodCaptured: boolean;
};

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
    {
      label: "Health goals",
      ok: Array.isArray(profile.health_goals) && profile.health_goals.some((g) => g.trim()),
    },
    {
      label: "Health context",
      ok: Array.isArray(profile.conditions) && profile.conditions.length > 0,
    },
    { label: "Cycle regularity", ok: profile.cycle_regular !== null },
    {
      label: "Cycle length",
      ok:
        profile.cycle_regular === true ||
        (profile.cycle_regular === false &&
          profile.average_cycle_length != null &&
          profile.average_cycle_length > 0),
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
