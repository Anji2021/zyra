import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { TOPIC_SLUGS_ORDERED, SEO_TOPICS } from "@/lib/marketing/seo-topics-registry";
import { ZYRA } from "@/lib/zyra/site";

export const metadata: Metadata = {
  title: "Women’s health topics & tracking guides | Zyra",
  description:
    "Educational guides on irregular cycles, period symptoms, PMS tracking, and reproductive wellness—with private logging and clinician-ready preparation. Not medical advice.",
  alternates: { canonical: "/topics" },
  openGraph: {
    title: "Women’s health topics | Zyra",
    description:
      "Scalable educational topics for symptom and cycle tracking, written for clarity and care preparation.",
    url: "/topics",
    siteName: ZYRA.name,
    type: "website",
    images: [{ url: "/zyra-icon-512.png", width: 512, height: 512, alt: `${ZYRA.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Women’s health topics | Zyra",
    description:
      "Scalable educational topics for symptom and cycle tracking, written for clarity and care preparation.",
    images: ["/zyra-icon-512.png"],
  },
};

export default function TopicsIndexPage() {
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
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Topic library</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Topics for thoughtful tracking
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Each guide is intentionally short, medically cautious, and aligned with how {ZYRA.name} supports private logs
            and educational AI insights—not diagnosis or treatment.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl list-none gap-3 sm:grid-cols-2">
          {TOPIC_SLUGS_ORDERED.map((slug) => {
            const t = SEO_TOPICS[slug];
            return (
              <li key={slug}>
                <Link
                  href={`/topics/${slug}`}
                  className="flex h-full min-h-[4.75rem] flex-col rounded-2xl border border-border/80 bg-surface/95 p-4 text-left shadow-sm transition hover:border-accent/35 hover:bg-soft-rose/15"
                >
                  <span className="font-serif text-base font-semibold text-foreground">{t.cardLabel}</span>
                  <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{t.metaDescription}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-border/80 bg-soft-rose/25 p-5 text-center">
          <p className="text-sm font-medium text-foreground">Ready to log in context?</p>
          <div className="mt-4 flex justify-center">
            <GoogleSignInButton variant="primary" label="Start tracking privately with Zyra" />
          </div>
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
