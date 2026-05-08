import type { HealthTimelineEvent } from "@zyra/shared";

export function timelineKindLabel(kind: HealthTimelineEvent["kind"]): string {
  switch (kind) {
    case "cycle":
      return "Cycle";
    case "symptom":
      return "Symptom";
    case "medicine":
      return "Medicine";
    case "reminder":
      return "Reminder";
    case "profile":
      return "Profile";
    default:
      return "Entry";
  }
}

export function formatTimelineGroupDate(ymd: string): string {
  try {
    const d = new Date(`${ymd}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return ymd;
  }
}
