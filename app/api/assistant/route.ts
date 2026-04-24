import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { ASSISTANT_UNAVAILABLE } from "@/lib/assistant/chat-types";
import { ZYRA_ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant/system-prompt";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_USER_CHARS = 4000;
/** Recent turns sent to Groq (system prompt is separate). */
const CONTEXT_MESSAGE_LIMIT = 10;

export const runtime = "nodejs";

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function isMessageRow(r: { id: string; role: string; content: string } | null): r is MessageRow {
  return (
    r != null &&
    (r.role === "user" || r.role === "assistant") &&
    typeof r.content === "string" &&
    typeof r.id === "string"
  );
}

export async function POST(request: Request) {
  console.log("Groq key exists:", !!process.env.GROQ_API_KEY);

  try {
    const { url, anonKey, isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      return Response.json({ error: "App is not fully configured." }, { status: 503 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* session refresh from Route Handler */
          }
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[api/assistant] auth", authError.message);
    }
    if (!user) {
      return Response.json({ error: "Sign in to use the assistant." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || !("message" in body)) {
      return Response.json(
        { error: "Invalid body: expected JSON object with a string \"message\" field." },
        { status: 400 },
      );
    }

    const userMessageText = String((body as { message: unknown }).message ?? "").trim();

    if (!userMessageText) {
      return Response.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (userMessageText.length > MAX_USER_CHARS) {
      return Response.json({ error: "Message is too long." }, { status: 400 });
    }

    const { data: insertedUser, error: insertUserError } = await supabase
      .from("messages")
      .insert({ user_id: user.id, role: "user", content: userMessageText })
      .select("id, role, content")
      .single();

    if (insertUserError || !isMessageRow(insertedUser)) {
      console.error("[api/assistant] save user message", insertUserError?.message);
      return Response.json(
        { error: "Could not save your message. Please try again." },
        { status: 500 },
      );
    }

    const { data: recentRows, error: recentError } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(CONTEXT_MESSAGE_LIMIT);

    if (recentError) {
      console.error("[api/assistant] load context", recentError.message);
      return Response.json({ error: ASSISTANT_UNAVAILABLE }, { status: 502 });
    }

    const chronological = [...(recentRows ?? [])].reverse();
    const messages: ChatCompletionMessageParam[] = [];
    for (const row of chronological) {
      if (row.role === "user" || row.role === "assistant") {
        messages.push({ role: row.role, content: row.content });
      }
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.6,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: ZYRA_ASSISTANT_SYSTEM_PROMPT,
        },
        ...messages,
      ],
    });

    if (!completion.choices?.length) {
      console.error("ASSISTANT ERROR: Groq returned no choices:", JSON.stringify(completion));
    }

    const choice0 = completion.choices[0];
    if (choice0 && "error" in choice0 && choice0.error != null) {
      console.error("ASSISTANT ERROR: Groq choice error:", choice0.error);
    }
    if (choice0?.finish_reason && choice0.finish_reason !== "stop") {
      console.error(
        "ASSISTANT ERROR: Groq finish_reason:",
        choice0.finish_reason,
        JSON.stringify(completion),
      );
    }

    const rawContent = choice0?.message?.content;
    if (rawContent === undefined || rawContent === null || String(rawContent).trim() === "") {
      console.error(
        "ASSISTANT ERROR: Groq missing or empty message.content:",
        JSON.stringify(completion),
      );
    }

    const reply =
      typeof rawContent === "string" && rawContent.trim()
        ? rawContent.trim()
        : "Sorry, I couldn't respond.";

    const { data: insertedAssistant, error: insertAssistantError } = await supabase
      .from("messages")
      .insert({ user_id: user.id, role: "assistant", content: reply })
      .select("id, role, content")
      .single();

    if (insertAssistantError || !isMessageRow(insertedAssistant)) {
      console.error("[api/assistant] save assistant message", insertAssistantError?.message);
      return Response.json({ error: ASSISTANT_UNAVAILABLE }, { status: 502 });
    }

    return Response.json({
      message: reply,
      reply,
      userMessage: insertedUser,
      assistantMessage: insertedAssistant,
    });
  } catch (error) {
    console.error("ASSISTANT ERROR:", error);
    return Response.json({ error: ASSISTANT_UNAVAILABLE }, { status: 502 });
  }
}
