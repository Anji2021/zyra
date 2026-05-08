"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, CalendarDays, Pill, TrendingUp } from "lucide-react";
import type {
  WhatChangedComparisonKey,
  WhatChangedEmptyReason,
  WhatChangedInsightSet,
  WhatChangedStatus,
} from "@zyra/shared";

type WhatChangedSectionProps = {
  data: WhatChangedInsightSet;
  title?: string;
  subtitle?: string;
  variant?: "default" | "compact";
  className?: string;
  showSelector?: boolean;
  maxCards?: number;
};

function emptyCopy(reason: WhatChangedEmptyReason | null): string {
  if (reason === "insufficient_data") {
    return "Log more data to see what changed over time.";
  }
  if (reason === "no_shift_detected") {
    return "No big shifts detected comparing this week to last — keep logging; small comparisons get clearer with more history.";
  }
  return "Log more data to see what changed over time.";
}

/**
 * Rule-based pattern summary — educational only, not diagnosis.
 */
export function WhatChangedSection({
  data,
  title = "What Changed?",
  subtitle,
  variant = "default",
  className = "",
  showSelector = true,
  maxCards = 3,
}: WhatChangedSectionProps) {
  const compact = variant === "compact";
  const pad = compact ? "p-3" : "p-4 sm:p-5";
  const gap = compact ? "gap-2.5" : "gap-3 sm:gap-4";
  const [selectedKey, setSelectedKey] = useState<WhatChangedComparisonKey>(data.defaultComparisonKey);
  const selected = useMemo(() => data.results[selectedKey] ?? data.results[data.defaultComparisonKey], [data, selectedKey]);
  const cards = selected.cards.slice(0, Math.max(1, maxCards));

  return (
    <section
      className={`rounded-2xl border border-border/55 bg-surface/95 shadow-sm ${className}`}
      aria-labelledby="what-changed-heading"
    >
      <div className={`border-b border-border/40 ${pad}`}>
        <div className="flex items-start gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft-rose/50 text-accent">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="what-changed-heading" className="font-serif text-base font-semibold text-foreground sm:text-lg">
              {title}
            </h2>
            <p className="mt-1 text-xs text-muted">{subtitle ?? data.subtitle}</p>
            <p className="mt-1 text-[11px] text-muted sm:text-xs">Educational pattern summary only — not medical advice.</p>
          </div>
        </div>
      </div>

      {showSelector ? (
        <div className={`border-b border-border/35 ${pad}`}>
          <label htmlFor="what-changed-comparison" className="text-[11px] font-medium text-muted">
            Time comparison
          </label>
          <select
            id="what-changed-comparison"
            className="mt-1.5 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value as WhatChangedComparisonKey)}
          >
            {data.options.map((opt) => (
              <option key={opt.key} value={opt.key} disabled={!opt.available}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[10px] text-muted/90 sm:text-[11px]">{selected.comparisonLabel}</p>
        </div>
      ) : (
        <div className={`border-b border-border/35 ${pad}`}>
          <p className="text-[10px] text-muted/90 sm:text-[11px]">{selected.comparisonLabel}</p>
        </div>
      )}

      <div className={pad}>
        {data.fetchError ? (
          <p className="text-center text-sm leading-relaxed text-muted" role="alert">
            {data.fetchError}
          </p>
        ) : selected.cards.length === 0 ? (
          <>
            <p className="text-center text-sm leading-relaxed text-muted">
              {selected.emptyReason === "insufficient_data"
                ? "Log cycles, symptoms, medicines, and notes over time to see what changed."
                : emptyCopy(selected.emptyReason)}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link
                href="/app/health-log"
                className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-soft-rose/35"
              >
                Log symptom
              </Link>
              <Link
                href="/app/health-log"
                className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-soft-rose/35"
              >
                Add medicine
              </Link>
              <Link
                href="/app/timeline"
                className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-soft-rose/35"
              >
                Go to Timeline
              </Link>
            </div>
          </>
        ) : (
          <ul className={`grid ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"} ${gap}`}>
            {cards.map((c) => (
              <li
                key={c.id}
                className={`rounded-xl border border-border/50 bg-background/90 ${compact ? "px-3 py-2.5" : "px-3 py-3 sm:px-4 sm:py-3.5"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-accent">{iconForCard(c.id)}</span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.title}</p>
                </div>
                <p className="mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass(c.status)}`}>
                    {statusLabel(c.status)}
                  </span>
                </p>
                <p className={`mt-2 font-semibold leading-snug text-foreground ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
                  {c.changeDetected}
                </p>
                <p className={`mt-1.5 leading-relaxed text-muted ${compact ? "text-xs" : "text-xs sm:text-sm"}`}>
                  {c.whyItMatters}
                </p>
                <p className={`mt-2 border-t border-border/35 pt-2 text-muted ${compact ? "text-[11px]" : "text-[11px] sm:text-xs"}`}>
                  <span className="font-medium text-foreground/90">Suggested · </span>
                  {c.suggestedNext}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function statusLabel(status: WhatChangedStatus): string {
  if (status === "not_enough_data") return "Not enough data";
  return status[0].toUpperCase() + status.slice(1);
}

function badgeClass(status: WhatChangedStatus): string {
  switch (status) {
    case "increased":
      return "bg-soft-rose/45 text-accent";
    case "decreased":
      return "bg-emerald-50 text-emerald-700";
    case "new":
      return "bg-violet-50 text-violet-700";
    case "stable":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function iconForCard(id: string) {
  if (id === "cycle") return <CalendarDays className="size-4" aria-hidden />;
  if (id === "medicines") return <Pill className="size-4" aria-hidden />;
  return <Activity className="size-4" aria-hidden />;
}
