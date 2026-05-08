/** User-selectable filters for the health timeline UI */
export type TimelineFilter =
  | "all"
  | "cycle"
  | "symptoms"
  | "medicine"
  | "notes"
  | "reminders";

/** Rule-based highlights for the full timeline page header row (`ruleBasedTimelineTopCards` — swappable for AI later). */
export type TimelinePageTopCards = {
  recentActivity: { title: string; body: string };
  mostLoggedSymptom: { title: string; body: string };
  currentCycleContext: { title: string; body: string };
};

/** Stored log categories (reminders appear in “All” only on web/mobile as agreed). */
export type TimelineEventKind = "cycle" | "symptom" | "medicine" | "reminder" | "profile";

/** Serializable row for client rendering (web + mobile). */
export type HealthTimelineEvent = {
  id: string;
  kind: TimelineEventKind;
  /** yyyy-mm-dd for grouping */
  date: string;
  /** Stable sort within a day (ms since epoch) */
  sortAt: number;
  title: string;
  detail: string | null;
  /** True if this row carries a user-written note (symptom/cycle/medicine text). */
  hasNotes: boolean;
};

export type RuleBasedTimelineSummaries = {
  thisWeek: { title: string; body: string };
  recurringSymptoms: { title: string; body: string };
  whatChanged: { title: string; body: string };
};

export type ReminderRowInput = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reminder_date: string | null;
  reminder_time: string | null;
  is_active: boolean | null;
  created_at: string;
};
