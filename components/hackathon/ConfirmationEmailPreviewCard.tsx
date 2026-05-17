"use client";

import { Mail } from "lucide-react";

export type ConfirmationEmailPreviewCardProps = {
  providerName: string;
  appointmentLine: string;
  clinicLine: string;
  intakeLink: string | null;
  whatToBring: string[];
  questionsForClinician: string[];
  onSend: () => void | Promise<void>;
  sent: boolean;
  disabled?: boolean;
  /** Hackathon workspace: minimal confirmation strip. */
  layout?: "default" | "workspace";
};

export function ConfirmationEmailPreviewCard({
  providerName,
  appointmentLine,
  clinicLine,
  intakeLink,
  whatToBring,
  questionsForClinician,
  onSend,
  sent,
  disabled = false,
  layout = "default",
}: ConfirmationEmailPreviewCardProps) {
  if (layout === "workspace") {
    return (
      <section className="rounded-md border border-border/50 bg-surface/80 p-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            Email preview
          </p>
          <button
            type="button"
            onClick={() => void onSend()}
            disabled={disabled || sent}
            className="inline-flex min-h-6 items-center justify-center rounded-full bg-accent px-2.5 text-[10px] font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sent ? "Sent (demo)" : "Send"}
          </button>
        </div>
        <div className="mt-1 rounded border border-dashed border-border/60 bg-background/50 p-1.5 text-[10px] leading-snug text-muted">
          <p className="font-medium text-foreground">
            Subject: Visit with {providerName}
          </p>
          <p className="mt-0.5">
            <span className="text-foreground/80">When:</span> {appointmentLine}
          </p>
          <p className="truncate">
            <span className="text-foreground/80">Where:</span> {clinicLine}
          </p>
          {intakeLink ? (
            <p className="mt-0.5 truncate text-accent" title={intakeLink}>
              Intake: {intakeLink}
            </p>
          ) : null}
        </div>
        {sent ? (
          <p className="mt-1 text-[9px] font-medium text-sage" role="status">
            Simulated — AgentMail when wired.
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent"
          aria-hidden
        >
          <Mail className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Email preview
          </p>
          <h3 className="mt-1 font-serif text-lg font-semibold text-foreground sm:text-xl">
            Confirmation email ready
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Review the draft below. Sending uses a simulated transport until
            AgentMail is connected.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-background/60 p-3 text-sm sm:p-4">
        <p className="font-semibold text-foreground">Subject: Your appointment with {providerName}</p>
        <p className="mt-3 text-muted">
          <span className="font-medium text-foreground">When:</span> {appointmentLine}
        </p>
        <p className="mt-1 text-muted">
          <span className="font-medium text-foreground">Where:</span> {clinicLine}
        </p>
        {intakeLink ? (
          <p className="mt-1 break-all text-muted">
            <span className="font-medium text-foreground">Intake:</span>{" "}
            <span className="text-accent">{intakeLink}</span>
          </p>
        ) : null}
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            What to bring
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground">
            {whatToBring.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Questions to ask
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground">
            {questionsForClinician.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={disabled || sent}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send email confirmation
        </button>
        {sent ? (
          <p className="text-sm font-medium text-sage" role="status">
            Confirmation email simulated — ready for AgentMail integration.
          </p>
        ) : null}
      </div>
    </section>
  );
}
