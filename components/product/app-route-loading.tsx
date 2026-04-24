/** Calm skeleton for route-level `loading.tsx` in the companion app. */
export function AppRouteLoading() {
  return (
    <div
      className="mx-auto w-full max-w-3xl space-y-6 pb-4 lg:max-w-4xl"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-soft-rose/90" />
        <div className="h-9 w-full max-w-xs animate-pulse rounded-full bg-soft-rose/70" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-border/80" />
        <div className="h-4 w-full max-w-sm animate-pulse rounded-full bg-border/60" />
      </div>
      <div className="h-52 animate-pulse rounded-3xl border border-border/40 bg-surface/60 shadow-sm" />
      <div className="h-36 animate-pulse rounded-3xl border border-border/40 bg-surface/50" />
    </div>
  );
}
