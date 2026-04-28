import type { SupabaseClient } from "@supabase/supabase-js";
import type { SymptomRow } from "./types";

export async function fetchSymptomsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
): Promise<SymptomRow[]> {
  let q = supabase
    .from("symptoms")
    .select("id,user_id,symptom,severity,logged_date,notes,created_at")
    .eq("user_id", userId)
    .order("logged_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    q = q.limit(limit);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[symptoms] fetchSymptomsForUser", error.message, error);
    return [];
  }

  return (data ?? []) as SymptomRow[];
}
