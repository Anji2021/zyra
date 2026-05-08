import { redirect } from "next/navigation";
import Link from "next/link";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { HealthTimelinePage } from "@/components/health-timeline/health-timeline-page";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { getProfileForUser } from "@/lib/profiles/queries";
import { fetchRemindersForTimeline } from "@/lib/reminders/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { buildHealthTimelineEvents, buildRuleBasedTimelineSummaries } from "@zyra/shared";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [profile, cycles, symptoms, medicines, reminders] = await Promise.all([
    getProfileForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id, 80),
    fetchSymptomsForUser(supabase, user.id, 150),
    fetchMedicinesForUser(supabase, user.id, 80),
    fetchRemindersForTimeline(supabase, user.id, 120),
  ]);

  const initialEvents = buildHealthTimelineEvents({
    cycles,
    symptoms,
    medicines,
    reminders,
    profileUpdatedAt: profile?.updated_at ?? null,
  });

  const now = new Date();
  const summaries = buildRuleBasedTimelineSummaries(initialEvents, now);

  return (
    <AppPage className="gap-6 sm:gap-8">
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,72rem)]">
        <div className="border-b border-border/50 pb-5">
          <PageHeader
            eyebrow="Timeline"
            title="AI Health Timeline"
            subtitle="Your cycle, symptoms, medicines, notes, and reminders organized over time."
          />
          <p className="mt-2 text-[11px] text-muted sm:text-xs">
            Summaries are rule-based for now — educational only, not medical advice.
          </p>
        </div>

        <section className="mt-5 sm:mt-6" aria-label="What changed teaser">
          <div className="rounded-2xl border border-border/50 bg-background/90 px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">What changed recently?</h2>
                <p className="mt-0.5 text-xs text-muted sm:text-sm">See pattern comparisons in Insights.</p>
              </div>
              <Link
                href="/app/insights"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-accent/35 bg-soft-rose/35 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/55 sm:text-sm"
              >
                View insights
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 sm:mt-8">
          <HealthTimelinePage
            initialEvents={initialEvents}
            summaries={summaries}
            generatedAtIso={now.toISOString()}
          />
        </div>
      </div>
    </AppPage>
  );
}
