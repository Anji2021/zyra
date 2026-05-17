"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2, Loader2, Sparkles } from "lucide-react";
import {
  DEMO_INSURANCE_PREFILL,
  DEMO_PROVIDERS,
} from "@/lib/demoData";
import { getResearchNarrativeForProvider } from "@/lib/hackathon/provider-research-narrative";
import {
  buildMockProviderResearch,
  researchProviderWebPresence,
} from "@/lib/agentIntegrations/webWrangler";
import type {
  ProviderResearch,
  UserResearchContext,
} from "@/lib/hackathon/provider-research-types";
import { AgentActivityCard } from "./AgentActivityCard";

type AgentResearchStageProps = {
  insuranceLabel: string;
  symptomsText?: string;
  zipText?: string;
  onComplete: () => void;
  variant?: "full" | "compact";
};

const WEB_WRANGLER_GLOBAL_LINES = [
  "Zyra is comparing provider quality, access, insurance fit, and review signals.",
  "Distilling web signals into ranked matches for the next step.",
] as const;

function shortSignal(s: string, max = 52): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function accessLabel(p: { nextAvailable: string }, r?: ProviderResearch): string {
  const a = r?.accessSignals[0];
  if (a && a.length < 36) return a;
  const nv = p.nextAvailable;
  if (nv.includes("May 19") || nv.includes("May 20")) return "This week";
  return nv.split("·")[0]?.trim() ?? nv;
}

