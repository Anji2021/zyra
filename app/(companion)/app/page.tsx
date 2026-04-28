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

function todayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysUntilDate(isoYmd: string): number {
  const target = new Date(`${isoYmd}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatReminderTime(time: string | null): string {
  if (!time) return "";
  const [hhRaw, mmRaw] = time.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return time;
  const period = hh >= 12 ? "PM" : "AM";
  const displayHour = hh % 12 === 0 ? 12 : hh % 12;
  return `${displayHour}:${String(mm).padStart(2, "0")} ${period}`;
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

  const [cycles, medicines, symptoms, savedCount, remindersResult] = await Promise.all([
    fetchCyclesForUser(supabase, user.id, 1),
    fetchMedicinesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id, 5),
    countSavedSpecialistsForUser(supabase, user.id),
    supabase
      .from("reminders")
      .select("id,title,message,reminder_date,reminder_time,is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("reminder_date", { ascending: true })
      .order("reminder_time", { ascending: true })
      .limit(20),
  ]);

  const lastPeriod = cycles[0];
  const { days: cycleDays, source: cycleLengthSource } = cycleLengthForEstimate(
    profile?.average_cycle_length,
  );
  const nextPeriodEstimate =
    lastPeriod != null ? addCalendarDays(lastPeriod.start_date, cycleDays) : null;

  const activeMedicineCount = medicines.filter((m) => isMedicineActive(m.end_date)).length;
  const latestSymptom = symptoms[0];
  const reminders = remindersResult.data ?? [];
  const reminderError = remindersResult.error;
  if (reminderError) {
    console.error("[home] reminders.select:", reminderError.message);
  }

  const today = todayYmd();
  const hasSymptomToday = symptoms.some((s) => s.logged_date === today);
  const symptomLoggedWithin3Days = symptoms.some((s) => daysSinceSymptomLog(s.logged_date) <= 3);
  const nextUpcomingReminder = reminders.find((r) => {
    if (!r.reminder_date) return false;
    if (r.reminder_date > today) return true;
    if (r.reminder_date < today) return false;
    if (!r.reminder_time) return true;
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return r.reminder_time.slice(0, 5) >= current;
  });

  const symptomRecentEnough =
    latestSymptom != null && daysSinceSymptomLog(latestSymptom.logged_date) <= 7;

  const nudges: string[] = [];
  if (!symptomRecentEnough) {
    nudges.push("Want to log how you’re feeling today?");
  }
  if (savedCount === 0) {
    nudges.push("You can save specialists you may want to revisit later.");
  }
  if (reminders.length === 0) {
    nudges.push("Set reminders so Zyra can support you proactively.");
  }
  if (!symptomLoggedWithin3Days) {
    nudges.unshift("You haven’t logged symptoms recently — want to check in?");
  }
  const visibleNudges = nudges.slice(0, 2);
  const nextPeriodDaysAway = nextPeriodEstimate ? daysUntilDate(nextPeriodEstimate) : null;
  const featureCards = [
    {
      title: "Track your cycle",
      description: "Log start and end dates to keep a gentle cycle history.",
      href: "/app/cycle",
    },
    {
      title: "Log symptoms & medicines",
      description: "Capture how you feel and what you’re taking in one place.",
      href: "/app/health-log",
    },
    {
      title: "Understand insights",
      description: "See simple pattern summaries from your own logs.",
      href: "/app/insights",
    },
    {
      title: "Ask Zyra",
      description: "Get supportive, educational guidance when you need it.",
      href: "/app/assistant",
    },
    {
      title: "Find specialists",
      description: "Discover and save specialists you may want to revisit.",
      href: "/app/specialists",
    },
    {
      title: "Set reminders",
      description: "Stay on track with gentle reminder prompts.",
      href: "/app/reminders",
    },
  ] as const;

  const recommendedNextStep =
    cycles.length === 0
      ? { label: "Log your first period", href: "/app/cycle" }
      : symptoms.length === 0
        ? { label: "Log how you’re feeling", href: "/app/health-log" }
        : reminders.length === 0
          ? { label: "Set a reminder", href: "/app/reminders" }
          : { label: "Ask Zyra about your recent patterns", href: "/app/assistant" };

  return (
    <div className="space-y-5 sm:space-y-10">
      {/* A. Personalized greeting */}
      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">Home</p>
        <h1 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-4xl">
          Hi {firstName}, welcome to Zyra
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Zyra helps you track your cycle, log symptoms, understand health patterns, ask questions,
          find specialists, and set reminders.
        </p>
        <p className="mt-2 text-sm text-foreground">You&apos;re doing great. Zyra is here to support you.</p>
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

      <section aria-labelledby="what-you-can-do-heading">
        <h2
          id="what-you-can-do-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          What you can do here
        </h2>
        <ul className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
          {featureCards.map((card) => (
            <li key={card.title} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
              <p className="font-medium text-foreground">{card.title}</p>
              <p className="mt-1 text-sm text-muted">{card.description}</p>
              <Link
                href={card.href}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
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
                {nextPeriodDaysAway != null && nextPeriodDaysAway <= 3 ? (
                  <>
                    <span className="font-medium text-foreground">Your period may start soon.</span>
                    <span className="text-muted"> Keep your essentials and comfort plan nearby.</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-foreground">Your next period may be in </span>
                    <span className="font-serif font-semibold text-foreground">
                      {Math.max(0, nextPeriodDaysAway ?? 0)} days
                    </span>
                    <span className="text-muted">.</span>
                  </>
                )}
              </p>
            ) : null}
            {nextPeriodEstimate ? (
              <p className="text-xs text-muted">
                Estimated around {formatCycleDate(nextPeriodEstimate)}{" "}
                {cycleLengthSource === "profile" ? "(using your average cycle length)." : "(using ~28 days)."}
              </p>
            ) : null}
            <p className="text-xs leading-relaxed text-muted sm:text-sm">
              Let’s check in together. This is a soft calendar hint, not a prediction or medical advice.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Log your cycle to start seeing insights.
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
            Today&apos;s check-in
          </h2>
          {!hasSymptomToday ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-foreground">How are you feeling today?</p>
              <Link
                href="/app/health-log"
                className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
              >
                Log symptom
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-foreground">
              You&apos;ve logged your symptoms today - great job. You&apos;re doing great.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
            Upcoming reminder
          </h2>
          {nextUpcomingReminder ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-foreground">
                Next reminder: {nextUpcomingReminder.title}
                {nextUpcomingReminder.reminder_time
                  ? ` at ${formatReminderTime(nextUpcomingReminder.reminder_time)}`
                  : ""}
              </p>
              <p className="text-xs text-muted">
                {nextUpcomingReminder.reminder_date
                  ? `Scheduled for ${formatCycleDate(nextUpcomingReminder.reminder_date)}`
                  : "Scheduled soon"}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted">Set reminders to stay on track.</p>
              <Link
                href="/app/reminders"
                className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
              >
                Set reminders
              </Link>
            </div>
          )}
        </article>
      </section>

      <section
        aria-labelledby="snapshot-heading"
        className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:rounded-3xl sm:p-7"
      >
        <h2
          id="snapshot-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          Today&apos;s snapshot
        </h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed sm:mt-5 sm:space-y-4">
          <li className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Next period estimate</span>
            <span className="text-foreground">
              {nextPeriodEstimate
                ? `${formatCycleDate(nextPeriodEstimate)}${nextPeriodDaysAway != null ? ` (${Math.max(0, nextPeriodDaysAway)} days)` : ""}`
                : "Add cycle entries to unlock this"}
            </span>
          </li>
          <li className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Latest symptom</span>
            <span className="text-foreground">
              {latestSymptom
                ? `${latestSymptom.symptom} · ${formatCycleDate(latestSymptom.logged_date)}`
                : "No symptom logged yet"}
            </span>
          </li>
          <li className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Upcoming reminder</span>
            <span className="text-foreground">
              {nextUpcomingReminder
                ? `${nextUpcomingReminder.title}${nextUpcomingReminder.reminder_time ? ` · ${formatReminderTime(nextUpcomingReminder.reminder_time)}` : ""}`
                : "No active reminder yet"}
            </span>
          </li>
          <li className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Saved specialists</span>
            <span className="font-medium text-foreground">{savedCount}</span>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
          Recommended next step
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground">Let&apos;s check in: {recommendedNextStep.label}</p>
        <Link
          href={recommendedNextStep.href}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
        >
          Continue
        </Link>
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
        aria-labelledby="recent-activity-heading"
        className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm sm:rounded-3xl sm:p-7"
      >
        <h2
          id="recent-activity-heading"
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
      {visibleNudges.length > 0 ? (
        <section
          aria-label="Suggestions"
          className="rounded-xl border border-dashed border-border/80 bg-surface/60 px-4 py-3 sm:rounded-2xl sm:px-6 sm:py-4"
        >
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {visibleNudges.map((text) => (
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
        Zyra is here to support you. {ZYRA.name} is a companion, not a clinician.{" "}
        <Link href="/app/more" className="font-semibold text-accent underline-offset-2 hover:underline">
          More
        </Link>{" "}
        has resources, specialists, and profile.
      </p>
    </div>
  );
}
