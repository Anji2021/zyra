import { extractJsonObject } from "@/lib/groq/extract-json";
import type { InsightPatternCard, InsightSummaryDocument } from "./types";

function isPatternCard(x: unknown): x is InsightPatternCard {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const id = o.id;
  if (id !== "cycle" && id !== "symptom" && id !== "health") return false;
  if (typeof o.title !== "string" || typeof o.body !== "string") return false;
  if (typeof o.highlight !== "string" || !o.highlight.trim()) return false;
  if (!Array.isArray(o.bullets)) return false;
  const bullets = o.bullets.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (bullets.length < 1 || bullets.length > 3) return false;
  return true;
}

function normalizeStringArray(x: unknown, maxLen: number): string[] | null {
  if (!Array.isArray(x)) return null;
  const out = x.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (out.length === 0) return null;
  return out.slice(0, maxLen);
}

/**
 * Safely merge Groq JSON output into the deterministic draft. Any invalid or missing piece falls back to `draft`.
 */
export function mergeInsightSummaryFromGroq(
  draft: InsightSummaryDocument,
  assistantContent: string,
): InsightSummaryDocument {
  const extracted = extractJsonObject(assistantContent);
  if (!extracted) return draft;

  let o: Record<string, unknown>;
  try {
    o = JSON.parse(extracted) as Record<string, unknown>;
  } catch {
    return draft;
  }

  const title =
    typeof o.title === "string" && o.title.trim() ? (o.title as string).trim() : draft.title;
  const overview =
    typeof o.overview === "string" && o.overview.trim()
      ? (o.overview as string).trim()
      : draft.overview;

  let patternCards = draft.patternCards;
  if (Array.isArray(o.patternCards) && o.patternCards.length === 3 && o.patternCards.every(isPatternCard)) {
    patternCards = o.patternCards as InsightPatternCard[];
  }

  let summaryBullets = draft.summaryBullets;
  const sb = normalizeStringArray(o.summaryBullets, 8);
  if (sb && sb.length >= 2) summaryBullets = sb.slice(0, 5);

  let unusualPatterns = draft.unusualPatterns;
  const up = normalizeStringArray(o.unusualPatterns, 20);
  if (up) unusualPatterns = up;

  let possibleSpecialist: string | null = draft.possibleSpecialist;
  if (o.possibleSpecialist === null) possibleSpecialist = null;
  else if (typeof o.possibleSpecialist === "string") {
    const t = o.possibleSpecialist.trim();
    possibleSpecialist = t.length ? t : draft.possibleSpecialist;
  }

  const carePrepScript =
    typeof o.carePrepScript === "string" && o.carePrepScript.trim()
      ? (o.carePrepScript as string).trim()
      : draft.carePrepScript;

  let questionsToAsk = draft.questionsToAsk;
  const qa = normalizeStringArray(o.questionsToAsk, 12);
  if (qa && qa.length >= 1) questionsToAsk = qa.slice(0, 8);

  let doctorVisitChecklist = draft.doctorVisitChecklist;
  const dc = normalizeStringArray(o.doctorVisitChecklist, 16);
  if (dc && dc.length >= 1) doctorVisitChecklist = dc.slice(0, 12);

  const disclaimer =
    typeof o.disclaimer === "string" && o.disclaimer.trim()
      ? (o.disclaimer as string).trim()
      : draft.disclaimer;

  return {
    title,
    overview,
    patternCards,
    summaryBullets,
    unusualPatterns,
    possibleSpecialist,
    carePrepScript,
    questionsToAsk,
    doctorVisitChecklist,
    disclaimer,
  };
}
