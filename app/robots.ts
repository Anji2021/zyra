import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/legal/disclaimer"],
        disallow: ["/app/", "/onboarding", "/onboarding/"],
      },
    ],
    sitemap: "/sitemap.xml",
  };
}
