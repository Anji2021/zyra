import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllResourceIds, getResourceById } from "@/data/resources";
import { ZYRA } from "@/lib/zyra/site";

const DISCLAIMER =
  "This content is for educational purposes only and does not replace medical advice.";

type ArticlePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllResourceIds().map((id) => ({ id }));
}

export default async function ResourceArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = getResourceById(id);
  if (!article) {
    notFound();
  }

  return (
    <article className="flex max-w-2xl flex-col gap-8 pb-12 lg:max-w-3xl">
      <p className="text-center text-xs leading-relaxed text-muted sm:text-sm">{DISCLAIMER}</p>

      <Link
        href="/app/resources"
        className="inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline"
      >
        ← Back to resources
      </Link>

      <header className="space-y-3 border-b border-border/60 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-soft-rose/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            {article.category}
          </span>
          <span className="text-[11px] font-medium text-muted">{article.readTime}</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {article.title}
        </h1>
        <p className="text-sm leading-relaxed text-muted">{article.description}</p>
      </header>

      <div className="space-y-5 text-base leading-relaxed text-foreground/95">
        {article.paragraphs.map((p, i) => (
          <p key={i} className="first:mt-0">
            {p}
          </p>
        ))}
      </div>

      <p className="rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-center text-xs leading-relaxed text-muted sm:text-sm">
        {DISCLAIMER} Everything here is general education from {ZYRA.name}, not care tailored to
        you personally.
      </p>

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
