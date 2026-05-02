/**
 * Optional Butterbase demo logging for CarePrep (hackathon).
 * See https://docs.butterbase.ai/api-reference/data-api/
 */

export type CarePrepButterbasePayload = {
  symptoms: string;
  pattern: string;
  specialist: string;
  title: string;
  narration: string;
  visualPrompt: string;
  checklist: string[];
  videoStatus: string;
  videoUrl: string;
  createdAt: string;
};

export function isButterbaseConfigured(): boolean {
  const key = process.env.BUTTERBASE_API_KEY?.trim();
  const base = process.env.BUTTERBASE_BASE_URL?.trim();
  return Boolean(key && base);
}

/** Validates JSON POST body for `/api/careprep/butterbase`. */
export function parseCarePrepButterbasePayload(data: unknown): CarePrepButterbasePayload | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;

  const checklistRaw = o.checklist;
  if (!Array.isArray(checklistRaw)) return null;
  const checklist = checklistRaw.map((x) => String(x).trim()).filter(Boolean);

  const req = (key: string) => (typeof o[key] === "string" ? String(o[key]).trim() : "");
  const title = req("title");
  const narration = req("narration");
  const visualPrompt = req("visualPrompt");
  const videoStatus = req("videoStatus");
  if (!title || !narration || !visualPrompt || !videoStatus) return null;

  const createdAt = req("createdAt") || new Date().toISOString();

  return {
    symptoms: typeof o.symptoms === "string" ? o.symptoms : "",
    pattern: typeof o.pattern === "string" ? o.pattern : "",
    specialist: typeof o.specialist === "string" ? o.specialist : "",
    title,
    narration,
    visualPrompt,
    checklist,
    videoStatus,
    videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : "",
    createdAt,
  };
}

/**
 * POST row to Butterbase Data API: `{BASE_URL}/{table}` with Bearer API key.
 * `BUTTERBASE_BASE_URL` should include `/v1/{app_id}` (no trailing slash).
 */
export async function saveCarePrepToButterbase(payload: CarePrepButterbasePayload): Promise<boolean> {
  if (!isButterbaseConfigured()) return false;

  const apiKey = process.env.BUTTERBASE_API_KEY!.trim();
  const baseUrl = process.env.BUTTERBASE_BASE_URL!.trim().replace(/\/+$/, "");
  const tableRaw = process.env.BUTTERBASE_TABLE?.trim() || "care_prep_demo";
  const table = tableRaw.replace(/^\/+|\/+$/g, "");

  const url = `${baseUrl}/${table}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("[butterbase] CarePrep demo storage failed:", res.status);
      return false;
    }

    return true;
  } catch {
    console.warn("[butterbase] CarePrep demo storage request failed");
    return false;
  }
}
