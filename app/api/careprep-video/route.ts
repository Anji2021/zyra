import {
  carePrepVideoDemoFallbackResponse,
  type CarePrepVideoGenerationResponse,
} from "@zyra/shared";
import { saveCarePrepToButterbase } from "@/lib/butterbase/client";
import {
  createImaRouterCarePrepVideo,
  DEFAULT_IMAROUTER_BASE,
  formatImaRouterErrorMessage,
  shouldSuppressImaRouterUserMessage,
} from "@/lib/careprep-video/imarouter";
import {
  buildSeedanceCarePrepPrompt,
  getSeedanceModelId,
  getSeedanceTaskPollSnapshot,
  modelArkCreateVideoTask,
} from "@/lib/careprep-video/modelark-seedance";

export const runtime = "nodejs";

type CarePrepVideoJsonBody = CarePrepVideoGenerationResponse & { butterbaseSaved?: boolean };

function json(body: CarePrepVideoJsonBody, status = 200) {
  return Response.json(body, { status });
}

function normalizeVideoBody(body: unknown): {
  title: string;
  narration: string;
  visualPrompt: string;
  checklist: string[];
  symptoms: string;
  pattern: string;
  specialist: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const narration = typeof o.narration === "string" ? o.narration.trim() : "";
  const visualPrompt = typeof o.visualPrompt === "string" ? o.visualPrompt.trim() : "";
  const checklistRaw = o.checklist;
  const checklist = Array.isArray(checklistRaw)
    ? checklistRaw.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const symptoms = typeof o.symptoms === "string" ? o.symptoms.trim() : "";
  const pattern = typeof o.pattern === "string" ? o.pattern.trim() : "";
  const specialist = typeof o.specialist === "string" ? o.specialist.trim() : "";
  if (!title || !narration || !visualPrompt) return null;
  return { title, narration, visualPrompt, checklist, symptoms, pattern, specialist };
}

type NormalizedCarePrepVideoBody = NonNullable<ReturnType<typeof normalizeVideoBody>>;

const SEEDANCE_START_MESSAGE = "Seedance video generation started.";

async function trySeedanceCarePrepVideo(input: NormalizedCarePrepVideoBody): Promise<CarePrepVideoJsonBody | null> {
  const apiKey = process.env.SEEDANCE_API_KEY?.trim();
  if (!apiKey) return null;

  const model = getSeedanceModelId();
  const prompt = buildSeedanceCarePrepPrompt(input);

  const created = await modelArkCreateVideoTask({ apiKey, model, prompt });
  if (!created.taskId || created.error) {
    console.error("[careprep-video] Seedance create failed:", created.error ?? "(no detail)");
    return null;
  }

  return {
    status: "processing",
    provider: "seedance",
    jobId: created.taskId,
    videoUrl: "",
    message: SEEDANCE_START_MESSAGE,
  };
}

async function tryImaRouterCarePrepVideo(input: NormalizedCarePrepVideoBody): Promise<Response | null> {
  const imarouterKey = process.env.IMAROUTER_API_KEY?.trim();
  if (!imarouterKey) return null;

  const base = process.env.IMAROUTER_BASE_URL?.trim() || DEFAULT_IMAROUTER_BASE;
  const model = process.env.IMAROUTER_VIDEO_MODEL?.trim() || "happyhorse-1.0-t2v";
  const endpointUrl = `${base.replace(/\/+$/, "")}/v1/videos`;

  console.log("[imarouter] IMAROUTER_API_KEY exists:", true);
  console.log("[imarouter] IMAROUTER_BASE_URL:", base);
  console.log("[imarouter] IMAROUTER_VIDEO_MODEL:", model);
  console.log("[imarouter] final endpoint URL:", endpointUrl);

  const ir = await createImaRouterCarePrepVideo({
    base,
    apiKey: imarouterKey,
    model,
    title: input.title,
    narration: input.narration,
    visualPrompt: input.visualPrompt,
  });

  if (ir.kind === "fail") {
    const d = ir.detail;
    if (d) {
      console.log("[imarouter] response status:", d.httpStatus);
      console.log("[imarouter] response text (first 500 chars):", d.bodyHead);
    }
    const message =
      d && shouldSuppressImaRouterUserMessage(d.bodyHead)
        ? ""
        : d
          ? formatImaRouterErrorMessage(d.httpStatus, d.bodyHead)
          : "ImaRouter error: unknown";
    return json({
      status: "failed",
      provider: "imarouter",
      videoUrl: "",
      jobId: "",
      message,
    });
  }

  if (ir.kind === "success") {
    let butterbaseSaved = false;
    if (ir.response.videoUrl.trim()) {
      butterbaseSaved = await saveCarePrepToButterbase({
        symptoms: input.symptoms,
        pattern: input.pattern,
        specialist: input.specialist,
        title: input.title,
        narration: input.narration,
        visualPrompt: input.visualPrompt,
        checklist: input.checklist.length ? input.checklist : ["—"],
        videoStatus: "ready",
        videoUrl: ir.response.videoUrl,
        createdAt: new Date().toISOString(),
      });
    }
    return json({
      ...ir.response,
      ...(butterbaseSaved ? { butterbaseSaved: true } : {}),
    });
  }

  if (ir.kind === "processing") {
    return json(ir.response);
  }

  return null;
}


/** POST: Seedance → ImaRouter → demo fallback. GET ?taskId=: Seedance poll legacy. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ status: "failed", videoUrl: "", jobId: "", message: "Invalid JSON body." }, 400);
  }

  const input = normalizeVideoBody(body);
  if (!input) {
    return json(
      { status: "failed", videoUrl: "", jobId: "", message: "Missing title, narration, or visualPrompt." },
      400,
    );
  }

  const seedanceOut = await trySeedanceCarePrepVideo(input);
  if (seedanceOut) {
    return json(seedanceOut);
  }

  const irResponse = await tryImaRouterCarePrepVideo(input);
  if (irResponse) {
    return irResponse;
  }

  return json(carePrepVideoDemoFallbackResponse());
}

export async function GET(request: Request) {
  const taskId = new URL(request.url).searchParams.get("taskId")?.trim();
  if (!taskId) {
    return json({ status: "failed", videoUrl: "", jobId: "", message: "Missing taskId query parameter." }, 400);
  }

  const { rawJson, mapped } = await getSeedanceTaskPollSnapshot(taskId);
  if (rawJson) {
    console.log("[seedance] FULL RESPONSE:", JSON.stringify(rawJson, null, 2));
  }
  return json({ ...mapped, provider: "seedance" });
}
