/** Static product preview card for the marketing hero (no client JS). */
export function MarketingHeroPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/75 bg-surface/95 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-soft-rose/35 via-transparent to-transparent opacity-90"
        aria-hidden
      />
      <div className="relative space-y-5 p-6 sm:p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Private workspace</p>
          <p className="mt-2 font-serif text-lg font-semibold text-foreground sm:text-xl">Your snapshot</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Preview of how structured logs translate into clearer care preparation.
          </p>
        </div>

        <div className="space-y-2.5 rounded-xl border border-border/70 bg-background/85 p-4 ring-1 ring-border/35">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted">This month</span>
            <span className="rounded-full bg-soft-rose/40 px-2 py-0.5 text-[10px] font-semibold text-accent">
              Educational
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-[72%] rounded-full bg-accent/35" aria-hidden />
            <div className="h-2 w-[92%] rounded-full bg-soft-rose/55" aria-hidden />
            <div className="h-2 w-[56%] rounded-full bg-border/90" aria-hidden />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Symptom and cycle signals stay linked to calendar context—summaries emphasize patterns, not diagnoses.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-soft-rose/20 px-4 py-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Reminder:</span> {` `}
          Zyra shares educational cues only—urgent symptoms belong with emergency clinicians.
        </div>
      </div>
    </div>
  );
}
