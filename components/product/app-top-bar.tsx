"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Loader2, LogOut, MessageSquareText, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { ZYRA } from "@/lib/zyra/site";

type AppTopBarProps = {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export function AppTopBar({ email, displayName, avatarUrl }: AppTopBarProps) {
  const router = useRouter();
  const { isConfigured } = getSupabasePublicEnv();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (displayName?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase();
  const label = displayName?.trim() || email?.trim() || "Your profile";

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      const target = event.target;
      if (target instanceof Node && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  async function handleSignOut() {
    if (!isConfigured || signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="relative z-50 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-3">
      <Link
        href="/app"
        className="shrink-0 font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg"
      >
        {ZYRA.name}
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-end">
        <div
          ref={menuRef}
          className="relative min-w-0 max-w-[min(100%,13rem)] overflow-visible sm:max-w-xs"
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={label}
            title={label}
            className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-background/90 py-0.5 pl-0.5 pr-1.5 transition hover:bg-soft-rose/25 sm:gap-2 sm:py-1 sm:pl-1 sm:pr-3"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-7 shrink-0 rounded-full object-cover sm:size-8"
              />
            ) : (
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-soft-rose text-[11px] font-semibold text-foreground sm:size-8 sm:text-xs"
                aria-hidden
              >
                {initial}
              </span>
            )}
            <span className="hidden min-w-0 max-w-[8rem] truncate text-xs font-medium text-muted min-[380px]:inline sm:max-w-[10.5rem] sm:text-sm">
              {label}
            </span>
            <ChevronDown
              className={`size-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {open ? (
            <div
              role="menu"
              aria-label="Profile menu"
              className="absolute right-0 top-full z-[9999] mt-2 w-[min(15rem,calc(100vw-1rem))] rounded-2xl border border-border bg-surface p-1.5 shadow-lg"
            >
              <Link
                href="/app/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-soft-rose/30"
              >
                <UserRound className="size-4 shrink-0 text-accent" aria-hidden />
                Profile
              </Link>
              <Link
                href="/app/feedback"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-soft-rose/30"
              >
                <MessageSquareText className="size-4 shrink-0 text-accent" aria-hidden />
                Feedback
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                disabled={!isConfigured || signingOut}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-soft-rose/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOut ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden />
                ) : (
                  <LogOut className="size-4 shrink-0 text-accent" aria-hidden />
                )}
                {signingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
