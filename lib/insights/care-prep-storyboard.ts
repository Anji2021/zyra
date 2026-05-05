import type { InsightSummaryDocument } from "@/lib/insight-summary/types";
import { ZYRA } from "@/lib/zyra/site";

export type CarePrepStoryboardSlide = {
  heading: string;
  /** 2–3 short lines (no long paragraphs). */
  bullets: string[];
};

/** Four-slide local preview before any real video is generated. */
export type CarePrepStoryboard = {
  title: string;
  slides: [
    CarePrepStoryboardSlide,
    CarePrepStoryboardSlide,
    CarePrepStoryboardSlide,
    CarePrepStoryboardSlide,
  ];
  disclaimer: string;
};

function clip(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function takeBullets(lines: string[], max: number, eachMax: number): string[] {
  return lines
    .map((s) => clip(s, eachMax))
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Builds a fixed 4-slide storyboard from the current insight summary (no network).
 * Copy is kept short for mobile and auto-play readability.
 */
export function buildCarePrepStoryboard(report: InsightSummaryDocument): CarePrepStoryboard {
  const main = report.patternCards[0];
  const slide1Lines: string[] = main
    ? [main.highlight, ...main.bullets.slice(0, 2)].filter(Boolean)
    : [clip(report.overview || "Log symptoms and cycles so Zyra can highlight patterns here.", 120)];

  const slide2Lines = takeBullets(report.summaryBullets, 3, 110);

  const slide3Lines = takeBullets(report.questionsToAsk, 3, 100);

  const checklist = report.doctorVisitChecklist.slice(0, 2).map((c) => clip(c, 100));
  const slide4Lines = [
    ...checklist,
    "Bring this summary to your visit when you’re ready.",
  ].filter(Boolean);
  const slide4 = takeBullets(slide4Lines, 3, 105);

  return {
    title: `${ZYRA.name} — Care prep preview`,
    slides: [
      { heading: "Possible pattern", bullets: takeBullets(slide1Lines, 3, 95) },
      { heading: "What Zyra noticed", bullets: slide2Lines.length ? slide2Lines : ["Keep logging — clearer patterns will show over time."] },
      { heading: "Questions to ask", bullets: slide3Lines.length ? slide3Lines : ["What should I track before the next visit?", "When should I follow up?"] },
      { heading: "What to do next", bullets: slide4.length ? slide4 : ["List medicines you take.", "Note recent symptom changes.", "Schedule a visit if symptoms worsen."] },
    ],
    disclaimer: report.disclaimer,
  };
}
