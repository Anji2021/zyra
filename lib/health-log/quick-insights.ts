import type { MedicineRow, SymptomRow } from "@shared/types/records";

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function medicineIsActive(m: MedicineRow): boolean {
  const t = todayIsoLocal();
  if (!m.end_date) return true;
  return m.end_date >= t;
}

/** Recent = logged_date within last `days` calendar days (inclusive). */
function symptomIsRecent(s: SymptomRow, days: number): boolean {
  const log = new Date(`${s.logged_date}T12:00:00`);
  if (Number.isNaN(log.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return log >= start && log <= now;
}

function countRecentMatching(symptoms: SymptomRow[], days: number, test: (s: string) => boolean): number {
  return symptoms.filter((s) => symptomIsRecent(s, days) && test(s.symptom)).length;
}

function avgRecentSeverity(symptoms: SymptomRow[], days: number): number | null {
  const recent = symptoms.filter((s) => symptomIsRecent(s, days) && s.severity != null);
  if (recent.length === 0) return null;
  const sum = recent.reduce((a, s) => a + (s.severity ?? 0), 0);
  return sum / recent.length;
}

/**
 * Short, non-clinical copy derived only from stored logs (no API).
 * Caps at 4 lines to stay compact.
 */
export function buildQuickInsights(medicines: MedicineRow[], symptoms: SymptomRow[]): string[] {
  const lines: string[] = [];
  const recentWindow = 21;

  const irregular = countRecentMatching(symptoms, recentWindow, (t) => /irregular|period/i.test(t));
  if (irregular >= 2) {
    lines.push(`You logged irregular periods ${irregular} times recently.`);
  } else if (irregular === 1) {
    lines.push("You logged irregular periods once recently.");
  }

  const fatigue = countRecentMatching(symptoms, recentWindow, (t) => /fatigue|tired|exhaust/i.test(t));
  if (fatigue >= 2) {
    lines.push(`Fatigue shows up ${fatigue} times in your recent logs.`);
  }

  const cramps = countRecentMatching(symptoms, recentWindow, (t) => /cramp/i.test(t));
  if (cramps >= 2 && lines.length < 4) {
    lines.push(`Cramps were logged ${cramps} times recently.`);
  }

  const active = medicines.filter(medicineIsActive);
  if (medicines.length > 0) {
    if (active.length === 1) {
      lines.push("You have 1 active medication.");
    } else if (active.length > 1) {
      lines.push(`You have ${active.length} active medications.`);
    } else {
      lines.push("No active medications — each entry has an end date in the past.");
    }
  }

  const avg = avgRecentSeverity(symptoms, recentWindow);
  if (avg != null && lines.length < 4) {
    if (avg < 2.25) {
      lines.push("Severity has been mild recently.");
    } else if (avg <= 3.5) {
      lines.push("Severity has been moderate recently.");
    } else {
      lines.push("Severity has been on the higher side recently.");
    }
  }

  if (lines.length === 0) {
    if (symptoms.length === 0 && medicines.length === 0) {
      return [];
    }
    lines.push("Add a few more logs and short patterns will show up here.");
  }

  return lines.slice(0, 4);
}
