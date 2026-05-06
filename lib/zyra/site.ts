export { ZYRA, defaultTitle } from "@shared/constants/zyra";

/** Production canonical origin — HTTPS, no trailing slash (override via NEXT_PUBLIC_SITE_URL). */
export const SITE_ORIGIN_PRODUCTION = "https://zyra-gold.vercel.app";

/**
 * Site origin for metadataBase, sitemaps, robots, JSON-LD, and marketing props.
 *
 * Priority: NEXT_PUBLIC_SITE_URL (trimmed) → production fallback in production builds → localhost in development.
 */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return SITE_ORIGIN_PRODUCTION;
  return "http://localhost:3000";
}
