import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "./types";

/** Normalize `profiles` row → baseline app shape (may include legacy clarity columns). */
export function normalizeProfileRow(raw: Record<string, unknown>): ProfileRow {
  const radiusRaw = raw.search_radius_miles;
  const radius =
    typeof radiusRaw === "number" && [5, 10, 25].includes(radiusRaw) ? radiusRaw : 10;

  const crRaw = raw.cycle_regularity;
  const cycle_regularity: ProfileRow["cycle_regularity"] =
    crRaw === "regular" || crRaw === "irregular" || crRaw === "unsure"
      ? crRaw
      : raw.cycle_regular === true
        ? "regular"
        : raw.cycle_regular === false
          ? "irregular"
          : "unsure";

  return {
    ...(raw as unknown as ProfileRow),
    cycle_regularity,
    known_conditions: Array.isArray(raw.known_conditions)
      ? (raw.known_conditions as string[])
      : [],
    health_concerns: Array.isArray(raw.health_concerns) ? (raw.health_concerns as string[]) : [],
    symptom_baselines: Array.isArray(raw.symptom_baselines)
      ? (raw.symptom_baselines as string[])
      : [],
    search_radius_miles: radius,
    health_goals: Array.isArray(raw.health_goals) ? (raw.health_goals as string[]) : [],
    conditions: Array.isArray(raw.conditions) ? (raw.conditions as string[]) : [],
  };
}

/**
 * Overlay `user_health_profile` onto normalized `profiles` for UI / completeness.
 * When health row is absent, returns baseline from profiles only.
 */
export function mergeProfileRows(
  profilesRaw: Record<string, unknown>,
  healthRaw: Record<string, unknown> | null,
): ProfileRow {
  const base = normalizeProfileRow(profilesRaw);

  if (!healthRaw) {
    return base;
  }

  const cycle_regularity: ProfileRow["cycle_regularity"] =
    healthRaw.cycle_regularity === "regular" ||
    healthRaw.cycle_regularity === "irregular" ||
    healthRaw.cycle_regularity === "unsure"
      ? healthRaw.cycle_regularity
      : base.cycle_regularity;

  const cycle_regular =
    cycle_regularity === "regular" ? true : cycle_regularity === "irregular" ? false : base.cycle_regular;

  const radiusRaw = healthRaw.preferred_search_radius;
  const search_radius_miles =
    typeof radiusRaw === "number" && [5, 10, 25].includes(radiusRaw) ? radiusRaw : base.search_radius_miles;

  const lastDate = healthRaw.last_period_date;
  let last_period_start = base.last_period_start;
  if (lastDate != null && String(lastDate).trim().length > 0) {
    last_period_start = String(lastDate).slice(0, 10);
  }

  const avg = healthRaw.average_cycle_length;
  const average_cycle_length =
    avg !== undefined && avg !== null && !Number.isNaN(Number(avg))
      ? Math.round(Number(avg))
      : base.average_cycle_length;

  return {
    ...base,
    known_conditions: Array.isArray(healthRaw.known_conditions)
      ? (healthRaw.known_conditions as string[])
      : [],
    health_concerns: Array.isArray(healthRaw.current_concerns)
      ? (healthRaw.current_concerns as string[])
      : [],
    symptom_baselines: Array.isArray(healthRaw.baseline_symptoms)
      ? (healthRaw.baseline_symptoms as string[])
      : [],
    health_goals: Array.isArray(healthRaw.goals) ? (healthRaw.goals as string[]) : base.health_goals,
    search_radius_miles,
    cycle_regularity,
    cycle_regular,
    average_cycle_length,
    last_period_start,
  };
}

/** True when a dedicated `user_health_profile` row exists (Clarity storage). */
export async function hasUserHealthProfileRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_health_profile")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "[profiles] hasUserHealthProfileRow",
      error.message,
      error.code,
      error.details,
      error.hint,
    );
    return false;
  }

  return Boolean(data);
}

export async function hasProfileRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles] hasProfileRow", error.message);
    return false;
  }

  return Boolean(data);
}

export async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const [{ data: profileData, error: profileError }, { data: healthData, error: healthError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_health_profile").select("*").eq("user_id", userId).maybeSingle(),
    ]);

  if (profileError) {
    console.error("[profiles] getProfileForUser profiles.select", profileError.message);
    return null;
  }

  if (!profileData || typeof profileData !== "object") return null;

  if (healthError) {
    console.error(
      "[profiles] getProfileForUser user_health_profile.select",
      healthError.message,
      healthError.code,
      healthError.details,
      healthError.hint,
    );
  }

  const merged = mergeProfileRows(
    profileData as Record<string, unknown>,
    healthError ? null : healthData && typeof healthData === "object"
      ? (healthData as Record<string, unknown>)
      : null,
  );

  return merged;
}
