"use client";

import { useCallback, useId, useState } from "react";

type InsightCarePrepContextProps = {
  carePrepScript: string;
};

/** Collapsed: ~3–4 lines; expanded shows full “Context from logs” narrative. */
export function InsightCarePrepContext({ carePrepScript }: InsightCarePrepContextProps) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  if (!carePrepScript.trim()) {
    return null;
  }

  return (
    <div data-pdf-card className="rounded-lg border border-border/40 bg-background/70 px-3 py-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Context (from logs)</h3>
      <p
        id={regionId}
        className={
          expanded
            ? "mt-1 text-xs leading-relaxed text-foreground sm:text-sm"
            : "mt-1 line-clamp-4 text-xs leading-relaxed text-foreground sm:text-sm"
        }
      >
        {carePrepScript}
      </p>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={regionId}
        className="no-print mt-2 text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
      >
        {expanded ? "Hide full context" : "Show full context"}
      </button>
    </div>
  );
}
