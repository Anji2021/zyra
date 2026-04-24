import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "./types";

export async function hasProfileRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles] hasProfileRow", error.message);
    return false;
  }

  return Boolean(data);
}

export async function getProfileForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles] getProfileForUser", error.message);
    return null;
  }

  return data as ProfileRow | null;
}
