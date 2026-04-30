/** Row shape for `public.user_health_profile` (Clarity / structured health only). */
export type { UserHealthProfileRow } from "@shared/types/profile";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  health_goals: string[];
  conditions: string[];
  /** Structured conditions for Clarity Plan (PCOS, thyroid, etc.). */
  known_conditions: string[];
  /** Current concerns (irregular periods, fertility, etc.). */
  health_concerns: string[];
  symptom_baselines: string[];
  search_radius_miles: number;
  cycle_regularity: "regular" | "irregular" | "unsure";
  cycle_regular: boolean | null;
  average_cycle_length: number | null;
  last_period_start: string | null;
  created_at: string;
  updated_at: string;
};
