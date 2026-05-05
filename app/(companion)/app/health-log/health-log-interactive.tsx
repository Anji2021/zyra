"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { MedicineRow, SymptomRow } from "@shared/types/records";
import { formatCycleDate } from "@/lib/cycles/format";
import { buildQuickInsights, medicineIsActive } from "@/lib/health-log/quick-insights";
import {
  COMMON_MEDICINE_LABELS,
  filterMedicineSuggestions,
  filterSymptomSuggestions,
  SYMPTOM_CHIP_LABELS,
} from "@/lib/health-log/suggestions";
import { type LogMedicineState, type LogSymptomState, logMedicine, logSymptom } from "./actions";

function localDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const chipScroll =
  "flex gap-2 overflow-x-auto pb-1.5 pt-0.5 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80";

const severityLabels: Record<number, string> = {
  1: "Mild",
  2: "Light",
  3: "Moderate",
  4: "Strong",
  5: "Severe",
};

type HealthLogInteractiveProps = {
  initialMedicines: MedicineRow[];
  initialSymptoms: SymptomRow[];
  showNextSteps: boolean;
};

export function HealthLogInteractive({
  initialMedicines,
  initialSymptoms,
  showNextSteps,
}: HealthLogInteractiveProps) {
  const [medicines, setMedicines] = useState(initialMedicines);
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [medicineFormKey, setMedicineFormKey] = useState(0);
  const [symptomFormKey, setSymptomFormKey] = useState(0);
  const [savedCue, setSavedCue] = useState<"medicine" | "symptom" | null>(null);

  const insights = useMemo(() => buildQuickInsights(medicines, symptoms), [medicines, symptoms]);

  const handleMedicineSaved = useCallback((m: MedicineRow) => {
    setMedicines((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]));
    setMedicineFormKey((k) => k + 1);
    setSavedCue("medicine");
  }, []);

  const handleSymptomSaved = useCallback((s: SymptomRow) => {
    setSymptoms((prev) => (prev.some((x) => x.id === s.id) ? prev : [s, ...prev]));
    setSymptomFormKey((k) => k + 1);
    setSavedCue("symptom");
  }, []);

  const assistantQuery = useMemo(() => {
    const latest = symptoms[0];
    if (latest) {
      return `I recently logged ${latest.symptom}. What does this mean?`;
    }
    return `Help me understand my recent health logs.`;
  }, [symptoms]);

  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <MedicineColumn
          formKey={medicineFormKey}
          medicines={medicines}
          savedCue={savedCue === "medicine"}
          onClearSavedCue={() => setSavedCue((c) => (c === "medicine" ? null : c))}
          onSuccess={handleMedicineSaved}
        />
        <SymptomColumn
          formKey={symptomFormKey}
          symptoms={symptoms}
          savedCue={savedCue === "symptom"}
          onClearSavedCue={() => setSavedCue((c) => (c === "symptom" ? null : c))}
          onSuccess={handleSymptomSaved}
        />
      </div>

      {insights.length > 0 ? (
        <section
          className="rounded-2xl border border-border/70 bg-background/80 px-3 py-3 shadow-sm sm:px-4 sm:py-3.5"
          aria-labelledby="quick-insights-heading"
        >
          <h2 id="quick-insights-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
            Quick insights from recent logs
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-snug text-foreground">
            {insights.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showNextSteps ? (
        <section
          className="rounded-2xl border border-border/70 bg-soft-rose/20 p-3 shadow-sm sm:p-4"
          aria-labelledby="recent-logs-heading"
        >
          <h2 id="recent-logs-heading" className="text-sm font-semibold text-foreground sm:text-base">
            Next steps
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-muted sm:text-xs">Act on what you have logged.</p>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-2">
            <Link
              href="/app/insights"
              className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-full border border-border bg-background/95 px-4 py-2.5 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/35 sm:min-h-10 sm:w-auto sm:px-5"
            >
              View insights
            </Link>
            <Link
              href="/app/specialists"
              className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-full border border-border bg-background/95 px-4 py-2.5 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/35 sm:min-h-10 sm:w-auto sm:px-5"
            >
              Find specialists
            </Link>
            <Link
              href={`/app/assistant?q=${encodeURIComponent(assistantQuery)}`}
              className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-full border border-border bg-background/95 px-4 py-2.5 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/35 sm:min-h-10 sm:w-auto sm:px-5"
            >
              Ask assistant
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}

function MedicineColumn({
  formKey,
  medicines,
  savedCue,
  onSuccess,
  onClearSavedCue,
}: {
  formKey: number;
  medicines: MedicineRow[];
  savedCue: boolean;
  onSuccess: (m: MedicineRow) => void;
  onClearSavedCue: () => void;
}) {
  const [state, formAction, pending] = useActionState<LogMedicineState, FormData>(logMedicine, {});
  const listId = useId();
  const datalistId = `${listId}-meds`;
  const appliedMedicineId = useRef<string | null>(null);

  useEffect(() => {
    if (!state.ok || !state.medicine) return;
    if (appliedMedicineId.current === state.medicine.id) return;
    appliedMedicineId.current = state.medicine.id;
    onSuccess(state.medicine);
  }, [state.ok, state.medicine, onSuccess]);

  useEffect(() => {
    if (!savedCue) return;
    const t = window.setTimeout(() => onClearSavedCue(), 2400);
    return () => window.clearTimeout(t);
  }, [savedCue, onClearSavedCue]);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:p-5" aria-labelledby="medicines-heading">
      <h2 id="medicines-heading" className="font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg">
        Medicines
      </h2>
      <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">Tap a suggestion or type any name.</p>
      <div className="mt-3 rounded-xl border border-border/50 bg-background/70 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">Log a medicine</h3>
          {savedCue ? (
            <span className="text-xs font-medium text-accent" role="status">
              Saved
            </span>
          ) : null}
        </div>
        <form key={formKey} action={formAction} className="mt-2 max-w-full space-y-3 sm:space-y-3.5">
          <datalist id={datalistId}>
            {COMMON_MEDICINE_LABELS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <MedicineNameField datalistId={datalistId} formKey={formKey} />
          <div className={chipScroll}>
            {COMMON_MEDICINE_LABELS.slice(0, 5).map((label) => (
              <MedNameChip key={label} label={label} formKey={formKey} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
            <div className="min-w-0 space-y-1.5">
              <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`${formKey}-med-dosage`}>
                Dosage <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${formKey}-med-dosage`}
                name="dosage"
                type="text"
                placeholder="e.g. 500 mg"
                className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`${formKey}-med-freq`}>
                Frequency <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${formKey}-med-freq`}
                name="frequency"
                type="text"
                placeholder="e.g. Once daily"
                className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
            <div className="min-w-0 space-y-1.5">
              <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`${formKey}-med-start`}>
                Start <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${formKey}-med-start`}
                name="start_date"
                type="date"
                className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`${formKey}-med-end`}>
                End <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${formKey}-med-end`}
                name="end_date"
                type="date"
                className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`${formKey}-med-notes`}>
              Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id={`${formKey}-med-notes`}
              name="notes"
              rows={2}
              placeholder="Short note for you or your clinician."
              className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          {state.error ? (
            <p className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-950" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-11 w-full touch-manipulation items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start sm:px-8"
          >
            {pending ? "Saving…" : "Save medicine"}
          </button>
        </form>
      </div>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted sm:mt-5">History</h3>
      {medicines.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-border/80 bg-background/60 px-3 py-4 text-center">
          <p className="text-sm font-semibold text-foreground">Nothing yet</p>
          <p className="mt-0.5 text-xs text-muted">Your entries appear here right after you save.</p>
        </div>
      ) : (
        <ul className="mt-2 max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-0.5 lg:max-h-[min(55vh,24rem)]">
          {medicines.map((m) => (
            <MedicineHistoryCard key={m.id} m={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MedicineNameField({ datalistId, formKey }: { datalistId: string; formKey: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => filterMedicineSuggestions(q, 6), [q]);

  return (
    <div className="relative space-y-1.5">
      <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`med-name-${formKey}`}>
        Medicine name
      </label>
      <input
        ref={inputRef}
        id={`med-name-${formKey}`}
        name="name"
        type="text"
        required
        autoComplete="off"
        list={datalistId}
        defaultValue=""
        onInput={(e) => {
          setQ((e.target as HTMLInputElement).value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 180)}
        className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
      />
      {open && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-surface py-1 shadow-md"
          role="listbox"
        >
          {suggestions.map((label) => (
            <li key={label}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-soft-rose/30"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const el = inputRef.current;
                  if (el) {
                    el.value = label;
                    setQ(label);
                    setOpen(false);
                  }
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MedNameChip({ label, formKey }: { label: string; formKey: number }) {
  return (
    <button
      type="button"
      className="shrink-0 touch-manipulation rounded-full border border-border/80 bg-background/90 px-3 py-2 text-xs font-medium text-foreground transition hover:border-accent/40 hover:bg-soft-rose/25 sm:py-1.5"
      onClick={() => {
        const el = document.querySelector<HTMLInputElement>(`#med-name-${formKey}`);
        if (el) {
          el.value = label;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }}
    >
      {label}
    </button>
  );
}

function MedicineHistoryCard({ m }: { m: MedicineRow }) {
  const active = medicineIsActive(m);
  const duration =
    m.start_date || m.end_date
      ? `${m.start_date ? formatCycleDate(m.start_date) : "—"} → ${m.end_date ? formatCycleDate(m.end_date) : "Open"}`
      : "No dates";

  return (
    <li className="rounded-xl border border-border/55 bg-background/90 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">{m.name}</p>
        <span
          className={
            active
              ? "shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200"
              : "shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          }
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">{duration}</p>
      {(m.dosage || m.frequency) && (
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          {[m.dosage, m.frequency].filter(Boolean).join(" · ")}
        </p>
      )}
      {m.notes ? <p className="mt-1 line-clamp-2 text-[11px] text-muted">{m.notes}</p> : null}
    </li>
  );
}

function SymptomColumn({
  formKey,
  symptoms,
  savedCue,
  onSuccess,
  onClearSavedCue,
}: {
  formKey: number;
  symptoms: SymptomRow[];
  savedCue: boolean;
  onSuccess: (s: SymptomRow) => void;
  onClearSavedCue: () => void;
}) {
  const [state, formAction, pending] = useActionState<LogSymptomState, FormData>(logSymptom, {});
  const appliedSymptomId = useRef<string | null>(null);

  useEffect(() => {
    if (!state.ok || !state.symptom) return;
    if (appliedSymptomId.current === state.symptom.id) return;
    appliedSymptomId.current = state.symptom.id;
    onSuccess(state.symptom);
  }, [state.ok, state.symptom, onSuccess]);

  useEffect(() => {
    if (!savedCue) return;
    const t = window.setTimeout(() => onClearSavedCue(), 2400);
    return () => window.clearTimeout(t);
  }, [savedCue, onClearSavedCue]);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:p-5" aria-labelledby="symptoms-heading">
      <h2 id="symptoms-heading" className="font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg">
        Symptoms
      </h2>
      <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">Search, tap a chip, or write your own words.</p>
      <div className="mt-3 rounded-xl border border-border/50 bg-background/70 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">Log a symptom</h3>
          {savedCue ? (
            <span className="text-xs font-medium text-accent" role="status">
              Saved
            </span>
          ) : null}
        </div>
        <form key={formKey} action={formAction} className="mt-2 max-w-full space-y-3 sm:space-y-3.5">
          <SymptomNameField formKey={formKey} />
          <div className={chipScroll} aria-label="Quick symptom picks">
            {SYMPTOM_CHIP_LABELS.map((label) => (
              <SymptomChip key={label} formKey={formKey} label={label} />
            ))}
          </div>
          <SeverityField formKey={formKey} />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`sym-date-${formKey}`}>
              Date
            </label>
            <input
              id={`sym-date-${formKey}`}
              name="logged_date"
              type="date"
              required
              defaultValue={localDateInputValue()}
              className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`sym-notes-${formKey}`}>
              Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id={`sym-notes-${formKey}`}
              name="notes"
              rows={2}
              placeholder="One line of context."
              className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          {state.error ? (
            <p className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-950" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-11 w-full touch-manipulation items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start sm:px-8"
          >
            {pending ? "Saving…" : "Save symptom"}
          </button>
        </form>
      </div>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted sm:mt-5">History</h3>
      {symptoms.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-border/80 bg-background/60 px-3 py-4 text-center">
          <p className="text-sm font-semibold text-foreground">Nothing yet</p>
          <p className="mt-0.5 text-xs text-muted">Saved symptoms land here instantly.</p>
        </div>
      ) : (
        <ul className="mt-2 max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-0.5 lg:max-h-[min(55vh,24rem)]">
          {symptoms.map((s) => (
            <SymptomHistoryCard key={s.id} s={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SymptomNameField({ formKey }: { formKey: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => filterSymptomSuggestions(q, 7), [q]);

  return (
    <div className="relative space-y-1.5">
      <label className="text-xs font-semibold text-foreground sm:text-sm" htmlFor={`symptom-name-${formKey}`}>
        Symptom
      </label>
      <input
        ref={inputRef}
        id={`symptom-name-${formKey}`}
        name="symptom"
        type="text"
        required
        autoComplete="off"
        defaultValue=""
        onInput={(e) => {
          setQ((e.target as HTMLInputElement).value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 180)}
        placeholder="Type to search…"
        className="w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 min-[480px]:min-h-11"
      />
      {open && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border/80 bg-surface py-1 shadow-md">
          {suggestions.map((label) => (
            <li key={label}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-soft-rose/30"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const el = inputRef.current;
                  if (el) {
                    el.value = label;
                    setQ(label);
                    setOpen(false);
                  }
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SymptomChip({ formKey, label }: { formKey: number; label: string }) {
  return (
    <button
      type="button"
      className="shrink-0 touch-manipulation rounded-full border border-border/80 bg-background/90 px-3 py-2 text-xs font-medium text-foreground transition hover:border-accent/40 hover:bg-soft-rose/25 sm:py-1.5"
      onClick={() => {
        const el = document.querySelector<HTMLInputElement>(`#symptom-name-${formKey}`);
        if (el) {
          el.value = label;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }}
    >
      {label}
    </button>
  );
}

function SeverityField({ formKey }: { formKey: number }) {
  const [severity, setSeverity] = useState<string>("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground sm:text-sm" id={`sev-label-${formKey}`}>
          How strong? <span className="font-normal text-muted">(optional)</span>
        </span>
        {severity ? (
          <button
            type="button"
            className="text-[11px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => setSeverity("")}
          >
            Clear
          </button>
        ) : null}
      </div>
      <input type="hidden" name="severity" value={severity} aria-hidden />
      <div
        className={`${chipScroll} sm:flex-wrap sm:overflow-visible`}
        role="group"
        aria-labelledby={`sev-label-${formKey}`}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = severity === String(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => setSeverity(String(n))}
              className={
                on
                  ? "flex min-w-[4.25rem] shrink-0 touch-manipulation flex-col items-center rounded-xl border-2 border-accent bg-soft-rose/35 px-2.5 py-2 sm:min-w-[4.5rem]"
                  : "flex min-w-[4.25rem] shrink-0 touch-manipulation flex-col items-center rounded-xl border border-border/80 bg-background/90 px-2.5 py-2 sm:min-w-[4.5rem]"
              }
            >
              <span className="text-xs font-bold text-foreground">{n}</span>
              <span className="text-[10px] font-medium leading-tight text-muted">{severityLabels[n]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SymptomHistoryCard({ s }: { s: SymptomRow }) {
  return (
    <li className="rounded-xl border border-border/55 bg-background/90 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">{s.symptom}</p>
        {s.severity != null ? (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-accent">
            {s.severity}/5
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-muted/35 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            —
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">{formatCycleDate(s.logged_date)}</p>
      {s.notes ? <p className="mt-1 line-clamp-2 text-[11px] text-muted">{s.notes}</p> : null}
    </li>
  );
}
