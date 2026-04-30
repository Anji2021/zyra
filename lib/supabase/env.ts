import { getSupabasePublicEnvFromValues } from "@shared/supabase/public-env";

/** Normalize Supabase project URL (no trailing slash) for consistent API calls. */
export function getSupabasePublicEnv() {
  return getSupabasePublicEnvFromValues(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
