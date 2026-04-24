import type { Redis } from "@upstash/redis";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

const MEMORY_PREFIX = "zyra:assistant:memory:";
const RATE_PREFIX = "zyra:assistant:ratelimit:";
const MEMORY_TTL_SEC = 60 * 60 * 24; // 24 hours
const RATE_WINDOW_SEC = 600; // 10 minutes
const RATE_MAX = 10;

const RATE_LIMIT_MESSAGE =
  "You've reached the temporary message limit. Please try again in a few minutes.";

export type CachedAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function memoryKeyForUser(userId: string): string {
  return `${MEMORY_PREFIX}${userId}`;
}

export function rateLimitKeyForUser(userId: string): string {
  return `${RATE_PREFIX}user:${userId}`;
}

/**
 * Fixed window: max RATE_MAX increments per RATE_WINDOW_SEC.
 * Returns { ok: true } or { ok: false, message } — does not throw.
 */
export async function checkAssistantRateLimit(
  redis: Redis,
  bucketKey: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const n = await redis.incr(bucketKey);
    if (n === 1) {
      await redis.expire(bucketKey, RATE_WINDOW_SEC);
    }
    if (n > RATE_MAX) {
      return { ok: false, message: RATE_LIMIT_MESSAGE };
    }
    return { ok: true };
  } catch (e) {
    console.error("[redis] rate limit check failed, allowing request", e);
    return { ok: true };
  }
}

export async function getCachedAssistantMessages(
  redis: Redis,
  userId: string,
): Promise<CachedAssistantMessage[] | null> {
  try {
    const raw = await redis.get(memoryKeyForUser(userId));
    if (raw == null || raw === "") {
      return null;
    }
    const parsed: unknown =
      typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }
    const out: CachedAssistantMessage[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as { id?: string }).id === "string" &&
        ((item as { role?: string }).role === "user" ||
          (item as { role?: string }).role === "assistant") &&
        typeof (item as { content?: string }).content === "string"
      ) {
        out.push({
          id: (item as { id: string }).id,
          role: (item as { role: "user" | "assistant" }).role,
          content: (item as { content: string }).content,
        });
      }
    }
    return out.length > 0 ? out : null;
  } catch (e) {
    console.error("[redis] read assistant memory failed", e);
    return null;
  }
}

export function cachedMessagesToGroqParams(
  cached: CachedAssistantMessage[],
): ChatCompletionMessageParam[] {
  return cached.map((m) => ({ role: m.role, content: m.content }));
}

/** Ensure the newly saved user row is the latest turn in the list (chronological). */
export function mergeCachedWithNewUserMessage(
  cached: CachedAssistantMessage[],
  inserted: { id: string; role: "user" | "assistant"; content: string },
): CachedAssistantMessage[] {
  const withoutDup = cached.filter((m) => m.id !== inserted.id);
  return [...withoutDup, { id: inserted.id, role: inserted.role, content: inserted.content }];
}

export async function setCachedAssistantMessages(
  redis: Redis,
  userId: string,
  messages: CachedAssistantMessage[],
): Promise<void> {
  const trimmed = messages.slice(-10);
  try {
    await redis.set(memoryKeyForUser(userId), JSON.stringify(trimmed), { ex: MEMORY_TTL_SEC });
  } catch (e) {
    console.error("[redis] write assistant memory failed", e);
  }
}

export async function deleteAssistantMemory(redis: Redis, userId: string): Promise<void> {
  try {
    await redis.del(memoryKeyForUser(userId));
  } catch (e) {
    console.error("[redis] delete assistant memory failed", e);
  }
}
