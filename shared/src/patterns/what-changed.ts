import type { CycleRow, MedicineRow, SymptomRow } from "../types/records";

const MS_DAY = 86_400_000;
const SAFE_TRACK_NEXT = "Keep tracking this for a few more days.";
const SAFE_CLINICIAN_NEXT = "Consider discussing it with a clinician if it persists.";
const SAFE_STABLE_NEXT = "No major change noticed yet.";

export type WhatChangedStatus = "increased" | "decreased" | "new" | "stable" | "not_enough_data";
export type WhatChangedDomain = "cycle" | "symptoms" | "medicines";
export type WhatChangedComparisonKey = "last_7_days" | "last_30_days" | "cycle_vs_previous_cycle";
export type WhatChangedEmptyReason = "insufficient_data" | "no_shift_detected";

export type WhatChangedCard = {
  id: WhatChangedDomain;
  title: string;
  status: WhatChangedStatus;
  changeDetected: string;
  whyItMatters: string;
  suggestedNext: string;
};

export type WhatChangedResult = {
  comparisonKey: WhatChangedComparisonKey;
  comparisonLabel: string;
  cards: WhatChangedCard[];
  emptyReason: WhatChangedEmptyReason | null;
  fetchError?: string | null;
};

export type WhatChangedInsightSet = {
  subtitle: string;
  defaultComparisonKey: WhatChangedComparisonKey;
  options: {
    key: WhatChangedComparisonKey;
    label: string;
    available: boolean;
  }[];
  results: Record<WhatChangedComparisonKey, WhatChangedResult>;
  fetchError?: string | null;
};

function noonMs(isoYmd: string): number {
  return new Date(`${isoYmd.slice(0, 10)}T12:00:00`).getTime();
}

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetweenStarts(newerYmd: string, olderYmd: string): number {
  return Math.round((noonMs(newerYmd) - noonMs(olderYmd)) / MS_DAY);
}

function safeSymptomLabel(raw: string): string {
  const base = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!base) return "symptom";
  return base.slice(0, 80);
}

function mapStatusLabel(status: WhatChangedStatus): string {
  switch (status) {
    case "increased":
      return "Increased";
    case "decreased":
      return "Decreased";
    case "new":
      return "New";
    case "stable":
      return "Stable";
    default:
      return "Not enough data";
  }
}

type Metrics = {
  symptomCountCurrent: number;
  symptomCountPrevious: number;
  newSymptoms: string[];
  topIncreasedSymptom: { label: string; before: number; after: number } | null;
  topDecreasedSymptom: { label: string; before: number; after: number } | null;
  medicineCountCurrent: number;
  medicineCountPrevious: number;
  newMedicines: string[];
  cycleLengthCurrent: number | null;
  cycleLengthPrevious: number | null;
};

function countByWindowSymptomLabels(
  symptoms: SymptomRow[],
  include: (ymd: string) => "current" | "previous" | null,
): {
  current: number;
  previous: number;
  currentMap: Map<string, number>;
  previousMap: Map<string, number>;
} {
  const currentMap = new Map<string, number>();
  const previousMap = new Map<string, number>();
  let current = 0;
  let previous = 0;

  for (const s of symptoms) {
    const ymd = s.logged_date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) continue;
    const bucket = include(ymd);
    if (!bucket) continue;
    const label = safeSymptomLabel(s.symptom);
    if (bucket === "current") {
      current += 1;
      currentMap.set(label, (currentMap.get(label) ?? 0) + 1);
    } else {
      previous += 1;
      previousMap.set(label, (previousMap.get(label) ?? 0) + 1);
    }
  }
  return { current, previous, currentMap, previousMap };
}

