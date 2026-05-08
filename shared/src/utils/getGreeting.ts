/**
 * Time-of-day greeting using the caller's local clock (browser / device).
 * Boundaries (local hours):
 * - Good morning: 5:00–11:59
 * - Good afternoon: 12:00–16:59
 * - Good evening: 17:00–21:59
 * - Good night: 22:00–4:59
 */
export function getGreetingPhrase(now: Date = new Date()): string {
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  // 5:00 → 300, 11:59 → 719
  if (totalMinutes >= 300 && totalMinutes <= 719) return "Good morning";
  // 12:00 → 720, 16:59 → 1019
  if (totalMinutes >= 720 && totalMinutes <= 1019) return "Good afternoon";
  // 17:00 → 1020, 21:59 → 1319
  if (totalMinutes >= 1020 && totalMinutes <= 1319) return "Good evening";
  return "Good night";
}

/** Shown only before client mount / refresh to avoid SSR vs client time skew (Next.js hydration). */
export const GREETING_NEUTRAL_FALLBACK = "Hello";

export function formatGreetingWithName(firstName: string, now?: Date): string {
  const name = firstName.trim() || "there";
  return `${getGreetingPhrase(now)}, ${name}`;
}

/**
 * First word of a display name, or email local-part, or "there".
 */
export function firstNameFromDisplayName(fullName: string | null | undefined, email?: string | null): string {
  const t = fullName?.trim();
  if (t) return t.split(/\s+/)[0] ?? "there";
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.trim();
    return local || "there";
  }
  return "there";
}
