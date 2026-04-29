import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: "/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "/privacy",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "/terms",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "/legal/disclaimer",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
