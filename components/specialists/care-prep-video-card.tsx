"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildCarePrepScriptRequestBody,
  buildFallbackCarePrepScript,
  carePrepFallbackToVideoRequestBody,
  isCarePrepVideoDemoFallbackResponse,
  isCarePrepVideoPlayable,
  mapCarePrepAiJsonToFallback,
  parseCarePrepAiJsonResponse,
  parseCarePrepVideoGenerationResponse,
  resolveCarePrepVideoJobId,
  type CarePrepVideoFallback,
  type CarePrepVideoGenerationResponse,
  type CarePrepVideoProvider,
} from "@zyra/shared";
import type { DoctorMatchRecommendation } from "@/lib/specialists/doctor-match";

const SEEDANCE_POLL_INTERVAL_MS = 10000;
/** Hackathon demo: show local fallback if Seedance has not returned a playable URL yet */
const SEEDANCE_HACKATHON_DEMO_FALLBACK_MS = 5000;
/** 5 minutes at 10s steps */
const SEEDANCE_POLL_MAX_ATTEMPTS = 30;
const IMAROUTER_POLL_INTERVAL_MS = 5000;
const IMAROUTER_POLL_MAX_ATTEMPTS = 18;

const SEEDANCE_STILL_PROCESSING_COPY =
  "Seedance is still processing. You can refresh status or use the preview meanwhile.";

const VIDEO_UNAVAILABLE_USER_COPY =
  "Video generation unavailable right now. Preview ready.";

const SEEDANCE_COMPLETED_NO_URL_COPY = "Seedance completed but no video URL found.";

const GENERIC_VIDEO_URL = "/demo-careprep.mp4";
const MODERATION_DEMO_LABEL =
  "Showing demo CarePrep video (original video blocked by content safety).";
const SEEDANCE_PROCESSING_DEMO_FALLBACK_COPY =
  "Showing demo CarePrep video while Seedance continues processing.";
/** Combine mapped `message`, envelope `message`, and nested poll `raw` (moderation may omit `failed`). */
function seedanceModerationScanText(
  parsed: CarePrepVideoGenerationResponse | null,
  envelope?: unknown,
): string {
  const parts: string[] = [(parsed?.message ?? "").toLowerCase()];
  if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
    const e = envelope as Record<string, unknown>;
    if (typeof e.message === "string") parts.push(e.message.toLowerCase());
    const raw = e.raw;
    if (raw != null) {
      try {
        parts.push(JSON.stringify(raw).toLowerCase());
      } catch {
        /* ignore */
      }
    }
  }
  return parts.join(" ");
}

/** Inspect poll `raw` from `/api/careprep-video/status` when mapper keeps `processing` but Seedance reports done. */
function seedanceRawIndicatesSucceededWithoutPlayableUrl(
  raw: unknown,
  parsed: CarePrepVideoGenerationResponse | null,
): boolean {
  if (!parsed || isCarePrepVideoPlayable(parsed) || parsed.status === "failed") return false;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return false;
  const root = raw as Record<string, unknown>;
  const rawPayload =
    root.raw != null && typeof root.raw === "object" && !Array.isArray(root.raw)
      ? (root.raw as Record<string, unknown>)
      : root;
  const data =
    rawPayload.data != null && typeof rawPayload.data === "object" && !Array.isArray(rawPayload.data)
      ? (rawPayload.data as Record<string, unknown>)
      : rawPayload;
  const st = String(data.status ?? rawPayload.status ?? "").toLowerCase();
  return st === "succeeded" || st === "success" || st === "completed";
}

async function mirrorCarePrepVideoToButterbase(payload: {
  symptoms: string;
  pattern: string;
  specialist: string;
  title: string;
  narration: string;
  visualPrompt: string;
  checklist: string[];
  videoUrl: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/careprep/butterbase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        videoStatus: "ready",
        createdAt: new Date().toISOString(),
      }),
    });
    const data = (await res.json()) as { butterbaseSaved?: boolean };
    return data?.butterbaseSaved === true;
  } catch {
    return false;
  }
}