function collectWindowMedicines(
  medicines: MedicineRow[],
  include: (ms: number) => "current" | "previous" | null,
): { currentCount: number; previousCount: number; newCurrentNames: string[] } {
  let currentCount = 0;
  let previousCount = 0;
  const currentNames = new Set<string>();
  const previousNames = new Set<string>();

  for (const m of medicines) {
    const ts = Date.parse(m.created_at);
    if (Number.isNaN(ts)) continue;
    const bucket = include(ts);
    if (!bucket) continue;
    const name = m.name.trim().toLowerCase();
    if (bucket === "current") {
      currentCount += 1;
      if (name) currentNames.add(name);
    } else {
      previousCount += 1;
      if (name) previousNames.add(name);
    }
  }

  const newCurrentNames = [...currentNames].filter((n) => !previousNames.has(n));
  return { currentCount, previousCount, newCurrentNames };
}

function computeCycleLengthsForRolling(cycles: CycleRow[]): { current: number | null; previous: number | null } {
  const sorted = [...cycles]
    .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.start_date.slice(0, 10)))
    .sort((a, b) => noonMs(b.start_date) - noonMs(a.start_date));

  if (sorted.length < 3) return { current: null, previous: null };
  const current = daysBetweenStarts(sorted[0]!.start_date, sorted[1]!.start_date);
  const previous = daysBetweenStarts(sorted[1]!.start_date, sorted[2]!.start_date);
  if (current < 20 || current > 55 || previous < 20 || previous > 55) return { current: null, previous: null };
  return { current, previous };
}

function computeMetrics(input: {
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
  includeSymptomYmd: (ymd: string) => "current" | "previous" | null;
  includeMedicineMs: (ms: number) => "current" | "previous" | null;
  cycleLengthsOverride?: { current: number | null; previous: number | null };
}): Metrics {
  const symptom = countByWindowSymptomLabels(input.symptoms, input.includeSymptomYmd);
  const allLabels = new Set([...symptom.currentMap.keys(), ...symptom.previousMap.keys()]);
  const deltas: { label: string; before: number; after: number; delta: number }[] = [];
  const newSymptoms: string[] = [];

  for (const label of allLabels) {
    const after = symptom.currentMap.get(label) ?? 0;
    const before = symptom.previousMap.get(label) ?? 0;
    if (after > 0 && before === 0) newSymptoms.push(label);
    if (after !== before) deltas.push({ label, before, after, delta: after - before });
  }

  const topIncreasedSymptom = [...deltas]
    .filter((d) => d.delta > 0)
    .sort((a, b) => b.delta - a.delta)[0] ?? null;
  const topDecreasedSymptom = [...deltas]
    .filter((d) => d.delta < 0)
    .sort((a, b) => a.delta - b.delta)[0] ?? null;

  const meds = collectWindowMedicines(input.medicines, input.includeMedicineMs);
  const cycleLengths = input.cycleLengthsOverride ?? computeCycleLengthsForRolling(input.cycles);

  return {
    symptomCountCurrent: symptom.current,
    symptomCountPrevious: symptom.previous,
    newSymptoms,
    topIncreasedSymptom,
    topDecreasedSymptom,
    medicineCountCurrent: meds.currentCount,
    medicineCountPrevious: meds.previousCount,
    newMedicines: meds.newCurrentNames,
    cycleLengthCurrent: cycleLengths.current,
    cycleLengthPrevious: cycleLengths.previous,
  };
}

