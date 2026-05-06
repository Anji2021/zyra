import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SeoJsonLd } from "@/components/seo/json-ld";
import { ZYRA } from "@/lib/zyra/site";
import type { LandingPageKey } from "@/lib/marketing/landing-pages";

type SeoLandingPageProps = {
  slug: LandingPageKey;
  title: string;
  description: string;
  h1: string;
  heroBody: string;
  helpsWith: string[];
  supportPoints: { title: string; body: string }[];
  privacyMessage: string;
  faq: { question: string; answer: string }[];
  relatedPages: { slug: LandingPageKey; h1: string }[];
  siteUrl: string;
};

export function SeoLandingPage({
  slug,
  title,
  description,
  h1,
  heroBody,
  helpsWith,
  supportPoints,
  privacyMessage,
  faq,
  relatedPages,
  siteUrl,
}: SeoLandingPageProps) {
  const pageUrl = `${siteUrl}/${slug}`;
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: pageUrl,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <SeoJsonLd data={pageJsonLd} />
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

      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-b from-soft-rose/35 to-background px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Educational landing page</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                {h1}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{heroBody}</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/app/insights"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  View insights
                </Link>
                <Link
                  href="/app/specialists"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Find specialists
                </Link>
                <Link
                  href="/private-health-journal"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Private tracking
                </Link>
              </div>
            </div>
            <article className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-sm sm:p-6">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">What this helps with</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-muted">
                {helpsWith.map((item) => (
                  <li key={item} className="flex gap-2 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">How {ZYRA.name} supports you</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {supportPoints.map((point) => (
                <article key={point.title} className="rounded-xl border border-border/80 bg-surface/90 px-4 py-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{point.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/50 px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/70 bg-background/90 p-5 text-center shadow-sm sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">Privacy-first women's health support</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{privacyMessage}</p>
            <div className="mt-5 flex justify-center">
              <GoogleSignInButton variant="primary" label="Start tracking privately with Zyra" modalInitialMode="signup" />
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="related-pages-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="related-pages-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Explore related guides
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="rounded-xl border border-border/80 bg-surface/85 px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  {page.h1}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {faq.length > 0 ? (
          <section className="px-4 py-8 sm:px-6" aria-labelledby="faq-heading">
            <div className="mx-auto max-w-3xl space-y-3">
              <h2 id="faq-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
                FAQ
              </h2>
              {faq.map((item) => (
                <details key={item.question} className="rounded-xl border border-border/70 bg-surface/80 px-4 py-3 text-left">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">{item.question}</summary>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-xs text-muted sm:px-6">
        <p className="font-serif text-sm font-semibold text-foreground">{ZYRA.name}</p>
        <p className="mt-2">
          <Link href="/" className="underline-offset-2 hover:underline">
            Home
          </Link>
          {" · "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
