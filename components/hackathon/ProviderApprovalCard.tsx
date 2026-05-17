import { Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import type { DemoAvailability, DemoProvider } from "@/lib/demoData";
import { slotKeyFromParts } from "@/lib/agentIntegrations/booking";

export type ProviderApprovalCardProps = {
  providers: DemoProvider[];
  availabilityById: Map<string, DemoAvailability>;
  selectedSlots: Record<string, string>;
  onSlotChange: (providerId: string, slotKey: string) => void;
  onApproveContact: () => void;
  onDecline: () => void;
  onBookSelectedSlot: () => void | Promise<void>;
  onSendConfirmationEmail: () => void | Promise<void>;
  disabled?: boolean;
  busyAction?: null | "approve" | "book" | "email";
  /** Hackathon workspace: operator-style approve surface. */
  layout?: "default" | "workspace";
  onEditSelections?: () => void;
  /** Return user to Web Wrangler research step (hackathon workspace). */
  onBackToResearch?: () => void;
  onPreviewOutreach?: () => void;
};

export function ProviderApprovalCard({
  providers,
  availabilityById,
  selectedSlots,
  onSlotChange,
  onApproveContact,
  onDecline,
  onBookSelectedSlot,
  onSendConfirmationEmail,
  disabled = false,
  busyAction = null,
  layout = "default",
  onEditSelections,
  onBackToResearch,
  onPreviewOutreach,
}: ProviderApprovalCardProps) {
  const isWorkspace = layout === "workspace";

  const slotRows = (
    <ul className={isWorkspace ? "mt-3 space-y-2" : "mt-4 space-y-3"}>
      {providers.map((provider) => {
        const avail = availabilityById.get(provider.id);
        const slots = avail?.slots ?? [];
        const value = selectedSlots[provider.id] ?? "";
        return (
          <li
            key={provider.id}
            className={
              isWorkspace
                ? "rounded-xl border border-border/60 bg-background/70 px-3 py-2.5"
                : "rounded-2xl border border-border/60 bg-surface/95 px-3 py-3 sm:px-4 sm:py-3.5"
            }
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-soft-rose/80 text-accent"
                  aria-hidden
                >
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {provider.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {provider.specialty} · {provider.clinic}
                  </p>
                </div>
                <span
                  className={`shrink-0 self-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    provider.inNetwork
                      ? "bg-sage/15 text-sage"
                      : "bg-background text-muted"
                  }`}
                >
                  {provider.inNetwork ? "In network" : "Out of network"}
                </span>
              </div>
            </div>
            {slots.length > 0 ? (
              <div className={isWorkspace ? "mt-2 pl-0 sm:pl-11" : "mt-2.5 pl-0 sm:pl-11"}>
                <label
                  htmlFor={`slot-${provider.id}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
                >
                  Preferred slot
                </label>
                <select
                  id={`slot-${provider.id}`}
                  value={value}
                  onChange={(e) => onSlotChange(provider.id, e.target.value)}
                  disabled={disabled}
                  className="mt-1.5 w-full max-w-md rounded-xl border border-border bg-background/80 px-3 py-2 text-sm text-foreground focus:border-accent/50 focus:outline-none disabled:opacity-60"
                >
                  {slots.map((s) => {
                    const key = slotKeyFromParts(s.date, s.time);
                    return (
                      <option key={key} value={key}>
                        {s.date} · {s.time} (
                        {s.type === "telehealth" ? "Telehealth" : "In person"})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  if (isWorkspace) {
    return (
      <section className="rounded-lg border border-border/50 bg-surface/90 p-2 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-serif text-sm font-semibold text-foreground">
            Approve Zyra to contact
          </h3>
          <div className="flex flex-wrap justify-end gap-0.5">
            {(
              [
                ["Browser-ready", "sage"],
                ["Email-ready", "sage"],
                ["Voice-ready", "sage"],
                ["API pending", "muted"],
              ] as const
            ).map(([label, tone]) => (
              <span
                key={label}
                className={`rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.06em] ${
                  tone === "sage"
                    ? "border-sage/30 bg-sage/10 text-sage"
                    : "border-border/70 bg-background/80 text-muted"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-1.5 rounded-md border border-border/40 bg-background/40 p-1.5">
          <ul className="space-y-1">
            {providers.map((provider) => {
              const avail = availabilityById.get(provider.id);
              const slots = avail?.slots ?? [];
              const value = selectedSlots[provider.id] ?? "";
              const m = provider.providerResearch?.matchScore;
              return (
                <li
                  key={provider.id}
                  className="flex flex-col gap-1 rounded border border-border/40 bg-surface/80 px-1.5 py-1 sm:flex-row sm:items-end sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">
                      {provider.name}
                    </p>
                    <p className="truncate text-[9px] text-muted">{provider.clinic}</p>
                    {m != null ? (
                      <p className="text-[9px] text-muted">
                        Match {m}
                        <span className="text-foreground/80">
                          {" "}
                          · {provider.inNetwork ? "In-network" : "OON"}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  {slots.length > 0 ? (
                    <div className="flex shrink-0 flex-col sm:items-end">
                      <label
                        htmlFor={`slot-${provider.id}`}
                        className="text-[8px] font-semibold uppercase tracking-[0.08em] text-muted"
                      >
                        Slot
                      </label>
                      <select
                        id={`slot-${provider.id}`}
                        value={value}
                        onChange={(e) => onSlotChange(provider.id, e.target.value)}
                        disabled={disabled}
                        className="mt-0.5 max-w-[12rem] rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-[10px] text-foreground focus:border-accent/40 focus:outline-none disabled:opacity-60"
                      >
                        {slots.map((s) => {
                          const key = slotKeyFromParts(s.date, s.time);
                          return (
                            <option key={key} value={key}>
                              {s.date} · {s.time}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={onApproveContact}
              disabled={disabled || busyAction !== null}
              className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full bg-accent px-3 text-[11px] font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "approve" ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : null}
              Approve Zyra to contact
            </button>
            {onPreviewOutreach ? (
              <button
                type="button"
                onClick={onPreviewOutreach}
                disabled={disabled || busyAction !== null}
                className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full border border-border/70 bg-surface px-3 text-[11px] font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="size-3" aria-hidden />
                Preview outreach
              </button>
            ) : null}
            {onBackToResearch ? (
              <button
                type="button"
                onClick={onBackToResearch}
                disabled={disabled || busyAction !== null}
                className="inline-flex min-h-7 items-center justify-center rounded-full border border-border/60 bg-background/80 px-3 text-[11px] font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
            ) : null}
            {onEditSelections ? (
              <button
                type="button"
                onClick={onEditSelections}
                disabled={disabled || busyAction !== null}
                className="inline-flex min-h-7 items-center justify-center rounded-full border border-border/60 px-3 text-[11px] font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1 sm:justify-end">
            <button
              type="button"
              onClick={onDecline}
              disabled={disabled || busyAction !== null}
              className="inline-flex min-h-7 items-center justify-center rounded-full border border-border/60 px-2.5 text-[11px] font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => void onSendConfirmationEmail()}
              disabled={disabled || busyAction !== null}
              className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full border border-accent/25 bg-soft-rose/20 px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-soft-rose/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "email" ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : null}
              Email
            </button>
            <button
              type="button"
              onClick={() => void onBookSelectedSlot()}
              disabled={disabled || busyAction !== null}
              className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full border border-border/60 bg-surface px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "book" ? (
                <Loader2 className="size-3 animate-spin" aria-hidden />
              ) : null}
              Book
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-accent/30 bg-soft-rose/30 p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"
          aria-hidden
        >
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Approval & booking
          </p>
          <h3 className="mt-1 font-serif text-lg font-semibold text-foreground sm:text-xl">
            Would you like Zyra to contact these clinics?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Zyra will reach out on your behalf to confirm availability, verify
            insurance, and request a new-patient intake. You stay in control —
            nothing is booked without your approval.
          </p>
        </div>
      </div>

      {slotRows}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={onDecline}
          disabled={disabled || busyAction !== null}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/80 bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void onSendConfirmationEmail()}
          disabled={disabled || busyAction !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/80 bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
        >
          {busyAction === "email" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Send confirmation email
        </button>
        <button
          type="button"
          onClick={() => void onBookSelectedSlot()}
          disabled={disabled || busyAction !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent/40 bg-background/90 px-4 text-sm font-semibold text-foreground transition hover:bg-soft-rose/40 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
        >
          {busyAction === "book" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Book selected slot
        </button>
        <button
          type="button"
          onClick={onApproveContact}
          disabled={disabled || busyAction !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
        >
          {busyAction === "approve" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Approve Zyra to contact
        </button>
      </div>
    </section>
  );
}
