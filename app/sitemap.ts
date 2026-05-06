import type { MetadataRoute } from "next";
import { getTopicSlugs } from "@/lib/marketing/seo-topics-registry";

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteOrigin();
  const now = new Date();
  const topicSlugs = getTopicSlugs();
  const seoLandingPages = [
    "symptom-tracker",
    "cycle-tracker",
    "period-health-insights",
    "hormone-health-tracker",
    "womens-health-ai",
    "private-health-journal",
    /** Public info page; complements in-app `/app/specialists` (auth). */
    "specialists",
  ] as const;

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/legal/disclaimer`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...seoLandingPages.map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${base}/topics`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    ...topicSlugs.map((slug) => ({
      url: `${base}/topics/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
  ];
}
