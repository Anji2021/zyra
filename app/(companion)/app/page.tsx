import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarHeart, ClipboardList, MapPinned } from "lucide-react";
import { AppPage, PageHeader, ProductCard, ResponsiveGrid } from "@/components/product/page-system";
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

  const primaryCta = (
    <Link
      href="/app/health-log"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 sm:w-auto sm:min-w-[12rem]"
    >
      Log how you&apos;re feeling
    </Link>
  );

  return (
    <AppPage>
      <PageHeader
        eyebrow="Home"
        title={`Good morning, ${firstName}`}
        subtitle="What would you like to do today?"
        actions={primaryCta}
      />

      <ProductCard padding="md">
        <ResponsiveGrid columns={2}>
          <div className="rounded-xl border border-border/60 bg-soft-rose/25 p-3 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Next period (estimate)</p>
            <p className="mt-2 text-base font-semibold text-foreground sm:text-lg">
              {nextPeriodEstimate ? formatCycleDate(nextPeriodEstimate) : "Add cycle entries"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 p-3 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Symptom log</p>
            {!symptomRecentEnough ? (
              <p className="mt-2 text-sm leading-snug text-foreground">
                No symptom logged in the last week — quick logs help your insights.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-snug text-foreground">Nice — you&apos;re keeping logs current.</p>
            )}
          </div>
        </ResponsiveGrid>

        {!hasSavedHealthProfile ? (
          <div className="mt-4 rounded-xl border border-accent/35 bg-soft-rose/40 p-3 sm:mt-5 sm:p-4">
            <p className="text-sm font-medium text-foreground">Complete your health profile to personalize Zyra.</p>
            <Link
              href="/app/profile"
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-accent px-4 text-xs font-semibold text-accent-foreground transition hover:opacity-90 sm:w-auto sm:text-sm"
            >
              Complete profile
            </Link>
          </div>
        ) : null}
      </ProductCard>

      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs"
        >
          Top actions
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <li className="min-w-0">
            <Link
              href="/app/health-log"
              className="flex min-h-[3.75rem] w-full flex-col justify-center gap-1.5 rounded-2xl border border-border/70 bg-background/90 px-3 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.25rem] sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent">
                <ClipboardList className="size-5" aria-hidden />
              </span>
              <span className="leading-snug">Log symptom</span>
            </Link>
          </li>
          <li className="min-w-0">
            <Link
              href="/app/cycle"
              className="flex min-h-[3.75rem] w-full flex-col justify-center gap-1.5 rounded-2xl border border-border/70 bg-background/90 px-3 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.25rem] sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent">
                <CalendarHeart className="size-5" aria-hidden />
              </span>
              <span className="leading-snug">Track cycle</span>
            </Link>
          </li>
          <li className="min-w-0">
            <Link
              href="/app/specialists"
              className="flex min-h-[3.75rem] w-full flex-col justify-center gap-1.5 rounded-2xl border border-border/70 bg-background/90 px-3 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25 sm:min-h-[4.25rem] sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent">
                <MapPinned className="size-5" aria-hidden />
              </span>
              <span className="leading-snug">Find specialist</span>
            </Link>
          </li>
        </ul>
      </section>

      <p className="rounded-2xl border border-border/60 bg-soft-rose/25 px-3 py-2.5 text-center text-xs leading-relaxed text-muted sm:px-4 sm:py-3">
        Your health data is private and only visible to you. {ZYRA.name} supports your care; it does not replace your
        clinician.{" "}
        <Link href="/app/more" className="font-semibold text-accent underline-offset-2 hover:underline">
          More
        </Link>
      </p>
    </AppPage>
  );
}
