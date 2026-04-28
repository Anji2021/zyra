import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isFeedbackType } from "@/lib/feedback/types";

export const runtime = "nodejs";

const TITLE_MAX = 200;
const MESSAGE_MAX = 8000;
const EMAIL_MAX = 320;

export async function POST(request: Request) {
  const { isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return Response.json(
      { error: "Zyra isn’t fully configured right now. Try again later." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Sign in to send feedback." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { type, title, message, email } = body as Record<string, unknown>;

  if (typeof type !== "string" || !isFeedbackType(type)) {
    return Response.json({ error: "Choose a valid feedback type." }, { status: 400 });
  }

  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Add a short title." }, { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Add a message." }, { status: 400 });
  }

  const titleTrim = title.trim().slice(0, TITLE_MAX);
  const messageTrim = message.trim().slice(0, MESSAGE_MAX);

  let emailOut: string | null = null;
  if (email != null && email !== "") {
    if (typeof email !== "string") {
      return Response.json({ error: "Email must be text if provided." }, { status: 400 });
    }
    emailOut = email.trim().slice(0, EMAIL_MAX) || null;
  }

  const { data, error } = await supabase
    .from("feedback_requests")
    .insert({
      user_id: user.id,
      type,
      title: titleTrim,
      message: messageTrim,
      email: emailOut,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[feedback] insert error:", error.message);
    return Response.json(
      {
        error:
          "We couldn’t save your feedback just now. Check your connection and try again in a moment.",
      },
      { status: 500 },
    );
  }

  return Response.json({ id: data?.id ?? null });
}
