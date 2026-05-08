import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderRowInput } from "@shared/health-timeline/types";

export async function fetchRemindersForTimeline(
  supabase: SupabaseClient,
  userId: string,
  limit = 120,
): Promise<ReminderRowInput[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("id,type,title,message,reminder_date,reminder_time,is_active,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[reminders] fetchRemindersForTimeline", error.message);
    return [];
  }

  return (data ?? []) as ReminderRowInput[];
}
