import { daysBetweenStarts } from "@/lib/cycles/queries";
import type { CycleRow } from "@/lib/cycles/types";
import type { MedicineRow } from "@/lib/medicines/types";
import type { ProfileRow } from "@/lib/profiles/types";
import type { SymptomRow } from "@/lib/symptoms/types";

/** Calendar add in local time, noon anchor; returns YYYY-MM-DD */
export function addCalendarDays(isoYmd: string, days: number): string {
  const d = new Date(`${isoYmd}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function profileCycleLengthDays(avg: number | null | undefined): number | null {
  if (avg == null || !Number.isFinite(avg)) return null;
  if (avg < 21 || avg > 50) return null;
  return Math.round(avg);
}

function isMedicineActive(endDate: string | null): boolean {
  if (endDate == null || endDate.trim() === "") return true;
  const end = new Date(`${endDate}T12:00:00`);
  if (Number.isNaN(end.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end >= today;
}

export type CycleInsights = {
  hasCycles: boolean;
  cycleCount: number;
  lastPeriodStart: string | null;
  /** Shown in UI; null if no cycles and no profile average */
  averageCycleLengthDays: number | null;
  averageSource: "logged-intervals" | "profile" | null;
  /** Uses logged → profile → 28 days for spacing hint */
  estimateSource: "logged-intervals" | "profile" | "default";
  estimatedNextPeriod: string | null;
  irregularityNote: string | null;
};

export type SymptomInsights = {
  hasSymptoms: boolean;
  totalCount: number;
  mostRecent: Pick<SymptomRow, "symptom" | "logged_date" | "severity"> | null;
  /** Only when the same name appears at least twice */
  mostFrequent: { label: string; count: number } | null;
  highestSeverity: Pick<SymptomRow, "symptom" | "severity" | "logged_date"> | null;
};

export type MedicineInsights = {
  hasMedicines: boolean;
  totalCount: number;
  activeCount: number;
  mostRecentAdded: Pick<MedicineRow, "name" | "created_at"> | null;
};

export function buildCycleInsights(profile: ProfileRow | null, cycles: CycleRow[]): CycleInsights {
  const cycleCount = cycles.length;
  const hasCycles = cycleCount > 0;
  const lastPeriodStart = hasCycles ? cycles[0]!.start_date : null;

  const intervals: number[] = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const days = daysBetweenStarts(cycles[i].start_date, cycles[i + 1].start_date);
    if (days > 0 && days < 120) intervals.push(days);
  }

  const avgFromLogs =
    intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : null;

  const avgFromProfile = profileCycleLengthDays(profile?.average_cycle_length ?? null);

  const averageCycleLengthDays = avgFromLogs ?? (hasCycles ? avgFromProfile : null);
  const averageSource: CycleInsights["averageSource"] =
    avgFromLogs != null
      ? "logged-intervals"
      : hasCycles && avgFromProfile != null
        ? "profile"
        : null;

  const lengthForNext = avgFromLogs ?? avgFromProfile ?? 28;
  const estimateSource: CycleInsights["estimateSource"] =
    avgFromLogs != null ? "logged-intervals" : avgFromProfile != null ? "profile" : "default";

  let irregularityNote: string | null = null;
  if (intervals.length >= 2) {
    const min = Math.min(...intervals);
    const max = Math.max(...intervals);
    if (max - min >= 7) {
      irregularityNote =
        "Your logged gaps between period starts vary quite a bit — stress, sleep, or hormones can all nudge timing. Worth mentioning to a clinician if it worries you; this isn’t a diagnosis.";
    }
  }

  const estimatedNextPeriod =
    lastPeriodStart != null ? addCalendarDays(lastPeriodStart, lengthForNext) : null;

  return {
    hasCycles,
    cycleCount,
    lastPeriodStart,
    averageCycleLengthDays,
    averageSource,
    estimateSource,
    estimatedNextPeriod,
    irregularityNote,
  };
}

export function buildSymptomInsights(symptoms: SymptomRow[]): SymptomInsights {
  const totalCount = symptoms.length;
  const hasSymptoms = totalCount > 0;
  const mostRecent = hasSymptoms
    ? {
        symptom: symptoms[0].symptom,
        logged_date: symptoms[0].logged_date,
        severity: symptoms[0].severity,
      }
    : null;

  const freq = new Map<string, { display: string; count: number }>();
  for (const s of symptoms) {
    const key = (s.symptom.trim().toLowerCase() || "entry").slice(0, 200);
    const display = s.symptom.trim() || "Entry";
    const cur = freq.get(key);
    if (cur) cur.count += 1;
    else freq.set(key, { display, count: 1 });
  }

  let mostFrequent: { label: string; count: number } | null = null;
  for (const v of freq.values()) {
    if (!mostFrequent || v.count > mostFrequent.count) {
      mostFrequent = { label: v.display, count: v.count };
    }
  }
  if (mostFrequent && mostFrequent.count < 2) {
    mostFrequent = null;
  }

  let highestSeverity: Pick<SymptomRow, "symptom" | "severity" | "logged_date"> | null = null;
  for (const s of symptoms) {
    if (s.severity == null) continue;
    if (
      !highestSeverity ||
      s.severity > (highestSeverity.severity ?? 0) ||
      (s.severity === highestSeverity.severity &&
        new Date(`${s.logged_date}T12:00:00`) > new Date(`${highestSeverity.logged_date}T12:00:00`))
    ) {
      highestSeverity = {
        symptom: s.symptom,
        severity: s.severity,
        logged_date: s.logged_date,
      };
    }
  }

  return {
    hasSymptoms,
    totalCount,
    mostRecent,
    mostFrequent,
    highestSeverity,
  };
}

export function buildMedicineInsights(medicines: MedicineRow[]): MedicineInsights {
  const totalCount = medicines.length;
  const activeCount = medicines.filter((m) => isMedicineActive(m.end_date)).length;
  const sorted = [...medicines].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const mostRecentAdded =
    sorted[0] != null ? { name: sorted[0].name, created_at: sorted[0].created_at } : null;

  return {
    hasMedicines: totalCount > 0,
    totalCount,
    activeCount,
    mostRecentAdded,
  };
}

export function hasAnyTracking(
  cycle: CycleInsights,
  symptom: SymptomInsights,
  medicine: MedicineInsights,
): boolean {
  return cycle.hasCycles || symptom.hasSymptoms || medicine.hasMedicines;
}
