"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { MarketingAuthModalMode } from "@/components/auth/marketing-auth-shell";
import { useOptionalMarketingAuthChoice } from "@/components/auth/marketing-auth-shell";
import { startGoogleOAuthSignIn } from "@/components/auth/oauth-google-client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type Variant = "primary" | "outline" | "nav";

const styles: Record<Variant, string> = {
  primary:
    "inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
  outline:
    "inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-full border border-border bg-surface px-8 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-60",
  nav: "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
};

type GoogleSignInButtonProps = {
  variant?: Variant;
  className?: string;
  label?: string;
  /**
   * Skip the marketing auth modal and start Google OAuth immediately.
   * Useful outside `MarketingAuthShell` or for dedicated Google-only flows.
   */
  forceDirectGoogleOAuth?: boolean;
  /** Initial tab when opened via marketing auth modal. Defaults to `signin`. */
  modalInitialMode?: MarketingAuthModalMode;
};

export function GoogleSignInButton({
  variant = "primary",
  className = "",
  label = "Sign in with Google",
  forceDirectGoogleOAuth = false,
  modalInitialMode = "signin",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConfigured } = getSupabasePublicEnv();
  const openMarketingAuth = useOptionalMarketingAuthChoice();

  async function runGoogleOAuth() {
    setError(null);
    if (!isConfigured) {
      setError("Supabase is not configured. Check .env.local.");
      return;
    }
    setLoading(true);
    const errMsg = await startGoogleOAuthSignIn();
    if (errMsg) {
      console.error("[GoogleSignIn] OAuth failed:", errMsg);
      setError(errMsg);
      setLoading(false);
    }
  }

  function handleClick() {
    setError(null);
    if (!forceDirectGoogleOAuth && openMarketingAuth) {
      openMarketingAuth({ mode: modalInitialMode });
      return;
    }
    void runGoogleOAuth();
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !isConfigured}
        className={styles[variant]}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>Connecting…</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-red-700/90 sm:text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
