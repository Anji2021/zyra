import type { DoctorMatchHistoryRow } from "@/lib/specialists/doctor-match-history-queries";

const MIN_ENTRIES = 3;
const MIN_REPEAT = 2;

function normalizePhrase(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Map free text to a short theme label for summaries. */
function themeFromText(text: string): string | null {
  const t = text.toLowerCase();
  if (/(pcos|hormonal|hormone|irregular period|cycle|period)/i.test(t)) {
    return "hormonal balance and cycles";
  }
  if (/(digest|stomach|bloat|bloating|nausea|gastro|abdominal)/i.test(t)) {
    return "digestive comfort";
  }
  if (/(uti|urinary|bladder|burning|urgency)/i.test(t)) {
    return "urinary symptoms";
  }
  if (/(stress|anxiety|mood|fatigue|energy)/i.test(t)) {
    return "stress and energy";
  }
  return null;
}

/**
 * Rule-based summary from the last few DoctorMatch history rows.
 * Returns null if not enough data or no clear repetition.
 */
export function analyzeHistoryPatterns(history: DoctorMatchHistoryRow[]): string | null {
  if (history.length < MIN_ENTRIES) return null;

  const rows = history.slice(0, 5);

  // 1) Exact same pattern string repeated
  const patternCounts = new Map<string, number>();
  for (const row of rows) {
    const p = normalizePhrase(row.pattern);
    if (!p) continue;
    patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
  }
  for (const [pattern, count] of patternCounts) {
    if (count >= MIN_REPEAT) {
      const short = pattern.length > 90 ? `${pattern.slice(0, 87)}…` : pattern;
      return `Your recent entries suggest a recurring pattern related to: ${short}`;
    }
  }

  // 2) Same theme from pattern/symptoms fields (2+ rows)
  const themeCounts = new Map<string, number>();
  for (const row of rows) {
    const combined = `${row.pattern} ${row.symptoms}`;
    const theme = themeFromText(combined);
    if (theme) themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
  }
  const topTheme = [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTheme && topTheme[1] >= MIN_REPEAT) {
    return `Your recent entries suggest a recurring pattern related to ${topTheme[0]}.`;
  }

  // 3) Repeated symptom phrases (comma-separated chips)
  const phraseCounts = new Map<string, number>();
  for (const row of rows) {
    const parts = row.symptoms.split(",").map((s) => normalizePhrase(s)).filter(Boolean);
    const uniqueInRow = new Set(parts);
    for (const phrase of uniqueInRow) {
      if (phrase.length < 3) continue;
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
    }
  }
  const topPhrase = [...phraseCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topPhrase && topPhrase[1] >= MIN_REPEAT) {
    const label = topPhrase[0].length > 60 ? `${topPhrase[0].slice(0, 57)}…` : topPhrase[0];
    return `Your recent entries suggest a recurring pattern related to symptoms like “${label}”.`;
  }

  return null;
}
