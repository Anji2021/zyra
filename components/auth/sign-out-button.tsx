"use client";

import { Loader2 } from "lucide-react";
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
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-soft-rose/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Signing out…
        </>
      ) : (
        "Log out"
      )}
    </button>
  );
}
