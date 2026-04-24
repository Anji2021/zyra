import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export type AssistantChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const ASSISTANT_UNAVAILABLE = FRIENDLY_TRY_AGAIN;
