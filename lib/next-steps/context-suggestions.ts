export type NextStepSuggestion = {
  resourceId: string;
  resourceTitle: string;
  assistantPrefill: string;
};

const FALLBACK: NextStepSuggestion = {
  resourceId: "when-to-see-gynecologist",
  resourceTitle: "When to see a gynecologist",
  assistantPrefill: "I want to understand my recent health changes better.",
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

export function suggestionFromSymptomText(raw: string | null | undefined): NextStepSuggestion {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return FALLBACK;

  if (includesAny(text, ["cramp", "cramps", "period pain", "menstrual pain"])) {
    return {
      resourceId: "pms-vs-pmdd",
      resourceTitle: "Learn about menstrual cramps and PMS patterns",
      assistantPrefill: "I recently logged cramps. What does this usually mean?",
    };
  }

  if (includesAny(text, ["irregular cycle", "irregular period", "irregular"])) {
    return {
      resourceId: "irregular-periods-support",
      resourceTitle: "Irregular cycles explained",
      assistantPrefill: "I recently logged an irregular cycle. What could affect this?",
    };
  }

  if (includesAny(text, ["missed period", "late period", "period late", "no period"])) {
    return {
      resourceId: "late-periods-when-to-notice",
      resourceTitle: "Late or missed periods: what to notice",
      assistantPrefill: "I recently logged a missed period. How should I think about this?",
    };
  }

  if (includesAny(text, ["pain", "ache", "pelvic", "sharp"])) {
    return {
      resourceId: "endometriosis-basics",
      resourceTitle: "General pain context and when to seek support",
      assistantPrefill: "I recently logged pain symptoms. How can I understand patterns safely?",
    };
  }

  return FALLBACK;
}

export function suggestionFromResource(resourceTitle: string): string {
  const clean = resourceTitle.trim();
  if (!clean) return "I want help understanding this health topic.";
  return `I want to understand ${clean.toLowerCase()}.`;
}
