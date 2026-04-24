import { Redis } from "@upstash/redis";

/**
 * Server-only Upstash Redis client.
 * Supports `UPSTASH_REDIS_REST_*` or `REDIS_URL` + `REDIS_TOKEN` when they hold Upstash REST values.
 * Returns null if unset or init fails — callers must fall back (e.g. Supabase only).
 */
export function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.REDIS_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.REDIS_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (e) {
    console.error("[redis] failed to initialize client", e);
    return null;
  }
}
