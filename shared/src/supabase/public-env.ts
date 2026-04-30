export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

function trimValue(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Platform-safe helper to normalize public Supabase env names into runtime config. */
export function getSupabasePublicEnvFromValues(
  rawUrl: string | undefined,
  rawAnonKey: string | undefined,
): SupabasePublicEnv {
  const url = trimValue(rawUrl).replace(/\/+$/, "");
  const anonKey = trimValue(rawAnonKey);
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}
