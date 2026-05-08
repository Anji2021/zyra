"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AppPage, PageHeader } from "@/components/product/page-system";

export default function TimelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[timeline]", error);
  }, [error]);

  return (
    <AppPage className="gap-5">
      <PageHeader
        eyebrow="Timeline"
        title="Couldn’t load timeline"
        subtitle="Something went wrong while loading your health timeline. Your data is still private — try again in a moment."
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-soft-rose/30"
        >
          Try again
        </button>
        <Link
          href="/app/insights"
          className="rounded-full border border-border/70 bg-surface/90 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/30"
        >
          Back to Insights
        </Link>
      </div>
    </AppPage>
  );
}
