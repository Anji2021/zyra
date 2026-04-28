import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircleHeart } from "lucide-react";
import { formatCycleDate } from "@/lib/cycles/format";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import {
  buildCycleInsights,
  buildMedicineInsights,
  buildSymptomInsights,
  hasAnyTracking,
} from "@/lib/insights/build-summary";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { getProfileForUser } from "@/lib/profiles/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { GLOBAL_MEDICAL_DISCLAIMER } from "@/lib/zyra/medical-disclaimer";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

function formatLoggedAt(iso: string): string {
  const datePart = iso.slice(0, 10);
  if (datePart.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return formatCycleDate(datePart);
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function estimateFootnote(source: "logged-intervals" | "profile" | "default"): string {
  if (source === "logged-intervals") return "Based on your logged period starts.";
  if (source === "profile") return "Based on the average cycle length in your profile.";
  return "Using a simple ~28 day placeholder — add more logs or your profile average for a closer hint.";
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [profile, cycles, symptoms, medicines] = await Promise.all([
    getProfileForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id),
    fetchMedicinesForUser(supabase, user.id),
  ]);

  const cycle = buildCycleInsights(profile, cycles);
  const symptom = buildSymptomInsights(symptoms);
  const medicine = buildMedicineInsights(medicines);
  const any = hasAnyTracking(cycle, symptom, medicine);

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <header className="space-y-2 sm:space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
          Insights
        </p>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Patterns worth noticing
        </h1>
        <p className="max-w-2xl text-sm leading-snug text-muted sm:leading-relaxed sm:text-base">
          Soft summaries from what you chose to log — memory support, not medical advice.
        </p>
      </header>

      <p className="rounded-xl border border-border/60 bg-soft-rose/20 px-3 py-2 text-center text-[11px] leading-relaxed text-muted sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-xs">
        {GLOBAL_MEDICAL_DISCLAIMER}
      </p>

      {!any ? (
        <section className="rounded-2xl border border-dashed border-border/80 bg-surface/90 p-5 text-center sm:rounded-3xl sm:p-8">
          <p className="font-serif text-lg font-semibold text-foreground">No patterns yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            When you log periods, symptoms, or medicines, {ZYRA.name} can reflect gentle trends
            here — always for your eyes only.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:mx-auto sm:max-w-md sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Link
              href="/app/cycle"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30"
            >
              Log period
            </Link>
            <Link
              href="/app/health-log"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30"
            >
              Log symptom
            </Link>
            <Link
              href="/app/assistant"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30"
            >
              <MessageCircleHeart className="size-4 shrink-0" aria-hidden />
              Ask Zyra
            </Link>
          </div>
          <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-border/60 bg-soft-rose/20 p-4 text-left sm:p-5">
            <h2 className="font-serif text-base font-semibold text-foreground">Gentle reminders</h2>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-muted sm:text-sm">
              <li>Keep tracking for more accurate insights.</li>
              <li>
                If symptoms are severe, unusual, or persistent, consider talking to a licensed
                clinician.
              </li>
              <li>{ZYRA.name} does not diagnose or prescribe treatment.</li>
            </ul>
          </div>
        </section>
      ) : null}

      {any ? (
        <>
          <section className="rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">Cycle patterns</h2>
            {!cycle.hasCycles ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Start tracking your cycle to see personalized insights.
              </p>
            ) : (
              <dl className="mt-4 space-y-3 text-sm sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 sm:space-y-0">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Last period start
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {cycle.lastPeriodStart ? formatCycleDate(cycle.lastPeriodStart) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Logged cycles
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{cycle.cycleCount}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Average cycle length
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {cycle.averageCycleLengthDays != null
                      ? `About ${cycle.averageCycleLengthDays} days`
                      : "—"}
                    {cycle.averageSource === "logged-intervals" ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        From your logged starts.
                      </span>
                    ) : cycle.averageSource === "profile" ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        From your profile.
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Rough next period
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {cycle.estimatedNextPeriod ? formatCycleDate(cycle.estimatedNextPeriod) : "—"}
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {estimateFootnote(cycle.estimateSource)}
                    </span>
                  </dd>
                </div>
              </dl>
            )}
            {cycle.irregularityNote ? (
              <p className="mt-4 rounded-xl border border-border/60 bg-soft-rose/25 px-3 py-2.5 text-xs leading-relaxed text-muted sm:text-sm">
                {cycle.irregularityNote}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">Symptom patterns</h2>
            {!symptom.hasSymptoms ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Log how you&apos;re feeling to build your health history.
              </p>
            ) : (
              <dl className="mt-4 space-y-3 text-sm sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 sm:space-y-0">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Most recent
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {symptom.mostRecent?.symptom ?? "—"}
                    {symptom.mostRecent ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        {formatCycleDate(symptom.mostRecent.logged_date)}
                        {symptom.mostRecent.severity != null
                          ? ` · severity ${symptom.mostRecent.severity}/5`
                          : ""}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Most frequent name
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {symptom.mostFrequent ? (
                      <>
                        {symptom.mostFrequent.label}
                        <span className="mt-0.5 block text-xs font-normal text-muted">
                          Logged {symptom.mostFrequent.count} times
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">No repeat label yet</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Highest severity logged
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {symptom.highestSeverity ? (
                      <>
                        {symptom.highestSeverity.symptom}{" "}
                        <span className="text-muted">({symptom.highestSeverity.severity}/5)</span>
                        <span className="mt-0.5 block text-xs font-normal text-muted">
                          {formatCycleDate(symptom.highestSeverity.logged_date)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">No severity scores yet</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Total logs
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{symptom.totalCount}</dd>
                </div>
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">Medicine snapshot</h2>
            {!medicine.hasMedicines ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                No medicines on your list yet. Add entries on the Health log when it helps you
                prepare for visits.
              </p>
            ) : (
              <dl className="mt-4 space-y-3 text-sm sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3 sm:space-y-0">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Active medicines
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{medicine.activeCount}</dd>
                  <dd className="mt-0.5 text-xs text-muted">
                    Active means no end date, or end date not passed.
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Total entries
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">{medicine.totalCount}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Most recently added
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {medicine.mostRecentAdded?.name ?? "—"}
                    {medicine.mostRecentAdded ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        {formatLoggedAt(medicine.mostRecentAdded.created_at)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-soft-rose/25 p-4 sm:rounded-3xl sm:p-6">
            <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">
              Gentle reminders
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
              <li>Keep tracking for more accurate insights.</li>
              <li>
                If symptoms are severe, unusual, or persistent, consider talking to a licensed
                clinician.
              </li>
              <li>{ZYRA.name} does not diagnose or prescribe treatment.</li>
            </ul>
          </section>
        </>
      ) : null}

      {any ? (
        <p className="text-center text-[11px] leading-relaxed text-muted sm:text-xs">
          Only you can see this page. Nothing here replaces labs, imaging, or your clinician&apos;s
          judgment.
        </p>
      ) : null}
    </div>
  );
}
