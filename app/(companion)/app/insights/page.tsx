import { redirect } from "next/navigation";
import { InsightsDashboard } from "@/components/insights/insights-dashboard";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import {
  hasAnyTracking,
  buildCycleInsights,
  buildMedicineInsights,
  buildSymptomInsights,
} from "@/lib/insights/build-summary";
import { buildEducationalInsightCards } from "@/lib/insights/educational-insight-cards";
import { buildInsightSummaryDocument } from "@/lib/insight-summary/build-document";
import type { DoctorMatchHistoryRow } from "@/lib/insight-summary/types";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { getProfileForUser } from "@/lib/profiles/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { getWhatChangedForUser } from "@/lib/patterns/get-what-changed";
import { AppPage } from "@/components/product/page-system";

export const dynamic = "force-dynamic";

function countNotesAcrossLogs(
  cycles: { notes: string | null }[],
  symptoms: { notes: string | null }[],
  medicines: { notes: string | null }[],
): number {
  return (
    cycles.filter((c) => (c.notes?.trim() ?? "").length > 0).length +
    symptoms.filter((s) => (s.notes?.trim() ?? "").length > 0).length +
    medicines.filter((m) => (m.notes?.trim() ?? "").length > 0).length
  );
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [profile, cycles, symptoms, medicines, dmResult, whatChanged] = await Promise.all([
    getProfileForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id, 80),
    fetchSymptomsForUser(supabase, user.id, 150),
    fetchMedicinesForUser(supabase, user.id, 80),
    supabase
      .from("doctor_match_history")
      .select("symptoms,pattern,specialist,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    getWhatChangedForUser(supabase, user.id),
  ]);

  if (dmResult.error) {
    console.error("[insights page] doctor_match_history:", dmResult.error.message);
  }

  const doctorMatchHistory = (dmResult.data ?? []) as DoctorMatchHistoryRow[];

  const report = buildInsightSummaryDocument({
    profile,
    cycles,
    symptoms,
    medicines,
    doctorMatchHistory,
  });

  const cycle = buildCycleInsights(profile, cycles);
  const symptom = buildSymptomInsights(symptoms);
  const medicine = buildMedicineInsights(medicines);
  const anyTracking = hasAnyTracking(cycle, symptom, medicine);
  const notesCount = countNotesAcrossLogs(cycles, symptoms, medicines);
  const educationalCards = buildEducationalInsightCards(cycle, symptom, medicine);

  return (
    <AppPage className="gap-5 sm:gap-6">
      <InsightsDashboard
        report={report}
        cycle={cycle}
        symptom={symptom}
        medicine={medicine}
        notesCount={notesCount}
        educationalCards={educationalCards}
        anyTracking={anyTracking}
        whatChanged={whatChanged}
      />
    </AppPage>
  );
}
