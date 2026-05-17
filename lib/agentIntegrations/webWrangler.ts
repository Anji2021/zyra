/**
 * Web Wrangler — provider web research layer (hackathon / demo).
 *
 * Placeholder async functions return structured mock data. Replace with sponsor
 * APIs (Browser Use, Moss, insurer directories, model summarization, Supermemory)
 * during integration — no secrets or API keys here.
 */

import type { DemoProvider } from "@/lib/demoData";
import type {
  ProviderResearch,
  UserResearchContext,
} from "@/lib/hackathon/provider-research-types";

const MOCK_DELAY_MS = 280;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Demo-only ISO timestamp string */
function demoTimestamp(): string {
  return new Date("2026-05-15T12:00:00-07:00").toISOString();
}

function baseSources(
  clinicLabel: string,
  phase: "partial" | "full",
): ProviderResearch["sourcesChecked"] {
  const checked: ProviderResearch["sourcesChecked"] = [
    {
      sourceType: "google",
      sourceName: "Care context scan (demo)",
      status: "checked",
      summary: "Zyra gathered public signals tied to this clinic name and specialty.",
    },
    {
      sourceType: "clinic_website",
      sourceName: `${clinicLabel} — public pages`,
      status: phase === "full" ? "checked" : "pending",
      summary:
        phase === "full"
          ? "Zyra reviewed services and new-patient cues from public site copy (demo)."
          : "Clinic website pass queued in this simulation.",
    },
    {
      sourceType: "review_site",
      sourceName: "Patient feedback corpus (demo)",
      status: phase === "full" ? "checked" : "pending",
      summary:
        phase === "full"
          ? "Review themes weighted for symptom fit — not a clinical endorsement."
          : "Review signals still aggregating in this pass.",
    },
    {
      sourceType: "insurance_directory",
      sourceName: "Plan directory (demo)",
      status: phase === "full" ? "checked" : "pending",
      summary:
        phase === "full"
          ? "In-network clues from demo plan rules — confirm with carrier when APIs connect."
          : "Insurance clues pending.",
    },
  ];
  if (phase === "full") {
    checked.push({
      sourceType: "hospital_profile",
      sourceName: "Affiliation / profile pages (demo)",
      status: "checked",
      summary: "Cross-checked public affiliation blurbs for consistency.",
    });
  }
  return checked;
}

/**
 * Synchronous mock builder for demo providers (deterministic).
 * Used for Match / Approve cards and ranked lists without awaiting.
 */
export function buildMockProviderResearch(
  provider: DemoProvider,
  ctx: UserResearchContext,
  phase: "partial" | "full" = "full",
): ProviderResearch {
  const ins = ctx.insurance.trim() || "Blue Shield PPO";
  const sym = ctx.symptoms.trim() || "Irregular cycles and pelvic pain";

  if (provider.id === "prov_rivera") {
    return {
      researchStatus: phase === "full" ? "completed" : "researching",
      sourcesChecked: baseSources(provider.clinic, phase),
      reputationSignals: [
        "Strong review signals for irregular cycles and PCOS-adjacent care (demo corpus).",
        "Clinic public copy references reproductive wellness and gynecology (demo).",
      ],
      reviewHighlights: [
        "Patients often mention thorough follow-up on hormonal concerns (demo).",
      ],
      insuranceSignals: [
        `Likely in-network estimate for ${ins} — demo only; confirm when directory APIs connect.`,
      ],
      accessSignals: [
        "Access likelihood: high — demo calendar shows new-patient window this week.",
      ],
      redFlags: [],
      confidenceScore: phase === "full" ? 88 : 72,
      matchScore: phase === "full" ? 92 : 84,
      webResearchSummary:
        "Zyra researched strong women’s health review signals, likely in-network clues for your plan, and the shortest demo access window for your symptoms — not a clinical recommendation.",
      lastResearchedAt: demoTimestamp(),
      confirmationSource: "demo",
    };
  }

  if (provider.id === "prov_chen") {
    return {
      researchStatus: phase === "full" ? "completed" : "researching",
      sourcesChecked: baseSources(provider.clinic, phase),
      reputationSignals: [
        "Strong hormonal-care focus in public positioning (demo).",
        "Review signals highlight listening and follow-up (demo snippets).",
      ],
      reviewHighlights: [
        "Telehealth follow-up options noted on public pages (demo).",
      ],
      insuranceSignals: [
        `In-network clues favorable for ${ins} in this demo scenario.`,
      ],
      accessSignals: [
        "Access likelihood: moderate — slightly longer wait vs top pick in demo data.",
      ],
      redFlags: [],
      confidenceScore: phase === "full" ? 82 : 68,
      matchScore: phase === "full" ? 86 : 80,
      webResearchSummary:
        "Zyra researched hormonal-care depth and solid review signals; access is good but a touch longer than the top-ranked option in this demo.",
      lastResearchedAt: demoTimestamp(),
      confirmationSource: "demo",
    };
  }

  if (provider.id === "prov_okafor") {
    return {
      researchStatus: phase === "full" ? "completed" : "researching",
      sourcesChecked: baseSources(provider.clinic, phase),
      reputationSignals: [
        "Pelvic pain specialization signals in public materials (demo).",
      ],
      reviewHighlights: [
        "Second-opinion framing appears in patient-facing copy (demo).",
      ],
      insuranceSignals: [
        "Potential out-of-network estimate in demo rules — superbill path noted.",
      ],
      accessSignals: [
        "Access likelihood: mixed — fewer near-term demo slots than top picks.",
      ],
      redFlags: [
        "Insurance network status needs confirmation before outreach (demo).",
      ],
      confidenceScore: phase === "full" ? 70 : 58,
      matchScore: phase === "full" ? 78 : 72,
      webResearchSummary:
        "Zyra researched pelvic-pain-focused signals and found helpful access clues, but insurance fit is less certain in this demo — worth supervisor review before outreach.",
      lastResearchedAt: demoTimestamp(),
      confirmationSource: "demo",
    };
  }

  return {
    researchStatus: phase === "full" ? "completed" : "researching",
    sourcesChecked: baseSources(provider.clinic, phase),
    reputationSignals: [
      `Public signals scanned for relevance to: ${sym.slice(0, 80)}${sym.length > 80 ? "…" : ""} (demo).`,
    ],
    reviewHighlights: ["Limited demo highlights — expand when search APIs connect."],
    insuranceSignals: [`Plan context: ${ins} (demo estimate only).`],
    accessSignals: ["Access likelihood estimated from demo availability only."],
    redFlags: [],
    confidenceScore: 65,
    matchScore: 70,
    webResearchSummary:
      "Zyra researched available demo signals for this provider; sponsor APIs will deepen coverage.",
    lastResearchedAt: demoTimestamp(),
    confirmationSource: "demo",
  };
}

