import { AppPage } from "@/components/product/page-system";

export default function TimelineLoading() {
  return (
    <AppPage className="gap-6">
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,72rem)] animate-pulse space-y-6">
        <div className="space-y-2 border-b border-border/40 pb-5">
          <div className="h-3 w-24 rounded bg-border/80" />
          <div className="h-8 w-64 max-w-full rounded bg-border/80" />
          <div className="h-4 w-full max-w-md rounded bg-border/60" />
        </div>
        <div className="flex gap-2 sm:grid sm:grid-cols-4 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 min-w-[45%] shrink-0 rounded-xl border border-border/50 bg-surface/80 sm:min-w-0 sm:h-24" />
          ))}
        </div>
        <div className="h-11 rounded-xl border border-border/50 bg-background/80" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-border/60" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-36 rounded-2xl border border-border/50 bg-surface/80" />
          <div className="h-36 rounded-2xl border border-border/50 bg-surface/80" />
        </div>
      </div>
    </AppPage>
  );
}
