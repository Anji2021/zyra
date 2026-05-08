import type { SupabaseClient } from "@supabase/supabase-js";
import type { MedicineRow } from "./types";

export async function fetchMedicinesForUser(
  supabase: SupabaseClient,
  userId: string,
  limit?: number,
): Promise<MedicineRow[]> {
  let q = supabase
    .from("medicines")
    .select("id,user_id,name,dosage,frequency,start_date,end_date,notes,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    q = q.limit(limit);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[medicines] fetchMedicinesForUser", error.message, error);
    return [];
  }

  return (data ?? []) as MedicineRow[];
}
