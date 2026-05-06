import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/zyra/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/app/",
          "/auth/",
          "/dashboard/",
          "/onboarding/",
          "/profile/",
          "/settings/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