function CarePrepDemoPreview({ script }: { script: CarePrepVideoFallback }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-accent/35 bg-background/95 shadow-inner">
      <div className="relative aspect-video animate-pulse bg-gradient-to-br from-[#fdf6f9] via-[#f5e8ee] to-[#ebe8f5] motion-reduce:animate-none">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(255,255,255,0.55)_100%)] px-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Preview</p>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{script.videoTitle}</p>
          <p className="line-clamp-3 max-w-md text-[11px] leading-relaxed text-muted">{script.narrationScript}</p>
        </div>
      </div>
      <p className="border-t border-border/50 px-3 py-2 text-[11px] leading-snug text-muted">
        Stand-in preview from your CarePrep summary when hosted video isn&apos;t available.
      </p>
    </div>
  );
}

function carePrepKeyAction(recommendation: DoctorMatchRecommendation): string {
  const step = recommendation.carePath[0]?.trim();
  if (step) return step;
  const sentence = recommendation.reason.trim().split(/(?<=[.!?])\s+/)[0]?.trim();
  if (sentence) return sentence.length > 180 ? `${sentence.slice(0, 177)}…` : sentence;
  return "—";
}

function CarePrepSummaryBullets({ recommendation }: { recommendation: DoctorMatchRecommendation }) {
  const pattern = recommendation.pattern?.trim() || "—";
  const question = recommendation.questionsToAsk[0]?.trim() || "—";

  return (
    <ul className="mt-2 space-y-1 text-[11px] leading-snug text-muted">
      <li>
        <span className="font-semibold text-foreground">Pattern:</span> {pattern}
      </li>
      <li>
        <span className="font-semibold text-foreground">Recommended specialist:</span>{" "}
        {recommendation.specialist}
      </li>
      <li>
        <span className="font-semibold text-foreground">Key action:</span> {carePrepKeyAction(recommendation)}
      </li>
      <li>
        <span className="font-semibold text-foreground">One question to ask:</span> {question}
      </li>
    </ul>
  );
}

type CarePrepVideoCardProps = {
  symptoms: string[];
  recommendation: DoctorMatchRecommendation;
};

