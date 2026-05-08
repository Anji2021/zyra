 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileDown,
  HeartPulse,
  MessageCircleHeart,
  Pill,
  Sparkles,
  Video,
} from "lucide-react";
import { WhatChangedSection } from "@/components/patterns/what-changed-section";
import { TopicGuidesStrip } from "@/components/marketing/topic-guides-strip";
import { CarePrepVideoStoryboard } from "@/components/insights/care-prep-video-storyboard";
import { InsightCarePrepContext } from "@/components/insights/insight-care-prep-context";
import { InsightReportToolbar } from "@/components/insights/insight-report-toolbar";
import type { CycleInsights, MedicineInsights, SymptomInsights } from "@/lib/insights/build-summary";
import type { EducationalInsightCard } from "@/lib/insights/educational-insight-cards";
import { formatCycleDateSafe } from "@/lib/cycles/format";
import { ZYRA } from "@/lib/zyra/site";
import type { InsightSummaryDocument } from "@/lib/insight-summary/types";
import type { WhatChangedInsightSet } from "@zyra/shared";

function clipText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

const PATTERN_CTA: Record<"cycle" | "symptom" | "health", { href: string; label: string }> = {
  cycle: { href: "/app/cycle", label: "View cycle log" },
  symptom: { href: "/app/health-log", label: "Review symptoms" },
  health: { href: "/app/health-log", label: "Review medicines" },
};

type InsightsDashboardProps = {
  report: InsightSummaryDocument;
  cycle: CycleInsights;
  symptom: SymptomInsights;
  medicine: MedicineInsights;
  notesCount: number;
  educationalCards: EducationalInsightCard[];
  anyTracking: boolean;
  whatChanged: WhatChangedInsightSet;
};

type InsightsTab = "overview" | "changes" | "signals" | "care-prep" | "timeline";

const INSIGHTS_TABS: { key: InsightsTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "changes", label: "Changes" },
  { key: "signals", label: "Signals" },
  { key: "care-prep", label: "Care Prep" },
  { key: "timeline", label: "Timeline" },
];

