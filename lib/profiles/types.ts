export type ProfileRow = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  health_goals: string[];
  conditions: string[];
  cycle_regular: boolean | null;
  average_cycle_length: number | null;
  last_period_start: string | null;
  created_at: string;
  updated_at: string;
};
