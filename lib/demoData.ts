/**
 * Mock data for the hackathon demo flow.
 *
 * Used by the hackathon-only Zyra Agent flow and the public `/demo` route so
 * the experience is always deterministic during live judging — no API
 * dependency, no network flake. None of this replaces the real production
 * data layer; existing features keep using their existing queries.
 */

import type { ProviderResearch } from "@/lib/hackathon/provider-research-types";

export type DemoProvider = {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  distanceMiles: number;
  rating: number;
  reviewCount: number;
  acceptsNewPatients: boolean;
  nextAvailable: string;
  inNetwork: boolean;
  address: string;
  highlights: string[];
  /** Populated by Web Wrangler demo layer (`lib/agentIntegrations/webWrangler.ts`). */
  providerResearch?: ProviderResearch;
};

export type DemoOutreachResult = {
  providerId: string;
  status: "confirmed" | "waitlist" | "no_response";
  channel: "phone" | "portal" | "email";
  responseSummary: string;
  bookedAt: string | null;
};

export type DemoAvailability = {
  providerId: string;
  slots: Array<{ date: string; time: string; type: "in_person" | "telehealth" }>;
};

export type DemoInsuranceCheck = {
  providerId: string;
  planName: string;
  inNetwork: boolean;
  estimatedCopay: string;
  notes: string;
};

export type DemoCareSummary = {
  headline: string;
  recommendedNextStep: string;
  whatToBring: string[];
  questionsForClinician: string[];
};

export const DEMO_SYMPTOMS_PREFILL =
  "I have irregular cycles and pelvic pain.";

export const DEMO_ZIP_PREFILL = "94110";

export const DEMO_INSURANCE_PREFILL = "Blue Shield PPO";

export const DEMO_PROVIDERS: DemoProvider[] = [
  {
    id: "prov_rivera",
    name: "Dr. Maya Rivera, MD",
    specialty: "OB-GYN, PCOS focus",
    clinic: "Mission Women's Health",
    distanceMiles: 1.4,
    rating: 4.9,
    reviewCount: 312,
    acceptsNewPatients: true,
    nextAvailable: "Tue, May 19 · 9:40 AM",
    inNetwork: true,
    address: "1840 Mission St, San Francisco, CA",
    highlights: [
      "PCOS and irregular cycle specialist",
      "Same-week availability",
      "In network for Blue Shield PPO",
    ],
  },
  {
    id: "prov_chen",
    name: "Dr. Priya Chen, DO",
    specialty: "Reproductive endocrinology",
    clinic: "Bay Area Hormone Health",
    distanceMiles: 2.7,
    rating: 4.8,
    reviewCount: 218,
    acceptsNewPatients: true,
    nextAvailable: "Thu, May 21 · 2:15 PM",
    inNetwork: true,
    address: "2100 Webster St, Suite 410, San Francisco, CA",
    highlights: [
      "Hormone panel + ultrasound on first visit",
      "Telehealth follow-ups available",
      "In network for Blue Shield PPO",
    ],
  },
  {
    id: "prov_okafor",
    name: "Dr. Aisha Okafor, MD",
    specialty: "Pelvic pain and endometriosis",
    clinic: "Bayview Pelvic Care",
    distanceMiles: 3.9,
    rating: 4.95,
    reviewCount: 184,
    acceptsNewPatients: true,
    nextAvailable: "Mon, May 25 · 11:00 AM",
    inNetwork: false,
    address: "3201 Cesar Chavez St, San Francisco, CA",
    highlights: [
      "Pelvic pain second-opinion clinic",
      "Out of network — superbill provided",
      "Average wait time under 2 weeks",
    ],
  },
];

export const DEMO_OUTREACH_RESULTS: DemoOutreachResult[] = [
  {
    providerId: "prov_rivera",
    status: "confirmed",
    channel: "phone",
    responseSummary:
      "Front desk confirmed Tue 9:40 AM. New-patient intake link sent to your email.",
    bookedAt: "2026-05-19T09:40:00-07:00",
  },
  {
    providerId: "prov_chen",
    status: "waitlist",
    channel: "portal",
    responseSummary:
      "Added to cancellation waitlist for this week; standing appointment Thu 2:15 PM held.",
    bookedAt: "2026-05-21T14:15:00-07:00",
  },
  {
    providerId: "prov_okafor",
    status: "no_response",
    channel: "email",
    responseSummary:
      "No response yet — Zyra will retry tomorrow morning and notify you.",
    bookedAt: null,
  },
];

export const DEMO_AVAILABILITY: DemoAvailability[] = [
  {
    providerId: "prov_rivera",
    slots: [
      { date: "Tue, May 19", time: "9:40 AM", type: "in_person" },
      { date: "Wed, May 20", time: "3:20 PM", type: "in_person" },
      { date: "Fri, May 22", time: "10:10 AM", type: "telehealth" },
    ],
  },
  {
    providerId: "prov_chen",
    slots: [
      { date: "Thu, May 21", time: "2:15 PM", type: "in_person" },
      { date: "Mon, May 25", time: "9:00 AM", type: "telehealth" },
    ],
  },
  {
    providerId: "prov_okafor",
    slots: [{ date: "Mon, May 25", time: "11:00 AM", type: "in_person" }],
  },
];

export const DEMO_INSURANCE_CHECKS: DemoInsuranceCheck[] = [
  {
    providerId: "prov_rivera",
    planName: "Blue Shield PPO",
    inNetwork: true,
    estimatedCopay: "$25 office visit",
    notes: "Lab work covered under preventive benefits.",
  },
  {
    providerId: "prov_chen",
    planName: "Blue Shield PPO",
    inNetwork: true,
    estimatedCopay: "$35 specialist visit",
    notes: "Prior auth not required for first consult.",
  },
  {
    providerId: "prov_okafor",
    planName: "Blue Shield PPO",
    inNetwork: false,
    estimatedCopay: "~$220 (out of network)",
    notes: "Superbill provided; ~60% reimbursable after deductible.",
  },
];

export const DEMO_CARE_SUMMARY: DemoCareSummary = {
  headline:
    "Two in-network specialists confirmed this week for irregular cycles and pelvic pain.",
  recommendedNextStep:
    "Start with Dr. Rivera on Tue, May 19 — she's the closest match and confirmed first.",
  whatToBring: [
    "Last 3 months of cycle tracking",
    "Photo ID and insurance card",
    "List of current medications and supplements",
  ],
  questionsForClinician: [
    "Could my cycle pattern point to PCOS, endometriosis, or something else?",
    "What labs and imaging would you order first?",
    "What pain management options are appropriate while we investigate?",
  ],
};

export function getDemoProviderById(
  id: string,
): DemoProvider | undefined {
  return DEMO_PROVIDERS.find((p) => p.id === id);
}
