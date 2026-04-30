import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarHeart, ClipboardList, MapPinned } from "lucide-react";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { formatCycleDate } from "@/lib/cycles/format";
import { getProfileForUser, hasUserHealthProfileRow } from "@/lib/profiles/queries";
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

function cycleLengthForEstimate(profileAvg: number | null | undefined): number {
  if (
    profileAvg != null &&
    Number.isFinite(profileAvg) &&
    profileAvg >= 21 &&
    profileAvg <= 50
  ) {
    return Math.round(profileAvg);
  }
  return 28;
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

  const [profile, hasSavedHealthProfile] = await Promise.all([
    getProfileForUser(supabase, user.id),
    hasUserHealthProfileRow(supabase, user.id),
  ]);
  const firstName = firstNameFromProfile(profile?.full_name);

  const [cycles, symptoms] = await Promise.all([
    fetchCyclesForUser(supabase, user.id, 1),
    fetchSymptomsForUser(supabase, user.id, 5),
  ]);

  const lastPeriod = cycles[0];
  const cycleDays = cycleLengthForEstimate(profile?.average_cycle_length);
  const nextPeriodEstimate =
    lastPeriod != null ? addCalendarDays(lastPeriod.start_date, cycleDays) : null;
  const latestSymptom = symptoms[0];
  const symptomRecentEnough = latestSymptom != null && daysSinceSymptomLog(latestSymptom.logged_date) <= 7;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">Home</p>
        <h1 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Good morning, {firstName}
        </h1>
        <p className="mt-2 text-sm text-muted">What would you like to do today?</p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/app/health-log"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Log how you&apos;re feeling
          </Link>
          <Link
            href="/app/specialists"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-soft-rose/25"
          >
            Find a specialist
          </Link>
        </div>
        {!hasSavedHealthProfile ? (
          <div className="mt-4 rounded-xl border border-accent/35 bg-soft-rose/40 p-3.5">
            <p className="text-sm font-medium text-foreground">Complete your health profile to personalize Zyra.</p>
            <Link
              href="/app/profile"
              className="mt-3 inline-flex min-h-[2.25rem] items-center justify-center rounded-full bg-accent px-4 text-xs font-semibold text-accent-foreground transition hover:opacity-90 sm:text-sm"
            >
              Complete profile
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-soft-rose/20 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
            Next period estimate
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {nextPeriodEstimate ? formatCycleDate(nextPeriodEstimate) : "Add cycle entries"}
          </p>
        </article>
        <article className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
            Clarity insight
          </p>
          {!symptomRecentEnough ? (
            <>
              <p className="mt-2 text-sm text-foreground">
                You haven&apos;t logged symptoms recently. Tracking helps detect patterns.
              </p>
              <Link
                href="/app/health-log"
                className="mt-3 inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
              >
                Log symptom
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-foreground">
              Great consistency. Keep logging symptoms to strengthen your pattern tracking.
            </p>
          )}
        </article>
      </section>

      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          Quick actions
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
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
              href="/app/cycle"
              className="flex h-full min-h-[3.75rem] flex-col justify-center gap-1.5 rounded-xl border border-border/70 bg-background/85 px-2.5 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent sm:size-10 sm:rounded-2xl">
                <CalendarHeart className="size-4 sm:size-5" aria-hidden />
              </span>
              <span className="leading-snug">Track cycle</span>
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
