"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppPageShell } from "@/components/product/app-page-shell";
import { AppTopBar } from "@/components/product/app-top-bar";
import { productMobileNav, productSidebarNav } from "@/lib/zyra/navigation";
import { MedicalStrip } from "./medical-strip";

function navIsActive(pathname: string, href: string): boolean {
  if (href === "/app/more") {
    return (
      pathname === "/app/more" ||
      pathname === "/app/profile" ||
      pathname === "/app/specialists" ||
      pathname === "/app/saved" ||
      pathname === "/app/insights" ||
      pathname === "/app/resources" ||
      pathname.startsWith("/app/resources/")
    );
  }
  if (href === "/app") {
    return pathname === "/app" || pathname === "/app/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navIconClasses(active: boolean) {
  return active ? "text-accent" : "text-muted";
}

export type ProductShellProps = {
  children: React.ReactNode;
  userEmail: string | null;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
};

export function ProductShell({
  children,
  userEmail,
  userDisplayName,
  userAvatarUrl,
}: ProductShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <MedicalStrip />
      <AppTopBar
        email={userEmail}
        displayName={userDisplayName}
        avatarUrl={userAvatarUrl}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="relative hidden w-52 shrink-0 flex-col border-r border-border/80 bg-surface/95 py-6 pl-4 pr-2 lg:flex xl:w-56">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            Navigate
          </p>

          <nav className="mt-5 flex flex-col gap-1" aria-label="Product">
            {productSidebarNav.map((item) => {
              const active = navIsActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out ${
                    active
                      ? "bg-soft-rose/90 text-foreground shadow-sm"
                      : "text-muted hover:bg-background/80 hover:text-foreground"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${navIconClasses(active)}`} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-8 text-[11px] leading-relaxed text-muted/95">
            Private by design. Your clinician leads your care; Zyra supports the conversation.
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="relative flex-1 overflow-y-auto px-4 py-5 pb-28 sm:px-6 sm:py-8 lg:pb-10">
            <AppPageShell>{children}</AppPageShell>
          </main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_24px_-8px_rgba(42,38,44,0.08)] backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg items-end justify-between gap-1">
          {productMobileNav.map((item) => {
            const active = navIsActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold tracking-tight transition-colors duration-200 ease-out ${
                    active
                      ? "text-accent"
                      : "text-muted hover:text-foreground/90"
                  }`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-2xl transition-colors duration-200 ease-out ${
                      active ? "bg-soft-rose/90 text-accent shadow-sm" : "bg-transparent"
                    }`}
                  >
                    <Icon className="size-[1.15rem] shrink-0" aria-hidden />
                  </span>
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
