import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteAssistantMemory } from "@/lib/assistant/redis-assistant";
import { getRedis } from "@/lib/redis";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function DELETE() {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    return NextResponse.json({ error: "App is not fully configured." }, { status: 503 });
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
    console.error("[api/assistant/clear] auth", authError.message);
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to use the assistant." }, { status: 401 });
  }

  const { error } = await supabase.from("messages").delete().eq("user_id", user.id);

  if (error) {
    console.error("[api/assistant/clear] delete", error.message);
    return NextResponse.json({ error: "Could not clear chat. Please try again." }, { status: 500 });
  }

  const redis = getRedis();
  if (redis) {
    await deleteAssistantMemory(redis, user.id);
  }

  return NextResponse.json({ ok: true });
}