export function AgentResearchStage({
  insuranceLabel,
  symptomsText = "",
  zipText = "",
  onComplete,
  variant = "full",
}: AgentResearchStageProps) {
  const userCtx: UserResearchContext = useMemo(
    () => ({
      symptoms: symptomsText,
      zip: zipText,
      insurance: insuranceLabel.trim() || DEMO_INSURANCE_PREFILL,
    }),
    [symptomsText, zipText, insuranceLabel],
  );

  const [globalIdx, setGlobalIdx] = useState(0);
  const [providerIdx, setProviderIdx] = useState(0);
  const [researchSnippet, setResearchSnippet] = useState<string | null>(null);
  const [snippetById, setSnippetById] = useState<Record<string, string>>({});
  const [researchById, setResearchById] = useState<Record<string, ProviderResearch>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    WEB_WRANGLER_GLOBAL_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setGlobalIdx(i + 1), 520 * (i + 1)));
    });
    const startProviders = 520 * (WEB_WRANGLER_GLOBAL_LINES.length + 1);
    const userCtxLocal: UserResearchContext = {
      symptoms: symptomsText,
      zip: zipText,
      insurance: insuranceLabel.trim() || DEMO_INSURANCE_PREFILL,
    };
    DEMO_PROVIDERS.forEach((p, i) => {
      timers.push(
        setTimeout(() => {
          setProviderIdx(i + 1);
          void researchProviderWebPresence(p, userCtxLocal).then((res) => {
            setResearchSnippet(res.webResearchSummary);
            setSnippetById((prev) => ({ ...prev, [p.id]: res.webResearchSummary }));
            setResearchById((prev) => ({ ...prev, [p.id]: res }));
          });
        }, startProviders + 620 * (i + 1)),
      );
    });
    const doneAt = startProviders + 620 * (DEMO_PROVIDERS.length + 1) + 500;
    timers.push(setTimeout(() => onComplete(), doneAt));
    return () => timers.forEach(clearTimeout);
  }, [onComplete, symptomsText, zipText, insuranceLabel]);

  if (variant === "compact") {
    return (
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/50 bg-surface/90 shadow-sm">
        <div className="shrink-0 border-b border-border/35 px-2 py-1.5">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted">
            Step 2 · Research
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-foreground/90">
            {WEB_WRANGLER_GLOBAL_LINES[0]}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5 [scrollbar-gutter:stable]">
          {DEMO_PROVIDERS.map((p, idx) => {
            const queued = providerIdx < idx + 1;
            const running = providerIdx === idx + 1;
            const done = providerIdx > idx + 1;
            const research = researchById[p.id];
            const partial =
              research ?? buildMockProviderResearch(p, userCtx, done ? "full" : "partial");
            const expanded = expandedId === p.id;
            const inNet = p.inNetwork ? "In-network" : "OON";
            const sigs = [
              partial.reputationSignals[0],
              partial.accessSignals[0] ?? `Access: ${accessLabel(p, partial)}`,
              partial.insuranceSignals[0],
            ].filter(Boolean) as string[];

            return (
              <div
                key={p.id}
                className={`rounded-md border px-2 py-1.5 text-[10px] transition-colors ${
                  running
                    ? "border-accent/30 bg-soft-rose/15"
                    : done
                      ? "border-border/50 bg-background/50"
                      : "border-border/40 bg-background/40 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      #{idx + 1} {p.name}
                    </p>
                    <p className="truncate text-[9px] text-muted">{p.clinic}</p>
                    <p className="mt-0.5 text-[9.5px] text-foreground/90">
                      Match {partial.matchScore} · {inNet} · {accessLabel(p, partial)}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[9px] text-muted">
                      {sigs.slice(0, 3).map((s, si) => (
                        <li key={`${p.id}-s-${si}`} className="flex gap-1">
                          <span className="shrink-0 text-sage" aria-hidden>
                            ✓
                          </span>
                          <span>{shortSignal(s, 64)}</span>
                        </li>
                      ))}
                    </ul>
                    {running ? (
                      <p className="mt-1 text-[9px] text-accent">
                        <span className="motion-safe:animate-pulse">↻</span> Zyra researched web
                        signals…
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : p.id)}
                      className="rounded-full border border-border/60 bg-surface px-2 py-0.5 text-[9px] font-semibold text-foreground"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="mt-1.5 max-h-36 space-y-1.5 overflow-y-auto border-t border-border/35 pt-1.5 text-[9px] leading-snug text-muted">
                    <div>
                      <p className="font-semibold text-foreground">Review signals</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {partial.reviewHighlights.map((x) => (
                          <li key={x}>· {shortSignal(x, 72)}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Insurance clues</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {partial.insuranceSignals.map((x) => (
                          <li key={x}>· {shortSignal(x, 72)}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Access notes</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {partial.accessSignals.map((x) => (
                          <li key={x}>· {shortSignal(x, 72)}</li>
                        ))}
                      </ul>
                    </div>
                    {partial.redFlags.length > 0 ? (
                      <div className="rounded border border-border/50 bg-background/60 px-1.5 py-1">
                        <p className="font-semibold text-foreground">Flag</p>
                        <p>{partial.redFlags.map((x) => shortSignal(x, 80)).join(" ")}</p>
                      </div>
                    ) : null}
                    <p className="text-[8.5px] text-muted/85">
                      Demo distillate — not clinical fact. APIs replace mock signals.
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent">
          <Globe2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Step 2 · Research
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
            Zyra is researching care options
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {WEB_WRANGLER_GLOBAL_LINES[0]}{" "}
            <span className="font-medium text-foreground">
              Plan: {userCtx.insurance || DEMO_INSURANCE_PREFILL}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-background/50 p-3 sm:p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Sparkles className="size-3.5 shrink-0 text-accent" aria-hidden />
          Status
        </p>
        <ul className="space-y-1.5 text-sm text-muted">
          {WEB_WRANGLER_GLOBAL_LINES.map((line, i) => (
            <li
              key={line}
              className={`flex items-start gap-2 ${i < globalIdx ? "text-foreground" : ""}`}
            >
              {i < globalIdx ? (
                <span className="mt-0.5 text-sage" aria-hidden>
                  ✓
                </span>
              ) : i === globalIdx && globalIdx < WEB_WRANGLER_GLOBAL_LINES.length ? (
                <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-accent" aria-hidden />
              ) : (
                <span className="mt-0.5 text-muted" aria-hidden>
                  •
                </span>
              )}
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DEMO_PROVIDERS.map((p, idx) => {
          const narrative = getResearchNarrativeForProvider(p.id);
          const done = providerIdx > idx;
          const running = providerIdx === idx + 1;
          const research = researchById[p.id];
          const phaseForMock = running ? "partial" : done ? "full" : "partial";
          const partial =
            research ?? buildMockProviderResearch(p, userCtx, phaseForMock);
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-3 sm:p-4 ${
                running
                  ? "border-accent/40 bg-soft-rose/25"
                  : done
                    ? "border-sage/35 bg-sage/5"
                    : "border-border/60 bg-background/60"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                #{idx + 1}
              </p>
              <p className="mt-1 font-medium text-foreground">{p.name}</p>
              <p className="mt-0.5 text-xs text-muted">{p.clinic}</p>
              <p className="mt-1.5 text-[11px] font-semibold text-accent">
                Match {partial.matchScore}
              </p>
              <ul className="mt-2 space-y-1 text-[11px] leading-snug text-muted">
                {(narrative?.signals ?? partial.reputationSignals.slice(0, 2)).map((s, si) => (
                  <li key={`${p.id}-f-${si}`}>· {shortSignal(s, 70)}</li>
                ))}
              </ul>
              {running && researchSnippet ? (
                <p className="mt-2 line-clamp-3 rounded-lg border border-border/60 bg-surface/90 p-2 text-[11px] text-foreground">
                  {researchSnippet}
                </p>
              ) : done && research ? (
                <p className="mt-2 line-clamp-3 rounded-lg border border-border/50 bg-surface/80 p-2 text-[11px] leading-snug text-foreground">
                  {research.webResearchSummary}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DEMO_PROVIDERS.map((p, idx) => {
          const done = providerIdx > idx;
          const running = providerIdx === idx + 1;
          return (
            <AgentActivityCard
              key={`card-${p.id}`}
              icon={Globe2}
              title={p.name.split(",")[0]?.trim() ?? p.name}
              detail={
                running
                  ? "Zyra researched web signals (simulated)…"
                  : done
                    ? "Ranked — ready for Match."
                    : "Queued."
              }
              status={done ? "done" : running ? "running" : "queued"}
            />
          );
        })}
      </div>
    </section>
  );
}
