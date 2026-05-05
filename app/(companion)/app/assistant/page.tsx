import { redirect } from "next/navigation";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { AssistantChat } from "./assistant-chat";
import type { AssistantChatMessage } from "@/lib/assistant/chat-types";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { GLOBAL_MEDICAL_DISCLAIMER } from "@/lib/zyra/medical-disclaimer";
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

  const initialMessages: AssistantChatMessage[] = (rows ?? [])
    .filter(
      (r): r is AssistantChatMessage =>
        typeof r.id === "string" &&
        (r.role === "user" || r.role === "assistant") &&
        typeof r.content === "string",
    )
    .reverse();

  return (
    <AppPage className="gap-4 pb-1 sm:gap-6 sm:pb-2">
      <PageHeader
        eyebrow="Assistant"
        title="A quiet place to ask"
        subtitle={
          <>
            {ZYRA.name} answers in plain language for{" "}
            <strong className="font-medium text-foreground">education only</strong> — never a stand-in for your doctor
            or your prescriptions.
            <span className="mt-2 block text-xs text-muted">{PRIVACY_ONLY_YOU}</span>
          </>
        }
      />

      <p className="rounded-2xl border border-border/60 bg-soft-rose/20 px-3 py-2 text-center text-[11px] leading-relaxed text-muted sm:px-4 sm:py-2.5 sm:text-xs">
        {GLOBAL_MEDICAL_DISCLAIMER}
      </p>

      <div className="min-h-0 min-w-0 flex-1">
        <AssistantChat
          initialMessages={initialMessages}
          hasLoggedSymptoms={hasLoggedSymptoms}
          initialInput={initialInput}
        />
      </div>
    </AppPage>
  );
}
