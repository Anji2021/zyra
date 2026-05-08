import { redirect } from "next/navigation";
import { AppPage } from "@/components/product/page-system";
import { AssistantWorkspace } from "./assistant-workspace";
import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { PRIVACY_ONLY_YOU } from "@/lib/zyra/user-messages";

export const dynamic = "force-dynamic";

type AssistantPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function AssistantPage({ searchParams }: AssistantPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [{ data: rows, error }, symptomProbe] = await Promise.all([
    supabase
      .from("messages")
      .select("id, role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    fetchSymptomsForUser(supabase, user.id, 1),
  ]);

  if (error) {
    console.error("[assistant page] messages", error.message);
  }

  const hasLoggedSymptoms = symptomProbe.length > 0;
  const prefill = (searchParams ? (await searchParams).q : undefined) ?? "";
  const initialInput = prefill.trim().slice(0, 500);

  const legacySeedMessages: AssistantChatMessage[] = (rows ?? [])
    .filter(
      (r): r is AssistantChatMessage =>
        typeof r.id === "string" &&
        (r.role === "user" || r.role === "assistant") &&
        typeof r.content === "string",
    )
    .reverse();

  return (
    <AppPage className="gap-4 pb-2 sm:gap-5 sm:pb-3">
      <header className="mx-auto w-full max-w-6xl border-b border-border/45 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Assistant</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Your workspace with {ZYRA.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Organize chats, reuse prompts, and get plain-language explanations —{" "}
          <strong className="font-medium text-foreground">education only</strong>, never a substitute for in-person
          care.
        </p>
        <p className="mt-2 text-xs text-muted">{PRIVACY_ONLY_YOU}</p>
      </header>

      <AssistantWorkspace
        userId={user.id}
        hasLoggedSymptoms={hasLoggedSymptoms}
        initialInput={initialInput}
        legacySeedMessages={legacySeedMessages}
      />
    </AppPage>
  );
}
