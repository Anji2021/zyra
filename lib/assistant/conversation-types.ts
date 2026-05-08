import type { AssistantChatMessage } from "@/lib/assistant/chat-types";

/** Client-stored message; optional client-only timestamp for UI. */
export type StoredAssistantMessage = AssistantChatMessage & {
  createdAt?: number;
};

export type AssistantConversation = {
  id: string;
  title: string;
  messages: StoredAssistantMessage[];
  createdAt: number;
  updatedAt: number;
};

export const ASSISTANT_STORAGE_KEY = "zyra-assistant-conversations-v2";
