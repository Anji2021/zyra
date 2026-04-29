import Link from "next/link";
import type { Metadata } from "next";
import { ZYRA } from "@/lib/zyra/site";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/80 bg-surface/90 px-5 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
            {ZYRA.name}
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Onboarding
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">{children}</div>
    </div>
  );
}
