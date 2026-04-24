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
