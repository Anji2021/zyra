"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isConfigured } = getSupabasePublicEnv();

  async function handleSignOut() {
    if (!isConfigured) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading || !isConfigured}
      aria-label={loading ? "Signing out" : "Log out"}
      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-soft-rose/40 disabled:cursor-not-allowed disabled:opacity-50 min-[380px]:px-3"
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          <span className="hidden min-[380px]:inline">Signing out…</span>
        </>
      ) : (
        <>
          <LogOut className="size-3.5 shrink-0 min-[380px]:hidden" aria-hidden />
          <span className="hidden min-[380px]:inline">Log out</span>
        </>
      )}
    </button>
  );
}
