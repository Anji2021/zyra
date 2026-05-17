/**
 * Global feature flags for opt-in surfaces.
 *
 * Read at build time from `NEXT_PUBLIC_*` env vars so the values are inlined
 * into both server and client bundles. Toggle in `.env.local` (dev) or hosting
 * env UI (prod) — not in `mobile/.env` (Expo only).
 *
 *   NEXT_PUBLIC_HACKATHON_MODE=true   # streamlined hackathon UI/UX
 *   NEXT_PUBLIC_DEMO_MODE=true        # always-on mocked data for live demos
 *
 * Only the literal string "true" enables a flag. "false", empty, or unset → off.
 * Do not use Boolean(process.env.VAR) — the string "false" is truthy in JS.
 */

function envFlag(name: "NEXT_PUBLIC_HACKATHON_MODE" | "NEXT_PUBLIC_DEMO_MODE"): boolean {
  return process.env[name] === "true";
}

export const HACKATHON_MODE = envFlag("NEXT_PUBLIC_HACKATHON_MODE");

export const DEMO_MODE = envFlag("NEXT_PUBLIC_DEMO_MODE");

export const isHackathonMode = (): boolean => HACKATHON_MODE;

export const isDemoMode = (): boolean => DEMO_MODE;

if (process.env.NODE_ENV === "development") {
  console.log("Feature flags", {
    HACKATHON_MODE,
    DEMO_MODE,
    raw: {
      NEXT_PUBLIC_HACKATHON_MODE: process.env.NEXT_PUBLIC_HACKATHON_MODE ?? "(unset)",
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? "(unset)",
    },
  });
}
