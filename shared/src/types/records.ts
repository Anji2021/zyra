export type CycleRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
};

export type SymptomRow = {
  id: string;
  user_id: string;
  symptom: string;
  severity: number | null;
  logged_date: string;
  notes: string | null;
  created_at: string;
};

export type MedicineRow = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
};
