"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function GaRouteViewsInner({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPageView = useRef(true);

  useEffect(() => {
    if (!gaId || typeof window.gtag !== "function") return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (isFirstPageView.current) {
      isFirstPageView.current = false;
      return;
    }

    window.gtag("config", gaId, {
      page_path: pagePath,
      send_page_view: true,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}

/** Sends GA4 page_view on App Router navigations (initial load handled by inline `gtag('config')` in layout). */
export function GoogleAnalyticsRouteViews({ gaId }: { gaId: string }) {
  return (
    <Suspense fallback={null}>
      <GaRouteViewsInner gaId={gaId} />
    </Suspense>
  );
}

/** Development-only: logs whether GA is configured for this environment. */
export function GaDevLogger({ configured }: { configured: boolean }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log(`GA loaded: ${configured}`);
  }, [configured]);

  return null;
}
