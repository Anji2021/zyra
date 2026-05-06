import { notFound } from "next/navigation";
import { ProgrammaticTopicPage } from "@/components/marketing/programmatic-topic-page";
import { LANDING_SITE_URL } from "@/lib/marketing/landing-pages";
import {
  buildTopicMetadata,
  getRelatedTopicCards,
  getTopicOrNull,
  getTopicSlugs,
  type TopicSlug,
} from "@/lib/marketing/seo-topics-registry";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: TopicSlug }[] {
  return getTopicSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!getTopicOrNull(slug)) return {};
  return buildTopicMetadata(slug as TopicSlug);
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getTopicOrNull(slug);
  if (!topic) notFound();
  const s = slug as TopicSlug;
  const related = getRelatedTopicCards(s);

  return <ProgrammaticTopicPage topic={topic} slug={s} related={related} siteUrl={LANDING_SITE_URL} />;
}
