import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import {
  ASSISTANT_STORAGE_KEY,
  type AssistantConversation,
  type StoredAssistantMessage,
} from "@/lib/assistant/conversation-types";
import { titleFromFirstUserMessage } from "@/lib/assistant/conversation-title";

function safeParse(raw: string | null): AssistantConversation[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(isConversation);
  } catch {
    return [];
  }
}

function isConversation(x: unknown): x is AssistantConversation {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.createdAt === "number" &&
    typeof o.updatedAt === "number" &&
    Array.isArray(o.messages)
  );
}

export function loadConversations(userId: string): AssistantConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${ASSISTANT_STORAGE_KEY}:${userId}`);
    return safeParse(raw);
  } catch {
    return [];
  }
}

export function saveConversations(userId: string, list: AssistantConversation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${ASSISTANT_STORAGE_KEY}:${userId}`, JSON.stringify(list));
  } catch (e) {
    console.error("[conversation-storage] save failed", e);
  }
}

/** If local is empty and server returned messages, create one imported thread. */
export function seedFromLegacyMessages(legacy: AssistantChatMessage[]): AssistantConversation[] {
  if (legacy.length === 0) return [];
  const now = Date.now();
  const firstUser = legacy.find((m) => m.role === "user");
  const title = firstUser ? titleFromFirstUserMessage(firstUser.content) : "Imported chat";
  const messages: StoredAssistantMessage[] = legacy.map((m) => ({
    ...m,
    createdAt: now,
  }));
  return [
    {
      id: `imported-${now}`,
      title,
      messages,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function newEmptyConversation(): AssistantConversation {
  const t = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: t,
    updatedAt: t,
  };
}
