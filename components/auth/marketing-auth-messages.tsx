"use client";

import { useSearchParams } from "next/navigation";

export function MarketingAuthMessages() {
  const searchParams = useSearchParams();
  const auth = searchParams.get("auth");
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  if (error === "auth") {
    const decoded =
      message != null && message.length > 0
        ? (() => {
            try {
              return decodeURIComponent(message);
            } catch {
              return message;
            }
          })()
        : "Google sign-in did not finish. Please try again.";
    return (
      <div
        role="alert"
        className="border-b border-red-200/80 bg-red-50 px-4 py-3 text-center text-sm text-red-950"
      >
        {decoded}
      </div>
    );
  }

  if (error === "config") {
    return (
      <div
        role="alert"
        className="border-b border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
      >
        Supabase environment variables are missing. Add{" "}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">.env.local</code>,
        then restart the dev server.
      </div>
    );
  }

  if (auth === "required") {
    return (
      <div
        role="status"
        className="border-b border-border bg-soft-rose/60 px-4 py-3 text-center text-sm text-muted"
      >
        Sign in with Google to open your private Zyra space.
      </div>
    );
  }

  return null;
}
