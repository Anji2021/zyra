const longFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatCycleDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return longFormatter.format(d);
}

/** Never throws; survives legacy or malformed ISO-like strings from old data. */
export function formatCycleDateSafe(isoDate: string): string {
  if (!isoDate || typeof isoDate !== "string") return "—";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate.length > 32 ? `${isoDate.slice(0, 29)}…` : isoDate;
  try {
    return formatCycleDate(isoDate);
  } catch {
    return isoDate;
  }
}
