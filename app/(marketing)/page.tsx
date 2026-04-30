import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LandingDoctorMatch } from "@/components/marketing/landing-doctor-match";
import { ZYRA } from "@/lib/zyra/site";

const faqItems = [
  {
    question: "What is Zyra?",
    answer:
      "Zyra is a women’s health companion for cycle and symptom tracking, educational guidance, and DoctorMatch-style specialist direction — not a replacement for a clinician.",
  },
  {
    question: "Is Zyra medical advice?",
    answer:
      "No. Zyra provides educational guidance only. For diagnosis, treatment, or emergencies, contact a licensed professional or emergency services.",
  },
] as const;

export const metadata: Metadata = {
  title: "Zyra | Women’s Health Companion for Period Tracking and PCOS Support",
  description:
    "Zyra is a women’s health companion for period tracker workflows, cycle tracking, PCOS support, symptom tracker logs, and a women’s health AI assistant.",
  keywords: [
    "women's health companion",
    "period tracker",
    "cycle tracking",
    "PCOS support",
    "symptom tracker",
    "women's health AI assistant",
  ],
  openGraph: {
    title: "Zyra | Women’s Health Companion",
    description:
      "Track your cycle, log symptoms, get PCOS support education, and use a women’s health AI assistant in one private space.",
    type: "website",
    images: [{ url: "/zyra-icon.png", width: 512, height: 512, alt: "Zyra women health companion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zyra | Women’s Health Companion",
    description:
      "Period tracker, cycle tracking, symptom tracker, PCOS support, and women’s health AI assistant.",
    images: ["/zyra-icon.png"],
  },
};

export default function MarketingHomePage() {
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: ZYRA.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description:
      "A women’s health companion for period tracker and cycle tracking workflows, symptom tracker logs, PCOS support education, and a women’s health AI assistant.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="border-b border-border/80 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {ZYRA.name}
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/privacy"
              className="text-xs font-medium text-muted transition hover:text-foreground sm:text-sm"
            >
              Privacy
            </Link>
            <GoogleSignInButton variant="nav" label="Sign in" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Above the fold: product + copy */}
        <section className="border-b border-border/60 bg-gradient-to-b from-soft-rose/35 to-background px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="max-w-xl">
              <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem]">
                Understand your symptoms. Find the right care.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                AI-powered women’s health guidance in seconds.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Try DoctorMatch on the right, then sign in to track patterns over time and search nearby
                specialists inside the app.
              </p>
            </div>
            <div className="lg:pt-1">
              <LandingDoctorMatch />
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                title: "Pattern detection over time",
                body: "Spot recurring themes from what you log — framed as education, not diagnosis.",
              },
              {
                title: "Smarter specialist matching",
                body: "DoctorMatch suggests a sensible first type of care to discuss with a licensed clinician.",
              },
              {
                title: "Confident decision-making",
                body: "Clearer questions, calmer next steps, and your data stays private to you.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-border/80 bg-surface/90 px-4 py-4 shadow-sm sm:px-5"
              >
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Static demo — trust */}
        <section className="border-y border-border/60 bg-surface/50 px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Example result</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted">
              Illustrative only — your real matches depend on what you enter. Not medical advice.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 lg:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Pattern detected</p>
                <p className="mt-2 text-sm text-foreground">
                  Possible pattern: hormonal imbalance (PCOS-related pattern)
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 lg:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Recommended specialist</p>
                <p className="mt-2 text-sm font-medium text-foreground">Endocrinologist or OB-GYN</p>
                <p className="mt-2 text-xs text-muted">A starting point to discuss with your doctor.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 lg:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Nearby care (example)</p>
                <p className="mt-2 font-serif text-base font-semibold text-foreground">Bay Area Women’s Health Clinic</p>
                <p className="mt-1 text-xs text-muted">4.6 · 210 reviews · Open now</p>
                <p className="mt-2 text-xs text-muted">123 Example St, San Francisco, CA</p>
                <span className="mt-3 inline-block rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted">
                  View on Google Maps
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Clarity Plan */}
        <section id="clarity-plan" className="px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border/80 bg-surface/90 px-5 py-8 text-center shadow-sm sm:px-8">
            <h2 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">Clarity Plan</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Save DoctorMatch runs, see gentle pattern summaries from your history, and keep specialist search in one
              workspace — built for ongoing clarity, not one-off scrolling.
            </p>
            <div className="mt-6 flex justify-center">
              <GoogleSignInButton variant="primary" label="Start free" />
            </div>
          </div>
        </section>

        {/* Disclaimer — compact */}
        <section className="border-t border-border/60 bg-soft-rose/30 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-muted">
              {ZYRA.name} does not diagnose or treat. Urgent symptoms need emergency care or a licensed clinician.{" "}
              <Link href="/legal/disclaimer" className="font-semibold text-accent underline-offset-2 hover:underline">
                Full disclaimer
              </Link>
            </p>
          </div>
        </section>

        {/* Minimal FAQ (matches schema) */}
        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="rounded-xl border border-border/70 bg-surface/80 px-4 py-3 text-left"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground">{item.question}</summary>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-xs text-muted sm:px-6">
        <p className="font-serif text-sm font-semibold text-foreground">{ZYRA.name}</p>
        <p className="mt-2">
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
        </p>
        <p className="mt-2 text-muted/80">© {new Date().getFullYear()} {ZYRA.name}</p>
      </footer>
    </div>
  );
}
