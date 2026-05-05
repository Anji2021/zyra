"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MedicineRow, SymptomRow } from "@shared/types/records";
import { createClient } from "@/lib/supabase/server";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export type LogMedicineState = { error?: string; ok?: true; medicine?: MedicineRow };
export type LogSymptomState = { error?: string; ok?: true; symptom?: SymptomRow };

function logErr(scope: string, error: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[health-log] ${scope}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const medicineSelect = "id,user_id,name,dosage,frequency,start_date,end_date,notes,created_at" as const;
const symptomSelect = "id,user_id,symptom,severity,logged_date,notes,created_at" as const;

export async function logMedicine(_prev: LogMedicineState, formData: FormData): Promise<LogMedicineState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logErr("medicine getUser", userError);
  if (!user) redirect("/?auth=required");

  const name = String(formData.get("name") ?? "").trim();
  const dosage = String(formData.get("dosage") ?? "").trim() || null;
  const frequency = String(formData.get("frequency") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const startRaw = String(formData.get("start_date") ?? "").trim();
  const endRaw = String(formData.get("end_date") ?? "").trim();

  if (!name) {
    return { error: "Please add the medicine name." };
  }

  let start_date: string | null = null;
  if (startRaw) {
    if (!isIsoDateOnly(startRaw)) return { error: "Start date looks invalid." };
    start_date = startRaw;
  }
  let end_date: string | null = null;
  if (endRaw) {
    if (!isIsoDateOnly(endRaw)) return { error: "End date looks invalid." };
    end_date = endRaw;
  }
  if (start_date && end_date && end_date < start_date) {
    return { error: "End date should be on or after the start date." };
  }

  const { data: medicine, error } = await supabase
    .from("medicines")
    .insert({
      user_id: user.id,
      name,
      dosage,
      frequency,
      start_date,
      end_date,
      notes,
    })
    .select(medicineSelect)
    .single();

  if (error) {
    logErr("medicines.insert", error);
    return { error: FRIENDLY_TRY_AGAIN };
  }

  revalidatePath("/app/health-log");
  return { ok: true, medicine: medicine as MedicineRow };
}

export async function logSymptom(_prev: LogSymptomState, formData: FormData): Promise<LogSymptomState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) logErr("symptom getUser", userError);
  if (!user) redirect("/?auth=required");

  const symptom = String(formData.get("symptom") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const loggedRaw = String(formData.get("logged_date") ?? "").trim();
  const severityRaw = String(formData.get("severity") ?? "").trim();

  if (!symptom) {
    return { error: "Please describe the symptom." };
  }
  if (!loggedRaw) {
    return { error: "Please choose the day you are logging for." };
  }
  if (!isIsoDateOnly(loggedRaw)) {
    return { error: "Logged date looks invalid." };
  }

  let severity: number | null = null;
  if (severityRaw) {
    const n = Number(severityRaw);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return { error: "Severity should be a whole number from 1 to 5, or leave it blank." };
    }
    severity = n;
  }

  const { data: row, error } = await supabase
    .from("symptoms")
    .insert({
      user_id: user.id,
      symptom,
      severity,
      logged_date: loggedRaw,
      notes,
    })
    .select(symptomSelect)
    .single();

  if (error) {
    logErr("symptoms.insert", error);
    return { error: FRIENDLY_TRY_AGAIN };
  }

  revalidatePath("/app/health-log");
  return { ok: true, symptom: row as SymptomRow };
}
