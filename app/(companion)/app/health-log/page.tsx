import { redirect } from "next/navigation";
import { formatCycleDate } from "@/lib/cycles/format";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
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

  const [medicines, symptoms] = await Promise.all([
    fetchMedicinesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Health log</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Medicines & symptoms
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          A quiet place to remember what you took and how you felt — without turning it into a
          chart. {ZYRA.name} never replaces your clinician’s judgment.
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

      <section className="rounded-3xl border border-border/70 bg-surface/95 p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">Medicines</h2>
        <p className="mt-2 text-sm text-muted">
          For your memory before appointments — not dosing instructions from {ZYRA.name}.
        </p>
        <div className="mt-6 rounded-2xl border border-border/50 bg-background/65 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">Add a medicine</h3>
          <div className="mt-4">
            <MedicineForm />
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground">Your medicine history</h3>
          {medicines.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-10 text-center">
              <p className="font-serif text-base font-semibold text-foreground">You haven&apos;t added anything yet</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Add your medications when it helps you remember — we&apos;ll keep the list gentle and
                yours alone.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {medicines.map((m) => (
                <li
                  key={m.id}
                  className="rounded-2xl border border-border/60 bg-background/85 px-4 py-4 sm:px-5"
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

      <section className="rounded-3xl border border-border/70 bg-surface/95 p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">Symptoms</h2>
        <p className="mt-2 text-sm text-muted">
          Name what you felt and how strong it was — a way to carry the story, not to label you.
        </p>
        <div className="mt-6 rounded-2xl border border-border/50 bg-background/65 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-foreground">Log a symptom</h3>
          <div className="mt-4">
            <SymptomForm />
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground">Your symptom history</h3>
          {symptoms.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-10 text-center">
              <p className="font-serif text-base font-semibold text-foreground">You haven&apos;t added anything yet</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Log how you&apos;re feeling when it helps — no judgment, no streaks, just your words.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {symptoms.map((s) => (
                <li
                  key={s.id}
                  className="rounded-2xl border border-border/60 bg-background/85 px-4 py-4 sm:px-5"
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
    </div>
  );
}
