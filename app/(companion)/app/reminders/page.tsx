import Link from "next/link";
import { BellRing } from "lucide-react";
import { redirect } from "next/navigation";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { formatCycleDate } from "@/lib/cycles/format";
import { getProfileForUser } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";
import { createSuggestedReminder, deactivateReminder, deleteReminder } from "./actions";
import { NotificationPermissionPrompt } from "./notification-permission-prompt";
import { ReminderForm } from "./reminder-form";
import { ServiceWorkerRegister } from "./service-worker-register";

export const dynamic = "force-dynamic";

type ReminderRow = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reminder_date: string | null;
  reminder_time: string | null;
  frequency: string | null;
  is_active: boolean | null;
  created_at: string;
};

type Suggestion = {
  key: "period" | "symptom";
  type: string;
  title: string;
  message: string;
  reminderDate: string;
};

function addCalendarDays(isoYmd: string, days: number): string {
  const d = new Date(`${isoYmd}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cycleDays(avg: number | null | undefined): number {
  if (avg != null && Number.isFinite(avg) && avg >= 15 && avg <= 60) return Math.round(avg);
  return 28;
}

function toastForSuggestionStatus(status: string | undefined): string | null {
  if (!status) return null;
  if (status === "created") return "Suggested reminder saved.";
  if (status === "exists") return "This suggestion is already saved.";
  if (status === "invalid") return "Suggestion could not be saved.";
  if (status === "error") return FRIENDLY_TRY_AGAIN;
  return null;
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [params, profile, cycles, remindersResult] = await Promise.all([
    searchParams,
    getProfileForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id, 1),
    supabase
      .from("reminders")
      .select("id,type,title,message,reminder_date,reminder_time,frequency,is_active,created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("reminder_date", { ascending: true })
      .order("reminder_time", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const { data, error } = remindersResult;

  if (error) {
    console.error("[reminders page] reminders.select:", error.message);
  }

  const reminders = (data ?? []) as ReminderRow[];
  const latestCycle = cycles[0] ?? null;
  const estimatedNextPeriod = latestCycle
    ? addCalendarDays(latestCycle.start_date, cycleDays(profile?.average_cycle_length))
    : null;
  const suggestions: Suggestion[] = estimatedNextPeriod
    ? [
        {
          key: "period",
          type: "Period reminder",
          title: "Your period may start soon",
          message: "Based on your cycle history, your next period may be coming soon.",
          reminderDate: addCalendarDays(estimatedNextPeriod, -1),
        },
        {
          key: "symptom",
          type: "Symptom check-in",
          title: "Check in with how you’re feeling",
          message: "Track symptoms or mood changes before your expected period.",
          reminderDate: addCalendarDays(estimatedNextPeriod, -3),
        },
      ]
    : [];

  const prefillType = typeof params?.prefillType === "string" ? params.prefillType : "";
  const prefillTitle = typeof params?.prefillTitle === "string" ? params.prefillTitle : "";
  const prefillMessage = typeof params?.prefillMessage === "string" ? params.prefillMessage : "";
  const prefillDate = typeof params?.prefillDate === "string" ? params.prefillDate : "";
  const savedMessage = toastForSuggestionStatus(
    typeof params?.suggested === "string" ? params.suggested : undefined,
  );

  return (
    <AppPage>
      <ServiceWorkerRegister />
      <PageHeader
        eyebrow="Reminders"
        title="Reminders"
        subtitle={
          <>
            Set personal reminders for cycle, medicine, and check-ins. {ZYRA.name} keeps this private to your account.
            <span className="mt-2 block text-xs text-muted">Your reminders are private and only visible to you.</span>
          </>
        }
      />
      <NotificationPermissionPrompt />

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Suggested reminders
        </h2>
        <p className="mt-2 text-sm text-muted">
          These are estimates based on your logged cycle history and may not be exact.
        </p>
        {savedMessage ? (
          <p className="mt-3 rounded-2xl border border-border/70 bg-soft-rose/15 px-4 py-3 text-sm text-foreground">
            {savedMessage}
          </p>
        ) : null}
        {latestCycle == null ? (
          <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-background/60 px-4 py-7 text-center sm:rounded-2xl sm:py-10">
            <p className="font-serif text-base font-semibold text-foreground">
              Log at least one period to get cycle-based reminder suggestions.
            </p>
            <Link
              href="/app/cycle"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/30"
            >
              Log period
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3 sm:space-y-4">
            <p className="text-xs leading-relaxed text-muted">
              Latest logged period: {formatCycleDate(latestCycle.start_date)}. Estimated next period:{" "}
              {estimatedNextPeriod ? formatCycleDate(estimatedNextPeriod) : "—"}.
            </p>

            {suggestions.map((suggestion) => (
              <div
                key={suggestion.key}
                className="rounded-xl border border-border/60 bg-background/85 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{suggestion.type}</p>
                <p className="mt-1 font-medium text-foreground">{suggestion.title}</p>
                <p className="mt-1 text-sm text-muted">{suggestion.message}</p>
                <p className="mt-1 text-xs text-muted">Suggested date: {formatCycleDate(suggestion.reminderDate)}</p>
                <form action={createSuggestedReminder} className="mt-3">
                  <input type="hidden" name="type" value={suggestion.type} />
                  <input type="hidden" name="title" value={suggestion.title} />
                  <input type="hidden" name="message" value={suggestion.message} />
                  <input type="hidden" name="reminder_date" value={suggestion.reminderDate} />
                  <button
                    type="submit"
                    className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
                  >
                    Create reminder
                  </button>
                </form>
              </div>
            ))}

            <div className="rounded-xl border border-border/60 bg-background/85 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Medicine/supplement suggestion
              </p>
              <p className="mt-1 text-sm text-muted">
                Create a medicine reminder if you take cycle-related medication or supplements.
              </p>
              <Link
                href={`/app/reminders?prefillType=${encodeURIComponent("Medicine reminder")}&prefillTitle=${encodeURIComponent("Cycle medicine check-in")}&prefillMessage=${encodeURIComponent("Add your medicine or supplement note.")}&prefillDate=${encodeURIComponent(addCalendarDays(estimatedNextPeriod ?? addCalendarDays(latestCycle.start_date, cycleDays(profile?.average_cycle_length)), -3))}`}
                className="mt-3 inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
              >
                Create reminder
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Create reminder
        </h2>
        <p className="mt-2 text-sm text-muted">Small prompts for your day, at your pace.</p>
        <div className="mt-4 sm:mt-6">
          <ReminderForm
            defaults={{
              type: prefillType || undefined,
              title: prefillTitle || undefined,
              message: prefillMessage || undefined,
              reminderDate: prefillDate || undefined,
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Active reminders
        </h2>
        {error ? (
          <p className="mt-3 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-950">
            {FRIENDLY_TRY_AGAIN}
          </p>
        ) : reminders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-background/60 px-4 py-7 text-center sm:rounded-2xl sm:py-10">
            <p className="font-serif text-base font-semibold text-foreground">
              You haven&apos;t added anything yet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Save a reminder above and it will appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3 sm:space-y-4">
            {reminders.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border/60 bg-background/85 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-soft-rose/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    {row.type}
                  </span>
                  <span className="text-[11px] text-muted">
                    {row.frequency ?? "once"}
                  </span>
                </div>
                <p className="mt-2 font-medium text-foreground">{row.title}</p>
                {row.message ? <p className="mt-1 text-sm text-muted">{row.message}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  {row.reminder_date ?? "No date"} {row.reminder_time ?? ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={deactivateReminder.bind(null, row.id)}>
                    <button
                      type="submit"
                      className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 sm:text-sm"
                    >
                      Mark inactive
                    </button>
                  </form>
                  <form action={deleteReminder.bind(null, row.id)}>
                    <button
                      type="submit"
                      className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-red-200/80 hover:bg-red-50/50 sm:text-sm"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-[11px] leading-relaxed text-muted sm:text-xs">
        <BellRing className="mr-1 inline size-3.5" aria-hidden />
        Reminders are personal support only — not diagnosis or treatment guidance.
      </p>
    </AppPage>
  );
}
