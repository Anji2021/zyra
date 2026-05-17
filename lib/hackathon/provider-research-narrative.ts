/**
 * Agentic “web research” microcopy for demo providers in Hackathon / Zyra Agent flow.
 * Not clinical claims — narrative trust signals for judges and demos.
 */

export type ProviderResearchNarrative = {
  providerId: string;
  /** Short lines shown during the Research stage (typing / agent feel). */
  signals: string[];
  /** “Why Zyra selected this provider” bullets for Match + Care Plan. */
  selectionRationale: string[];
};

export const DEMO_PROVIDER_RESEARCH: ProviderResearchNarrative[] = [
  {
    providerId: "prov_rivera",
    signals: [
      "Scanning public reviews for PCOS and irregular-cycle care…",
      "Cross-checking new-patient availability signals…",
    ],
    selectionRationale: [
      "Strong women’s health reviews mentioning PCOS care.",
      "Frequently recommended for irregular cycle evaluation.",
      "In-network with Blue Shield PPO.",
      "Shortest new-patient wait time nearby.",
    ],
  },
  {
    providerId: "prov_chen",
    signals: [
      "Evaluating reproductive endocrinology depth vs. your symptoms…",
      "Checking telehealth follow-up options…",
    ],
    selectionRationale: [
      "High-volume reproductive endocrinology practice with strong ratings.",
      "Offers hormone workup pathways aligned with your intake.",
      "In-network with Blue Shield PPO.",
      "Solid balance of distance and specialist depth.",
    ],
  },
  {
    providerId: "prov_okafor",
    signals: [
      "Searching for pelvic pain and endometriosis-focused programs…",
      "Noting out-of-network options with superbill patterns…",
    ],
    selectionRationale: [
      "Dedicated pelvic pain / endometriosis clinic profile.",
      "Second-opinion friendly for complex symptom stories.",
      "Out-of-network — Zyra flagged for transparency on cost.",
      "Worth comparing if in-network slots are waitlisted.",
    ],
  },
];

export function getResearchNarrativeForProvider(
  providerId: string,
): ProviderResearchNarrative | undefined {
  return DEMO_PROVIDER_RESEARCH.find((n) => n.providerId === providerId);
}
