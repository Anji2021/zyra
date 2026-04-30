export type UserHealthProfileRow = {
  user_id: string;
  known_conditions: string[];
  current_concerns: string[];
  cycle_regularity: "regular" | "irregular" | "unsure";
  average_cycle_length: number | null;
  last_period_date: string | null;
  goals: string[];
  baseline_symptoms: string[];
  preferred_search_radius: number;
  created_at: string;
  updated_at: string;
};
