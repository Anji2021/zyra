"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildCarePrepStoryboard, type CarePrepStoryboard } from "@/lib/insights/care-prep-storyboard";
import type { InsightSummaryDocument } from "@/lib/insight-summary/types";

const SLIDE_MS = 3000;
const TICK_MS = 48;
const SLIDE_COUNT = 4;

type CarePrepVideoStoryboardProps = {
  report: InsightSummaryDocument;
};

export function CarePrepVideoStoryboard({ report }: CarePrepVideoStoryboardProps) {
  const [storyboard, setStoryboard] = useState<CarePrepStoryboard | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);

  const slideStartRef = useRef(0);
  const pauseAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);

  const onCreate = useCallback(() => {
    setStoryboard(buildCarePrepStoryboard(report));
    setIndex(0);
    setPlaying(true);
    slideStartRef.current = Date.now();
    pauseAccumRef.current = 0;
    pauseStartedRef.current = null;
    setSlideProgress(0);
  }, [report]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) {
        pauseStartedRef.current = Date.now();
        return false;
      }
      if (pauseStartedRef.current != null) {
        pauseAccumRef.current += Date.now() - pauseStartedRef.current;
        pauseStartedRef.current = null;
      }
      return true;
    });
  }, []);

  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(true);
    slideStartRef.current = Date.now();
    pauseAccumRef.current = 0;
    pauseStartedRef.current = null;
    setSlideProgress(0);
  }, []);

  useEffect(() => {
    if (!storyboard) return;
    slideStartRef.current = Date.now();
    pauseAccumRef.current = 0;
    pauseStartedRef.current = null;
    setSlideProgress(0);
  }, [storyboard, index]);

  useEffect(() => {
    if (!storyboard || !playing) return;

    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - slideStartRef.current - pauseAccumRef.current;
      if (elapsed >= SLIDE_MS) {
        setIndex((i) => (i + 1) % SLIDE_COUNT);
        return;
      }
      setSlideProgress(Math.min(1, elapsed / SLIDE_MS));
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [storyboard, playing, index]);

  const slide = storyboard?.slides[index] ?? null;

  return (
    <div className="mt-4 space-y-4">
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex min-h-[2.25rem] items-center justify-center rounded-full border border-accent/45 bg-background px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/40 sm:text-sm"
      >
        Create CarePrep Video
      </button>
      <p className="text-[10px] leading-snug text-muted/90 sm:text-[11px]">
        Auto-playing preview on this device only — no upload or external API.
      </p>

      {storyboard && slide ? (
        <div className="mx-auto w-full max-w-[700px]">
          <div className="overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-b from-surface to-soft-rose/35 shadow-sm">
            <div className="border-b border-border/40 bg-background/60 px-3 py-2 sm:px-4">
              <p className="font-serif text-xs font-semibold text-foreground sm:text-sm">{storyboard.title}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted sm:text-xs">
                Slide {index + 1} of {SLIDE_COUNT}
              </p>
            </div>

            <div className="relative aspect-video w-full">
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 text-center sm:px-8 sm:py-6">
                  <div key={index} className="careprep-slide-enter max-w-full">
                    <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {slide.heading}
                    </h3>
                    <ul className="mt-3 max-h-[38vh] space-y-2.5 overflow-y-auto text-left sm:max-h-[min(40%,13rem)] sm:space-y-3">
                      {slide.bullets.map((line, i) => (
                        <li key={`${index}-${i}`} className="flex gap-2.5 text-sm leading-snug text-foreground/95 sm:text-base sm:leading-snug">
                          <span className="mt-0.5 shrink-0 font-semibold text-accent" aria-hidden>
                            •
                          </span>
                          <span className="min-w-0 break-words">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="shrink-0 space-y-2 border-t border-border/35 bg-background/40 px-3 pb-2 pt-2 sm:px-4">
                  <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((index + slideProgress) / SLIDE_COUNT) * 100)} aria-label="Story progress">
                    {Array.from({ length: SLIDE_COUNT }, (_, i) => {
                      let fill = 0;
                      if (i < index) fill = 1;
                      else if (i === index) fill = slideProgress;
                      return (
                        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border/60">
                          <div className="h-full rounded-full bg-accent/85" style={{ width: `${fill * 100}%` }} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : "Play"}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-accent/40 bg-background text-accent shadow-sm transition hover:bg-soft-rose/45 active:scale-[0.98]"
                    >
                      {playing ? <Pause className="size-5" strokeWidth={2} /> : <Play className="size-5 pl-0.5" strokeWidth={2} />}
                    </button>
                    <button
                      type="button"
                      onClick={restart}
                      aria-label="Restart from first slide"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground transition hover:bg-soft-rose/40 active:scale-[0.98]"
                    >
                      <RotateCcw className="size-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="border-t border-border/40 bg-background/50 px-3 py-2 text-[9px] leading-snug text-muted sm:px-4 sm:text-[10px]">
              {storyboard.disclaimer}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
