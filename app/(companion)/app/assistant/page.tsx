import { redirect } from "next/navigation";
import { AssistantChat } from "./assistant-chat";
import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { PRIVACY_ONLY_YOU } from "@/lib/zyra/user-messages";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const { data: rows, error } = await supabase
    .from("messages")
    .select("id, role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[assistant page] messages", error.message);
  }

  const initialMessages: AssistantChatMessage[] = (rows ?? [])
    .filter(
      (r): r is AssistantChatMessage =>
        typeof r.id === "string" &&
        (r.role === "user" || r.role === "assistant") &&
        typeof r.content === "string",
    )
    .reverse();

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Assistant</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A quiet place to ask
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          {ZYRA.name} answers in plain language for <strong className="font-medium text-foreground">education only</strong>
          — never a stand-in for your doctor or your prescriptions.
        </p>
        <p className="max-w-xl text-xs leading-relaxed text-muted">{PRIVACY_ONLY_YOU}</p>
      </header>

      <AssistantChat initialMessages={initialMessages} />
    </div>
  );
}
