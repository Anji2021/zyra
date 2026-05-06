import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/product/page-system";
import { CompanionPanel } from "@/components/product/companion-panel";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
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
  const hasActionError = params.updated === "error" || params.deleted === "error";

  const cycles = await fetchCyclesForUser(supabase, user.id);

  return (
    <AppPage className="min-w-0 overflow-x-hidden">
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

      <div className="grid min-w-0 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8">
        <section className="min-w-0 rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Log your period
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Log past periods or your current bleed. Leave the end blank only while a period is still active (one
            open entry at a time, up to 8 days — then add an end date).
          </p>
          <div className="mt-4 sm:mt-6">
            <LogPeriodForm cycles={cycles} />
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8 lg:pb-10">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Your history
          </h2>
          <p className="mt-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2.5 text-sm leading-relaxed text-muted">
            You can add past periods. Zyra keeps the timeline sorted automatically — newest period start first.
          </p>
          <p className="mt-2 text-xs text-muted">Newest → oldest · {PRIVACY_ONLY_YOU}</p>

          {cycles.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border/80 bg-background/65 px-4 py-7 text-center sm:mt-6 sm:rounded-2xl sm:px-6 sm:py-10">
              <p className="font-serif text-base font-medium text-foreground sm:text-lg">Start tracking your cycle</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                When you&apos;re ready, add a start date on the left. There&apos;s no streak to protect — just your own
                pace.
              </p>
            </div>
          ) : (
            <CycleHistoryList cycles={cycles} />
          )}
        </section>
      </div>

      <p className="text-center text-xs leading-relaxed text-muted">
        Questions about pain or bleeding belong with a clinician —{" "}
        <Link href="/legal/disclaimer" className="font-semibold text-accent underline-offset-2 hover:underline">
          disclaimer
        </Link>
        .
      </p>
    </AppPage>
  );
}
