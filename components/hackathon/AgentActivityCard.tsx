import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Loader2 } from "lucide-react";

export type AgentActivityStatus = "queued" | "running" | "done";

export type AgentActivityCardProps = {
  icon: LucideIcon;
  title: string;
  detail: string;
  status: AgentActivityStatus;
};

export function AgentActivityCard({
  icon: Icon,
  title,
  detail,
  status,
}: AgentActivityCardProps) {
  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border bg-surface/95 p-3.5 shadow-sm transition-colors sm:p-4 ${
        isDone
          ? "border-sage/40"
          : isRunning
            ? "border-accent/40"
            : "border-border/70"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          isDone
            ? "bg-sage/15 text-sage"
            : isRunning
              ? "bg-soft-rose/90 text-accent"
              : "bg-background text-muted"
        }`}
        aria-hidden
      >
        <Icon className="size-[1.05rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted sm:text-[13px]">
          {detail}
        </p>
      </div>
      <span
        className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
          isDone ? "text-sage" : isRunning ? "text-accent" : "text-muted"
        }`}
      >
        {isDone ? (
          <CheckCircle2 className="size-3.5" aria-hidden />
        ) : isRunning ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : null}
        {isDone ? "Done" : isRunning ? "Working" : "Queued"}
      </span>
    </div>
  );
}