export function InsightsDashboard({
  report,
  cycle,
  symptom,
  medicine,
  notesCount,
  educationalCards,
  anyTracking,
  whatChanged,
}: InsightsDashboardProps) {
  const [activeTab, setActiveTab] = useState<InsightsTab>("overview");
  const lastPeriodDisplay = cycle.lastPeriodStart
    ? formatCycleDateSafe(cycle.lastPeriodStart.slice(0, 10))
    : "—";
  const avgCycleDisplay =
    cycle.averageCycleLengthDays != null ? `${cycle.averageCycleLengthDays} days` : "—";
  const totalLogEvidence = cycle.cycleCount + symptom.totalCount + medicine.totalCount + notesCount;
  const confidence = confidenceLabel(totalLogEvidence);
  const heroSummary = buildHeroSummary({ cycle, symptom, medicine });
  const wcDefault = whatChanged.results[whatChanged.defaultComparisonKey];
  const wcByDomain = {
    cycle: wcDefault.cards.find((c) => c.id === "cycle"),
    symptom: wcDefault.cards.find((c) => c.id === "symptoms"),
    health: wcDefault.cards.find((c) => c.id === "medicines"),
  };

  const title = "Your Health Insights";
  const subtitle = "Personalized patterns from your cycle, symptoms, medicines, and health logs.";

  return (
    <div id="insights-report" className="mx-auto w-full min-w-0 max-w-[76rem]">
      <header className="sticky top-0 z-10 border-b border-border/45 bg-background/95 px-1 py-3 backdrop-blur-sm sm:px-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted sm:text-sm">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-medium text-muted">
              Confidence · {confidence}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("changes")}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-accent/35 bg-soft-rose/35 px-4 text-xs font-semibold text-accent transition hover:bg-soft-rose/50"
            >
              Update insights
            </button>
          </div>
        </div>
        <div className="-mx-1 mt-3 flex overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex min-w-max gap-2">
            {INSIGHTS_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === t.key
                    ? "border-accent/45 bg-soft-rose/45 text-foreground"
                    : "border-border/70 bg-background text-muted hover:border-accent/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="pt-5 sm:pt-6">
        {activeTab === "overview" ? (
          <section className="space-y-6">
            <section className="rounded-3xl border border-border/50 bg-gradient-to-br from-surface/98 via-background/90 to-soft-rose/20 p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-8">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">AI Snapshot</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Your recent health snapshot
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{heroSummary}</p>
                  <p className="mt-4 text-[11px] text-muted">Educational only — not medical advice.</p>
                </div>
                <div className="rounded-2xl border border-border/45 bg-background/90 p-5 shadow-[0_1px_0_rgba(42,38,44,0.04)] lg:w-[15.5rem]">
                  <Sparkles className="size-8 text-accent" aria-hidden />
                  <p className="mt-3 text-sm font-semibold leading-snug text-foreground">Guided, calm pattern review.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("changes")}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-accent/35 bg-soft-rose/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-soft-rose/55"
                  >
                    Review changes
                  </button>
                </div>
              </div>
            </section>
            <section aria-label="Core stats">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <KpiCard
                  icon={<CalendarDays className="size-4 text-accent" aria-hidden />}
                  label="Last period"
                  value={lastPeriodDisplay}
                  hint={cycle.hasCycles ? "Most recent start" : "Not logged yet"}
                />
                <KpiCard
                  icon={<Activity className="size-4 text-accent" aria-hidden />}
                  label="Cycle interval"
                  value={avgCycleDisplay}
                  hint={cycle.averageSource === "profile" ? "Profile estimate" : "From your logged intervals"}
                />
                <KpiCard
                  icon={<HeartPulse className="size-4 text-accent" aria-hidden />}
                  label="Symptoms logged"
                  value={symptom.hasSymptoms ? String(symptom.totalCount) : "0"}
                  hint={symptom.hasSymptoms ? "In your history" : "Start in Health"}
                />
              </div>
            </section>
            <section className="rounded-2xl border border-border/50 bg-background/92 p-5 shadow-sm">
              <p className="text-sm text-muted">
                {report.overview}
              </p>
            </section>
          </section>
        ) : null}

        {activeTab === "changes" ? (
          <section id="what-changed-section" className="space-y-4">
            <WhatChangedSection title="What Changed?" subtitle="Compare recent logs with previous patterns." data={whatChanged} />
          </section>
        ) : null}

        {activeTab === "signals" ? (
          <section aria-labelledby="signals-heading">
            <h2 id="signals-heading" className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
              Health signals worth monitoring
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">Possible patterns from your recent logs.</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {report.patternCards.map((card) => {
                const cta = PATTERN_CTA[card.id];
                const shortBullets = card.bullets.slice(0, 2).map((b) => clipText(b, 90)).filter(Boolean);
                const edu = educationalCards.find((c) =>
                  c.title.toLowerCase().includes(card.title.split(" ")[0]?.toLowerCase() ?? ""),
                );
                const status = signalStatusFromWhatChanged(
                  card.id === "cycle"
                    ? wcByDomain.cycle?.status
                    : card.id === "symptom"
                      ? wcByDomain.symptom?.status
                      : wcByDomain.health?.status,
                );
                return (
                  <div
                    key={card.id}
                    data-pdf-card
                    className="flex flex-col rounded-2xl border border-border/55 bg-surface/95 p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{card.title}</p>
                      <span className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted">
                        {status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
                      {clipText(card.highlight, 105)}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs leading-snug text-muted">
                      {shortBullets.slice(0, 2).map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/55" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                      {shortBullets.length < 2 && edu ? (
                        <li className="flex gap-2">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/55" aria-hidden />
                          <span>{clipText(edu.body, 88)}</span>
                        </li>
                      ) : null}
                    </ul>
                    <div className="mt-4 pt-3">
                      <Link
                        href={cta.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent underline-offset-4 hover:underline"
                      >
                        {cta.label}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeTab === "care-prep" ? (
          <section className="space-y-6" aria-labelledby="care-plan-heading">
            <div>
              <h2 id="care-plan-heading" className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
                Care plan & visit prep
              </h2>
              <p className="mt-1 text-xs text-muted sm:text-sm">Action-focused prep for your next check-in.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-8 lg:items-start">
              <div data-pdf-card className="rounded-2xl border border-border/55 bg-surface/90 p-5 shadow-sm sm:p-6">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Summary bullets</h3>
                <ul className="mt-3 space-y-2 text-sm leading-snug text-foreground">
                  {report.summaryBullets.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-accent/70" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {report.unusualPatterns.length > 0 ? (
                  <div className="mt-5 rounded-xl border border-accent/25 bg-soft-rose/15 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Worth discussing</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-snug text-foreground sm:text-sm">
                      {report.unusualPatterns.slice(0, 3).map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Questions to ask</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-snug text-foreground sm:text-sm">
                    {report.questionsToAsk.slice(0, 3).map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/55 bg-background/90 p-5 shadow-sm sm:p-6">
                  <h3 className="font-serif text-base font-semibold text-foreground">Actions</h3>
                  <div className="mt-3 grid gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground">
                      <FileDown className="size-3.5 text-accent" aria-hidden />
                      Download PDF
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground">
                      <Video className="size-3.5 text-accent" aria-hidden />
                      Create CarePrep Video
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className="inline-flex items-center justify-center rounded-xl border border-accent/35 bg-soft-rose/30 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/50"
                    >
                      Update insights
                    </button>
                  </div>
                  <div className="mt-4">
                    <InsightReportToolbar report={report} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border/55 bg-background/90 p-5 shadow-sm sm:p-6">
                  <h3 className="font-serif text-base font-semibold text-foreground">Care prep storyboard</h3>
                  <p className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">
                    Lightweight video outline for your visit conversation.
                  </p>
                  <div className="mt-3">
                    <CarePrepVideoStoryboard report={report} />
                  </div>
                </div>
              </div>
            </div>
            <section className="rounded-2xl border border-border/45 bg-soft-rose/12 p-5 sm:p-6">
              <InsightCarePrepContext carePrepScript={report.carePrepScript} />
            </section>
          </section>
        ) : null}

        {activeTab === "timeline" ? (
          <section aria-labelledby="history-preview-heading">
            <div className="rounded-2xl border border-border/50 bg-background/92 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="history-preview-heading" className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
                    Timeline / recent history preview
                  </h2>
                  <p className="mt-1 text-xs text-muted sm:text-sm">A quick glance at your latest logged items.</p>
                </div>
                <Link
                  href="/app/timeline"
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-accent/40 bg-soft-rose/30 px-5 text-sm font-semibold text-accent transition hover:bg-soft-rose/50 sm:w-auto"
                >
                  View full history
                </Link>
              </div>
              {anyTracking ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniRow
                    icon={<CalendarDays className="size-3.5 text-accent" aria-hidden />}
                    label="Latest cycle start"
                    value={cycle.lastPeriodStart ? formatCycleDateSafe(cycle.lastPeriodStart.slice(0, 10)) : "No cycle yet"}
                  />
                  <MiniRow
                    icon={<HeartPulse className="size-3.5 text-accent" aria-hidden />}
                    label="Latest symptom"
                    value={symptom.mostRecent ? clipText(symptom.mostRecent.symptom, 42) : "No symptom yet"}
                  />
                  <MiniRow
                    icon={<Pill className="size-3.5 text-accent" aria-hidden />}
                    label="Latest medicine"
                    value={medicine.mostRecentAdded ? clipText(medicine.mostRecentAdded.name, 42) : "No medicine yet"}
                  />
                  <MiniRow
                    icon={<ClipboardList className="size-3.5 text-accent" aria-hidden />}
                    label="Latest note"
                    value={notesCount > 0 ? `${notesCount} note${notesCount === 1 ? "" : "s"} logged across entries` : "No notes yet"}
                  />
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-border/65 bg-surface/70 px-4 py-5 text-sm text-muted">
                  Not enough history yet — log a few entries to unlock your recent preview.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </div>

      {!anyTracking ? (
        <section className="mt-8 rounded-2xl border border-dashed border-border/60 bg-surface/70 px-5 py-5 text-center sm:py-6">
          <p className="text-sm font-semibold text-foreground">Grow your snapshot over time</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-muted sm:text-sm">
            Periods, symptoms, or medicines deepen these cards — everything stays private to your account.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
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

      <TopicGuidesStrip variant="insights" />

      <footer className="mt-8 border-t border-border/40 pt-6 text-center">
        <p className="text-[10px] leading-relaxed text-muted sm:text-[11px]">Educational only — not medical advice.</p>
      </footer>
    </div>
  );
}

function signalStatusFromWhatChanged(status: string | undefined): string {
  if (status === "not_enough_data") return "Not enough data";
  if (status === "increased" || status === "new") return "Worth monitoring";
  if (status === "stable") return "Stable";
  return "Possible pattern";
}

function confidenceLabel(totalLogs: number): "Early stage" | "Building pattern" | "Stronger pattern" {
  if (totalLogs < 10) return "Early stage";
  if (totalLogs < 30) return "Building pattern";
  return "Stronger pattern";
}

function buildHeroSummary(input: {
  cycle: CycleInsights;
  symptom: SymptomInsights;
  medicine: MedicineInsights;
}): string {
  const pieces: string[] = [];
  if (input.cycle.hasCycles) {
    pieces.push(
      input.cycle.irregularityNote
        ? "Your cycle timing shows some variation across recent logs."
        : "Your cycle timing looks relatively stable based on recent logs.",
    );
  } else {
    pieces.push("Cycle trends are still early because there is not enough cycle history yet.");
  }
  if (input.symptom.hasSymptoms) {
    const recent = input.symptom.mostRecent?.symptom?.trim();
    pieces.push(
      recent
        ? `Recent symptom tracking includes entries like ${recent.toLowerCase()}, which may be worth monitoring.`
        : "Recent symptom logs may help reveal patterns over time.",
    );
  } else {
    pieces.push("Symptoms are not logged enough yet to show strong comparisons.");
  }
  if (input.medicine.hasMedicines) {
    pieces.push("Medicine entries are available to support clearer context for your next visit.");
  } else {
    pieces.push("No medicine history is tracked yet, so this view stays early.");
  }
  return `${pieces[0]} ${pieces[1]} ${pieces[2]}`;
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/50 bg-background/92 px-4 py-3 shadow-[0_1px_0_rgba(42,38,44,0.03)] sm:px-4 sm:py-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-soft-rose/35">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      </div>
      <p className="mt-3 font-serif text-lg font-semibold text-foreground sm:text-xl">{value}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-muted sm:text-[11px]">{hint}</p>
    </div>
  );
}

function MiniRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/55 bg-surface/95 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-snug text-foreground">{value}</p>
    </div>
  );
}
