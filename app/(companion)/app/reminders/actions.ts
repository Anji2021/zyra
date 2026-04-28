"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export type ReminderActionState = {
  error?: string;
};

function logErr(scope: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[reminders] ${scope}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export async function createReminder(
  _prev: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logErr("create getUser", userError);
  if (!user) redirect("/?auth=required");

  const type = String(formData.get("type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  const reminderDateRaw = String(formData.get("reminder_date") ?? "").trim();
  const reminderTimeRaw = String(formData.get("reminder_time") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "once").trim() || "once";

  if (!type) return { error: "Please choose a reminder type." };
  if (!title) return { error: "Please add a title." };
  if (!reminderDateRaw) return { error: "Please choose a date." };
  if (!isIsoDateOnly(reminderDateRaw)) return { error: "Date looks invalid." };
  if (!reminderTimeRaw) return { error: "Please choose a time." };
  if (!isIsoTime(reminderTimeRaw)) return { error: "Time looks invalid." };

  const allowedFreq = new Set(["once", "daily", "weekly", "monthly"]);
  if (!allowedFreq.has(frequency)) return { error: "Frequency is invalid." };

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    type,
    title,
    message,
    reminder_date: reminderDateRaw,
    reminder_time: reminderTimeRaw,
    frequency,
    is_active: true,
  });

  if (error) {
    logErr("reminders.insert", error);
    return { error: FRIENDLY_TRY_AGAIN };
  }

  revalidatePath("/app/reminders");
  redirect("/app/reminders?saved=1");
}

export async function deactivateReminder(reminderId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logErr("deactivate getUser", userError);
  if (!user) redirect("/?auth=required");
  if (!reminderId) return;

  const { error } = await supabase
    .from("reminders")
    .update({ is_active: false })
    .eq("id", reminderId)
    .eq("user_id", user.id);
  if (error) logErr("reminders.deactivate", error);

  revalidatePath("/app/reminders");
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logErr("delete getUser", userError);
  if (!user) redirect("/?auth=required");
  if (!reminderId) return;

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", user.id);
  if (error) logErr("reminders.delete", error);

  revalidatePath("/app/reminders");
}

export async function createSuggestedReminder(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logErr("suggested getUser", userError);
  if (!user) redirect("/?auth=required");

  const type = String(formData.get("type") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  const reminderDateRaw = String(formData.get("reminder_date") ?? "").trim();

  if (!type || !title || !isIsoDateOnly(reminderDateRaw)) {
    redirect("/app/reminders?suggested=invalid");
  }

  const { data: existing, error: existingError } = await supabase
    .from("reminders")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", title)
    .eq("reminder_date", reminderDateRaw)
    .limit(1);

  if (existingError) {
    logErr("suggested reminders.select", existingError);
    redirect("/app/reminders?suggested=error");
  }

  if ((existing ?? []).length > 0) {
    redirect("/app/reminders?suggested=exists");
  }

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    type,
    title,
    message,
    reminder_date: reminderDateRaw,
    reminder_time: "09:00",
    frequency: "once",
    is_active: true,
  });

  if (error) {
    logErr("suggested reminders.insert", error);
    redirect("/app/reminders?suggested=error");
  }

  revalidatePath("/app/reminders");
  redirect("/app/reminders?suggested=created");
}
