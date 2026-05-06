import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { LANDING_SITE_URL, getLandingPage, getLandingPageMetadata, getRelatedLandingPages } from "@/lib/marketing/landing-pages";

const slug = "period-health-insights";
const page = getLandingPage(slug);

export const metadata: Metadata = getLandingPageMetadata(slug);

export default function PeriodHealthInsightsPage() {
  return (
    <SeoLandingPage
      slug={slug}
      title={page.title}
      description={page.description}
      h1={page.h1}
      heroBody={page.heroBody}
      helpsWith={page.helpsWith}
      supportPoints={page.supportPoints}
      privacyMessage={page.privacyMessage}
      faq={page.faq}
      relatedPages={getRelatedLandingPages(slug)}
      siteUrl={LANDING_SITE_URL}
    />
  );
}
