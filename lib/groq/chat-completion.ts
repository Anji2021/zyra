export const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_DEFAULT_MODEL = "llama-3.1-8b-instant";

const ZYRA_SYSTEM =
  "You are Zyra, an educational women's health assistant. You do not diagnose. You summarize possible patterns, care-prep questions, and next steps in a calm, concise way.";

export type GroqJsonResult =
  | { ok: true; content: string }
  | { ok: false; reason: "missing_api_key" | "http_error" | "parse_error" | "network" };

function messageContentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (content == null) return "";
  return JSON.stringify(content);
}

/**
 * POST chat/completions with JSON mode. Returns assistant message text (may still need extractJsonObject).
 */
export async function groqChatJsonCompletion(params: {
  userContent: string;
  /** Defaults to Zyra educational system line. */
  systemContent?: string;
  temperature?: number;
}): Promise<GroqJsonResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  const model = process.env.GROQ_MODEL?.trim() || GROQ_DEFAULT_MODEL;
  const systemContent = params.systemContent?.trim() || ZYRA_SYSTEM;

  try {
    const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: params.userContent },
        ],
        temperature: params.temperature ?? 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[groq] chat/completions HTTP error:", res.status, errText.slice(0, 500));
      return { ok: false, reason: "http_error" };
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const raw = messageContentToString(data?.choices?.[0]?.message?.content);
    if (!raw.trim()) {
      console.error("[groq] empty assistant content");
      return { ok: false, reason: "parse_error" };
    }
    return { ok: true, content: raw };
  } catch (e) {
    console.error("[groq] chat/completions request failed:", e);
    return { ok: false, reason: "network" };
  }
}
