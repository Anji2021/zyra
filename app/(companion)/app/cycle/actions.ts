"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export type LogCycleState = {
  error?: string;
};

function logSupabaseError(scope: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[cycles] ${scope} Supabase error:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function logPeriod(_prev: LogCycleState, formData: FormData): Promise<LogCycleState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logSupabaseError("getUser", userError);
  }
  if (!user) {
    redirect("/?auth=required");
  }

  const startRaw = String(formData.get("start_date") ?? "").trim();
  const endRaw = String(formData.get("end_date") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  if (!startRaw) {
    return { error: "Please choose a start date for this period." };
  }
  if (!isIsoDateOnly(startRaw)) {
    return { error: "Start date does not look valid. Please pick it again from the calendar." };
  }

  let end_date: string | null = null;
  if (endRaw.length > 0) {
    if (!isIsoDateOnly(endRaw)) {
      return { error: "End date does not look valid. Please pick it again from the calendar." };
    }
    if (endRaw < startRaw) {
      return { error: "End date should be the same day or after the start date." };
    }
    end_date = endRaw;
  }

  const notes = notesRaw.length > 0 ? notesRaw : null;

  const row = {
    user_id: user.id,
    start_date: startRaw,
    end_date,
    notes,
  };

  const { error } = await supabase.from("cycles").insert(row);

  if (error) {
    logSupabaseError("cycles.insert", error);
    return { error: FRIENDLY_TRY_AGAIN };
  }

  revalidatePath("/app/cycle");
  redirect("/app/cycle?saved=1");
}
