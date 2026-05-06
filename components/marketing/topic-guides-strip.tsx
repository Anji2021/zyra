import Link from "next/link";
import { SEO_TOPICS, type TopicSlug } from "@/lib/marketing/seo-topics-registry";

const INSIGHT_TOPIC_SLUGS = [
  "irregular-cycles",
  "mood-and-cycle-patterns",
  "symptom-journaling",
  "cycle-tracking",
] as const satisfies readonly TopicSlug[];

const SPECIALIST_TOPIC_SLUGS = [
  "irregular-cycles",
  "hormone-balance",
  "pms-tracking",
  "reproductive-wellness-tracking",
] as const satisfies readonly TopicSlug[];

type StripVariant = "insights" | "specialists";

export function TopicGuidesStrip({ variant }: { variant: StripVariant }) {
  const slugs = variant === "insights" ? INSIGHT_TOPIC_SLUGS : SPECIALIST_TOPIC_SLUGS;
  const title =
    variant === "insights"
      ? "Guides related to insights & tracking"
      : "Guides for visit prep & specialist search";

  return (
    <section className="rounded-2xl border border-border/60 bg-background/92 p-4 shadow-sm sm:p-5" aria-labelledby="topic-strip-heading">
      <h2 id="topic-strip-heading" className="font-serif text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted sm:text-xs">
        Short educational reads—nothing here replaces clinicians or emergency care.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <Link
            key={slug}
            href={`/topics/${slug}`}
            className="inline-flex rounded-full border border-border/75 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
          >
            {SEO_TOPICS[slug].cardLabel}
          </Link>
        ))}
        <Link
          href="/topics"
          className="inline-flex rounded-full border border-border bg-soft-rose/30 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent/40"
        >
          All topics
        </Link>
      </div>
    </section>
  );
}
