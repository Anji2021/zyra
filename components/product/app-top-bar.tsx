"use client";

import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ZYRA } from "@/lib/zyra/site";

type AppTopBarProps = {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export function AppTopBar({ email, displayName, avatarUrl }: AppTopBarProps) {
  const initial = (displayName?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase();
  const label = displayName?.trim() || email?.trim() || "Your profile";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <Link
        href="/app"
        className="shrink-0 font-serif text-lg font-semibold tracking-tight text-foreground"
      >
        {ZYRA.name}
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2 rounded-full border border-border bg-background/90 py-1 pl-1 pr-2 sm:max-w-xs sm:pr-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="size-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft-rose text-xs font-semibold text-foreground"
              aria-hidden
            >
              {initial}
            </span>
          )}
          <span className="truncate text-xs font-medium text-muted sm:text-sm" title={label}>
            {label}
          </span>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
