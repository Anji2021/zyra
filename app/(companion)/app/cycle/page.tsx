import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanionPanel } from "@/components/product/companion-panel";
import { daysBetweenStarts, fetchCyclesForUser } from "@/lib/cycles/queries";
import { formatCycleDate } from "@/lib/cycles/format";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { PRIVACY_ONLY_YOU } from "@/lib/zyra/user-messages";
import { CycleHistoryList } from "./cycle-history-list";
import { LogPeriodForm } from "./log-period-form";

export const dynamic = "force-dynamic";

type CyclePageProps = {
  searchParams?: Promise<{ saved?: string; updated?: string; deleted?: string }>;
};

export default async function CyclePage({ searchParams }: CyclePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const params = searchParams ? await searchParams : {};
  const justSaved = params.saved === "1";
  const justUpdated = params.updated === "1";
  const justDeleted = params.deleted === "1";
  const hasActionError = params.updated === "error" || params.deleted === "error" || params.updated === "invalid";

  const cycles = await fetchCyclesForUser(supabase, user.id);

  let lastCycleDays: number | null = null;
  if (cycles.length >= 2) {
    lastCycleDays = daysBetweenStarts(cycles[0].start_date, cycles[1].start_date);
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <CompanionPanel
        eyebrow="Cycle"
        titleLevel={1}
        title="Your cycle, in your words"
        description="Log when a period starts and ends — gently, without pressure. This is memory support for you (and optional context for a clinician later), not a diagnosis."
      >
        <p className="text-xs leading-relaxed text-muted">{PRIVACY_ONLY_YOU}</p>
      </CompanionPanel>

      {justSaved ? (
        <div
          role="status"
          className="rounded-2xl border border-border/70 bg-soft-rose/45 px-4 py-3 text-center text-sm text-foreground"
        >
          Saved. {ZYRA.name} is holding this entry only for you.
        </div>
      ) : null}
      {justUpdated ? (
        <div
          role="status"
          className="rounded-2xl border border-border/70 bg-soft-rose/45 px-4 py-3 text-center text-sm text-foreground"
        >
          Updated. Your cycle entry has been saved.
        </div>
      ) : null}
      {justDeleted ? (
        <div
          role="status"
          className="rounded-2xl border border-border/70 bg-soft-rose/45 px-4 py-3 text-center text-sm text-foreground"
        >
          Deleted. That cycle entry was removed.
        </div>
      ) : null}
      {hasActionError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-center text-sm text-red-950"
        >
          Something went wrong. Please try again.
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Log your period
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          One row per period. You can leave the end date open if you are still bleeding or not sure
          yet.
        </p>
        <div className="mt-4 sm:mt-6">
          <LogPeriodForm />
        </div>
      </section>

      {lastCycleDays != null && lastCycleDays > 0 ? (
        <div className="rounded-2xl border border-border/50 bg-background/85 px-4 py-3 text-center text-sm text-muted">
          <span className="font-medium text-foreground">Gentle note:</span> your last cycle was
          about <span className="font-semibold text-accent">{lastCycleDays} days</span> between
          period starts. Patterns shift — this is not medical advice.
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Your history
        </h2>
        <p className="mt-2 text-sm text-muted">Newest first. {PRIVACY_ONLY_YOU}</p>

        {cycles.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border/80 bg-background/65 px-4 py-7 text-center sm:mt-8 sm:rounded-2xl sm:px-6 sm:py-10">
            <p className="font-serif text-base font-medium text-foreground sm:text-lg">
              Start tracking your cycle
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              When you&apos;re ready, add a start date above. There&apos;s no streak to protect — just
              your own pace.
            </p>
          </div>
        ) : (
          <CycleHistoryList cycles={cycles} />
        )}
      </section>

      <p className="text-center text-xs text-muted">
        Questions about pain or bleeding belong with a clinician —{" "}
        <Link href="/legal/disclaimer" className="font-semibold text-accent underline-offset-2 hover:underline">
          disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
