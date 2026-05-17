/**
 * Web Wrangler / provider research layer — types only (no demo imports).
 * Mock payloads and API placeholders live in `lib/agentIntegrations/webWrangler.ts`.
 */

export type ResearchSourceType =
  | "google"
  | "clinic_website"
  | "review_site"
  | "insurance_directory"
  | "hospital_profile"
  | "forum"
  | "article"
  | "other";

export type ResearchSourceStatus = "checked" | "pending" | "failed";

export type ProviderResearchConfirmationSource =
  | "demo"
  | "browser_api"
  | "search_api"
  | "manual";

export type ResearchSourceChecked = {
  sourceType: ResearchSourceType;
  sourceName: string;
  sourceUrl?: string;
  status: ResearchSourceStatus;
  summary: string;
};

export type ProviderResearchStatus =
  | "not_started"
  | "researching"
  | "completed"
  | "failed";

export type ProviderResearch = {
  researchStatus: ProviderResearchStatus;
  sourcesChecked: ResearchSourceChecked[];
  reputationSignals: string[];
  reviewHighlights: string[];
  insuranceSignals: string[];
  accessSignals: string[];
  redFlags: string[];
  confidenceScore: number;
  matchScore: number;
  webResearchSummary: string;
  lastResearchedAt: string;
  confirmationSource: ProviderResearchConfirmationSource;
};

export type UserResearchContext = {
  symptoms: string;
  zip: string;
  insurance: string;
};
