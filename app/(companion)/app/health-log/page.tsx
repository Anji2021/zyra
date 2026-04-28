import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { formatCycleDate } from "@/lib/cycles/format";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { suggestionFromSymptomText } from "@/lib/next-steps/context-suggestions";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { PRIVACY_ONLY_YOU } from "@/lib/zyra/user-messages";
import { MedicineForm } from "./medicine-form";
import { SymptomForm } from "./symptom-form";

export const dynamic = "force-dynamic";

type HealthLogPageProps = {
  searchParams?: Promise<{ saved?: string }>;
};

export default async function HealthLogPage({ searchParams }: HealthLogPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const params = searchParams ? await searchParams : {};
  const savedMedicine = params.saved === "medicine";
  const savedSymptom = params.saved === "symptom";

  const [medicines, symptoms, cycles] = await Promise.all([
    fetchMedicinesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id, 1),
  ]);
  const latestSymptom = symptoms[0];
  const contextSuggestion = suggestionFromSymptomText(latestSymptom?.symptom);
  const hasRecentLogs = symptoms.length > 0 || medicines.length > 0 || cycles.length > 0;
  const assistantPrefill = latestSymptom
    ? `I recently logged ${latestSymptom.symptom}. What does this mean?`
    : contextSuggestion.assistantPrefill;

  return (
    <div className="flex flex-col gap-6 sm:gap-10">
      <header className="space-y-2 sm:space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
          Health log
        </p>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Medicines & symptoms
        </h1>
        <p className="max-w-2xl text-sm leading-snug text-muted sm:leading-relaxed sm:text-base">
          A quiet place to remember what you took and how you felt — without turning it into a
          chart. {ZYRA.name} never replaces your clinician’s judgment.
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-muted">
          Your health data is private and only visible to you.
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-muted sm:text-sm">{PRIVACY_ONLY_YOU}</p>
      </header>

      {savedMedicine ? (
        <div
          role="status"
          className="rounded-2xl border border-border/70 bg-soft-rose/45 px-4 py-3 text-center text-sm text-foreground"
        >
          Medicine saved. Only you can see this list.
        </div>
      ) : null}
      {savedSymptom ? (
        <div
          role="status"
          className="rounded-2xl border border-border/70 bg-soft-rose/45 px-4 py-3 text-center text-sm text-foreground"
        >
          Symptom saved. Take a breath — you are allowed to notice your body without fixing it
          alone.
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Medicines
        </h2>
        <p className="mt-2 text-sm text-muted">
          For your memory before appointments — not dosing instructions from {ZYRA.name}.
        </p>
        <div className="mt-4 rounded-xl border border-border/50 bg-background/65 p-4 sm:mt-6 sm:rounded-2xl sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">Log a medicine</h3>
          <div className="mt-3 sm:mt-4">
            <MedicineForm />
          </div>
        </div>
        <div className="mt-6 sm:mt-8">
          <h3 className="text-sm font-semibold text-foreground">Your medicine history</h3>
          {medicines.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-background/60 px-4 py-7 text-center sm:mt-4 sm:rounded-2xl sm:py-10">
              <p className="font-serif text-base font-semibold text-foreground">You haven&apos;t added anything yet</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Add your medications when it helps you remember — we&apos;ll keep the list gentle and
                yours alone.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              {medicines.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-border/60 bg-background/85 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4"
                >
                  <p className="font-medium text-foreground">{m.name}</p>
                  <dl className="mt-2 space-y-1 text-sm text-muted">
                    {m.dosage ? (
                      <div>
                        <span className="font-medium text-foreground/80">Dosage: </span>
                        {m.dosage}
                      </div>
                    ) : null}
                    {m.frequency ? (
                      <div>
                        <span className="font-medium text-foreground/80">Frequency: </span>
                        {m.frequency}
                      </div>
                    ) : null}
                    <div>
                      <span className="font-medium text-foreground/80">Dates: </span>
                      {m.start_date ? formatCycleDate(m.start_date) : "—"}
                      <span className="mx-1 text-muted">→</span>
                      {m.end_date ? formatCycleDate(m.end_date) : "open"}
                    </div>
                    {m.notes ? <p className="pt-1 text-muted">{m.notes}</p> : null}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Symptoms
        </h2>
        <p className="mt-2 text-sm text-muted">
          Name what you felt and how strong it was — a way to carry the story, not to label you.
        </p>
        <div className="mt-4 rounded-xl border border-border/50 bg-background/65 p-4 sm:mt-6 sm:rounded-2xl sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">Log symptom</h3>
          <div className="mt-3 sm:mt-4">
            <SymptomForm />
          </div>
        </div>
        <div className="mt-6 sm:mt-8">
          <h3 className="text-sm font-semibold text-foreground">Your symptom history</h3>
          {symptoms.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-background/60 px-4 py-7 text-center sm:mt-4 sm:rounded-2xl sm:py-10">
              <p className="font-serif text-base font-semibold text-foreground">You haven&apos;t added anything yet</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Log how you&apos;re feeling when it helps — no judgment, no streaks, just your words.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              {symptoms.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-border/60 bg-background/85 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4"
                >
                  <p className="font-medium text-foreground">{s.symptom}</p>
                  <dl className="mt-2 space-y-1 text-sm text-muted">
                    <div>
                      <span className="font-medium text-foreground/80">Severity: </span>
                      {s.severity != null ? `${s.severity} / 5` : "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Date: </span>
                      {formatCycleDate(s.logged_date)}
                    </div>
                    {s.notes ? <p className="pt-1 text-muted">{s.notes}</p> : null}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {hasRecentLogs ? (
        <section className="rounded-2xl border border-border/70 bg-soft-rose/20 p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Based on your recent logs
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Small next steps you can take now — learn, ask a question, or find care options.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
            <Link
              href={`/app/resources/${contextSuggestion.resourceId}`}
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border bg-background/90 px-3 py-2 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/40 sm:text-sm"
            >
              {contextSuggestion.resourceTitle}
            </Link>
            <Link
              href={`/app/assistant?q=${encodeURIComponent(assistantPrefill)}`}
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border bg-background/90 px-3 py-2 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/40 sm:text-sm"
            >
              Ask Zyra about this
            </Link>
            <Link
              href="/app/specialists"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border bg-background/90 px-3 py-2 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/40 sm:text-sm"
            >
              Find specialists
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
