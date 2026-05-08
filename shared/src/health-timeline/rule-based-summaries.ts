import type { HealthTimelineEvent, RuleBasedTimelineSummaries } from "./types";

const MS_DAY = 86_400_000;

/**
 * Rule-based copy only — replace with LLM output later (`ruleBasedTimelineSummaries` prefix).
 */
export function buildRuleBasedTimelineSummaries(
  events: HealthTimelineEvent[],
  nowInput: Date = new Date(),
): RuleBasedTimelineSummaries {
  const t = nowInput.getTime();
  const thisWeek = events.filter((e) => e.sortAt >= t - 7 * MS_DAY && e.sortAt <= t);
  const prevWeek = events.filter(
    (e) => e.sortAt >= t - 14 * MS_DAY && e.sortAt < t - 7 * MS_DAY,
  );

  const countKinds = (list: HealthTimelineEvent[]) => {
    const c = { cycle: 0, symptom: 0, medicine: 0, reminder: 0, profile: 0 };
    for (const e of list) {
      c[e.kind] += 1;
    }
    return c;
  };

  const tw = countKinds(thisWeek);
  const parts: string[] = [];
  if (tw.symptom > 0) parts.push(`${tw.symptom} symptom log${tw.symptom === 1 ? "" : "s"}`);
  if (tw.cycle > 0) parts.push(`${tw.cycle} cycle update${tw.cycle === 1 ? "" : "s"}`);
  if (tw.medicine > 0) parts.push(`${tw.medicine} medicine record${tw.medicine === 1 ? "" : "s"}`);
  if (tw.reminder > 0) parts.push(`${tw.reminder} reminder row${tw.reminder === 1 ? "" : "s"}`);
  if (tw.profile > 0) parts.push("a profile update");

  const thisWeekBody =
    parts.length > 0
      ? `This week’s activity may include: ${parts.join(
          ", ",
        )}. This is educational pattern-spotting only — not a diagnosis — and may help you notice what to discuss with a clinician.`
      : "No new entries this week yet. As you log cycles, symptoms, or medicines, a pattern worth tracking may become easier to see.";

  const last28 = events.filter((e) => e.sortAt >= t - 28 * MS_DAY && e.kind === "symptom");
  const byLabel = new Map<string, number>();
  for (const e of last28) {
    const raw = e.title.replace(/^Symptom logged:\s*/i, "").trim();
    if (raw) byLabel.set(raw, (byLabel.get(raw) ?? 0) + 1);
  }
  const recurring = [...byLabel.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);

  const recurringBody =
    recurring.length > 0
      ? `These symptoms were logged more than once in the last month: ${recurring
          .slice(0, 3)
          .map(([k, n]) => `${k} (${n}×)`)
          .join(
            "; ",
          )}. A recurring label may indicate a pattern worth tracking — not a medical conclusion.`
      : "Not enough repeated symptom labels yet to suggest a recurring theme. Keep logging as feels helpful.";

  const curCount = thisWeek.length;
  const prevCount = prevWeek.length;
  let changedBody: string;
  if (curCount === 0 && prevCount === 0) {
    changedBody =
      "As you add logs over time, recent changes compared to earlier weeks will appear here — for awareness, not diagnosis.";
  } else if (curCount > prevCount) {
    changedBody = `There may be more timeline entries this week than the week before — worth tracking whether that matches how you’ve been feeling.`;
  } else if (curCount < prevCount) {
    changedBody = `Fewer entries than the prior week — which can be normal. Worth tracking only in the sense of what felt worth logging.`;
  } else {
    changedBody = `Activity level is similar to the prior week — pattern noticed in your logging rhythm, not your health status.`;
  }

  return {
    thisWeek: { title: "This week’s pattern", body: thisWeekBody },
    recurringSymptoms: { title: "Possible recurring symptoms", body: recurringBody },
    whatChanged: { title: "What changed recently", body: changedBody },
  };
}
