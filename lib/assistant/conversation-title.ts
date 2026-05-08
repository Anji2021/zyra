/**
 * Short title from the first user line — product-style, not a diagnosis.
 */
export function titleFromFirstUserMessage(text: string, maxLen = 44): string {
  const raw = text.trim().replace(/\s+/g, " ");
  if (!raw) return "New chat";
  const firstLine = raw.split("\n")[0] ?? raw;
  const words = firstLine.split(" ").filter(Boolean);
  let out = words.slice(0, 8).join(" ");
  if (out.length > maxLen) {
    out = `${out.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
  }
  return out || "New chat";
}
