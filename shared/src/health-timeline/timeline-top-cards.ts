import type { CycleRow } from "../types/records";
import type { HealthTimelineEvent, TimelinePageTopCards } from "./types";

const MS_DAY = 86_400_000;

function daysBetweenUtcDates(aYmd: string, bYmd: string): number {
  const a = new Date(`${aYmd}T12:00:00`).getTime();
  const b = new Date(`${bYmd}T12:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((a - b) / MS_DAY);
}

/**
 * Rule-based one-line cards for the timeline page header strip.
 * Replace with LLM-backed copy later (`ruleBasedTimelineTopCards`).
 */
export function buildRuleBasedTimelineTopCards(
  events: HealthTimelineEvent[],
  cycles: CycleRow[],
  nowInput: Date = new Date(),
): TimelinePageTopCards {
  const t = nowInput.getTime();
  const todayYmd = nowInput.toISOString().slice(0, 10);

  const last7 = events.filter((e) => e.sortAt >= t - 7 * MS_DAY && e.sortAt <= t);
  const recentBody =
    last7.length > 0
      ? `${last7.length} timeline entr${last7.length === 1 ? "y" : "ies"} in the last 7 days — pattern noticed in how often you’re logging, not what it means medically.`
      : "No timeline entries in the last 7 days yet. Light logging is still useful when life is busy.";

  const last28Symptoms = events.filter((e) => e.kind === "symptom" && e.sortAt >= t - 28 * MS_DAY);
  const byLabel = new Map<string, number>();
  for (const e of last28Symptoms) {
    const raw = e.title.replace(/^Symptom logged:\s*/i, "").trim();
    if (raw) byLabel.set(raw, (byLabel.get(raw) ?? 0) + 1);
  }
  const top = [...byLabel.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostSymptomBody = top
    ? `Most logged label in the last month: “${top[0]}” (${top[1]}×). May be worth tracking in a visit prep note — not a diagnosis.`
    : "Not enough symptom logs in the last month to highlight a label. Keep logging when it feels helpful.";

  const sortedCycles = [...cycles].sort((a, b) => {
    const as = a.start_date.slice(0, 10);
    const bs = b.start_date.slice(0, 10);
    return bs.localeCompare(as);
  });
  const latest = sortedCycles[0];
  let cycleBody: string;
  if (!latest) {
    cycleBody =
      "No period start saved yet. Adding dates when you can may add helpful context before visits — educational only.";
  } else {
    const start = latest.start_date.slice(0, 10);
    const daysSince = Math.max(0, daysBetweenUtcDates(todayYmd, start));
    const endPart = latest.end_date
      ? ` Latest logged end: ${latest.end_date.slice(0, 10)}.`
      : "";
    cycleBody = `Latest period start on record: ${start} (${daysSince} day${daysSince === 1 ? "" : "s"} ago).${endPart} Use this as organization context, not a clinical interpretation.`;
  }

  return {
    recentActivity: { title: "Recent activity", body: recentBody },
    mostLoggedSymptom: { title: "Most logged symptom", body: mostSymptomBody },
    currentCycleContext: { title: "Current cycle context", body: cycleBody },
  };
}
