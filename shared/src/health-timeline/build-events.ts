import type { CycleRow, MedicineRow, SymptomRow } from "../types/records";
import type { HealthTimelineEvent, ReminderRowInput, TimelineEventKind } from "./types";

function isoDateOnly(d: string): string {
  const t = d.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  try {
    return new Date(t).toISOString().slice(0, 10);
  } catch {
    return t.slice(0, 10);
  }
}

function atMs(iso: string, fallbackDay: string): number {
  const t = Date.parse(iso);
  if (!Number.isNaN(t)) return t;
  return Date.parse(`${fallbackDay}T12:00:00`);
}

function push(
  out: HealthTimelineEvent[],
  id: string,
  kind: TimelineEventKind,
  date: string,
  sortAt: number,
  title: string,
  detail: string | null,
  hasNotes: boolean,
) {
  out.push({ id, kind, date: isoDateOnly(date), sortAt, title, detail, hasNotes });
}

/**
 * Merges existing Supabase-backed logs into a single chronological feed.
 * Replaceable later with server-side aggregation; name kept for clarity.
 */
export function buildHealthTimelineEvents(input: {
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
  reminders: ReminderRowInput[];
  profileUpdatedAt: string | null;
}): HealthTimelineEvent[] {
  const out: HealthTimelineEvent[] = [];

  for (const c of input.cycles) {
    const startNotes = c.notes?.trim() ?? "";
    push(
      out,
      `cycle-${c.id}-start`,
      "cycle",
      c.start_date,
      atMs(c.created_at, c.start_date),
      "Period started",
      startNotes ? `Note: ${startNotes}` : null,
      Boolean(startNotes),
    );
    if (c.end_date) {
      push(
        out,
        `cycle-${c.id}-end`,
        "cycle",
        c.end_date,
        atMs(c.created_at, c.end_date) + 1,
        "Period ended",
        null,
        false,
      );
    }
  }

  for (const s of input.symptoms) {
    const n = s.notes?.trim() ?? "";
    const detailParts = [`Severity: ${s.severity ?? "—"}`];
    if (n) detailParts.push(`Note: ${n}`);
    push(
      out,
      `symptom-${s.id}`,
      "symptom",
      s.logged_date,
      atMs(s.created_at, s.logged_date),
      `Symptom logged: ${s.symptom}`,
      detailParts.join(" · "),
      Boolean(n),
    );
  }

  for (const m of input.medicines) {
    const n = m.notes?.trim() ?? "";
    const meta = [m.dosage && `Dosage: ${m.dosage}`, m.frequency && `Frequency: ${m.frequency}`]
      .filter(Boolean)
      .join(" · ");
    const detail = [meta || null, n ? `Note: ${n}` : null].filter(Boolean).join(" · ") || null;
    push(
      out,
      `medicine-${m.id}-created`,
      "medicine",
      isoDateOnly(m.created_at),
      atMs(m.created_at, isoDateOnly(m.created_at)),
      `Medicine saved: ${m.name}`,
      detail,
      Boolean(n),
    );
    if (m.start_date && /^\d{4}-\d{2}-\d{2}$/.test(m.start_date)) {
      push(
        out,
        `medicine-${m.id}-start`,
        "medicine",
        m.start_date,
        atMs(m.created_at, m.start_date) + 2,
        `Start date recorded: ${m.name}`,
        null,
        false,
      );
    }
  }

  for (const r of input.reminders) {
    const dayCreated = isoDateOnly(r.created_at);
    push(
      out,
      `reminder-${r.id}-created`,
      "reminder",
      dayCreated,
      atMs(r.created_at, dayCreated),
      `Reminder set · ${r.title}`,
      r.message?.trim() || r.type || null,
      false,
    );
    if (r.reminder_date && /^\d{4}-\d{2}-\d{2}$/.test(r.reminder_date)) {
      const due = r.reminder_date;
      const passive =
        r.is_active === false
          ? "Pattern noticed: this reminder is no longer active on your list."
          : r.message?.trim() || "Worth tracking alongside your other logs.";
      push(
        out,
        `reminder-${r.id}-date`,
        "reminder",
        due,
        atMs(r.created_at, due) + 4,
        `Reminder date · ${r.title}`,
        passive,
        false,
      );
    }
  }

  if (input.profileUpdatedAt) {
    const d = isoDateOnly(input.profileUpdatedAt);
    push(
      out,
      "profile-updated",
      "profile",
      d,
      atMs(input.profileUpdatedAt, d),
      "Health profile updated",
      "Your saved preferences or health context changed — may help personalization stay aligned.",
      false,
    );
  }

  out.sort((a, b) => b.sortAt - a.sortAt);
  return out.slice(0, 250);
}

export function groupEventsByDate(events: HealthTimelineEvent[]): Map<string, HealthTimelineEvent[]> {
  const m = new Map<string, HealthTimelineEvent[]>();
  for (const e of events) {
    const list = m.get(e.date) ?? [];
    list.push(e);
    m.set(e.date, list);
  }
  for (const [, list] of m) {
    list.sort((a, b) => b.sortAt - a.sortAt);
  }
  return m;
}

export function filterTimelineEvents(
  events: HealthTimelineEvent[],
  filter: import("./types").TimelineFilter,
): HealthTimelineEvent[] {
  if (filter === "all") return events;
  if (filter === "cycle") return events.filter((e) => e.kind === "cycle");
  if (filter === "symptoms") return events.filter((e) => e.kind === "symptom");
  if (filter === "medicine") return events.filter((e) => e.kind === "medicine");
  if (filter === "notes") return events.filter((e) => e.hasNotes);
  if (filter === "reminders") return events.filter((e) => e.kind === "reminder");
  return events;
}