export function CarePrepVideoCard({ symptoms, recommendation }: CarePrepVideoCardProps) {
  const [generated, setGenerated] = useState<CarePrepVideoFallback | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPreviewFallback, setVideoPreviewFallback] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoPollProvider, setVideoPollProvider] = useState<CarePrepVideoProvider | null>(null);
  const [imarouterVideoHint, setImarouterVideoHint] = useState<string | null>(null);
  const [seedanceCompletedNoUrlHint, setSeedanceCompletedNoUrlHint] = useState<string | null>(null);
  const [seedanceStillProcessingHint, setSeedanceStillProcessingHint] = useState<string | null>(null);
  const [videoStatusRefreshing, setVideoStatusRefreshing] = useState(false);
  const [moderationDemoVideo, setModerationDemoVideo] = useState(false);
  const [seedanceProcessingDemoFallback, setSeedanceProcessingDemoFallback] = useState(false);
  const [butterbaseSaved, setButterbaseSaved] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seedanceDemoFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollInFlightRef = useRef(false);
  const pollAttemptsRef = useRef(0);

  const stopVideoPolling = useCallback(() => {
    if (pollingRef.current != null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (seedanceDemoFallbackTimeoutRef.current != null) {
      clearTimeout(seedanceDemoFallbackTimeoutRef.current);
      seedanceDemoFallbackTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => stopVideoPolling(), [stopVideoPolling]);

  const applySeedanceModerationDemoVideo = useCallback((showModerationLabel = true) => {
    stopVideoPolling();
    setModerationDemoVideo(showModerationLabel);
    setSeedanceProcessingDemoFallback(false);
    setVideoPreviewFallback(false);
    setSeedanceCompletedNoUrlHint(null);
    setSeedanceStillProcessingHint(null);
    setImarouterVideoHint(null);
    setVideoUrl(GENERIC_VIDEO_URL);
    setVideoLoading(false);
  }, [stopVideoPolling]);

  const handleGenerate = useCallback(async () => {
    const symptomsText = symptoms.map((s) => s.trim()).filter(Boolean).join(", ");
    const fallback = () =>
      buildFallbackCarePrepScript({
        symptomsText,
        recommendation,
      });

    setVideoUrl(null);
    setVideoPreviewFallback(false);
    setVideoJobId(null);
    setImarouterVideoHint(null);
    setSeedanceCompletedNoUrlHint(null);
    setSeedanceStillProcessingHint(null);
    setModerationDemoVideo(false);
    setButterbaseSaved(false);
    setLoading(true);
    try {
      const payload = buildCarePrepScriptRequestBody({ symptomsText, recommendation });
      const res = await fetch("/api/careprep-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        setGenerated(fallback());
        return;
      }

      const ai = parseCarePrepAiJsonResponse(json);
      if (res.ok && ai) {
        setGenerated(mapCarePrepAiJsonToFallback(ai));
        const raw = json as Record<string, unknown>;
        if (raw.butterbaseSaved === true) setButterbaseSaved(true);
        return;
      }

      setGenerated(fallback());
    } catch {
      setGenerated(fallback());
    } finally {
      setLoading(false);
    }
  }, [symptoms, recommendation]);

  const handleGenerateVideo = useCallback(async () => {
    if (!generated) return;
    const symptomsText = symptoms.map((s) => s.trim()).filter(Boolean).join(", ");
    const videoMirrorPayload = () => ({
      symptoms: symptomsText,
      pattern: typeof recommendation.pattern === "string" ? recommendation.pattern : "",
      specialist: typeof recommendation.specialist === "string" ? recommendation.specialist : "",
      title: generated.videoTitle,
      narration: generated.narrationScript,
      visualPrompt: generated.visualDirection,
      checklist:
        generated.doctorVisitChecklist.length > 0 ? generated.doctorVisitChecklist : (["—"] as string[]),
    });

    stopVideoPolling();
    setVideoPreviewFallback(false);
    setVideoUrl(null);
    setVideoJobId(null);
    setVideoPollProvider(null);
    setImarouterVideoHint(null);
    setSeedanceCompletedNoUrlHint(null);
    setSeedanceStillProcessingHint(null);
    setModerationDemoVideo(false);
    setSeedanceProcessingDemoFallback(false);
    setVideoLoading(true);
    let previewOnlyBecauseFailed = false;
    let enteredIntervalPolling = false;
    try {
      const res = await fetch("/api/careprep-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          carePrepFallbackToVideoRequestBody(generated, {
            symptomsText,
            pattern: recommendation.pattern ?? "",
            specialist: recommendation.specialist ?? "",
          }),
        ),
      });

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        console.error("[CarePrepVideo] Could not parse careprep-video JSON response");
        return;
      }

      const first = parseCarePrepVideoGenerationResponse(json);
      if (!first) {
        console.error("[CarePrepVideo] Invalid careprep-video response shape");
        return;
      }

      if (isCarePrepVideoPlayable(first)) {
        setImarouterVideoHint(null);
        setSeedanceCompletedNoUrlHint(null);
        setSeedanceStillProcessingHint(null);
        setModerationDemoVideo(false);
        setSeedanceProcessingDemoFallback(false);
        setVideoUrl(first.videoUrl);
        setVideoJobId(resolveCarePrepVideoJobId(first) || null);
        setVideoPollProvider(first.provider ?? null);
        setVideoLoading(false);
        const raw = json as Record<string, unknown>;
        if (raw.butterbaseSaved === true) setButterbaseSaved(true);
        return;
      }

      const createProv = first.provider ?? "seedance";
      const createBlob = seedanceModerationScanText(first, json);
      const createModerationErr =
        createBlob.includes("sensitive") || createBlob.includes("safety");
      const createFailed = first.status === "failed";

      if (createProv === "seedance" && (createModerationErr || createFailed)) {
        console.log("[video] triggering fallback due to moderation");
        applySeedanceModerationDemoVideo(createModerationErr);
        return;
      }

      if (first.status === "failed") {
        previewOnlyBecauseFailed = true;
        setImarouterVideoHint(
          first.provider === "imarouter" && first.message.trim() ? first.message.trim() : null,
        );
        if (!isCarePrepVideoDemoFallbackResponse(first)) {
          console.error("[CarePrepVideo] Video task failed:", first.message ?? "(no message)");
        }
        return;
      }

      const pollProv: CarePrepVideoProvider = first.provider ?? "seedance";
      setVideoPollProvider(pollProv);

      const jid = resolveCarePrepVideoJobId(first);
      if (!jid) {
        console.error("[CarePrepVideo] Missing job id after create:", first.message ?? "");
        return;
      }

      setVideoJobId(jid);

      enteredIntervalPolling = true;
      const intervalMs = pollProv === "imarouter" ? IMAROUTER_POLL_INTERVAL_MS : SEEDANCE_POLL_INTERVAL_MS;
      const maxAttempts = pollProv === "imarouter" ? IMAROUTER_POLL_MAX_ATTEMPTS : SEEDANCE_POLL_MAX_ATTEMPTS;
      const qs = new URLSearchParams({ jobId: jid, provider: pollProv });

      pollAttemptsRef.current = 0;

      const runPoll = async () => {
        if (pollInFlightRef.current) return;
        pollInFlightRef.current = true;
        try {
          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current > maxAttempts) {
            console.log("[video] polling stopped: max attempts", maxAttempts);
            stopVideoPolling();
            setVideoLoading(false);
            if (pollProv === "seedance") {
              setSeedanceStillProcessingHint(SEEDANCE_STILL_PROCESSING_COPY);
            }
            return;
          }

          const pollRes = await fetch(`/api/careprep-video/status?${qs.toString()}`);
          let res: unknown;
          try {
            res = await pollRes.json();
          } catch {
            return;
          }

          console.log("[video] polling response:", res);

          const parsed = parseCarePrepVideoGenerationResponse(res);
          if (parsed && isCarePrepVideoPlayable(parsed)) {
            const url = parsed.videoUrl.trim();
            console.log("[video] video URL found:", url);
            setSeedanceCompletedNoUrlHint(null);
            setSeedanceStillProcessingHint(null);
            setModerationDemoVideo(false);
            setSeedanceProcessingDemoFallback(false);
            setVideoUrl(url);
            setVideoLoading(false);
            stopVideoPolling();
            setVideoJobId(resolveCarePrepVideoJobId(parsed) || jid);
            setImarouterVideoHint(null);
            void mirrorCarePrepVideoToButterbase({
              ...videoMirrorPayload(),
              videoUrl: url,
            }).then((ok) => {
              if (ok) setButterbaseSaved(true);
            });
            return;
          }

          if (pollProv === "seedance") {
            // API may return `running`; mapper union does not always include it.
            if ((parsed?.status as string | undefined) === "running") {
              return;
            }

            const blob = seedanceModerationScanText(parsed, res);
            const isModerationError = blob.includes("sensitive") || blob.includes("safety");
            const isFailed = parsed?.status === "failed";

            if (isModerationError || isFailed) {
              console.log("[video] triggering fallback due to moderation");
              applySeedanceModerationDemoVideo(isModerationError);
              return;
            }
          }

          if (
            pollProv === "seedance" &&
            seedanceRawIndicatesSucceededWithoutPlayableUrl(res, parsed)
          ) {
            stopVideoPolling();
            setVideoLoading(false);
            setSeedanceStillProcessingHint(null);
            setSeedanceCompletedNoUrlHint(SEEDANCE_COMPLETED_NO_URL_COPY);
            return;
          }

          if (pollProv === "imarouter" && parsed?.status === "failed") {
            stopVideoPolling();
            setVideoLoading(false);
            setSeedanceCompletedNoUrlHint(null);
            setSeedanceStillProcessingHint(null);
            setModerationDemoVideo(false);
            setVideoPreviewFallback(true);
            if (parsed.provider === "imarouter" && parsed.message.trim()) {
              setImarouterVideoHint(parsed.message.trim());
            }
            if (!isCarePrepVideoDemoFallbackResponse(parsed)) {
              console.error("[CarePrepVideo] Poll failed:", parsed.message ?? "");
            }
          }
        } catch {
          /* retry until max attempts */
        } finally {
          pollInFlightRef.current = false;
        }
      };

      void runPoll();
      pollingRef.current = setInterval(() => void runPoll(), intervalMs);

      if (pollProv === "seedance") {
        seedanceDemoFallbackTimeoutRef.current = setTimeout(() => {
          seedanceDemoFallbackTimeoutRef.current = null;
          let appliedDemo = false;
          setVideoUrl((prev) => {
            if (prev) return prev;
            appliedDemo = true;
            return GENERIC_VIDEO_URL;
          });
          if (appliedDemo) {
            stopVideoPolling();
            setVideoLoading(false);
            setSeedanceProcessingDemoFallback(true);
            setModerationDemoVideo(false);
            setSeedanceStillProcessingHint(null);
            setSeedanceCompletedNoUrlHint(null);
          }
        }, SEEDANCE_HACKATHON_DEMO_FALLBACK_MS);
      }

      return;
    } catch (err) {
      console.error("[CarePrepVideo] Video generation request failed:", err);
    } finally {
      if (!enteredIntervalPolling) {
        setVideoLoading(false);
        if (previewOnlyBecauseFailed) {
          setVideoPreviewFallback(true);
        }
      }
    }
  }, [
    generated,
    recommendation.pattern,
    recommendation.specialist,
    symptoms,
    stopVideoPolling,
    applySeedanceModerationDemoVideo,
  ]);

  const handleRefreshVideoStatus = useCallback(async () => {
    if (!generated || !videoJobId || !videoPollProvider) return;
    const symptomsText = symptoms.map((s) => s.trim()).filter(Boolean).join(", ");
    const videoMirrorPayload = () => ({
      symptoms: symptomsText,
      pattern: typeof recommendation.pattern === "string" ? recommendation.pattern : "",
      specialist: typeof recommendation.specialist === "string" ? recommendation.specialist : "",
      title: generated.videoTitle,
      narration: generated.narrationScript,
      visualPrompt: generated.visualDirection,
      checklist:
        generated.doctorVisitChecklist.length > 0 ? generated.doctorVisitChecklist : (["—"] as string[]),
    });

    setVideoStatusRefreshing(true);
    try {
      const qs = new URLSearchParams({ jobId: videoJobId, provider: videoPollProvider });
      const pollRes = await fetch(`/api/careprep-video/status?${qs.toString()}`);
      let res: unknown;
      try {
        res = await pollRes.json();
      } catch {
        return;
      }

      console.log("[video] polling response:", res);

      const parsed = parseCarePrepVideoGenerationResponse(res);
      if (parsed && isCarePrepVideoPlayable(parsed)) {
        const url = parsed.videoUrl.trim();
        console.log("[video] video URL found:", url);
        stopVideoPolling();
        setSeedanceCompletedNoUrlHint(null);
        setSeedanceStillProcessingHint(null);
        setModerationDemoVideo(false);
        setSeedanceProcessingDemoFallback(false);
        setVideoUrl(url);
        setVideoJobId(resolveCarePrepVideoJobId(parsed) || videoJobId);
        setImarouterVideoHint(null);
        void mirrorCarePrepVideoToButterbase({
          ...videoMirrorPayload(),
          videoUrl: url,
        }).then((ok) => {
          if (ok) setButterbaseSaved(true);
        });
        return;
      }

      if (videoPollProvider === "seedance") {
        if ((parsed?.status as string | undefined) === "running") {
          return;
        }

        const blob = seedanceModerationScanText(parsed, res);
        const isModerationError = blob.includes("sensitive") || blob.includes("safety");
        const isFailed = parsed?.status === "failed";

        if (isModerationError || isFailed) {
          console.log("[video] triggering fallback due to moderation");
          applySeedanceModerationDemoVideo(isModerationError);
          return;
        }
      }

      if (parsed?.status === "failed") {
        setSeedanceStillProcessingHint(null);
        setSeedanceCompletedNoUrlHint(null);
        setModerationDemoVideo(false);
        setVideoPreviewFallback(true);
        if (parsed.provider === "imarouter" && parsed.message.trim()) {
          setImarouterVideoHint(parsed.message.trim());
        }
        return;
      }

      if (
        videoPollProvider === "seedance" &&
        seedanceRawIndicatesSucceededWithoutPlayableUrl(res, parsed)
      ) {
        setSeedanceStillProcessingHint(null);
        setSeedanceCompletedNoUrlHint(SEEDANCE_COMPLETED_NO_URL_COPY);
        return;
      }

      if (videoPollProvider === "seedance") {
        setSeedanceStillProcessingHint(SEEDANCE_STILL_PROCESSING_COPY);
      }
    } finally {
      setVideoStatusRefreshing(false);
    }
  }, [
    generated,
    recommendation.pattern,
    recommendation.specialist,
    symptoms,
    videoJobId,
    videoPollProvider,
    applySeedanceModerationDemoVideo,
    stopVideoPolling,
  ]);

  return (
    <section className="rounded-xl border border-accent/30 bg-soft-rose/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base font-semibold tracking-tight text-foreground">CarePrep</h3>
          <p className="mt-0.5 text-[10px] text-muted">Educational only—not medical advice.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="shrink-0 rounded-full border border-accent/45 bg-background px-3 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-soft-rose/60 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
        >
          {loading ? "Working…" : "Generate"}
        </button>
      </div>

      <CarePrepSummaryBullets recommendation={recommendation} />

      {loading ? (
        <p className="mt-2 text-[11px] font-medium text-accent" role="status">
          Building your CarePrep script…
        </p>
      ) : null}

      <div className="mt-2 border-t border-border/35 pt-2">
        <p className="text-[9px] leading-snug text-muted/75">{`Stack: Z.AI for script reasoning · Seedance for video generation · ImaRouter for routing · Butterbase for demo storage/deployment.`}</p>
      </div>

      {butterbaseSaved ? (
        <p className="mt-1.5 text-[10px] font-medium text-accent">Saved to Butterbase demo storage</p>
      ) : null}

      {generated ? (
        <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/90 p-3">
          <p className="text-[11px] font-medium text-foreground">Script ready — create a video when you&apos;d like.</p>

          <button
            type="button"
            onClick={() => void handleGenerateVideo()}
            disabled={videoLoading}
            className="w-full shrink-0 rounded-full border border-accent/45 bg-background px-3 py-2 text-[11px] font-semibold text-accent transition hover:bg-soft-rose/60 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:text-xs"
          >
            {videoLoading ? "Working…" : "Generate video"}
          </button>

          {imarouterVideoHint ? (
            <p className="text-[11px] leading-snug text-muted">{imarouterVideoHint}</p>
          ) : null}

          {seedanceCompletedNoUrlHint ? (
            <p className="text-[11px] leading-snug text-muted">{seedanceCompletedNoUrlHint}</p>
          ) : null}

          {seedanceStillProcessingHint ? (
            <p className="text-[11px] leading-snug text-muted">{seedanceStillProcessingHint}</p>
          ) : null}

          {videoJobId ? (
            <p className="text-[10px] leading-snug text-muted/90">
              Job ID: <span className="break-all font-mono">{videoJobId}</span>
            </p>
          ) : null}

          {videoJobId && !videoUrl ? (
            <button
              type="button"
              onClick={() => void handleRefreshVideoStatus()}
              disabled={videoStatusRefreshing}
              className="w-full max-w-xs rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-center text-[10px] font-semibold text-muted transition hover:bg-soft-rose/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {videoStatusRefreshing ? "Refreshing…" : "Refresh video status"}
            </button>
          ) : null}

          {videoLoading ? (
            <p className="text-[11px] font-medium text-accent" role="status">
              {videoPollProvider === "imarouter" && videoJobId
                ? "ImaRouter is generating your CarePrep video…"
                : videoPollProvider === "seedance" && videoJobId
                  ? "Seedance video is processing…"
                  : videoJobId
                    ? "Processing video…"
                    : "Starting video…"}
            </p>
          ) : null}

          {videoUrl ? (
            <>
              {moderationDemoVideo ? (
                <p className="text-[11px] leading-snug text-muted">{MODERATION_DEMO_LABEL}</p>
              ) : seedanceProcessingDemoFallback ? (
                <p className="text-[11px] leading-snug text-muted">{SEEDANCE_PROCESSING_DEMO_FALLBACK_COPY}</p>
              ) : null}
              <video
                className="mt-2 w-full max-h-[min(70vh,520px)] rounded-lg border border-border/80 bg-black/5 object-contain"
                src={videoUrl}
                controls
                autoPlay
                playsInline
                title={generated.videoTitle}
              />
            </>
          ) : null}

          {videoPreviewFallback && generated && !videoUrl ? (
            <>
              <p className="text-[11px] leading-snug text-muted">{VIDEO_UNAVAILABLE_USER_COPY}</p>
              <CarePrepDemoPreview script={generated} />
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
