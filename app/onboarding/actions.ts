"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  error?: string;
};

const isDev = process.env.NODE_ENV === "development";

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

function parseConditions(formData: FormData): { ok: true; values: string[] } | { ok: false; error: string } {
  const selected = formData.getAll("conditions").map((v) => String(v).trim());
  if (selected.includes("none")) {
    return { ok: true, values: ["none"] };
  }
  const otherNote = String(formData.get("condition_other") ?? "").trim();
  if (selected.includes("other") && !otherNote) {
    return {
      ok: false,
      error: "Please add a short note for “Other”, or uncheck that option.",
    };
  }
  const base = selected.filter((c) => c !== "none" && c !== "other");
  if (selected.includes("other") && otherNote) {
    base.push(`other:${otherNote}`);
  }
  return { ok: true, values: base };
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
  const health_goals = parseGoals(String(formData.get("health_goals") ?? ""));
  const conditionsResult = parseConditions(formData);
  if (!conditionsResult.ok) {
    return { error: conditionsResult.error };
  }
  const conditions = conditionsResult.values;
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
  if (health_goals.length === 0) {
    return { error: "Please add at least one health goal — even a short phrase helps." };
  }
  if (conditions.length === 0) {
    return { error: "Please choose at least one option under known conditions." };
  }
  if (cycleRegularRaw !== "true" && cycleRegularRaw !== "false") {
    return { error: "Please let us know if your cycle is usually regular." };
  }
  const cycle_regular = cycleRegularRaw === "true";
  let average_cycle_length: number | null = null;
  if (!cycle_regular) {
    if (!avgRaw || Number.isNaN(Number(avgRaw))) {
      return {
        error: "When your cycle is irregular, an approximate average length in days helps.",
      };
    }
    average_cycle_length = Math.round(Number(avgRaw));
    if (average_cycle_length < 15 || average_cycle_length > 60) {
      return { error: "Average cycle length should be between 15 and 60 days." };
    }
  } else if (avgRaw) {
    const n = Math.round(Number(avgRaw));
    if (!Number.isNaN(n) && n >= 15 && n <= 60) {
      average_cycle_length = n;
    }
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

  if (isDev) {
    console.log("[onboarding] upsert payload (types):", {
      ...row,
      ageType: typeof row.age,
      avgType: row.average_cycle_length === null ? "null" : typeof row.average_cycle_length,
      cycleType: typeof row.cycle_regular,
    });
  }

  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) {
    logSupabaseError("profiles.upsert", error);

    const devDetail = isDev
      ? ` ${error.message}${error.code ? ` (code ${error.code})` : ""}${error.hint ? ` — ${error.hint}` : ""}`
      : "";

    return {
      error: isDev
        ? `Could not save profile.${devDetail} Check the terminal for full details.`
        : "We could not save your profile just yet. Check your connection, or try again in a moment.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/onboarding");
  redirect("/app");
}
