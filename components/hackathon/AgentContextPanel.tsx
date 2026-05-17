"use client";

import { Cpu, MapPin, Stethoscope } from "lucide-react";
import { useAgentWorkspace } from "./AgentWorkspaceContext";

const READINESS = [
  { id: "browser", label: "Browser-ready" },
  { id: "email", label: "Email-ready" },
  { id: "voice", label: "Voice-ready" },
  { id: "api", label: "API pending" },
] as const;

function activityGlyph(state: "done" | "active" | "todo"): string {
  if (state === "done") return "✓";
  if (state === "active") return "↻";
  return "•";
}

export function AgentContextPanel({ className = "" }: { className?: string }) {
  const { snapshot } = useAgentWorkspace();

  return (
    <aside
      className={`flex min-h-0 min-w-0 flex-col gap-1.5 rounded-lg border border-border/55 bg-soft-rose/[0.1] p-2 shadow-sm ring-1 ring-border/30 backdrop-blur-sm dark:bg-surface/90 ${className}`}
    >
      <div>
        <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-muted">
          Case
        </p>
        <dl className="mt-1 space-y-1 text-[10px] leading-snug">
          <div className="flex gap-1.5">
            <dt className="w-14 shrink-0 text-muted">Symptoms</dt>
            <dd className="min-w-0 text-foreground/90">{snapshot.symptoms}</dd>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-2.5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <dt className="text-muted">Location</dt>
              <dd className="text-foreground">{snapshot.zip}</dd>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Stethoscope className="mt-0.5 size-2.5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <dt className="text-muted">Insurance</dt>
              <dd className="text-foreground/90">{snapshot.insurance}</dd>
            </div>
          </div>
          <div>
            <dt className="text-muted">Specialty</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {snapshot.recommendedSpecialty}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-border/35 pt-2">
        <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Cpu className="size-2.5 text-accent" aria-hidden />
          Live activity
        </p>
        <ul className="mt-1 space-y-0.5">
          {snapshot.activities.map((a) => (
            <li
              key={a.id}
              className={`flex items-start gap-1.5 rounded-md px-1 py-0.5 ${
                a.state === "active"
                  ? "bg-soft-rose/25 ring-1 ring-accent/15"
                  : ""
              }`}
            >
              <span
                className={`w-3 shrink-0 text-center text-[10px] ${
                  a.state === "done"
                    ? "text-sage"
                    : a.state === "active"
                      ? "text-accent motion-safe:animate-pulse"
                      : "text-muted"
                }`}
                aria-hidden
              >
                {a.state === "active" ? (
                  <span className="inline-block motion-safe:animate-spin">↻</span>
                ) : (
                  activityGlyph(a.state)
                )}
              </span>
              <p
                className={`min-w-0 flex-1 text-[10px] leading-tight ${
                  a.state === "done"
                    ? "text-foreground/75"
                    : a.state === "active"
                      ? "font-medium text-foreground"
                      : "text-muted/80"
                }`}
              >
                {a.label}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border/35 pt-2">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
          Integrations
        </p>
        <div className="mt-1 flex flex-wrap gap-0.5">
          {READINESS.map((r) => (
            <span
              key={r.id}
              className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] ${
                r.id === "api"
                  ? "border-border/70 bg-background/80 text-muted"
                  : "border-sage/30 bg-sage/10 text-sage"
              }`}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
