import type { CarePrepVideoGenerationResponse } from "@zyra/shared";
import {
  DEFAULT_IMAROUTER_BASE,
  getImaRouterVideoStatus,
} from "@/lib/careprep-video/imarouter";
import { getSeedanceTaskPollSnapshot } from "@/lib/careprep-video/modelark-seedance";

export const runtime = "nodejs";

/** GET ?jobId=&provider=imarouter|seedance — poll once (default Seedance). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId")?.trim();
  const providerRaw = url.searchParams.get("provider")?.trim().toLowerCase();
  const provider = providerRaw === "imarouter" ? "imarouter" : "seedance";

  if (!jobId) {
    const body: CarePrepVideoGenerationResponse = {
      status: "failed",
      videoUrl: "",
      jobId: "",
      message: "Missing jobId query parameter.",
    };
    return Response.json(body, { status: 400 });
  }

  if (provider === "imarouter") {
    const apiKey = process.env.IMAROUTER_API_KEY?.trim();
    const base = process.env.IMAROUTER_BASE_URL?.trim() || DEFAULT_IMAROUTER_BASE;
    if (!apiKey) {
      return Response.json({
        status: "failed",
        videoUrl: "",
        jobId,
        message: "",
        provider: "imarouter",
      } satisfies CarePrepVideoGenerationResponse);
    }
    const body = await getImaRouterVideoStatus({ base, apiKey, jobId });
    return Response.json(body);
  }

  const { rawJson, mapped } = await getSeedanceTaskPollSnapshot(jobId);
  const json = rawJson;
  if (json != null) {
    console.log("[seedance status full]", JSON.stringify(json, null, 2));
  }

  return Response.json({
    status: mapped.status,
    provider: "seedance" as const,
    videoUrl: mapped.videoUrl,
    message: mapped.message,
    jobId: mapped.jobId,
    raw: json,
  });
}

