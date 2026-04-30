/** Stored as slug arrays on `user_health_profile.known_conditions`. */
export const KNOWN_CONDITION_OPTIONS = [
  { slug: "pcos", label: "PCOS" },
  { slug: "thyroid", label: "Thyroid" },
  { slug: "endometriosis", label: "Endometriosis" },
  { slug: "none", label: "None" },
  { slug: "other", label: "Other" },
] as const;

/** Stored on `user_health_profile.current_concerns`. */
export const HEALTH_CONCERN_OPTIONS = [
  { slug: "irregular_periods", label: "Irregular periods" },
  { slug: "acne", label: "Acne" },
  { slug: "weight_changes", label: "Weight changes" },
  { slug: "fertility", label: "Fertility" },
  { slug: "pain", label: "Pain" },
] as const;

/** Stored on `profiles.health_goals` (alongside legacy onboarding strings). */
export const PROFILE_GOAL_OPTIONS = [
  { slug: "understand_symptoms", label: "Understand symptoms" },
  { slug: "track_cycle", label: "Track cycle" },
  { slug: "manage_condition", label: "Manage a condition" },
  { slug: "prepare_doctor_visit", label: "Prepare for doctor visit" },
  { slug: "general_wellness", label: "General wellness" },
] as const;

/** Stored on `user_health_profile.baseline_symptoms`. */
export const SYMPTOM_BASELINE_OPTIONS = [
  { slug: "cramps", label: "Cramps" },
  { slug: "bloating", label: "Bloating" },
  { slug: "fatigue", label: "Fatigue" },
  { slug: "baseline_acne", label: "Acne" },
  { slug: "mood_swings", label: "Mood swings" },
  { slug: "headaches", label: "Headaches" },
] as const;

export const SEARCH_RADIUS_OPTIONS = [5, 10, 25] as const;

export const PROFILE_GOAL_SLUG_SET: ReadonlySet<string> = new Set(
  PROFILE_GOAL_OPTIONS.map((option) => option.slug),
);

/** Map onboarding goal labels → profile goal slugs for chip state. */
export const LEGACY_HEALTH_GOAL_TO_SLUG: Record<string, string> = {
  "Understand my cycle": "track_cycle",
  "Track symptoms": "understand_symptoms",
  "Remember medicines": "manage_condition",
  "Find specialists": "prepare_doctor_visit",
  "Learn about women’s health": "general_wellness",
};

/** Infer known_conditions slugs from onboarding `conditions` when structured field empty. */
export function inferKnownConditionsFromLegacy(profile: {
  known_conditions: string[];
  conditions: string[];
}): string[] {
  if (profile.known_conditions.length > 0) return [...profile.known_conditions];
  const out = new Set<string>();
  for (const line of profile.conditions) {
    const lower = line.toLowerCase();
    if (lower.includes("pcos") || lower.includes("pcod")) out.add("pcos");
    if (lower.includes("thyroid")) out.add("thyroid");
    if (lower.includes("endometriosis")) out.add("endometriosis");
  }
  return [...out];
}