function buildCycleCard(metrics: Metrics): WhatChangedCard {
  const base: Pick<WhatChangedCard, "id" | "title"> = {
    id: "cycle",
    title: "Cycle changes",
  };
  const cur = metrics.cycleLengthCurrent;
  const prev = metrics.cycleLengthPrevious;
  if (cur == null || prev == null) {
    return {
      ...base,
      status: "not_enough_data",
      changeDetected: "Not enough cycle history to compare current and previous cycle length.",
      whyItMatters: "Cycle interval comparisons become clearer after a few logged starts.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }
  if (cur === prev || Math.abs(cur - prev) < 2) {
    return {
      ...base,
      status: "stable",
      changeDetected: `Your recent cycle interval is similar to the previous one (${cur} vs ${prev} days).`,
      whyItMatters: "Small day-to-day variation is common in cycle tracking logs.",
      suggestedNext: SAFE_STABLE_NEXT,
    };
  }
  const increased = cur > prev;
  return {
    ...base,
    status: increased ? "increased" : "decreased",
    changeDetected: `Your recent cycle interval is ${increased ? "longer" : "shorter"} than the previous one (${cur} vs ${prev} days).`,
    whyItMatters: "A shift in cycle spacing can be useful context to track over upcoming cycles.",
    suggestedNext: SAFE_CLINICIAN_NEXT,
  };
}

function buildSymptomCard(metrics: Metrics): WhatChangedCard {
  const base: Pick<WhatChangedCard, "id" | "title"> = {
    id: "symptoms",
    title: "Symptom changes",
  };
  const total = metrics.symptomCountCurrent + metrics.symptomCountPrevious;
  if (total < 2) {
    return {
      ...base,
      status: "not_enough_data",
      changeDetected: "Not enough symptom logs to compare this period with the previous one.",
      whyItMatters: "More symptom check-ins improve pattern clarity.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }
  if (metrics.newSymptoms.length > 0) {
    return {
      ...base,
      status: "new",
      changeDetected: `You logged new symptom labels such as “${metrics.newSymptoms.slice(0, 2).join("” and “")}”.`,
      whyItMatters: "New labels can highlight fresh experiences worth following in your logs.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }
  if (
    metrics.topIncreasedSymptom &&
    metrics.topIncreasedSymptom.after - metrics.topIncreasedSymptom.before >= 1
  ) {
    const s = metrics.topIncreasedSymptom;
    return {
      ...base,
      status: "increased",
      changeDetected: `You logged “${s.label}” more often in this period (${s.after} vs ${s.before}).`,
      whyItMatters: "Increasing symptom frequency may be worth tracking over the next few entries.",
      suggestedNext: SAFE_CLINICIAN_NEXT,
    };
  }
  if (
    metrics.topDecreasedSymptom &&
    metrics.topDecreasedSymptom.before - metrics.topDecreasedSymptom.after >= 1
  ) {
    const s = metrics.topDecreasedSymptom;
    return {
      ...base,
      status: "decreased",
      changeDetected: `You logged “${s.label}” less often in this period (${s.after} vs ${s.before}).`,
      whyItMatters: "A decrease can reflect either symptom changes or logging rhythm differences.",
      suggestedNext: SAFE_STABLE_NEXT,
    };
  }
  return {
    ...base,
    status: "stable",
    changeDetected: "Your symptom logging pattern looks similar across both periods.",
    whyItMatters: "Steady logs are useful for long-term pattern context.",
    suggestedNext: SAFE_STABLE_NEXT,
  };
}

function buildMedicinesCard(metrics: Metrics): WhatChangedCard {
  const base: Pick<WhatChangedCard, "id" | "title"> = {
    id: "medicines",
    title: "Medicine & logging changes",
  };
  const total = metrics.medicineCountCurrent + metrics.medicineCountPrevious;
  const loggingCurrent = metrics.symptomCountCurrent + metrics.medicineCountCurrent;
  const loggingPrevious = metrics.symptomCountPrevious + metrics.medicineCountPrevious;

  if (total < 1 && loggingCurrent + loggingPrevious < 3) {
    return {
      ...base,
      status: "not_enough_data",
      changeDetected: "Not enough medicine or log activity to compare changes yet.",
      whyItMatters: "This card improves when symptoms and medicines are logged consistently.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }

  if (metrics.newMedicines.length > 0) {
    return {
      ...base,
      status: "new",
      changeDetected: `You added a new medicine entry: “${metrics.newMedicines[0]}”.`,
      whyItMatters: "New medicine updates can make your timeline and visit prep more accurate.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }

  if (metrics.medicineCountCurrent > metrics.medicineCountPrevious) {
    return {
      ...base,
      status: "increased",
      changeDetected: `You logged medicines more often in this period (${metrics.medicineCountCurrent} vs ${metrics.medicineCountPrevious}).`,
      whyItMatters: "A rise in medicine logging can reflect changes you are actively tracking.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }
  if (metrics.medicineCountCurrent < metrics.medicineCountPrevious) {
    return {
      ...base,
      status: "decreased",
      changeDetected: `You logged medicines less often in this period (${metrics.medicineCountCurrent} vs ${metrics.medicineCountPrevious}).`,
      whyItMatters: "Lower logging can mean fewer updates, not necessarily fewer medicines.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }

  if (loggingCurrent > loggingPrevious + 2) {
    return {
      ...base,
      status: "increased",
      changeDetected: `Your overall logging activity increased (${loggingCurrent} vs ${loggingPrevious} entries).`,
      whyItMatters: "Higher logging consistency improves how clearly trends can be compared.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }
  if (loggingPrevious > loggingCurrent + 2) {
    return {
      ...base,
      status: "decreased",
      changeDetected: `Your overall logging activity decreased (${loggingCurrent} vs ${loggingPrevious} entries).`,
      whyItMatters: "Lower logging activity can make pattern comparisons less precise.",
      suggestedNext: SAFE_TRACK_NEXT,
    };
  }

  return {
    ...base,
    status: "stable",
    changeDetected: "Your medicine and logging activity appears stable across both periods.",
    whyItMatters: "Stable activity gives a reliable baseline for future comparisons.",
    suggestedNext: SAFE_STABLE_NEXT,
  };
}

function rollingResult(input: {
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
  now: Date;
  days: number;
  comparisonKey: WhatChangedComparisonKey;
  comparisonLabel: string;
}): WhatChangedResult {
  const today = startOfDayLocal(input.now);
  const currentEnd = new Date(today);
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - input.days);
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - input.days * 2);

  const metrics = computeMetrics({
    cycles: input.cycles,
    symptoms: input.symptoms,
    medicines: input.medicines,
    includeSymptomYmd: (ymd) => {
      const ms = noonMs(ymd);
      if (ms >= currentStart.getTime() && ms < currentEnd.getTime()) return "current";
      if (ms >= previousStart.getTime() && ms < previousEnd.getTime()) return "previous";
      return null;
    },
    includeMedicineMs: (ms) => {
      if (ms >= currentStart.getTime() && ms < currentEnd.getTime()) return "current";
      if (ms >= previousStart.getTime() && ms < previousEnd.getTime()) return "previous";
      return null;
    },
  });

  const cards = [buildCycleCard(metrics), buildSymptomCard(metrics), buildMedicinesCard(metrics)];
  const hasSignal = cards.some((c) => c.status !== "not_enough_data" && c.status !== "stable");
  const allInsufficient = cards.every((c) => c.status === "not_enough_data");

  return {
    comparisonKey: input.comparisonKey,
    comparisonLabel: input.comparisonLabel,
    cards: cards.map((c) => ({ ...c, title: `${c.title} · ${mapStatusLabel(c.status)}` })),
    emptyReason: allInsufficient ? "insufficient_data" : hasSignal ? null : "no_shift_detected",
  };
}

function cycleVsPreviousResult(input: {
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
}): WhatChangedResult {
  const sorted = [...input.cycles]
    .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.start_date.slice(0, 10)))
    .sort((a, b) => noonMs(b.start_date) - noonMs(a.start_date));

  if (sorted.length < 2) {
    return {
      comparisonKey: "cycle_vs_previous_cycle",
      comparisonLabel: "Current cycle vs previous cycle",
      cards: [
        {
          id: "cycle",
          title: "Cycle changes · Not enough data",
          status: "not_enough_data",
          changeDetected: "Log at least two cycle starts to compare current and previous cycle.",
          whyItMatters: "Cycle-based comparison needs recent cycle boundaries.",
          suggestedNext: SAFE_TRACK_NEXT,
        },
        {
          id: "symptoms",
          title: "Symptom changes · Not enough data",
          status: "not_enough_data",
          changeDetected: "Cycle comparison for symptoms needs two recent cycle windows.",
          whyItMatters: "This view is most helpful once cycle windows are available.",
          suggestedNext: SAFE_TRACK_NEXT,
        },
        {
          id: "medicines",
          title: "Medicine & logging changes · Not enough data",
          status: "not_enough_data",
          changeDetected: "Cycle comparison for logging needs two cycle windows.",
          whyItMatters: "Log cycles to unlock cycle-based medicine and logging trends.",
          suggestedNext: SAFE_TRACK_NEXT,
        },
      ],
      emptyReason: "insufficient_data",
    };
  }

  const currentStartMs = noonMs(sorted[0]!.start_date);
  const previousStartMs = noonMs(sorted[1]!.start_date);
  const cycleLenCurrent = Math.max(1, Math.round((currentStartMs - previousStartMs) / MS_DAY));
  const previousStartBeforeMs = sorted[2] ? noonMs(sorted[2].start_date) : null;
  const cycleLenPrevious =
    previousStartBeforeMs == null ? null : Math.max(1, Math.round((previousStartMs - previousStartBeforeMs) / MS_DAY));

  const metrics = computeMetrics({
    cycles: input.cycles,
    symptoms: input.symptoms,
    medicines: input.medicines,
    includeSymptomYmd: (ymd) => {
      const ms = noonMs(ymd);
      if (ms >= previousStartMs && ms < currentStartMs) return "current";
      if (previousStartBeforeMs != null && ms >= previousStartBeforeMs && ms < previousStartMs) return "previous";
      return null;
    },
    includeMedicineMs: (ms) => {
      if (ms >= previousStartMs && ms < currentStartMs) return "current";
      if (previousStartBeforeMs != null && ms >= previousStartBeforeMs && ms < previousStartMs) return "previous";
      return null;
    },
    cycleLengthsOverride: { current: cycleLenCurrent, previous: cycleLenPrevious },
  });

  const cards = [buildCycleCard(metrics), buildSymptomCard(metrics), buildMedicinesCard(metrics)];
  const hasSignal = cards.some((c) => c.status !== "not_enough_data" && c.status !== "stable");
  const allInsufficient = cards.every((c) => c.status === "not_enough_data");

  return {
    comparisonKey: "cycle_vs_previous_cycle",
    comparisonLabel: "Current cycle vs previous cycle",
    cards: cards.map((c) => ({ ...c, title: `${c.title} · ${mapStatusLabel(c.status)}` })),
    emptyReason: allInsufficient ? "insufficient_data" : hasSignal ? null : "no_shift_detected",
  };
}

export function buildWhatChangedInsightSet(input: {
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
  nowInput?: Date;
}): WhatChangedInsightSet {
  const now = input.nowInput ?? new Date();
  const result7 = rollingResult({
    cycles: input.cycles,
    symptoms: input.symptoms,
    medicines: input.medicines,
    now,
    days: 7,
    comparisonKey: "last_7_days",
    comparisonLabel: "Last 7 days vs previous 7 days",
  });
  const result30 = rollingResult({
    cycles: input.cycles,
    symptoms: input.symptoms,
    medicines: input.medicines,
    now,
    days: 30,
    comparisonKey: "last_30_days",
    comparisonLabel: "Last 30 days vs previous 30 days",
  });
  const resultCycle = cycleVsPreviousResult({
    cycles: input.cycles,
    symptoms: input.symptoms,
    medicines: input.medicines,
  });

  return {
    subtitle: "Compare recent logs with previous patterns.",
    defaultComparisonKey: "last_7_days",
    options: [
      { key: "last_7_days", label: "Last 7 days vs previous 7 days", available: true },
      { key: "last_30_days", label: "Last 30 days vs previous 30 days", available: true },
      {
        key: "cycle_vs_previous_cycle",
        label: "Current cycle vs previous cycle",
        available: resultCycle.emptyReason !== "insufficient_data",
      },
    ],
    results: {
      last_7_days: result7,
      last_30_days: result30,
      cycle_vs_previous_cycle: resultCycle,
    },
  };
}

export function buildWhatChangedInsights(input: {
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
  nowInput?: Date;
  comparisonKey?: WhatChangedComparisonKey;
}): WhatChangedResult {
  const set = buildWhatChangedInsightSet(input);
  return set.results[input.comparisonKey ?? set.defaultComparisonKey];
}
