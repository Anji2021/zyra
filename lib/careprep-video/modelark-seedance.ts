import {
  carePrepVideoDemoFallbackResponse,
  formatCarePrepVideoTaskMessage,
  type CarePrepVideoGenerationResponse,
} from "@zyra/shared";

/** BytePlus ModelArk — Seedance text-to-video (confirmed Discord / docs). */
export const DEFAULT_SEEDANCE_BASE_URL = "https://ark.ap-southeast.bytepluses.com";
export const DEFAULT_SEEDANCE_GENERATE_PATH = "/api/v3/contents/generations/tasks";
export const DEFAULT_SEEDANCE_MODEL_ID = "dreamina-seedance-2-0-260128";

/** @deprecated Use `DEFAULT_SEEDANCE_BASE_URL` + `DEFAULT_SEEDANCE_GENERATE_PATH` or `resolveSeedanceTasksEndpoint()`. */
export const DEFAULT_SEEDANCE_API_BASE = `${DEFAULT_SEEDANCE_BASE_URL}/api/v3`;

/** @deprecated Use `DEFAULT_SEEDANCE_MODEL_ID` or `getSeedanceModelId()`. */
export const DEFAULT_SEEDANCE_MODEL = DEFAULT_SEEDANCE_MODEL_ID;

export const MODELARK_VIDEO_TASKS_PATH = "/api/v3/contents/generations/tasks";

/** Full URL for POST (create) and GET …/{taskId} (poll). */
export function resolveSeedanceTasksEndpoint(): string {
  const baseUrl = process.env.SEEDANCE_BASE_URL?.trim();
  const genPath = process.env.SEEDANCE_GENERATE_PATH?.trim();
  if (baseUrl || genPath) {
    const b = (baseUrl || DEFAULT_SEEDANCE_BASE_URL).replace(/\/+$/, "");
    const p = genPath || DEFAULT_SEEDANCE_GENERATE_PATH;
    const pathPart = p.startsWith("/") ? p : `/${p}`;
    return `${b}${pathPart}`;
  }
  const legacy = process.env.SEEDANCE_API_BASE_URL?.trim();
  if (legacy) {
    return `${legacy.replace(/\/+$/, "")}/contents/generations/tasks`;
  }
  return `${DEFAULT_SEEDANCE_BASE_URL}${DEFAULT_SEEDANCE_GENERATE_PATH}`;
}

export function getSeedanceModelId(): string {
  return (
    process.env.SEEDANCE_MODEL_ID?.trim() ||
    process.env.SEEDANCE_MODEL?.trim() ||
    DEFAULT_SEEDANCE_MODEL_ID
  );
}

function getSeedanceRequestDuration(): number {
  const raw =
    process.env.SEEDANCE_DURATION?.trim() ||
    process.env.SEEDANCE_DURATION_SECONDS?.trim() ||
    process.env.SEEDANCE_PROMPT_DURATION?.trim() ||
    "4";
  const n = parseInt(raw.replace(/\D/g, "") || "4", 10);
  return Number.isFinite(n) ? Math.min(30, Math.max(1, n)) : 4;
}

function getSeedanceRatio(): string {
  return process.env.SEEDANCE_RATIO?.trim() || "16:9";
}

