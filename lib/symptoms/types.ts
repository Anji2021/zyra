export type SymptomRow = {
  id: string;
  user_id: string;
  symptom: string;
  severity: number | null;
  logged_date: string;
  notes: string | null;
  created_at: string;
};
