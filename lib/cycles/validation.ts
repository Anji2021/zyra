import type { CycleRow } from "@/lib/cycles/types";

export type CycleDraft = {
  start_date: string;
  end_date: string | null;
};

/** Calendar-local “today” (YYYY-MM-DD). Client and server may differ slightly by TZ. */
export function calendarTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Whole days from `earlier` (inclusive) to `later` (inclusive) span: 0 if same day. */
export function calendarDaysSpan(earlier: string, later: string): number {
  const a = new Date(`${earlier}T12:00:00`);
  const b = new Date(`${later}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Inclusive day count for a closed period (start through end). */
export function periodInclusiveDayCount(start: string, end: string): number {
  return calendarDaysSpan(start, end) + 1;
}

function effectiveEnd(start: string, end: string | null, today: string): string {
  return end ?? today;
}

function rangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 <= e2 && s2 <= e1;
}

function absStartGap(a: string, b: string): number {
  return Math.abs(calendarDaysSpan(a <= b ? a : b, a <= b ? b : a));
}

export type ValidateCycleOptions = {
  existing: CycleRow[];
  draft: CycleDraft;
  /** When updating, ignore this row for duplicate/gap/overlap/open checks. */
  excludeId?: string;
  today: string;
};

/**
 * Single place for business rules (used by server actions + client submit guards).
 */
export function validateCycleEntry(opts: ValidateCycleOptions): { ok: true } | { ok: false; error: string } {
  const { existing, draft, excludeId, today } = opts;
  const { start_date: start, end_date: end } = draft;

  if (!isIsoDateOnly(start)) {
    return { ok: false, error: "Start date does not look valid. Please pick it again from the calendar." };
  }
  if (end != null && end !== "" && !isIsoDateOnly(end)) {
    return { ok: false, error: "End date does not look valid. Please pick it again from the calendar." };
  }
  const endNorm: string | null = end && end.length > 0 ? end : null;

  if (start > today) {
    return { ok: false, error: "Start date can’t be in the future." };
  }
  if (endNorm && endNorm > today) {
    return { ok: false, error: "End date can’t be in the future." };
  }
  if (endNorm && endNorm < start) {
    return { ok: false, error: "End date should be the same day or after the start date." };
  }

  const openEnded = endNorm == null;

  if (openEnded) {
    const daysOpen = calendarDaysSpan(start, today);
    if (daysOpen > 8) {
      return {
        ok: false,
        error: "A period entry can stay open for up to 8 days. Please add an end date.",
      };
    }

    const otherOpen = existing.some((r) => r.id !== excludeId && (r.end_date == null || r.end_date === ""));
    if (otherOpen) {
      return {
        ok: false,
        error: "You already have an open period entry. Please close it before starting a new one.",
      };
    }
  }

  for (const row of existing) {
    if (row.id === excludeId) continue;
    if (row.start_date === start) {
      return { ok: false, error: "That start date already exists in your history." };
    }
    if (absStartGap(row.start_date, start) < 21) {
      return {
        ok: false,
        error: "This start date is too close to another logged period. Please check your history.",
      };
    }
  }

  const draftEndEff = effectiveEnd(start, endNorm, today);
  for (const row of existing) {
    if (row.id === excludeId) continue;
    const rowEndEff = effectiveEnd(row.start_date, row.end_date, today);
    if (rangesOverlap(start, draftEndEff, row.start_date, rowEndEff)) {
      return {
        ok: false,
        error: "These dates overlap another period in your history. Adjust dates or edit the other entry.",
      };
    }
  }

  return { ok: true };
}
