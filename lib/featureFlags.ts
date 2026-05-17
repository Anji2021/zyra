/**
 * Global feature flags for opt-in surfaces.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time for client bundles.
 * Server components read runtime env; pass flags as props into client shells
 * to avoid SSR/hydration mismatches after `.env.local` changes without restart.
 *
 * Only the literal string `"true"` enables a flag.
 */

export const HACKATHON_MODE =
  process.env.NEXT_PUBLIC_HACKATHON_MODE === "true";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function isHackathonMode(): boolean {
  return HACKATHON_MODE;
}

export function isDemoMode(): boolean {
  return DEMO_MODE;
}
