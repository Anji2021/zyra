"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  HEALTH_CONCERN_OPTIONS,
  KNOWN_CONDITION_OPTIONS,
  LEGACY_HEALTH_GOAL_TO_SLUG,
  PROFILE_GOAL_SLUG_SET,
  SYMPTOM_BASELINE_OPTIONS,
} from "@/lib/profiles/profile-clarity-options";
import type { ProfileRow } from "@/lib/profiles/types";
import { mergeProfileRows } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";

export type ProfileSaveState = { error?: string; success?: boolean };

const ALLOWED_RADIUS = new Set([5, 10, 25]);

function logSupabaseError(scope: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[profile] ${scope} Supabase error:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

/** Maps PostgREST / Postgres errors to safe UI copy (details stay in server logs). */
function friendlyUpsertMessage(error: { message?: string; code?: string }): string {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  if (
    code === "PGRST204" ||
    msg.includes("schema cache") ||
    (msg.includes("column") && (msg.includes("could not find") || msg.includes("does not exist")))
  ) {
    return "Couldn't save your profile. This usually means the database is missing the user_health_profile table or columns — apply the latest Supabase migration, reload the API schema cache, then try again.";
  }
  if (code === "42501" || msg.includes("permission denied") || msg.includes("new row violates row-level security")) {
    return "We couldn't save your profile due to permissions. Try signing out and back in.";
  }
  return "Something went wrong saving your profile. Please try again.";
}

function parseMulti(formData: FormData, key: string): string[] {
  return [...new Set(formData.getAll(key).map((v) => String(v).trim()).filter(Boolean))];
}

function whitelist(values: string[], allowed: ReadonlySet<string>): string[] {
  return values.filter((v) => allowed.has(v));
}

export async function saveProfile(_prev: ProfileSaveState, formData: FormData): Promise<ProfileSaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=required");

  const [{ data: profilesRaw, error: profilesFetchErr }, { data: healthRaw, error: healthFetchErr }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_health_profile").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

  if (profilesFetchErr) {
    logSupabaseError("profiles.select(before save)", profilesFetchErr);
    return {
      error:
        "We couldn't load your profile to apply changes. Check your connection and try again — if this persists, contact support.",
    };
  }

  if (!profilesRaw || typeof profilesRaw !== "object") {
    return { error: "No profile found. Finish onboarding first, then try again." };
  }

  if (healthFetchErr) {
    logSupabaseError("user_health_profile.select(before save)", healthFetchErr);
  }

  const existingMerged = mergeProfileRows(
    profilesRaw as Record<string, unknown>,
    healthFetchErr || !healthRaw || typeof healthRaw !== "object"
      ? null
      : (healthRaw as Record<string, unknown>),
  );

  const full_name = String(formData.get("full_name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!full_name) return { error: "Please add your name." };
  if (!ageRaw || Number.isNaN(Number(ageRaw))) return { error: "Please add a valid age." };
  const age = Math.round(Number(ageRaw));
  if (age < 13 || age > 120) return { error: "Age must be between 13 and 120." };
  if (!location) return { error: "Please add your location." };

  let known_conditions = whitelist(
    parseMulti(formData, "known_conditions"),
    new Set(KNOWN_CONDITION_OPTIONS.map((o) => o.slug)),
  );
  if (known_conditions.includes("none")) known_conditions = ["none"];

  const health_concerns = whitelist(
    parseMulti(formData, "health_concerns"),
    new Set(HEALTH_CONCERN_OPTIONS.map((o) => o.slug)),
  );

  const symptom_baselines = whitelist(
    parseMulti(formData, "symptom_baselines"),
    new Set(SYMPTOM_BASELINE_OPTIONS.map((o) => o.slug)),
  );

  const profileGoalsSelected = whitelist(parseMulti(formData, "profile_health_goals"), PROFILE_GOAL_SLUG_SET);

  const legacyStrings = existingMerged.health_goals.filter((g) => {
    if (PROFILE_GOAL_SLUG_SET.has(g)) return false;
    const mapped = LEGACY_HEALTH_GOAL_TO_SLUG[g];
    if (mapped && profileGoalsSelected.includes(mapped)) return false;
    return true;
  });
  const goals = [...legacyStrings, ...profileGoalsSelected];

  const cycleReg = String(formData.get("cycle_regularity") ?? "").trim();
  let cycle_regularity: ProfileRow["cycle_regularity"] = existingMerged.cycle_regularity;

  if (cycleReg === "regular") {
    cycle_regularity = "regular";
  } else if (cycleReg === "irregular") {
    cycle_regularity = "irregular";
  } else if (cycleReg === "unsure") {
    cycle_regularity = "unsure";
  }

  const avgRaw = String(formData.get("average_cycle_length") ?? "").trim();
  let average_cycle_length = existingMerged.average_cycle_length;
  if (avgRaw !== "") {
    const n = Math.round(Number(avgRaw));
    if (Number.isNaN(n) || n < 15 || n > 60) {
      return {
        error:
          "Average cycle length must be between 15 and 60 days, or leave blank to keep your saved value.",
      };
    }
    average_cycle_length = n;
  }

  const lastRaw = String(formData.get("last_period_start") ?? "").trim();
  let last_period_date: string | null = existingMerged.last_period_start;
  if (lastRaw !== "") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastRaw)) return { error: "Please use a valid date." };
    last_period_date = lastRaw;
  }

  const rRaw = String(formData.get("search_radius_miles") ?? "").trim();
  const preferred_search_radius = Math.round(Number(rRaw));
  if (!ALLOWED_RADIUS.has(preferred_search_radius)) return { error: "Choose a valid search radius." };

  const profilesPatch: Record<string, unknown> = {
    full_name,
    age,
    location,
    updated_at: new Date().toISOString(),
  };
  if (cycleReg === "regular") profilesPatch.cycle_regular = true;
  else if (cycleReg === "irregular") profilesPatch.cycle_regular = false;

  const { error: profilesUpdateErr } = await supabase.from("profiles").update(profilesPatch).eq("id", user.id);

  if (profilesUpdateErr) {
    logSupabaseError("profiles.update(basics)", profilesUpdateErr);
    return { error: friendlyUpsertMessage(profilesUpdateErr) };
  }

  const healthPayload = {
    user_id: user.id,
    known_conditions,
    current_concerns: health_concerns,
    cycle_regularity,
    average_cycle_length,
    last_period_date,
    goals,
    baseline_symptoms: symptom_baselines,
    preferred_search_radius,
    updated_at: new Date().toISOString(),
  };

  const { error: healthUpsertErr } = await supabase.from("user_health_profile").upsert(healthPayload, {
    onConflict: "user_id",
    ignoreDuplicates: false,
  });

  if (healthUpsertErr) {
    logSupabaseError("user_health_profile.upsert", healthUpsertErr);
    return { error: friendlyUpsertMessage(healthUpsertErr) };
  }

  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { success: true };
}
