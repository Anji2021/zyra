import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SeoJsonLd } from "@/components/seo/json-ld";
import type { TopicDefinition, TopicSlug } from "@/lib/marketing/seo-topics-registry";
import { ZYRA } from "@/lib/zyra/site";

type ProgrammaticTopicPageProps = {
  topic: TopicDefinition;
  slug: TopicSlug;
  related: { slug: TopicSlug; cardLabel: string }[];
  siteUrl: string;
};

export function ProgrammaticTopicPage({ topic, slug, related, siteUrl }: ProgrammaticTopicPageProps) {
  const pageUrl = `${siteUrl}/topics/${slug}`;
  const orgId = `${siteUrl}/#organization`;
  const webId = `${pageUrl}#webpage`;

  const articleGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webId,
        url: pageUrl,
        name: topic.metaTitle,
        description: topic.metaDescription,
        isPartOf: { "@type": "WebSite", url: siteUrl },
      },
      {
        "@type": "Article",
        headline: topic.h1,
        description: topic.metaDescription,
        mainEntityOfPage: { "@id": webId },
        author: { "@type": "Organization", name: ZYRA.name, url: siteUrl },
        publisher: { "@id": orgId },
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: ZYRA.name,
        url: siteUrl,
      },
    ],
  };

  const faqGraph =
    topic.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: topic.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <SeoJsonLd data={articleGraph} />
      {faqGraph ? <SeoJsonLd data={faqGraph} /> : null}

      <header className="border-b border-border/80 bg-surface/90 backdrop-blur-none md:bg-surface/80 md:backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {ZYRA.name}
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-muted sm:gap-3 sm:text-sm">
            <Link href="/topics" className="transition hover:text-foreground">
              Topics
            </Link>
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
            <GoogleSignInButton variant="nav" label="Sign in" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article>
          <section className="border-b border-border/60 bg-gradient-to-b from-soft-rose/35 to-background px-4 py-10 sm:px-6 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Educational topic
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
                {topic.h1}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{topic.overview}</p>
              <div className="mt-5 flex min-h-[2.75rem] flex-wrap gap-2">
                <Link
                  href="/app/cycle"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Log your cycle in {ZYRA.name}
                </Link>
                <Link
                  href="/app/health-log"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Symptom & medicine log
                </Link>
                <Link
                  href="/symptom-tracker"
                  className="inline-flex items-center rounded-full border border-border/80 bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Symptom tracker guide
                </Link>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="patterns-heading">
            <div className="mx-auto max-w-3xl">
              <h2 id="patterns-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
                {topic.commonPatternsHeading}
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
                {topic.commonPatterns.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-y border-border/60 bg-surface/55 px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="why-heading">
            <div className="mx-auto max-w-3xl">
              <h2 id="why-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
                {topic.whyTrackingHeading}
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
                {topic.whyTracking.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="px-4 py-8 sm:px-6 sm:py-10" aria-labelledby="zyra-heading">
            <div className="mx-auto max-w-3xl">
              <h2 id="zyra-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
                {topic.zyraSupportsHeading}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {topic.zyraSupports.map((block) => (
                  <div
                    key={block.title}
                    className="rounded-xl border border-border/80 bg-surface/95 px-3 py-3 shadow-sm sm:px-4 sm:py-4"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{block.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{block.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-border/60 bg-soft-rose/20 px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/75 bg-background/95 p-5 text-center shadow-sm sm:p-6">
              <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">
                Start tracking privately with {ZYRA.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Use cycle and health logging alongside educational insights—not as a substitute for clinicians.
              </p>
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <GoogleSignInButton variant="primary" label="Open the app" />
                <Link
                  href="/app/insights"
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  View insights
                </Link>
                <Link
                  href="/app/specialists"
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Find specialists
                </Link>
              </div>
            </div>
          </section>

          {topic.faq.length > 0 ? (
            <section className="px-4 py-8 sm:px-6 sm:pb-12" aria-labelledby="faq-heading">
              <div className="mx-auto max-w-3xl space-y-2.5">
                <h2 id="faq-heading" className="font-serif text-xl font-semibold tracking-tight text-foreground">
                  FAQ
                </h2>
                {topic.faq.map((item) => (
                  <details key={item.question} className="rounded-xl border border-border/70 bg-surface/85 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">{item.question}</summary>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section className="border-t border-border/50 px-4 py-8 sm:px-6 sm:pb-12" aria-labelledby="related-heading">
            <div className="mx-auto max-w-3xl">
              <h2 id="related-heading" className="font-serif text-lg font-semibold tracking-tight text-foreground">
                Related topics & guides
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/topics/${r.slug}`}
                    className="inline-flex rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                  >
                    {r.cardLabel}
                  </Link>
                ))}
                <Link
                  href="/cycle-tracker"
                  className="inline-flex rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Cycle tracker landing
                </Link>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted">
                Prefer the full index? <Link href="/topics" className="font-semibold text-accent underline-offset-2 hover:underline">Browse all topics</Link>.
              </p>
            </div>
          </section>
        </article>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-xs text-muted sm:px-6">
        <p className="font-serif text-sm font-semibold text-foreground">{ZYRA.name}</p>
        <p className="mt-2 leading-relaxed">{ZYRA.legalShort}</p>
        <p className="mt-2">
          <Link href="/" className="underline-offset-2 hover:underline">
            Home
          </Link>
          {" · "}
          <Link href="/topics" className="underline-offset-2 hover:underline">
            Topics
          </Link>
          {" · "}
          <Link href="/legal/disclaimer" className="underline-offset-2 hover:underline">
            Disclaimer
          </Link>
        </p>
      </footer>
    </div>
  );
}
