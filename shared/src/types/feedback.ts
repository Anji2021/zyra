export const FEEDBACK_TYPE_OPTIONS = [
  { value: "general_feedback", label: "General feedback" },
  { value: "topic_request", label: "Request a health topic" },
  { value: "provider_issue", label: "Report provider issue" },
  { value: "bug_report", label: "Bug report" },
] as const;

export type FeedbackTypeValue = (typeof FEEDBACK_TYPE_OPTIONS)[number]["value"];

export function isFeedbackType(value: string): value is FeedbackTypeValue {
  return FEEDBACK_TYPE_OPTIONS.some((o) => o.value === value);
}
