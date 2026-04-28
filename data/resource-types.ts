export const RESOURCE_CATEGORIES = [
  "Periods",
  "PCOS/PCOD",
  "Hormones",
  "Sexual Health",
  "Fertility",
  "Doctor Visit Prep",
  "General Health",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export type ResourceArticle = {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  readTime: string;
  /** Main article body — plain paragraphs */
  paragraphs: string[];
  /** Educational disclaimer (shown on list + detail) */
  disclaimer: string;
  /** Ideas for self-tracking to discuss with a clinician — not prescriptions */
  whatToTrack: string[];
  /** Conversation starters for appointments */
  questionsToAskDoctor: string[];
  /** When professional care may be appropriate — not triage */
  whenToSeekCare: string[];
};
