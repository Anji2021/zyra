import type { SupabaseClient } from "@supabase/supabase-js";
import type { MedicineRow } from "./types";

export async function fetchMedicinesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<MedicineRow[]> {
  const { data, error } = await supabase
    .from("medicines")
    .select("id,user_id,name,dosage,frequency,start_date,end_date,notes,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[medicines] fetchMedicinesForUser", error.message, error);
    return [];
  }

  return (data ?? []) as MedicineRow[];
}
