import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bookmark,
  CalendarHeart,
  ClipboardList,
  MapPinned,
  MessageCircleHeart,
} from "lucide-react";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { formatCycleDate } from "@/lib/cycles/format";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { getProfileCompleteness } from "@/lib/profiles/completeness";
import { getProfileForUser } from "@/lib/profiles/queries";
import { countSavedSpecialistsForUser } from "@/lib/specialists/saved-queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

function firstNameFromProfile(fullName: string | null | undefined): string {
  const t = fullName?.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? "there";
}

/** Calendar add in local time, noon anchor; returns YYYY-MM-DD */
function addCalendarDays(isoYmd: string, days: number): string {
  const d = new Date(`${isoYmd}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cycleLengthForEstimate(
  profileAvg: number | null | undefined,
): { days: number; source: "profile" | "default" } {
  if (
    profileAvg != null &&
    Number.isFinite(profileAvg) &&
    profileAvg >= 21 &&
    profileAvg <= 50
  ) {
    return { days: Math.round(profileAvg), source: "profile" };
  }
  return { days: 28, source: "default" };
}

function isMedicineActive(endDate: string | null): boolean {
  if (endDate == null || endDate.trim() === "") return true;
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(end.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end >= today;
}

/** Days since logged_date (0 = today) */
function daysSinceSymptomLog(loggedDate: string): number {
  const log = new Date(`${loggedDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((today.getTime() - log.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const profile = await getProfileForUser(supabase, user.id);
  const { percent, missing } = getProfileCompleteness(profile);
  const firstName = firstNameFromProfile(profile?.full_name);

  const [cycles, medicines, symptoms, savedCount] = await Promise.all([
    fetchCyclesForUser(supabase, user.id, 1),
    fetchMedicinesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id, 1),
    countSavedSpecialistsForUser(supabase, user.id),
  ]);

  const lastPeriod = cycles[0];
  const { days: cycleDays, source: cycleLengthSource } = cycleLengthForEstimate(
    profile?.average_cycle_length,
  );
  const nextPeriodEstimate =
    lastPeriod != null ? addCalendarDays(lastPeriod.start_date, cycleDays) : null;

  const activeMedicineCount = medicines.filter((m) => isMedicineActive(m.end_date)).length;
  const latestSymptom = symptoms[0];

  const symptomRecentEnough =
    latestSymptom != null && daysSinceSymptomLog(latestSymptom.logged_date) <= 7;

  const nudges: string[] = [];
  if (!symptomRecentEnough) {
    nudges.push("Want to log how you’re feeling today?");
  }
  if (savedCount === 0) {
    nudges.push("You can save specialists you may want to revisit later.");
  }

  return (
    <div className="space-y-5 sm:space-y-10">
      {/* A. Personalized greeting */}
      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">Home</p>
        <h1 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-4xl">
          Hi {firstName}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Here&apos;s a gentle snapshot of your health journey.
        </p>
        {percent < 100 && missing.length > 0 ? (
          <p className="mt-4 text-xs leading-relaxed text-muted">
            When you have a moment, you can round out your profile from{" "}
            <Link href="/app/more" className="font-semibold text-accent underline-offset-2 hover:underline">
              More → Profile
            </Link>
            .
          </p>
        ) : null}
      </section>

      {/* B. Today’s insight — cycle */}
      <section
        aria-labelledby="insight-heading"
        className="rounded-2xl border border-border/70 bg-soft-rose/20 p-4 shadow-sm sm:rounded-3xl sm:p-7"
      >
        <h2
          id="insight-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          Today&apos;s insight
        </h2>
        {lastPeriod ? (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground sm:mt-4 sm:space-y-4 sm:text-base">
            <p>
              <span className="font-medium text-foreground">Last period started </span>
              <span className="font-serif font-semibold text-foreground">
                {formatCycleDate(lastPeriod.start_date)}
              </span>
              .
            </p>
            {nextPeriodEstimate ? (
              <p>
                <span className="font-medium text-foreground">Rough next period around </span>
                <span className="font-serif font-semibold text-foreground">
                  {formatCycleDate(nextPeriodEstimate)}
                </span>
                {cycleLengthSource === "profile" ? (
                  <span className="text-muted"> (using your average cycle length).</span>
                ) : (
                  <span className="text-muted"> (using a simple ~28 day estimate).</span>
                )}
              </p>
            ) : null}
            <p className="text-xs leading-relaxed text-muted sm:text-sm">
              This is a soft calendar hint, not a prediction or medical advice. Bodies vary week to
              week.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Log your first period to start seeing cycle insights.
          </p>
        )}
      </section>

      {/* C. Quick action cards */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          Quick actions
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3 lg:grid-cols-4">
          <li className="min-w-0">
            <Link
              href="/app/cycle"
              className="flex h-full min-h-[3.75rem] flex-col justify-center gap-1.5 rounded-xl border border-border/70 bg-background/85 px-2.5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent sm:size-10 sm:rounded-2xl">
                <CalendarHeart className="size-4 sm:size-5" aria-hidden />
              </span>
              <span className="leading-snug">Log period</span>
            </Link>
          </li>
          <li className="min-w-0">
            <Link
              href="/app/health-log"
              className="flex h-full min-h-[3.75rem] flex-col justify-center gap-1.5 rounded-xl border border-border/70 bg-background/85 px-2.5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent sm:size-10 sm:rounded-2xl">
                <ClipboardList className="size-4 sm:size-5" aria-hidden />
              </span>
              <span className="leading-snug">Log symptom</span>
            </Link>
          </li>
          <li className="min-w-0">
            <Link
              href="/app/assistant"
              className="flex h-full min-h-[3.75rem] flex-col justify-center gap-1.5 rounded-xl border border-border/70 bg-background/85 px-2.5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent sm:size-10 sm:rounded-2xl">
                <MessageCircleHeart className="size-4 sm:size-5" aria-hidden />
              </span>
              <span className="leading-snug">Ask Zyra</span>
            </Link>
          </li>
          <li className="min-w-0">
            <Link
              href="/app/specialists"
              className="flex h-full min-h-[3.75rem] flex-col justify-center gap-1.5 rounded-xl border border-border/70 bg-background/85 px-2.5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent sm:size-10 sm:rounded-2xl">
                <MapPinned className="size-4 sm:size-5" aria-hidden />
              </span>
              <span className="leading-snug">Find specialist</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* D. Recent activity snapshot */}
      <section
        aria-labelledby="snapshot-heading"
        className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:rounded-3xl sm:p-7"
      >
        <h2
          id="snapshot-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          Recent activity
        </h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed sm:mt-5 sm:space-y-4">
          <li className="flex flex-col gap-1 border-b border-border/50 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:pb-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Latest symptom
            </span>
            {latestSymptom ? (
              <span className="text-foreground">
                <span className="font-medium">{latestSymptom.symptom}</span>
                <span className="text-muted"> · {formatCycleDate(latestSymptom.logged_date)}</span>
              </span>
            ) : (
              <span className="text-muted">Nothing logged yet — add one when it feels right.</span>
            )}
          </li>
          <li className="flex flex-col gap-1 border-b border-border/50 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:pb-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Medicines
            </span>
            <span className="text-foreground">
              {medicines.length === 0 ? (
                <span className="text-muted">No medicines on your list yet.</span>
              ) : (
                <span className="block">
                  <span className="font-medium text-foreground">
                    {activeMedicineCount} active
                    {medicines.length !== activeMedicineCount
                      ? ` · ${medicines.length} total on your log`
                      : ""}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    Active means no end date, or an end date that hasn&apos;t passed.
                  </span>
                </span>
              )}
            </span>
          </li>
          <li className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Saved specialists
            </span>
            <span className="text-foreground">
              {savedCount === 0 ? (
                <span className="text-muted">Save specialists you may want to revisit later.</span>
              ) : (
                <span className="font-medium">
                  {savedCount} saved
                  <Link
                    href="/app/saved"
                    className="ml-2 text-xs font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    View →
                  </Link>
                </span>
              )}
            </span>
          </li>
        </ul>
      </section>

      {/* E. Gentle nudge */}
      {nudges.length > 0 ? (
        <section
          aria-label="Suggestions"
          className="rounded-xl border border-dashed border-border/80 bg-surface/60 px-4 py-3 sm:rounded-2xl sm:px-6 sm:py-4"
        >
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {nudges.map((text) => (
              <li key={text} className="flex gap-2">
                <span className="shrink-0 text-accent" aria-hidden>
                  ·
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="rounded-xl border border-border/60 bg-soft-rose/25 px-3 py-2.5 text-center text-[11px] leading-relaxed text-muted sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
        Your health data is private and only visible to you.
      </p>

      <p className="text-center text-xs leading-relaxed text-muted">
        {ZYRA.name} is a companion, not a clinician.{" "}
        <Link href="/app/more" className="font-semibold text-accent underline-offset-2 hover:underline">
          More
        </Link>{" "}
        has resources, specialists, and profile.
      </p>
    </div>
  );
}
