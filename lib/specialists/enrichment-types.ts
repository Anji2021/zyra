/** Structured clinic summary from Tinyfish Agent (best-effort parse). */
export type SpecialistEnrichment = {
  summary: string;
  services_offered: string[];
  topics: {
    pcos: boolean;
    irregular_periods: boolean;
    fertility: boolean;
    gynecology: boolean;
    hormone_care: boolean;
    womens_health: boolean;
  };
  appointment_url: string;
  phone_listed: string;
  source_url: string;
};

export const NO_WEBSITE_MESSAGE =
  "No clinic website was found for this provider yet.";

export const ENRICHMENT_FAILED_MESSAGE =
  "Zyra could not analyze this website right now. Please try again later.";

export const ENRICHMENT_DISCLAIMER =
  "This summary is based on publicly available website information and may be incomplete. Please confirm details directly with the provider.";
