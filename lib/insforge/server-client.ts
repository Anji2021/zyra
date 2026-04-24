import { createClient, type InsForgeClient } from "@insforge/sdk";

/**
 * InsForge SDK joins `baseUrl` + `/api/database/records/...`.
 * A trailing slash on `baseUrl` produces `//api/...` and breaks POST.
 */
function normalizeInsforgeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Server InsForge client for database writes (e.g. feedback).
 *
 * Uses `NEXT_PUBLIC_INSFORGE_BASE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY`.
 * Optional fallbacks: `INSFORGE_BASE_URL`, `INSFORGE_SERVICE_KEY`, `INSFORGE_ANON_KEY`.
 */
export function getInsforgeServerClient(): InsForgeClient | null {
  const rawBase =
    process.env.NEXT_PUBLIC_INSFORGE_BASE_URL?.trim() || process.env.INSFORGE_BASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim() ||
    process.env.INSFORGE_SERVICE_KEY?.trim() ||
    process.env.INSFORGE_ANON_KEY?.trim();

  if (!rawBase || !anonKey) {
    return null;
  }

  const baseUrl = normalizeInsforgeBaseUrl(rawBase);

  return createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
  });
}
