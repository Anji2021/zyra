import type { CarePrepVideoGenerationResponse } from "@zyra/shared";

export const DEFAULT_IMAROUTER_BASE = "https://api.imarouter.com";

/** Docs: prompt must stay under 800 characters (use 799 max after trim). */
const IMAROUTER_PROMPT_MAX_CHARS = 799;

/** HappyHorse text-to-video defaults per ImaRouter docs (model override via env). */
export const IMAROUTER_HAPPYHORSE_MODEL = "happyhorse-1.0-t2v";

/** Safe single-line-ish message for API responses (no secrets). */
export function formatImaRouterErrorMessage(httpStatus: number, bodyHead: string): string {
  const short = bodyHead.replace(/\s+/g, " ").trim().slice(0, 160);
  return short ? `ImaRouter error: ${httpStatus} ${short}` : `ImaRouter error: ${httpStatus}`;
}

/** Model-access / entitlement errors → UI shows preview only (no technical line). */
export function shouldSuppressImaRouterUserMessage(bodySnippet: string): boolean {
  const t = bodySnippet.toLowerCase();
  const needles = [
    "model access",
    "access to model",
    "model_not_found",
    "model not found",
    "no access",
    "permission denied",
    "not authorized",
    "unauthorized",
    "subscription required",
    "quota",
    "billing",
    "entitlement",
    "not entitled",
    "forbidden",
    "payment required",
    "insufficient",
  ];
  return needles.some((n) => t.includes(n));
}

export function clampImaRouterPrompt(prompt: string): string {
  const t = prompt.trim();
  if (t.length <= IMAROUTER_PROMPT_MAX_CHARS) return t;
  return t.slice(0, IMAROUTER_PROMPT_MAX_CHARS).trimEnd();
}

/** Simple text-to-video prompt: title + narration + visual direction only (then clamped). */
export function buildImaRouterCarePrepPrompt(input: {
  title: string;
  narration: string;
  visualPrompt: string;
}): string {
  const raw = [input.title, input.narration, input.visualPrompt].filter((s) => s.trim().length > 0).join("\n\n");
  return clampImaRouterPrompt(raw);
}

function normalizeJobStatus(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const o = json as Record<string, unknown>;
  const nested = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  return String(o.status ?? o.state ?? nested?.status ?? "").toLowerCase().trim();
}

/** Docs: completed jobs expose URL at results[0].url */
function extractResultsFirstUrl(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const nested = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  const results =
    (Array.isArray(o.results) ? o.results : null) ??
    (nested && Array.isArray(nested.results) ? nested.results : null);
  if (!results?.length || typeof results[0] !== "object" || results[0] === null) return null;
  const r0 = results[0] as Record<string, unknown>;
  const u = r0.url;
  return typeof u === "string" && u.trim() ? u.trim() : null;
}

