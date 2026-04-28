import type { SupabaseClient } from "@supabase/supabase-js";
import type { CycleRow } from "./types";

export async function fetchCyclesForUser(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
): Promise<CycleRow[]> {
  let q = supabase
    .from("cycles")
    .select("id,user_id,start_date,end_date,notes,created_at")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (typeof limit === "number") {
    q = q.limit(limit);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[cycles] fetchCyclesForUser", error.message, error);
    return [];
  }

  return (data ?? []) as CycleRow[];
}

/** Days between two period start dates (newer − older), local noon to avoid DST edge. */
export function daysBetweenStarts(newerStart: string, olderStart: string): number {
  const a = new Date(`${newerStart}T12:00:00`);
  const b = new Date(`${olderStart}T12:00:00`);
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}
