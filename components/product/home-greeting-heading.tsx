"use client";

import { useEffect, useState } from "react";
import {
  formatGreetingWithName,
  GREETING_NEUTRAL_FALLBACK,
} from "@/lib/utils/getGreeting";

type HomeGreetingHeadingProps = {
  firstName: string;
};

/**
 * Client-only time-based greeting using the user's local clock.
 * Initial paint uses a stable "Hello, {name}" so server HTML and first client pass match (no hydration warning).
 * After mount, updates to the real phrase and refreshes every minute (crosses segments like midnight over time).
 */
export function HomeGreetingHeading({ firstName }: HomeGreetingHeadingProps) {
  const safeName = firstName.trim() || "there";
  const [line, setLine] = useState(`${GREETING_NEUTRAL_FALLBACK}, ${safeName}`);

  useEffect(() => {
    const apply = () => setLine(formatGreetingWithName(safeName));
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, [safeName]);

  return <span suppressHydrationWarning>{line}</span>;
}