function extractImaRouterJobId(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const nested = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  const candidates = [o.task_id, o.taskId, o.id, nested?.task_id, nested?.taskId, nested?.id];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

/** Legacy/alternate shapes (never send images — URL fields only). */
function extractImaRouterVideoUrl(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const nested = o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>) : null;
  const candidates = [o.video_url, o.videoUrl, o.url, o.output_url, nested?.video_url, nested?.videoUrl, nested?.url];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

function failMessage(res: Response, text: string): string {
  const head = text.slice(0, 500);
  return shouldSuppressImaRouterUserMessage(head) ? "" : formatImaRouterErrorMessage(res.status, head);
}

export type ImaRouterCreateFailDetail = {
  requestUrl: string;
  httpStatus: number;
  /** First 500 chars of response body (safe logging / short user-facing snippet). */
  bodyHead: string;
};

export type ImaRouterCreateResult =
  | { kind: "success"; response: CarePrepVideoGenerationResponse }
  | { kind: "processing"; response: CarePrepVideoGenerationResponse }
  | { kind: "fail"; detail?: ImaRouterCreateFailDetail };

/**
 * POST /v1/videos — HappyHorse t2v only: model, prompt, duration, size, aspect_ratio (no images/media).
 */
export async function createImaRouterCarePrepVideo(params: {
  base: string;
  apiKey: string;
  model: string;
  title: string;
  narration: string;
  visualPrompt: string;
}): Promise<ImaRouterCreateResult> {
  const { base, apiKey, model } = params;
  const prompt = buildImaRouterCarePrepPrompt({
    title: params.title,
    narration: params.narration,
    visualPrompt: params.visualPrompt,
  });

  const url = `${base.replace(/\/+$/, "")}/v1/videos`;

  const fail = (res: Response | null, text: string): ImaRouterCreateResult => ({
    kind: "fail",
    detail: {
      requestUrl: url,
      httpStatus: res?.status ?? 0,
      bodyHead: text.slice(0, 500),
    },
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        duration: 8,
        size: "720P",
        aspect_ratio: "16:9",
      }),
    });

    const text = await res.text();

    let json: unknown;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      return fail(res, text);
    }

    if (!res.ok) {
      return fail(res, text);
    }

    const statusNorm = normalizeJobStatus(json);
    const completedUrl =
      statusNorm === "completed"
        ? extractResultsFirstUrl(json) ?? extractImaRouterVideoUrl(json)
        : extractImaRouterVideoUrl(json);

    if (completedUrl) {
      const jobId = extractImaRouterJobId(json) ?? "";
      return {
        kind: "success",
        response: {
          status: "success",
          videoUrl: completedUrl,
          jobId,
          message: "",
          provider: "imarouter",
        },
      };
    }

    const jobId = extractImaRouterJobId(json);
    if (jobId) {
      return {
        kind: "processing",
        response: {
          status: "processing",
          videoUrl: "",
          jobId,
          message: "ImaRouter video generation started.",
          provider: "imarouter",
        },
      };
    }

    return fail(res, text);
  } catch {
    return {
      kind: "fail",
      detail: { requestUrl: url, httpStatus: 0, bodyHead: "(network error)" },
    };
  }
}

/** GET /v1/videos/{task_id} — completed → results[0].url */
export async function getImaRouterVideoStatus(params: {
  base: string;
  apiKey: string;
  jobId: string;
}): Promise<CarePrepVideoGenerationResponse> {
  const { base, apiKey, jobId } = params;
  const url = `${base.replace(/\/+$/, "")}/v1/videos/${encodeURIComponent(jobId)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    let json: unknown;
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      console.warn("[careprep-video] ImaRouter status: non-JSON, status", res.status);
      return {
        status: "failed",
        videoUrl: "",
        jobId,
        message: failMessage(res, text),
        provider: "imarouter",
      };
    }

    if (!res.ok) {
      console.warn("[careprep-video] ImaRouter status HTTP:", res.status);
      return {
        status: "failed",
        videoUrl: "",
        jobId,
        message: failMessage(res, text),
        provider: "imarouter",
      };
    }

    const statusNorm = normalizeJobStatus(json);

    if (statusNorm === "completed") {
      const videoUrl = extractResultsFirstUrl(json) ?? extractImaRouterVideoUrl(json);
      if (videoUrl) {
        return {
          status: "success",
          videoUrl,
          jobId,
          message: "",
          provider: "imarouter",
        };
      }
      return {
        status: "failed",
        videoUrl: "",
        jobId,
        message: "",
        provider: "imarouter",
      };
    }

    const legacyUrl = extractImaRouterVideoUrl(json);
    if (legacyUrl && (statusNorm === "success" || statusNorm === "succeeded" || statusNorm === "ready")) {
      return {
        status: "success",
        videoUrl: legacyUrl,
        jobId,
        message: "",
        provider: "imarouter",
      };
    }

    if (legacyUrl) {
      return {
        status: "success",
        videoUrl: legacyUrl,
        jobId,
        message: "",
        provider: "imarouter",
      };
    }

    if (statusNorm.includes("fail") || statusNorm === "error" || statusNorm === "cancelled") {
      return {
        status: "failed",
        videoUrl: "",
        jobId,
        message: failMessage(res, text),
        provider: "imarouter",
      };
    }

    return {
      status: "processing",
      videoUrl: "",
      jobId,
      message: "",
      provider: "imarouter",
    };
  } catch {
    console.warn("[careprep-video] ImaRouter status request error");
    return {
      status: "failed",
      videoUrl: "",
      jobId,
      message: formatImaRouterErrorMessage(0, "(network error)"),
      provider: "imarouter",
    };
  }
}