export function getRankedProvidersWithDemoResearch(
  providers: readonly DemoProvider[],
  ctx: UserResearchContext,
): DemoProvider[] {
  const enriched = providers.map((p) => ({
    ...p,
    providerResearch: buildMockProviderResearch(p, ctx, "full"),
  }));
  return [...enriched].sort(
    (a, b) =>
      (b.providerResearch?.matchScore ?? 0) - (a.providerResearch?.matchScore ?? 0),
  );
}

// --- Placeholder async integrations (sponsor API stubs) ---

/**
 * TODO: Replace with Browser Use API for website navigation.
 * TODO: Replace with Moss for real-time semantic retrieval.
 * TODO: Replace with Supermemory for persistent provider/user context.
 * TODO: Replace with model API for final reasoning summary.
 */
export async function researchProviderWebPresence(
  provider: DemoProvider,
  userContext: UserResearchContext,
): Promise<ProviderResearch> {
  await sleep(MOCK_DELAY_MS);
  return buildMockProviderResearch(provider, userContext, "full");
}

/** TODO: Replace with Browser Use API for website navigation. */
export async function scanClinicWebsite(
  provider: DemoProvider,
): Promise<Pick<ProviderResearch, "sourcesChecked">> {
  await sleep(120);
  const site = provider.clinic;
  return {
    sourcesChecked: [
      {
        sourceType: "clinic_website",
        sourceName: `${site} — public pages`,
        status: "checked",
        summary: "Demo pass over public scheduling and services copy (placeholder).",
      },
    ],
  };
}

/** TODO: Replace with Moss for real-time semantic retrieval. */
export async function searchProviderReputation(
  provider: DemoProvider,
  symptoms: string,
): Promise<Pick<ProviderResearch, "reputationSignals" | "reviewHighlights">> {
  await sleep(120);
  const r = buildMockProviderResearch(provider, {
    symptoms,
    zip: "",
    insurance: "",
  });
  return {
    reputationSignals: r.reputationSignals,
    reviewHighlights: r.reviewHighlights,
  };
}

/** TODO: Replace with insurer / provider directory browsing when APIs exist. */
export async function checkInsuranceDirectory(
  provider: DemoProvider,
  insurance: string,
): Promise<Pick<ProviderResearch, "insuranceSignals">> {
  await sleep(120);
  const r = buildMockProviderResearch(provider, {
    symptoms: "",
    zip: "",
    insurance,
  });
  return { insuranceSignals: r.insuranceSignals };
}

/** TODO: Replace with model API for final reasoning summary. */
export async function summarizeProviderResearch(
  providerResearch: ProviderResearch,
): Promise<string> {
  await sleep(80);
  return providerResearch.webResearchSummary;
}

/**
 * TODO: Replace with model-assisted ranking when reasoning API is wired.
 * Returns providers with `providerResearch` attached and sorted by matchScore.
 */
export async function rankProvidersWithResearch(
  providers: readonly DemoProvider[],
  userContext: UserResearchContext,
): Promise<DemoProvider[]> {
  await sleep(MOCK_DELAY_MS);
  return getRankedProvidersWithDemoResearch(providers, userContext);
}
