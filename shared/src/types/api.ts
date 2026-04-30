export type AssistantChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type { ApiErrorResponse } from "./index";
