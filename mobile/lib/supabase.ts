import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnvFromValues } from "@zyra/shared";

/**
 * Expo Go must never throw during module evaluation — missing env leaves the bundle stuck behind
 * the native splash until the JS thread dies with an uncaught exception (often invisible to the user).
 */
const env = getSupabasePublicEnvFromValues(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

/** True when URL + anon key are set from env (see mobile/.env). */
export const MOBILE_SUPABASE_CONFIGURED = env.isConfigured;

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.invalid-mobile-placeholder-key";

console.log("SUPABASE INIT");
if (!env.isConfigured) {
  console.warn(
    "[mobile] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing — using placeholder Supabase URL until env is set.",
  );
}

export const supabase: SupabaseClient = createClient(
  env.isConfigured ? env.url : PLACEHOLDER_URL,
  env.isConfigured ? env.anonKey : PLACEHOLDER_ANON,
  {
    auth: {
      flowType: "pkce",
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
