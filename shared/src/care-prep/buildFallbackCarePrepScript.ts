import type { DoctorMatchRecommendation } from "../types";

export type CarePrepVideoFallback = {
  videoTitle: string;
  narrationScript: string;
  visualDirection: string;
  doctorVisitChecklist: string[];
};

function truncateSnippet(text: string, maxChars: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t.length) return "";
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

/** Local-only CarePrep script from existing DoctorMatch fields — no external APIs. Educational framing only. */
export function buildFallbackCarePrepScript(params: {
  symptomsText: string;
  recommendation: Pick<
    DoctorMatchRecommendation,
    "pattern" | "specialist" | "carePath" | "questionsToAsk" | "urgentCareWarning"
  >;
}): CarePrepVideoFallback {
  const { symptomsText, recommendation: r } = params;

  const symptomsSnippet =
    truncateSnippet(symptomsText, 140) || "symptoms you described in Zyra";

  let patternPlain = r.pattern?.trim() ?? "";
  patternPlain = patternPlain.replace(/^Possible pattern:\s*/i, "").trim();
  const patternSnippet = patternPlain ? truncateSnippet(patternPlain, 160) : "";

  const specialistLabel = truncateSnippet(r.specialist?.trim() || "your clinician", 48);

  const firstCare = r.carePath?.find((x) => String(x).trim()) ?? "";
  const firstQuestion = r.questionsToAsk?.find((x) => String(x).trim()) ?? "";

  const parts = [
    `You shared ${symptomsSnippet}.`,
    patternSnippet
      ? `Zyra surfaced a possible symptom pattern worth discussing with a clinician—not a diagnosis: ${patternSnippet}`
      : "",
    `DoctorMatch suggests exploring care with ${specialistLabel}.`,
    firstCare ? `One step you might mention is ${truncateSnippet(firstCare, 100)}.` : "",
    firstQuestion ? `Consider asking about ${truncateSnippet(firstQuestion, 100)}.` : "",
    `This narration is educational prep only and does not replace medical advice.`,
  ].filter(Boolean);

  let narrationScript = parts.join(" ");
  const words = narrationScript.split(/\s+/).filter(Boolean);
  if (words.length > 72) {
    narrationScript = `${words.slice(0, 68).join(" ")} …`;
  }

  const videoTitle = `Prepare for your ${specialistLabel} visit`;

  const doctorVisitChecklist = [
    ...(r.carePath ?? []).map((x) => String(x).trim()).filter(Boolean),
    ...(r.questionsToAsk ?? []).map((x) => String(x).trim()).filter(Boolean).map((q) => `Ask: ${q}`),
    ...(r.urgentCareWarning?.trim()
      ? [`If symptoms worsen: discuss urgent-care guidance from Zyra (${truncateSnippet(r.urgentCareWarning.trim(), 180)})`]
      : []),
  ].slice(0, 12);

  return {
    videoTitle,
    narrationScript,
    visualDirection:
      "Soft educational women’s-health video: calming cream and blush palette, gentle transitions, abstract icons—no graphic anatomy. Supportive tone; informational only, not diagnostic.",
    doctorVisitChecklist,
  };
}

/** JSON shape returned by POST /api/careprep-script (Groq generation with local fallback). */
export type CarePrepScriptAiJson = {
  title: string;
  narration: string;
  visualPrompt: string;
  checklist: string[];
};

/** Validates `/api/careprep-script` JSON for client-side use. */
export function parseCarePrepAiJsonResponse(data: unknown): CarePrepScriptAiJson | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (
    typeof o.title !== "string" ||
    typeof o.narration !== "string" ||
    typeof o.visualPrompt !== "string" ||
    !Array.isArray(o.checklist)
  ) {
    return null;
  }
  const checklist = o.checklist.map((x) => String(x).trim()).filter(Boolean);
  const title = o.title.trim();
  const narration = o.narration.trim();
  const visualPrompt = o.visualPrompt.trim();
  if (!title || !narration || !visualPrompt || checklist.length === 0) return null;
  return { title, narration, visualPrompt, checklist };
}

export function mapCarePrepAiJsonToFallback(ai: CarePrepScriptAiJson): CarePrepVideoFallback {
  return {
    videoTitle: ai.title.trim(),
    narrationScript: ai.narration.trim(),
    visualDirection: ai.visualPrompt.trim(),
    doctorVisitChecklist: ai.checklist.map((x) => String(x).trim()).filter(Boolean).slice(0, 12),
  };
}

export function buildCarePrepScriptRequestBody(params: {
  symptomsText: string;
  recommendation: Pick<
    DoctorMatchRecommendation,
    "pattern" | "specialist" | "carePath" | "questionsToAsk" | "urgentCareWarning"
  >;
}): {
  symptoms: string;
  pattern: string;
  specialist: string;
  carePath: string[];
  questionsToAsk: string[];
  urgentCareWarning: string;
} {
  const r = params.recommendation;
  return {
    symptoms: params.symptomsText.trim(),
    pattern: typeof r.pattern === "string" ? r.pattern : "",
    specialist: typeof r.specialist === "string" ? r.specialist : "",
    carePath: Array.isArray(r.carePath) ? r.carePath.map((x) => String(x)) : [],
    questionsToAsk: Array.isArray(r.questionsToAsk) ? r.questionsToAsk.map((x) => String(x)) : [],
    urgentCareWarning: typeof r.urgentCareWarning === "string" ? r.urgentCareWarning : "",
  };
}

