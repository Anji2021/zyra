import type { HealthTimelineEvent, TimelineEventKind } from "@zyra/shared";

export type DateRangePreset = "7" | "30" | "90" | "all";

export const DEFAULT_DATE_RANGE: DateRangePreset = "30";

export const INITIAL_VISIBLE_EVENTS = 10;
export const SHOW_MORE_INCREMENT = 8;

export function filterEventsByDateRange(
  events: HealthTimelineEvent[],
  preset: DateRangePreset,
  now: Date,
): HealthTimelineEvent[] {
  if (preset === "all") return events;
  const days = preset === "7" ? 7 : preset === "30" ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffMs = cutoff.getTime();
  return events.filter((e) => {
    const t = new Date(`${e.date}T12:00:00`).getTime();
    return !Number.isNaN(t) && t >= cutoffMs;
  });
}

export function filterEventsBySearch(events: HealthTimelineEvent[], query: string): HealthTimelineEvent[] {
  const q = query.trim().toLowerCase();
  if (!q) return events;
  return events.filter((e) => {
    const title = e.title.toLowerCase();
    const detail = (e.detail ?? "").toLowerCase();
    return title.includes(q) || detail.includes(q);
  });
}

/** yyyy-mm → label */
export function monthKeyFromDateYmd(ymd: string): string {
  return ymd.slice(0, 7);
}

export type MonthDayGroup = {
  monthKey: string;
  monthLabel: string;
  days: { dateKey: string; dayLabel: string; events: HealthTimelineEvent[] }[];
};

/** Build nested month → day groups; days sorted newest first; months newest first */
export function groupEventsByMonthThenDate(events: HealthTimelineEvent[]): MonthDayGroup[] {
  const sorted = [...events].sort((a, b) => b.sortAt - a.sortAt);
  const monthMap = new Map<string, Map<string, HealthTimelineEvent[]>>();

  for (const ev of sorted) {
    const mk = monthKeyFromDateYmd(ev.date);
    if (!monthMap.has(mk)) monthMap.set(mk, new Map());
    const dayMap = monthMap.get(mk)!;
    const dk = ev.date;
    if (!dayMap.has(dk)) dayMap.set(dk, []);
    dayMap.get(dk)!.push(ev);
  }

  const monthKeys = [...monthMap.keys()].sort((a, b) => (a < b ? 1 : -1));
  const out: MonthDayGroup[] = [];

  for (const mk of monthKeys) {
    const dayMap = monthMap.get(mk)!;
    const dateKeys = [...dayMap.keys()].sort((a, b) => (a < b ? 1 : -1));
    const days = dateKeys.map((dateKey) => ({
      dateKey,
      dayLabel: formatDayHeading(dateKey),
      events: dayMap.get(dateKey)!,
    }));
    out.push({
      monthKey: mk,
      monthLabel: formatMonthHeading(mk),
      days,
    });
  }
  return out;
}

function formatMonthHeading(monthKey: string): string {
  try {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } catch {
    return monthKey;
  }
}

function formatDayHeading(dateKey: string): string {
  try {
    const d = new Date(`${dateKey}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateKey;
  }
}

export type TimelineStatSummary = {
  totalInView: number;
  latestCycleLabel: string;
  symptomCount: number;
  medicineReminderCount: number;
};

export function buildStatSummary(events: HealthTimelineEvent[]): TimelineStatSummary {
  const symptomCount = events.filter((e) => e.kind === "symptom").length;
  const medicineReminderCount = events.filter(
    (e) => e.kind === "medicine" || e.kind === "reminder",
  ).length;
  const cycleEvents = events.filter((e) => e.kind === "cycle");
  const latestCycle = cycleEvents.sort((a, b) => b.sortAt - a.sortAt)[0];
  let latestCycleLabel = "—";
  if (latestCycle) {
    try {
      const d = new Date(`${latestCycle.date}T12:00:00`);
      latestCycleLabel = Number.isNaN(d.getTime())
        ? latestCycle.title
        : `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${latestCycle.title}`;
    } catch {
      latestCycleLabel = latestCycle.title;
    }
  }

  return {
    totalInView: events.length,
    latestCycleLabel,
    symptomCount,
    medicineReminderCount,
  };
}

export type MonthHighlights = {
  thisMonthLine: string;
  mostCommonLine: string;
  worthTrackingLine: string;
};

/** Rule-based copy for sidebar — educational only */
export function buildMonthSidebarHighlights(
  events: HealthTimelineEvent[],
  now: Date,
): MonthHighlights {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1).getTime();
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
  const thisMonthEv = events.filter((e) => {
    const t = new Date(`${e.date}T12:00:00`).getTime();
    return !Number.isNaN(t) && t >= start && t <= end;
  });

  const thisMonthLine =
    thisMonthEv.length > 0
      ? `${thisMonthEv.length} entr${thisMonthEv.length === 1 ? "y" : "ies"} this calendar month — pattern noticed in how often you’re logging, not what it means medically.`
      : "No entries yet this month — light logging still helps over time.";

  const kindCounts = new Map<TimelineEventKind, number>();
  for (const e of thisMonthEv.length > 0 ? thisMonthEv : events) {
    kindCounts.set(e.kind, (kindCounts.get(e.kind) ?? 0) + 1);
  }
  const labels: Record<TimelineEventKind, string> = {
    cycle: "Cycle",
    symptom: "Symptoms",
    medicine: "Medicine",
    reminder: "Reminders",
    profile: "Profile",
  };
  let topKind: TimelineEventKind | null = null;
  let topN = 0;
  for (const [k, n] of kindCounts) {
    if (n > topN) {
      topN = n;
      topKind = k;
    }
  }
  const mostCommonLine =
    topKind && topN > 0
      ? `Most common type in view: ${labels[topKind]} (${topN}) — worth tracking as organization, not a health label.`
      : "As you add logs, a most common type may appear here.";

  const worthTrackingLine =
    "Recurring themes can be helpful to discuss with a clinician — educational context only.";

  return { thisMonthLine, mostCommonLine, worthTrackingLine };
}

export function subtitleForEvent(ev: HealthTimelineEvent, maxLen = 72): string | null {
  const d = ev.detail?.trim();
  if (!d) return null;
  if (d.length <= maxLen) return d;
  return `${d.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}
