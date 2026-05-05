/** One of three priority “possible pattern” cards for the Insights report UI. */
export type InsightPatternCard = {
  id: "cycle" | "symptom" | "health";
  title: string;
  /** One-line bold headline for the card. */
  highlight: string;
  /** Up to 3 short bullets (no “•” prefix in strings). */
  bullets: string[];
  /** Compact fallback text (e.g. print, clients that only read `body`). */
  body: string;
};

/** Structured doctor-visit oriented summary (educational only; not a diagnosis). */
export type InsightSummaryDocument = {
  title: string;
  /** Short intro line(s) for API / download; main story lives in `summaryBullets`. */
  overview: string;
  patternCards: InsightPatternCard[];
  /** 3–5 concise bullets for the report “Summary” section. */
  summaryBullets: string[];
  unusualPatterns: string[];
  possibleSpecialist: string | null;
  /** Brief third-person narrative for visit context (not a script block). */
  carePrepScript: string;
  questionsToAsk: string[];
  doctorVisitChecklist: string[];
  disclaimer: string;
};

export type DoctorMatchHistoryRow = {
  symptoms: string;
  pattern: string;
  specialist: string;
  created_at: string;
};
