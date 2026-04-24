import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }
  return createBrowserClient(url, anonKey);
}
