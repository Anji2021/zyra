export default function InsightsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6" role="status" aria-live="polite">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
        Insights
      </p>
      <p className="text-sm text-muted">Loading your insights…</p>
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl border border-border/60 bg-surface/80" />
        <div className="h-24 animate-pulse rounded-2xl border border-border/60 bg-surface/80" />
        <div className="h-24 animate-pulse rounded-2xl border border-border/60 bg-surface/80" />
      </div>
    </div>
  );
}
