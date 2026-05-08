import { AppPage } from "@/components/product/page-system";

export default function InsightsLoading() {
  return (
    <AppPage className="gap-6">
      <div
        className="mx-auto w-full min-w-0 max-w-6xl animate-pulse space-y-6"
        role="status"
        aria-live="polite"
      >
        <div className="h-40 rounded-3xl border border-border/50 bg-surface/80" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border/50 bg-background/80" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-48 rounded-2xl border border-border/50 bg-surface/80" />
          <div className="h-48 rounded-2xl border border-border/50 bg-surface/80" />
          <div className="h-48 rounded-2xl border border-border/50 bg-surface/80" />
        </div>
        <p className="text-sm text-muted">Loading your insights…</p>
      </div>
    </AppPage>
  );
}
