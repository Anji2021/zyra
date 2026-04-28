"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  error?: string;
};

function logSupabaseError(scope: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[onboarding] ${scope} Supabase error:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function parseGoals(raw: string): string[] {
  return raw
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function saveOnboardingProfile(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logSupabaseError("getUser", userError);
  }

  if (!user) {
    console.error("[onboarding] save blocked: no authenticated user (getUser returned null).");
    redirect("/?auth=required");
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const selectedGoals = Array.from(
    new Set(formData.getAll("health_goals").map((v) => String(v).trim()).filter(Boolean)),
  );
  const health_goals =
    selectedGoals.length > 0
      ? selectedGoals
      : parseGoals(String(formData.get("health_goals_text") ?? ""));
  const conditions = Array.from(
    new Set(formData.getAll("conditions").map((v) => String(v).trim()).filter(Boolean)),
  );
  const cycleRegularRaw = String(formData.get("cycle_regular") ?? "").trim();
  const avgRaw = String(formData.get("average_cycle_length") ?? "").trim();
  const lastPeriod = String(formData.get("last_period_start") ?? "").trim();

  if (!full_name) {
    return { error: "Please add your full name." };
  }
  if (!ageRaw || Number.isNaN(Number(ageRaw))) {
    return { error: "Please add a valid age." };
  }
  const age = Math.round(Number(ageRaw));
  if (age < 13 || age > 120) {
    return { error: "Please enter an age between 13 and 120." };
  }
  if (!location) {
    return { error: "Please add your location (city or region is perfect)." };
  }
  if (cycleRegularRaw !== "true" && cycleRegularRaw !== "false") {
    return { error: "Please let us know if your cycle is usually regular." };
  }
  const cycle_regular = cycleRegularRaw === "true";
  if (!lastPeriod) {
    return { error: "Please add your last period start date." };
  }
  if (!avgRaw || Number.isNaN(Number(avgRaw))) {
    return { error: "Please add your average cycle length in days." };
  }
  const average_cycle_length = Math.round(Number(avgRaw));
  if (average_cycle_length < 15 || average_cycle_length > 60) {
    return { error: "Average cycle length should be between 15 and 60 days." };
  }

  let last_period_start: string | null = null;
  if (lastPeriod.length > 0) {
    if (!isIsoDateOnly(lastPeriod)) {
      return { error: "Please use a valid date for last period start." };
    }
    last_period_start = lastPeriod;
  }

  /** Matches `public.profiles` columns; no `undefined` (PostgREST can reject unknown keys). */
  const row: {
    id: string;
    full_name: string;
    age: number;
    location: string;
    health_goals: string[];
    conditions: string[];
    cycle_regular: boolean;
    average_cycle_length: number | null;
    last_period_start: string | null;
  } = {
    id: user.id,
    full_name,
    age,
    location,
    health_goals,
    conditions,
    cycle_regular,
    average_cycle_length,
    last_period_start,
  };

  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) {
    logSupabaseError("profiles.upsert", error);
    return {
      error: "We could not save your profile just yet. Check your connection, or try again in a moment.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/onboarding");
  redirect("/app");
}
