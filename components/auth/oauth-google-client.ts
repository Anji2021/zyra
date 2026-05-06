"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Starts Google OAuth redirect. Returns error message when configuration or navigation fails. */
export async function startGoogleOAuthSignIn(): Promise<string | null> {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return "Supabase is not configured. Check environment variables.";
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
      },
    });
    return error?.message ?? null;
  } catch (e) {
    return e instanceof Error ? e.message : "Something went wrong.";
  }
}
