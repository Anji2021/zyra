import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HackathonAgentShell } from "@/components/hackathon/HackathonAgentShell";
import { ZyraAgentFlow } from "@/components/hackathon/ZyraAgentFlow";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { HACKATHON_MODE } from "@/lib/featureFlags";
import { fetchSavedPlaceIdsForUser } from "@/lib/specialists/saved-queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Zyra Agent",
  robots: { index: false, follow: false },
};

type AgentPageProps = {
  searchParams?: Promise<{ q?: string; zip?: string; insurance?: string }>;
};

export default async function ZyraAgentPage({ searchParams }: AgentPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/?auth=required");
  }

  const params = (searchParams ? await searchParams : undefined) ?? {};
  const initialSymptoms = (params.q ?? "").trim().slice(0, 500);
  const initialZip = (params.zip ?? "").trim().slice(0, 10);
  const initialInsurance = (params.insurance ?? "").trim().slice(0, 80);

  const savedPlaceIds = Array.from(await fetchSavedPlaceIdsForUser(supabase, user.id));

  if (HACKATHON_MODE) {
    return (
      <AppPage className="min-h-0 flex-1 gap-3 overflow-hidden sm:gap-4">
        <HackathonAgentShell
          header={
            <PageHeader
              density="compact"
              eyebrow="Zyra Agent"
              title="Research, rank, reach out"
              subtitle="Ranked matches and outreach in one workspace."
            />
          }
        >
          <ZyraAgentFlow
            savedPlaceIds={savedPlaceIds}
            initialSymptoms={initialSymptoms}
            initialZip={initialZip}
            initialInsurance={initialInsurance}
          />
        </HackathonAgentShell>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="AI Care Coordination"
        title="One agent for your whole care path"
        subtitle={`${ZYRA.name} researches options, matches you to the right women’s health care, runs outreach, and hands you a care plan — without bouncing between tools.`}
      />
      <ZyraAgentFlow
        savedPlaceIds={savedPlaceIds}
        initialSymptoms={initialSymptoms}
        initialZip={initialZip}
        initialInsurance={initialInsurance}
      />
    </AppPage>
  );
}
