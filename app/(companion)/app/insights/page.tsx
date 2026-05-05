import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircleHeart } from "lucide-react";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { CarePrepVideoStoryboard } from "@/components/insights/care-prep-video-storyboard";
import { InsightCarePrepContext } from "@/components/insights/insight-care-prep-context";
import { InsightReportToolbar } from "@/components/insights/insight-report-toolbar";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { hasAnyTracking, buildCycleInsights, buildMedicineInsights, buildSymptomInsights } from "@/lib/insights/build-summary";
import { buildInsightSummaryDocument } from "@/lib/insight-summary/build-document";
import type { DoctorMatchHistoryRow } from "@/lib/insight-summary/types";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { getProfileForUser } from "@/lib/profiles/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { GLOBAL_MEDICAL_DISCLAIMER } from "@/lib/zyra/medical-disclaimer";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [profile, cycles, symptoms, medicines, dmResult] = await Promise.all([
    getProfileForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id),
    fetchMedicinesForUser(supabase, user.id),
    supabase
      .from("doctor_match_history")
      .select("symptoms,pattern,specialist,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (dmResult.error) {
    console.error("[insights page] doctor_match_history:", dmResult.error.message);
  }

  const doctorMatchHistory = (dmResult.data ?? []) as DoctorMatchHistoryRow[];
  const report = buildInsightSummaryDocument({
    profile,
    cycles,
    symptoms,
    medicines,
    doctorMatchHistory,
  });

  const cycle = buildCycleInsights(profile, cycles);
  const symptom = buildSymptomInsights(symptoms);
  const medicine = buildMedicineInsights(medicines);
  const any = hasAnyTracking(cycle, symptom, medicine);

  return (
    <AppPage className="gap-5 sm:gap-7">
      <div id="insights-report" className="mx-auto flex w-full min-w-0 max-w-[min(100%,52rem)] flex-col gap-5 sm:gap-7">
        <div className="border-b border-border/50 pb-4">
          <PageHeader
            eyebrow="Insights"
            title="Your Health Insights"
            subtitle={
              <>
                A gentle summary of patterns from your cycle, symptoms, medicines, and DoctorMatch history.
                <span className="mt-2 block text-[10px] text-muted/85 sm:text-[11px]">
                  Educational only — not medical advice.
                </span>
              </>
            }
          />
        </div>

      <section
        data-pdf-card
        className="rounded-2xl border border-border/60 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-5"
      >
        <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">Possible patterns</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-muted sm:text-xs">Quick highlights from your logs.</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {report.patternCards.map((card) => (
            <div
              key={card.id}
              data-pdf-card
              className="flex flex-col rounded-xl border border-border/50 bg-background/90 px-3 py-2.5 sm:min-h-[8.5rem] sm:px-3 sm:py-3"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">{card.title}</p>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{card.highlight}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] leading-snug text-muted marker:text-accent/80">
                {card.bullets.map((b, i) => (
                  <li key={`${card.id}-${i}`} className="pl-0.5">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] leading-snug text-muted/90 sm:text-[11px]">
          Educational hints only — not a diagnosis. Discuss concerns with a clinician.
        </p>
      </section>

      <section
        data-pdf-card
        className="rounded-2xl border border-border/60 bg-background/90 p-4 sm:rounded-3xl sm:p-5"
      >
        <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">Summary</h2>
        <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-sm leading-snug text-foreground sm:space-y-2 sm:leading-relaxed">
          {report.summaryBullets.map((b, i) => (
            <li key={i} className="pl-0.5 marker:text-accent">
              {b}
            </li>
          ))}
        </ul>
        {report.unusualPatterns.length > 0 ? (
          <div
            data-pdf-card
            className="mt-3 rounded-lg border border-accent/20 bg-soft-rose/15 px-3 py-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Worth reviewing</p>
            <ul className="mt-1 space-y-1 text-xs leading-snug text-foreground sm:text-sm">
              {report.unusualPatterns.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">Care prep video</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-muted sm:text-xs">
          Storyboard preview from your insight summary — educational only, not medical advice.
        </p>
        <CarePrepVideoStoryboard report={report} />
      </section>

      <section
        data-pdf-card
        className="rounded-2xl border border-border/60 bg-soft-rose/12 p-4 sm:rounded-3xl sm:p-5"
      >
        <h2 className="font-serif text-base font-semibold text-foreground sm:text-lg">Doctor visit prep</h2>
        <div className="mt-3 space-y-3 text-sm leading-snug sm:leading-relaxed">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">
              Possible specialist
            </h3>
            <p className="mt-1 text-foreground">
              {report.possibleSpecialist ??
                "Not specified from recent DoctorMatch — primary care or women’s health may be a starting point to discuss."}
            </p>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">
              Questions to ask
            </h3>
            <ul className="mt-1 list-inside list-decimal space-y-1 text-foreground">
              {report.questionsToAsk.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">
              What to bring
            </h3>
            <ul className="mt-1 list-inside list-disc space-y-1 text-foreground">
              {report.doctorVisitChecklist.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <InsightCarePrepContext carePrepScript={report.carePrepScript} />
        </div>
        <InsightReportToolbar report={report} />
      </section>

      {!any ? (
        <section className="rounded-xl border border-dashed border-border/70 bg-surface/60 px-4 py-4 text-center sm:px-6">
          <p className="text-sm font-medium text-foreground">Build your report over time</p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
            Logging periods, symptoms, or medicines adds depth to these cards — still private to your account.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href="/app/cycle"
              className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/40"
            >
              Log period
            </Link>
            <Link
              href="/app/health-log"
              className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/40"
            >
              Health log
            </Link>
            <Link
              href="/app/assistant"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/40"
            >
              <MessageCircleHeart className="size-3.5 shrink-0" aria-hidden />
              Ask {ZYRA.name}
            </Link>
          </div>
        </section>
      ) : null}

        <footer className="space-y-2 border-t border-border/40 pt-4 text-center">
          <p className="text-[10px] leading-relaxed text-muted sm:text-[11px]">{GLOBAL_MEDICAL_DISCLAIMER}</p>
          <p className="text-[10px] leading-relaxed text-muted/80">
            Only you can see this page. Nothing here replaces labs, imaging, or your clinician&apos;s judgment.
          </p>
        </footer>
      </div>
    </AppPage>
  );
}
