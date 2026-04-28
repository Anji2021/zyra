import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllResourceIds, getResourceById } from "@/data/resources";
import { suggestionFromResource } from "@/lib/next-steps/context-suggestions";
import { ZYRA } from "@/lib/zyra/site";

const TOP_DISCLAIMER =
  "Educational content only — not medical advice. Zyra does not replace your clinician.";

type ArticlePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllResourceIds().map((id) => ({ id }));
}

function BulletSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "muted" | "accent";
}) {
  if (!items.length) return null;
  const box =
    variant === "accent"
      ? "border-accent/25 bg-soft-rose/25"
      : "border-border/80 bg-background/80";
  return (
    <section className={`rounded-xl border px-3 py-4 sm:rounded-2xl sm:px-5 sm:py-5 ${box}`}>
      <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted marker:text-accent">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function ResourceArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = getResourceById(id);
  if (!article) {
    notFound();
  }
  const assistantPrefill = suggestionFromResource(article.title);

  return (
    <article className="flex max-w-2xl flex-col gap-5 pb-8 sm:gap-8 sm:pb-12 lg:max-w-3xl">
      <p className="text-center text-xs leading-relaxed text-muted sm:text-sm">{TOP_DISCLAIMER}</p>

      <Link
        href="/app/resources"
        className="inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline"
      >
        ← Back to resources
      </Link>

      <header className="space-y-2 border-b border-border/60 pb-6 sm:space-y-3 sm:pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-soft-rose/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            {article.category}
          </span>
          <span className="text-[11px] font-medium text-muted">{article.readTime}</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-sm leading-relaxed text-muted">{article.description}</p>
      </header>

      <div className="space-y-4 text-base leading-relaxed text-foreground/95 sm:space-y-5">
        {article.paragraphs.map((p, i) => (
          <p key={i} className="first:mt-0">
            {p}
          </p>
        ))}
      </div>

      <BulletSection title="What to track" items={article.whatToTrack} variant="muted" />
      <BulletSection
        title="Questions to ask your doctor"
        items={article.questionsToAskDoctor}
        variant="accent"
      />
      <BulletSection title="When to seek care" items={article.whenToSeekCare} variant="muted" />

      <p className="rounded-xl border border-border/80 bg-background/80 px-3 py-3 text-sm leading-relaxed text-muted sm:rounded-2xl sm:px-5 sm:py-4">
        <span className="font-semibold text-foreground">Disclaimer. </span>
        {article.disclaimer} {ZYRA.name} does not give personalized medical advice.
      </p>

      <section className="rounded-xl border border-border/70 bg-soft-rose/20 px-3 py-4 sm:rounded-2xl sm:px-5 sm:py-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Take next step
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-3">
          <Link
            href="/app/health-log"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border bg-background/90 px-3 py-2 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/35 sm:text-sm"
          >
            Track this in Zyra
          </Link>
          <Link
            href={`/app/assistant?q=${encodeURIComponent(assistantPrefill)}`}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border bg-background/90 px-3 py-2 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/35 sm:text-sm"
          >
            Ask Zyra
          </Link>
          <Link
            href="/app/specialists"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-border bg-background/90 px-3 py-2 text-center text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/35 sm:text-sm"
          >
            Find a specialist
          </Link>
        </div>
      </section>

      <div className="text-center">
        <Link
          href="/app/resources"
          className="inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline"
        >
          Browse more articles
        </Link>
      </div>
    </article>
  );
}
