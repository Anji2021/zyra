"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthChoiceModal } from "@/components/auth/auth-choice-modal";

export type MarketingAuthModalMode = "signin" | "signup";

type AuthModalCtx = {
  openAuthChoice: (opts?: { mode?: MarketingAuthModalMode }) => void;
};

const MarketingAuthModalContext = createContext<AuthModalCtx | null>(null);

export function useMarketingAuthChoice(): AuthModalCtx | null {
  return useContext(MarketingAuthModalContext);
}

/** Returns open callback when inside marketing auth shell; null otherwise. */
export function useOptionalMarketingAuthChoice(): AuthModalCtx["openAuthChoice"] | null {
  const ctx = useContext(MarketingAuthModalContext);
  return ctx?.openAuthChoice ?? null;
}

export function MarketingAuthShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<MarketingAuthModalMode>("signin");

  const openAuthChoice = useCallback((opts?: { mode?: MarketingAuthModalMode }) => {
    if (opts?.mode) setInitialMode(opts.mode);
    else setInitialMode("signin");
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openAuthChoice }), [openAuthChoice]);

  return (
    <MarketingAuthModalContext.Provider value={value}>
      {children}
      <AuthChoiceModal open={open} onOpenChange={setOpen} initialMode={initialMode} />
    </MarketingAuthModalContext.Provider>
  );
}
