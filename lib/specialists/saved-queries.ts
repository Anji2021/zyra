import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedSpecialistRow = {
  id: string;
  user_id: string;
  name: string | null;
  address: string | null;
  place_id: string | null;
  /** PostgREST may return string for `numeric`. */
  rating: number | string | null;
  created_at: string;
};

export async function fetchSavedSpecialistsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
): Promise<SavedSpecialistRow[]> {
  let q = supabase
    .from("saved_specialists")
    .select("id,user_id,name,address,place_id,rating,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    q = q.limit(limit);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[saved_specialists] fetch", error.message);
    return [];
  }

  return (data ?? []) as SavedSpecialistRow[];
}

export async function countSavedSpecialistsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("saved_specialists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[saved_specialists] count", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchSavedPlaceIdsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const rows = await fetchSavedSpecialistsForUser(supabase, userId);
  const set = new Set<string>();
  for (const r of rows) {
    if (r.place_id && r.place_id.trim()) set.add(r.place_id.trim());
  }
  return set;
}