export function buildSeedanceCarePrepPrompt(input: {
  title: string;
  narration: string;
  visualPrompt: string;
  checklist: string[];
}): string {
  const checklistLine = input.checklist.slice(0, 8).join("; ");

  return [
    "Zyra women's health companion — strictly educational preparation for talking with a clinician.",
    "NOT medical advice. NO diagnosis. NO graphic medical imagery. NO realistic human bodies or anatomy.",
    "Supportive, calm tone. Visuals: abstract motion only — cream/blush gradients, soft icons, typography, particles.",
    "Scope: brief abstract motion suitable for a short clip.",
    "",
    `Narration / pacing reference (ambient educational voiceover optional): ${input.narration}`,
    "",
    `Visual motion brief: ${input.visualPrompt}`,
    "",
    `Decorative title motif only (no claims): ${input.title}`,
    checklistLine ? `Abstract checklist motifs only — no diagrams or anatomy: ${checklistLine}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Safe client-visible summary: HTTP status + JSON message or raw body (max ~500 chars total). */
export function formatSeedanceHttpErrorDetail(
  httpStatus: number,
  json: Record<string, unknown> | null,
  bodySnippet: string,
): string {
  let extracted = "";
  if (json) {
    const top = json.message ?? json.msg ?? json.error_msg ?? json.error_message;
    if (typeof top === "string") extracted = top;
    else if (top && typeof top === "object") {
      const e = top as Record<string, unknown>;
      const inner = e.message ?? e.msg ?? e.detail ?? e.reason;
      if (typeof inner === "string") extracted = inner;
    }
    if (!extracted && typeof json.error === "string") extracted = json.error;
  }
  const fallback = bodySnippet.trim().slice(0, 500);
  const core = (extracted.trim() || fallback || "(empty response body)").replace(/\s+/g, " ").trim();
  const line = `HTTP ${httpStatus}: ${core}`;
  return line.length > 520 ? `${line.slice(0, 517)}…` : line;
}

/** Normalize BytePlus poll JSON → task payload (`data` or root). */
function seedancePollData(response: Record<string, unknown>): Record<string, unknown> {
  const d = response.data;
  if (d != null && typeof d === "object" && !Array.isArray(d)) {
    return d as Record<string, unknown>;
  }
  return response;
}

function coalesceUrl(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const t = c.trim();
    if (t.length > 0) return t;
  }
  return null;
}

/**
 * Canonical paths from Seedance GET /api/v3/contents/generations/tasks/{task_id}.
 * Mirrors: data.output.video.url | video_url | url | output[0].url | result.video (string or .url).
 */
export function extractSeedanceVideoUrlFromPollBody(response: Record<string, unknown>): string | null {
  const data = seedancePollData(response);
  const output = data.output;

  let videoUrl: string | null = null;

  if (output != null && typeof output === "object" && !Array.isArray(output)) {
    const o = output as Record<string, unknown>;
    const vid = o.video;
    if (vid != null && typeof vid === "object" && !Array.isArray(vid)) {
      videoUrl = coalesceUrl((vid as Record<string, unknown>).url);
    }
    if (!videoUrl) videoUrl = coalesceUrl(o.video_url, o.url);
  }

  if (!videoUrl && Array.isArray(output) && output[0] != null && typeof output[0] === "object") {
    videoUrl = coalesceUrl((output[0] as Record<string, unknown>).url);
  }

  if (!videoUrl && data.result != null && typeof data.result === "object") {
    const r = data.result as Record<string, unknown>;
    videoUrl = coalesceUrl(r.video);
    if (!videoUrl && r.video != null && typeof r.video === "object" && !Array.isArray(r.video)) {
      videoUrl = coalesceUrl((r.video as Record<string, unknown>).url);
    }
  }

  return videoUrl;
}

function extractTaskError(task: Record<string, unknown>): string {
  const err = task.error;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const msg = e.message ?? e.msg ?? e.detail;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (typeof task.failure_reason === "string" && task.failure_reason.trim()) {
    return task.failure_reason.trim();
  }
  return "Video generation failed.";
}

/** Map Seedance GET task JSON → CarePrep status (only `completed` when status is succeeded-like AND URL present). */
export function mapSeedancePollJsonToCarePrepResponse(
  rootJson: Record<string, unknown>,
  taskId: string,
): CarePrepVideoGenerationResponse {
  const data = seedancePollData(rootJson);
  const rawStatus = String(data.status ?? rootJson.status ?? "").toLowerCase();

  const isFailed =
    rawStatus === "failed" ||
    rawStatus === "error" ||
    rawStatus === "cancelled" ||
    rawStatus === "canceled";

  if (isFailed) {
    return {
      status: "failed",
      videoUrl: "",
      jobId: taskId,
      message: extractTaskError(data),
    };
  }

  const succeeded =
    rawStatus === "succeeded" || rawStatus === "success" || rawStatus === "completed";

  const videoUrl = extractSeedanceVideoUrlFromPollBody(rootJson)?.trim() ?? "";

  if (succeeded) {
    if (videoUrl) {
      return { status: "completed", videoUrl, jobId: taskId, message: "Ready." };
    }
    console.error("[seedance] No video URL found");
    return {
      status: "processing",
      videoUrl: "",
      jobId: taskId,
      message: formatCarePrepVideoTaskMessage(taskId),
    };
  }

  return {
    status: "processing",
    videoUrl: "",
    jobId: taskId,
    message: formatCarePrepVideoTaskMessage(taskId),
  };
}

type ArkFetchResult = {
  ok: boolean;
  status: number;
  json: Record<string, unknown> | null;
  bodySnippet: string;
};

async function arkFetchContents(url: string, apiKey: string, init?: RequestInit): Promise<ArkFetchResult> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers as Record<string, string>),
    },
  });
  const rawText = await res.text();
  const bodySnippet = rawText.replace(/\s+/g, " ").trim().slice(0, 500);
  let json: Record<string, unknown> | null = null;
  if (rawText.trim()) {
    try {
      const p = JSON.parse(rawText) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) json = p as Record<string, unknown>;
    } catch {
      json = null;
    }
  }
  return { ok: res.ok, status: res.status, json, bodySnippet };
}

function extractCreateTaskId(json: Record<string, unknown>): string {
  const data = json.data;
  const fromData = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>).id : undefined;
  const id = json.id ?? json.task_id ?? fromData;
  return typeof id === "string" ? id.trim() : "";
}

export async function modelArkCreateVideoTask(params: {
  apiKey: string;
  model: string;
  prompt: string;
  duration?: number;
  ratio?: string;
  generateAudio?: boolean;
}): Promise<{ taskId: string | null; error: string | null }> {
  const url = resolveSeedanceTasksEndpoint();
  const duration = params.duration ?? getSeedanceRequestDuration();
  const ratio = params.ratio ?? getSeedanceRatio();
  const r = await arkFetchContents(url, params.apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      content: [{ type: "text", text: params.prompt }],
      generate_audio: params.generateAudio ?? false,
      ratio,
      duration,
    }),
  });

  if (!r.ok) {
    return { taskId: null, error: formatSeedanceHttpErrorDetail(r.status, r.json, r.bodySnippet) };
  }

  if (!r.json) {
    return {
      taskId: null,
      error: formatSeedanceHttpErrorDetail(r.status, null, r.bodySnippet || "(invalid JSON body)"),
    };
  }

  const taskId = extractCreateTaskId(r.json);
  if (!taskId) {
    return {
      taskId: null,
      error: formatSeedanceHttpErrorDetail(r.status, r.json, r.bodySnippet || "Missing id in response."),
    };
  }
  return { taskId, error: null };
}

export async function modelArkGetVideoTask(params: {
  apiKey: string;
  taskId: string;
}): Promise<ArkFetchResult> {
  const base = resolveSeedanceTasksEndpoint().replace(/\/+$/, "");
  const url = `${base}/${encodeURIComponent(params.taskId)}`;
  return arkFetchContents(url, params.apiKey, { method: "GET" });
}

/**
 * Single GET …/tasks/{task_id}. Callers (e.g. status route) log
 * `[seedance] FULL RESPONSE:` with `rawJson`.
 */
export async function getSeedanceTaskPollSnapshot(taskId: string): Promise<{
  rawJson: Record<string, unknown> | null;
  mapped: CarePrepVideoGenerationResponse;
}> {
  const apiKey = process.env.SEEDANCE_API_KEY?.trim();
  if (!apiKey) {
    return { rawJson: null, mapped: carePrepVideoDemoFallbackResponse() };
  }

  const got = await modelArkGetVideoTask({ apiKey, taskId });

  if (!got.ok || got.json == null) {
    const msg = formatSeedanceHttpErrorDetail(got.status, got.json, got.bodySnippet);
    console.error("[careprep-video] Seedance poll GET failed:", msg);
    return {
      rawJson: got.json,
      mapped: {
        status: "failed",
        videoUrl: "",
        jobId: taskId,
        message: msg,
      },
    };
  }

  return { rawJson: got.json, mapped: mapSeedancePollJsonToCarePrepResponse(got.json, taskId) };
}

export async function resolveCarePrepVideoJobStatus(taskId: string): Promise<CarePrepVideoGenerationResponse> {
  return (await getSeedanceTaskPollSnapshot(taskId)).mapped;
}
