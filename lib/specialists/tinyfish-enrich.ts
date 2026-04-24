import type { SpecialistEnrichment } from "@/lib/specialists/enrichment-types";

const TINYFISH_AGENT_RUN = "https://agent.tinyfish.ai/v1/automation/run";

const EXTRACTION_GOAL = `Visit this clinic/provider website and extract public information relevant to a women's health patient.
Return ONLY a single JSON object (no markdown fences, no commentary) with exactly these keys:
- "services_offered": array of short strings (services or programs mentioned; empty array if none)
- "topics": object with boolean values for keys: "pcos", "irregular_periods", "fertility", "gynecology", "hormone_care", "womens_health" (true only if clearly suggested on the site)
- "appointment_url": string, full URL if a booking or appointments page is found, otherwise ""
- "phone_listed": string, a phone number shown on the site if found, otherwise ""
- "summary": string, short patient-friendly summary (max ~200 words)
- "source_url": string, the canonical page URL you relied on most (usually the homepage or main site URL)

Keep values factual and concise. If uncertain, use false for topic booleans and empty strings for URLs/phone.`;

type AgentRunResponse = {
  status?: string;
  result?: unknown;
  error?: { message?: string; code?: string } | null;
};

function defaultTopics(): SpecialistEnrichment["topics"] {
  return {
    pcos: false,
    irregular_periods: false,
    fertility: false,
    gynecology: false,
    hormone_care: false,
    womens_health: false,
  };
}

function coerceEnrichment(raw: Record<string, unknown>, fallbackSourceUrl: string): SpecialistEnrichment {
  const services = Array.isArray(raw.services_offered)
    ? raw.services_offered.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const topicsRaw = raw.topics && typeof raw.topics === "object" && raw.topics !== null ? raw.topics : {};
  const t = topicsRaw as Record<string, unknown>;
  const topics = {
    ...defaultTopics(),
    pcos: Boolean(t.pcos),
    irregular_periods: Boolean(t.irregular_periods),
    fertility: Boolean(t.fertility),
    gynecology: Boolean(t.gynecology),
    hormone_care: Boolean(t.hormone_care),
    womens_health: Boolean(t.womens_health),
  };

  return {
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    services_offered: services,
    topics,
    appointment_url: typeof raw.appointment_url === "string" ? raw.appointment_url.trim() : "",
    phone_listed: typeof raw.phone_listed === "string" ? raw.phone_listed.trim() : "",
    source_url:
      typeof raw.source_url === "string" && raw.source_url.trim()
        ? raw.source_url.trim()
        : fallbackSourceUrl,
  };
}

function parseJsonFromAgentResult(result: unknown, fallbackSourceUrl: string): SpecialistEnrichment | null {
  if (result == null) return null;

  if (typeof result === "object" && !Array.isArray(result)) {
    try {
      return coerceEnrichment(result as Record<string, unknown>, fallbackSourceUrl);
    } catch {
      return null;
    }
  }

  if (typeof result === "string") {
    let s = result.trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(s);
    if (fence) s = fence[1].trim();
    try {
      const parsed = JSON.parse(s) as Record<string, unknown>;
      return coerceEnrichment(parsed, fallbackSourceUrl);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Runs Tinyfish Agent on the provider website and returns structured enrichment.
 */
export async function runTinyfishClinicEnrichment(websiteUrl: string): Promise<{
  ok: true;
  enrichment: SpecialistEnrichment;
} | { ok: false; error: string; logDetail?: string }> {
  const apiKey = process.env.TINYFISH_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "missing_key", logDetail: "TINYFISH_API_KEY is not set" };
  }

  let res: Response;
  try {
    res = await fetch(TINYFISH_AGENT_RUN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        url: websiteUrl,
        goal: EXTRACTION_GOAL,
        browser_profile: "lite",
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "network", logDetail: msg };
  }

  let json: AgentRunResponse;
  try {
    json = (await res.json()) as AgentRunResponse;
  } catch (e) {
    return { ok: false, error: "bad_response", logDetail: `HTTP ${res.status}` };
  }

  if (!res.ok) {
    const detail = JSON.stringify(json);
    return { ok: false, error: `http_${res.status}`, logDetail: detail };
  }

  if (json.status !== "COMPLETED") {
    const errMsg = json.error?.message ?? json.status ?? "unknown";
    return { ok: false, error: "agent_failed", logDetail: errMsg };
  }

  const parsed = parseJsonFromAgentResult(json.result, websiteUrl);
  if (!parsed || !parsed.summary) {
    return {
      ok: false,
      error: "parse_failed",
      logDetail: typeof json.result === "string" ? json.result.slice(0, 500) : JSON.stringify(json.result).slice(0, 500),
    };
  }

  return { ok: true, enrichment: parsed };
}