const CARE_PREP_VIDEO_TASK_PREFIX = "TASK_ID:";

/** Embed task id for clients polling GET `/api/careprep-video?taskId=` or `/api/careprep-video/status?jobId=`. */
export function formatCarePrepVideoTaskMessage(taskId: string): string {
  return `${CARE_PREP_VIDEO_TASK_PREFIX}${taskId}`;
}

export function parseCarePrepVideoTaskIdFromMessage(message: string): string | null {
  const idx = message.indexOf(CARE_PREP_VIDEO_TASK_PREFIX);
  if (idx < 0) return null;
  const rest = message.slice(idx + CARE_PREP_VIDEO_TASK_PREFIX.length).trim();
  const token = rest.split(/\s/)[0];
  return token || null;
}

/** Video backend used for polling `/api/careprep-video/status?provider=` */
export type CarePrepVideoProvider = "imarouter" | "seedance";

/** JSON from POST/GET `/api/careprep-video` and GET `/api/careprep-video/status`. */
export type CarePrepVideoGenerationResponse = {
  /** Seedance / BytePlus uses `completed` when the asset URL is ready; ImaRouter uses `success`. */
  status: "success" | "completed" | "processing" | "failed";
  videoUrl: string;
  /** ModelArk task id while processing or after terminal states (may be empty). */
  jobId: string;
  message: string;
  provider?: CarePrepVideoProvider;
};

/** True when the client should render a `<video>` / `Video` player. */
export function isCarePrepVideoPlayable(res: CarePrepVideoGenerationResponse): boolean {
  const url = typeof res.videoUrl === "string" ? res.videoUrl.trim() : "";
  if (!url) return false;
  return res.status === "success" || res.status === "completed";
}

/** Server returns this `message` when Seedance is unavailable — client shows polished demo preview. */
export const CAREPREP_VIDEO_DEMO_FALLBACK_MESSAGE = "CAREPREP_VIDEO_DEMO_FALLBACK";

export function carePrepVideoDemoFallbackResponse(): CarePrepVideoGenerationResponse {
  return {
    status: "failed",
    videoUrl: "",
    jobId: "",
    message: CAREPREP_VIDEO_DEMO_FALLBACK_MESSAGE,
  };
}

export function isCarePrepVideoDemoFallbackResponse(res: CarePrepVideoGenerationResponse): boolean {
  return res.message === CAREPREP_VIDEO_DEMO_FALLBACK_MESSAGE;
}

export function parseCarePrepVideoGenerationResponse(data: unknown): CarePrepVideoGenerationResponse | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const status = o.status;
  if (
    status !== "success" &&
    status !== "completed" &&
    status !== "processing" &&
    status !== "failed"
  ) {
    return null;
  }
  const message = typeof o.message === "string" ? o.message : "";
  const jobIdRaw = o.jobId ?? o.job_id ?? o.task_id ?? o.id;
  let jobId = typeof jobIdRaw === "string" ? jobIdRaw.trim() : "";
  if (!jobId && message) {
    jobId = parseCarePrepVideoTaskIdFromMessage(message) ?? "";
  }
  const providerRaw = o.provider;
  const provider: CarePrepVideoProvider | undefined =
    providerRaw === "imarouter" || providerRaw === "seedance" ? providerRaw : undefined;

  const videoUrlRaw = o.videoUrl ?? o.video_url;
  const videoUrl = typeof videoUrlRaw === "string" ? videoUrlRaw : "";

  return {
    status,
    videoUrl,
    jobId,
    message,
    ...(provider ? { provider } : {}),
  };
}

/** Prefer explicit `jobId` from API; else parse `TASK_ID:` prefix from `message`. */
export function resolveCarePrepVideoJobId(res: CarePrepVideoGenerationResponse): string {
  if (res.jobId.trim()) return res.jobId.trim();
  return parseCarePrepVideoTaskIdFromMessage(res.message) ?? "";
}

/** Maps CarePrep script fields to POST `/api/careprep-video` body keys. */
export function carePrepFallbackToVideoRequestBody(
  script: CarePrepVideoFallback,
  matchContext?: {
    symptomsText?: string;
    pattern?: string;
    specialist?: string;
  },
): {
  title: string;
  narration: string;
  visualPrompt: string;
  checklist: string[];
  symptoms?: string;
  pattern?: string;
  specialist?: string;
} {
  const base = {
    title: script.videoTitle.trim(),
    narration: script.narrationScript.trim(),
    visualPrompt: script.visualDirection.trim(),
    checklist: script.doctorVisitChecklist.map((x) => String(x).trim()).filter(Boolean),
  };
  if (!matchContext) return base;
  return {
    ...base,
    symptoms: typeof matchContext.symptomsText === "string" ? matchContext.symptomsText.trim() : "",
    pattern: typeof matchContext.pattern === "string" ? matchContext.pattern.trim() : "",
    specialist: typeof matchContext.specialist === "string" ? matchContext.specialist.trim() : "",
  };
}
