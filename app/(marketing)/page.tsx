import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LandingDoctorMatch } from "@/components/marketing/landing-doctor-match";
import { SeoJsonLd } from "@/components/seo/json-ld";
import { defaultTitle, getSiteOrigin, ZYRA } from "@/lib/zyra/site";

const faqItems = [
  {
    question: "Is Zyra private?",
    answer:
      "Yes. Zyra is built as a private health companion, and your logs are intended to stay visible only to your account.",
  },
  {
    question: "Can Zyra replace a doctor?",
    answer:
      "No. Zyra provides educational AI health insights and care-preparation support, not diagnosis or treatment.",
  },
  {
    question: "What can I track in Zyra?",
    answer:
      "You can use Zyra for symptom tracking, cycle tracking, medicine logs, and context notes that help you notice patterns over time.",
  },
  {
    question: "How does AI help?",
    answer:
      "AI helps summarize what you log, highlight possible themes, and support clearer care conversations with licensed clinicians.",
  },
] as const;

export const metadata: Metadata = {
  title: defaultTitle,
  description: ZYRA.description,
  keywords: [
    "women's health app",
    "AI health companion",
    "symptom tracker",
    "cycle tracker",
    "private health insights",
    "reproductive health",
    "care preparation",
    "women's health companion",
    "period tracker",
    "cycle tracking",
    "PCOS support",
    "women's health AI assistant",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: defaultTitle,
    description: ZYRA.description,
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: ZYRA.name,
    images: [{ url: "/zyra-icon-512.png", width: 512, height: 512, alt: `${ZYRA.name} — women's health companion` }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: ZYRA.description,
    images: ["/zyra-icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingHomePage() {
  const siteUrl = getSiteOrigin();
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#webapplication`,
    name: ZYRA.name,
    url: siteUrl,
    applicationCategory: ["HealthApplication", "LifestyleApplication"],
    operatingSystem: "Web",
    inLanguage: "en",
    description:
      "A private AI-powered women’s health companion for tracking symptoms, cycle patterns, health context, and preparing for better care conversations.",
    audience: {
      "@type": "Audience",
      audienceType: "Women and people managing reproductive or hormone-related health patterns",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: ZYRA.name,
    url: siteUrl,
    logo: `${siteUrl}/zyra-icon.png`,
    description:
      "Zyra builds a private AI-powered women's health companion that helps users track symptoms and cycle patterns and prepare for better care conversations.",
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: ZYRA.name,
    description:
      "A private AI-powered women's health companion for symptom tracking, cycle tracking, and care preparation.",
    publisher: {
      "@id": `${siteUrl}/#organization`,
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

  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/`,
    url: `${siteUrl}/`,
    name: defaultTitle,
    headline: defaultTitle,
    description: ZYRA.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#webapplication` },
    primaryImageOfPage: `${siteUrl}/zyra-icon-512.png`,
    inLanguage: "en-US",
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <SeoJsonLd data={webAppJsonLd} />
      <SeoJsonLd data={organizationJsonLd} />
      <SeoJsonLd data={websiteJsonLd} />
      <SeoJsonLd data={webpageJsonLd} />
      <SeoJsonLd data={faqJsonLd} />

      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-none md:bg-surface/80 md:backdrop-blur-md">
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
                Understand your symptoms. Prepare for better care conversations.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                {ZYRA.description}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <GoogleSignInButton variant="primary" label="Sign in with Google" />
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-soft-rose/25"
                >
                  Continue onboarding
                </Link>
                <Link
                  href="/app"
                  className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-soft-rose/25"
                >
                  Open app
                </Link>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted sm:text-sm">
                Signing in verifies your Google account first. Visitors without a session are guided to sign in before
                onboarding or app tools that require authentication.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5 border-t border-border/50 pt-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Explore</span>
                <Link
                  href="/womens-health-ai"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Women&apos;s health AI
                </Link>
                <Link
                  href="/specialists"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Specialists &amp; appointments
                </Link>
                <Link
                  href="/topics"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Topic guides
                </Link>
                <Link
                  href="#about-zyra"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Overview
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Privacy
                </Link>
              </div>
            </div>
            <div className="lg:pt-1">
              <LandingDoctorMatch />
            </div>
          </div>
        </section>

        {/* Product overview */}
        <section id="about-zyra" className="px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="about-zyra-heading">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="sm:col-span-3">
              <h2 id="about-zyra-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Product overview
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                Zyra is a modern women&apos;s health app that supports cycle tracking, symptom tracking, and private AI
                health insights. It is designed for day-to-day clarity and care preparation, not medical diagnosis.
              </p>
            </div>
            {[
              {
                title: "How Zyra works",
                body: "Log symptoms, cycle patterns, medicines, and context. Zyra helps organize what happened so trends become easier to discuss.",
              },
              {
                title: "Private AI insights",
                body: "Receive calm, educational AI health insights from your own logs to support decisions and better questions for care visits.",
              },
              {
                title: "Privacy-first by design",
                body: "Your account centers a private health companion experience so reproductive wellness notes stay personal and useful over time.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-border/80 bg-surface/90 px-4 py-4 shadow-sm sm:px-5"
              >
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* AI insights */}
        <section
          id="ai-insights"
          className="border-y border-border/60 bg-surface/40 px-4 py-10 sm:px-6 sm:py-12"
          aria-labelledby="ai-insights-heading"
        >
          <div className="mx-auto max-w-6xl">
            <h2 id="ai-insights-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              AI-guided insights for planning
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
              Artificial intelligence reads only what you log to surface summaries, timelines, and possible themes—all
              framed as preparation for licensed clinicians—not diagnosis or prescriptions.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Summaries anchored in your timeline",
                  body: "Zyra organizes symptoms, moods, meds, and notes so summaries echo what happened in your journal instead of guessing.",
                },
                {
                  title: "Prompts for clinician-ready wording",
                  body: "Use AI outputs to shorten long histories into succinct talking points ahead of urgent or routine appointments.",
                },
                {
                  title: "Tone built for reassurance",
                  body: "Answers stay educational, medically cautious, and transparent about uncertainty so expectations stay grounded.",
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-border/80 bg-background/95 px-4 py-5 shadow-sm sm:px-5"
                >
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{card.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href="/womens-health-ai"
                className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
              >
                Read the AI companion landing page
              </Link>
              <Link
                href="/symptom-tracker"
                className="inline-flex items-center rounded-full border border-border/80 bg-surface px-4 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
              >
                Symptom-tracker playbook
              </Link>
              <Link
                href="/cycle-tracker"
                className="inline-flex items-center rounded-full border border-border/80 bg-surface px-4 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
              >
                Cycle-tracking playbook
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-6 sm:pb-6" aria-labelledby="guides-heading">
          <div className="mx-auto max-w-6xl rounded-2xl border border-border/70 bg-surface/80 p-4 shadow-sm sm:p-5">
            <h2 id="guides-heading" className="font-serif text-lg font-semibold tracking-tight text-foreground">
              Explore women's health tracking guides
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
              Learn how Zyra supports symptom tracking, cycle insights, hormone health tracking, and private health
              journaling.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { href: "/topics", label: "All topics hub" },
                { href: "/topics/irregular-cycles", label: "Irregular cycles topic" },
                { href: "/topics/symptom-journaling", label: "Symptom journaling topic" },
                { href: "/symptom-tracker", label: "Symptom tracker" },
                { href: "/cycle-tracker", label: "Cycle tracker" },
                { href: "/period-health-insights", label: "Period health insights" },
                { href: "/hormone-health-tracker", label: "Hormone health tracker" },
                { href: "/womens-health-ai", label: "Women's health AI" },
                { href: "/specialists", label: "Specialists & appointment prep" },
                { href: "/private-health-journal", label: "Private health journal" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy-first */}
        <section className="px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="privacy-first-heading">
          <div className="mx-auto max-w-6xl rounded-2xl border border-border/70 bg-gradient-to-br from-soft-rose/25 via-background to-background px-5 py-7 text-center shadow-sm sm:px-8 sm:text-left">
            <h2 id="privacy-first-heading" className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
              Privacy-first by design
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:mx-0">
              Logs stay tied to your account with practical controls for understanding how data fuels AI summaries. We
              encourage reading the privacy policy before you enroll so expectations stay aligned.
            </p>
            <Link
              href="/privacy"
              className="mt-5 inline-flex items-center justify-center rounded-full border border-accent/40 px-5 py-2 text-sm font-semibold text-accent underline-offset-2 transition hover:bg-soft-rose/30 sm:inline-flex"
            >
              View privacy policy
            </Link>
          </div>
        </section>

        {/* Static demo — trust */}
        <section
          className="border-y border-border/60 bg-surface/50 px-4 py-8 sm:px-6 sm:py-10"
          aria-labelledby="tracking-care-heading"
        >
          <div className="mx-auto max-w-6xl">
            <h2 id="tracking-care-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Symptom and cycle tracking for better care conversations
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted">
              Illustrative only. Zyra helps track health context and supports care preparation with licensed
              clinicians.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 lg:col-span-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-accent">Pattern summary</h3>
                <p className="mt-2 text-sm text-foreground">
                  Possible theme: irregular cycle + fatigue trend from recent entries
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 lg:col-span-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-accent">Specialist direction</h3>
                <p className="mt-2 text-sm font-medium text-foreground">Endocrinologist or OB-GYN</p>
                <p className="mt-2 text-xs text-muted">A starting point to discuss with your doctor.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/90 p-4 lg:col-span-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-accent">Nearby care (example)</h3>
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
              Save DoctorMatch runs, review AI health insights from your history, and keep specialist search in one
              workspace for ongoing reproductive wellness tracking.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <GoogleSignInButton variant="primary" label="Start free with Google" />
              <Link
                href="/onboarding"
                className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition hover:border-accent/40"
              >
                Resume onboarding
              </Link>
              <Link
                href="/app"
                className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition hover:border-accent/40"
              >
                Go to dashboard
              </Link>
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
        <section className="px-4 py-8 sm:px-6" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-2xl space-y-3">
            <h2 id="faq-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
              FAQ
            </h2>
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
