import type { SupabaseClient } from "@supabase/supabase-js";

export type DoctorMatchHistoryRow = {
  id: string;
  symptoms: string;
  pattern: string;
  specialist: string;
  created_at: string;
};

export async function fetchDoctorMatchHistoryForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 5,
): Promise<DoctorMatchHistoryRow[]> {
  const { data, error } = await supabase
    .from("doctor_match_history")
    .select("id, symptoms, pattern, specialist, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[doctor_match_history] fetch:", error.message);
    return [];
  }

  return (data ?? []) as DoctorMatchHistoryRow[];
}
