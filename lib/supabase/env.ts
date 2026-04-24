function trimValue(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Normalize Supabase project URL (no trailing slash) for consistent API calls. */
export function getSupabasePublicEnv() {
  const rawUrl = trimValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const url = rawUrl.replace(/\/+$/, "");
  const anonKey = trimValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}
