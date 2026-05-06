"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { calendarTodayIso, isIsoDateOnly, validateCycleEntry } from "@/lib/cycles/validation";
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

  let end_date: string | null = null;
  if (endRaw.length > 0) {
    end_date = endRaw;
  }

  const cycles = await fetchCyclesForUser(supabase, user.id);
  const today = calendarTodayIso();
  const v = validateCycleEntry({
    existing: cycles,
    draft: { start_date: startRaw, end_date: end_date },
    today,
  });
  if (!v.ok) {
    return { error: v.error };
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

export async function updateCycleEntryAction(_prev: LogCycleState, formData: FormData): Promise<LogCycleState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logSupabaseError("update getUser", userError);
  if (!user) redirect("/?auth=required");

  const cycleId = String(formData.get("cycle_id") ?? "").trim();
  const startRaw = String(formData.get("start_date") ?? "").trim();
  const endRaw = String(formData.get("end_date") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  if (!cycleId || !startRaw || !isIsoDateOnly(startRaw)) {
    return { error: "That update didn’t go through. Check your dates and try again." };
  }

  let end_date: string | null = null;
  if (endRaw.length > 0) {
    end_date = endRaw;
  }

  const cycles = await fetchCyclesForUser(supabase, user.id);
  const exists = cycles.some((c) => c.id === cycleId);
  if (!exists) {
    return { error: "That entry couldn’t be found. Refresh and try again." };
  }

  const today = calendarTodayIso();
  const v = validateCycleEntry({
    existing: cycles,
    draft: { start_date: startRaw, end_date },
    excludeId: cycleId,
    today,
  });
  if (!v.ok) {
    return { error: v.error };
  }

  const notes = notesRaw ? notesRaw : null;
  const { error } = await supabase
    .from("cycles")
    .update({
      start_date: startRaw,
      end_date,
      notes,
    })
    .eq("id", cycleId)
    .eq("user_id", user.id);
  if (error) {
    logSupabaseError("cycles.update", error);
    return { error: FRIENDLY_TRY_AGAIN };
  }

  revalidatePath("/app/cycle");
  redirect("/app/cycle?updated=1");
}

/** @deprecated use updateCycleEntryAction + hidden cycle_id — kept export name collision guard */
export async function deleteCycleEntry(cycleId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logSupabaseError("delete getUser", userError);
  if (!user) redirect("/?auth=required");

  const { error } = await supabase
    .from("cycles")
    .delete()
    .eq("id", cycleId)
    .eq("user_id", user.id);
  if (error) {
    logSupabaseError("cycles.delete", error);
    redirect("/app/cycle?deleted=error");
  }

  revalidatePath("/app/cycle");
  redirect("/app/cycle?deleted=1");
}
