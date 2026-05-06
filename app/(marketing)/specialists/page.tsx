import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TOPIC_SLUGS_ORDERED, SEO_TOPICS } from "@/lib/marketing/seo-topics-registry";
import { ZYRA } from "@/lib/zyra/site";

const title = "Find specialists & prepare for appointments | Zyra";
const description =
  `${ZYRA.name} helps users organize symptoms, cycles, and care-preparation notes before clinician visits—and offers an in-app pathway to browse nearby specialties after sign-in. Educational only—not medical advice.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/specialists" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/specialists",
    siteName: ZYRA.name,
    images: [{ url: "/zyra-icon-512.png", width: 512, height: 512, alt: `${ZYRA.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/zyra-icon-512.png"],
  },
};

export default function SpecialistsMarketingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-none md:bg-surface/80 md:backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {ZYRA.name}
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link href="/privacy" className="text-xs font-medium text-muted transition hover:text-foreground sm:text-sm">
              Privacy
            </Link>
            <GoogleSignInButton variant="nav" label="Sign in" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Care preparation</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Narrowing questions before you see a specialist
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{description}</p>
          <p className="mt-4 rounded-xl border border-border/70 bg-surface/80 p-4 text-xs leading-relaxed text-muted sm:text-sm">
            {ZYRA.name} does not diagnose, treat, or rank clinicians.             Nearby search availability depends on configuration
            and sign-in. Always verify licensing and suitability with licensed professionals you trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <GoogleSignInButton variant="primary" label="Continue to specialist search after sign-in" modalInitialMode="signup" />
            <Link
              href="/topics"
              className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
            >
              Browse topic guides
            </Link>
            <Link
              href="/womens-health-ai"
              className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
            >
              Women&apos;s health AI companion
            </Link>
          </div>
          <section className="mt-12">
            <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">Popular topics ahead of appointments</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {TOPIC_SLUGS_ORDERED.slice(0, 4).map((slug) => {
                const t = SEO_TOPICS[slug];
                return (
                  <li key={slug}>
                    <Link
                      href={`/topics/${slug}`}
                      className="block rounded-2xl border border-border/80 bg-surface/95 p-4 text-sm font-medium text-foreground transition hover:border-accent/35 hover:bg-soft-rose/15"
                    >
                      {t.cardLabel}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Prefer the full set?{" "}
              <Link href="/topics" className="font-semibold text-accent underline-offset-2 hover:underline">
                Open the topic hub
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-xs text-muted">
        <Link href="/" className="underline-offset-2 hover:underline">
          Home
        </Link>
        {" · "}
        <Link href="/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}
