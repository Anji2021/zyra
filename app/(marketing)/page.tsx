import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LandingDoctorMatch } from "@/components/marketing/landing-doctor-match";
import { MarketingHeroPreview } from "@/components/marketing/marketing-hero-preview";
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

const guideLinks = [
  { href: "/topics", label: "All topics hub" },
  { href: "/topics/irregular-cycles", label: "Irregular cycles" },
  { href: "/topics/symptom-journaling", label: "Symptom journaling" },
  { href: "/symptom-tracker", label: "Symptom tracker" },
  { href: "/cycle-tracker", label: "Cycle tracker" },
  { href: "/period-health-insights", label: "Period health insights" },
  { href: "/hormone-health-tracker", label: "Hormone health tracker" },
  { href: "/womens-health-ai", label: "Women's health AI" },
  { href: "/specialists", label: "Specialists & appointment prep" },
  { href: "/private-health-journal", label: "Private health journal" },
] as const;

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
        {/* Hero */}
        <section className="border-b border-border/60 bg-gradient-to-b from-soft-rose/35 to-background px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-center lg:gap-12">
            <div className="max-w-xl lg:max-w-none">
              <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem]">
                Understand your symptoms. Prepare for better care conversations.
              </h1>
              <p className="mt-4 text-base font-medium leading-relaxed text-foreground sm:text-lg">{ZYRA.tagline}</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                Track symptoms and cycle patterns privately, organize context with structured logging, then bring clearer
                questions to clinicians—education only, never a substitute for care.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <GoogleSignInButton variant="primary" label="Start free" modalInitialMode="signup" />
                <Link
                  href="#how-zyra-helps"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-transparent px-8 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/40 hover:bg-soft-rose/25"
                >
                  Explore how it works
                </Link>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-muted sm:text-sm">
                {ZYRA.name} does not diagnose or treat. Prefer email? Pick it in the same sign-up window alongside Google.
              </p>
            </div>

            <div className="max-lg:mx-auto max-lg:w-full max-lg:max-w-md lg:justify-self-end">
              <MarketingHeroPreview />
            </div>
          </div>
        </section>

        {/* How Zyra helps */}
        <section
          id="how-zyra-helps"
          className="px-4 py-12 sm:px-6 sm:py-16"
          aria-labelledby="how-zyra-heading"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 id="how-zyra-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                How Zyra helps
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                A calm workflow for reproductive and hormone-health context: log what matters, revisit patterns privately,
                and pair AI summaries with clinician conversations—not emergency triage inside the same screen.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Structured logging",
                  body: "Symptoms, cycle timing, meds, and notes stay organized so timelines stay accurate when appointments arrive.",
                },
                {
                  title: "Insights for framing",
                  body: "Educational AI highlights themes grounded in what you logged—optimized for wording and planning, not self-diagnosis.",
                },
                {
                  title: "Privacy-minded defaults",
                  body: "Zyra emphasizes account-level confidentiality so personal health journaling remains yours to steward.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-surface/90 px-5 py-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{item.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 mx-auto max-w-lg rounded-2xl border border-border/70 bg-soft-rose/15 p-1">
              <div className="rounded-[1.05rem] border border-border/40 bg-background/90 p-4 sm:p-5">
                <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Educational preview · no account required
                </p>
                <div className="mt-4">
                  <LandingDoctorMatch />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI-guided insights */}
        <section
          id="ai-guided-insights"
          className="border-y border-border/60 bg-surface/35 px-4 py-12 sm:px-6 sm:py-16"
          aria-labelledby="ai-insights-heading"
        >
          <div className="mx-auto max-w-6xl">
            <h2 id="ai-insights-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              AI-guided insights for planning
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
              Artificial intelligence reads only what you log to surface summaries, timelines, and possible themes—all
              framed as preparation for licensed clinicians, not diagnoses or prescriptions.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Anchored summaries",
                  body: "Themes echo calendar context so AI responses stay tethered to the notes you volunteered.",
                },
                {
                  title: "Talking-point prompts",
                  body: "Condense sprawling histories into short prompts you can bring to clinicians or allied staff.",
                },
                {
                  title: "Tone with guardrails",
                  body: "Copy stays reassuring, cites uncertainty plainly, and nudges you back to licensed decision-makers.",
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-border/80 bg-background/95 px-5 py-5 shadow-sm sm:py-6"
                >
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{card.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 text-center sm:text-left">
              <Link
                href="/womens-health-ai"
                className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
              >
                Learn more about the AI companion
              </Link>
            </p>
          </div>
        </section>

        {/* Privacy-first */}
        <section
          id="privacy-first-tracking"
          className="px-4 py-12 sm:px-6 sm:py-14"
          aria-labelledby="privacy-first-heading"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-surface/85 px-6 py-10 text-center sm:px-10 sm:text-left">
            <h2 id="privacy-first-heading" className="font-serif text-2xl font-semibold text-foreground">
              Privacy-first tracking
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Your logs stay anchored to your account with transparent expectations about AI usage. Reading the privacy
              policy takes minutes and keeps surprises out of onboarding.
            </p>
            <Link
              href="/privacy"
              className="mt-6 inline-flex text-sm font-semibold text-accent underline-offset-4 transition hover:underline"
            >
              Read the privacy policy
            </Link>
          </div>
        </section>

        {/* Explore guides */}
        <section id="explore-guides" className="border-t border-border/60 px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="guides-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="guides-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Explore guides
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Deeper dives on symptom tracking, cycle insights, journaling, hormones, appointments, and the AI companion.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guideLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex h-full min-h-[3.25rem] items-center rounded-2xl border border-border/80 bg-surface/90 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/35 hover:bg-soft-rose/20"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/55 bg-soft-rose/25 px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 id="faq-heading" className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              FAQ
            </h2>
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border/70 bg-background/92 px-4 py-3 text-left shadow-sm open:shadow-md"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground outline-none [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-muted sm:text-sm">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/60 px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="final-cta-heading">
          <div className="mx-auto max-w-2xl rounded-3xl border border-border/75 bg-gradient-to-b from-soft-rose/35 to-background px-6 py-10 text-center sm:px-10">
            <h2 id="final-cta-heading" className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
              Ready to keep your logs private?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Start free with Google or email, finish onboarding once, then access {ZYRA.name} anytime from the dashboard.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <GoogleSignInButton variant="primary" label="Start free" modalInitialMode="signup" />
              <GoogleSignInButton variant="outline" label="Already have access? Sign in" modalInitialMode="signin" />
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted">
              {ZYRA.name} does not diagnose or treat. Seek emergency care when symptoms are urgent.{` `}
              <Link href="/legal/disclaimer" className="font-semibold text-accent underline-offset-2 hover:underline">
                Medical disclaimer
              </Link>
            </p>
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
        <p className="mt-2 text-muted/80">
          © {new Date().getFullYear()} {ZYRA.name}
        </p>
      </footer>
    </div>
  );
}
