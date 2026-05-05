import { redirect } from "next/navigation";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { PRIVACY_ONLY_YOU } from "@/lib/zyra/user-messages";
import { HealthLogInteractive } from "./health-log-interactive";

export const dynamic = "force-dynamic";

export default async function HealthLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [medicines, symptoms, cycles] = await Promise.all([
    fetchMedicinesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id, 1),
  ]);
  const showNextSteps = symptoms.length > 0 || medicines.length > 0 || cycles.length > 0;

  return (
    <AppPage className="gap-4 sm:gap-6">
      <PageHeader
        eyebrow="Health log"
        title="Medicines & symptoms"
        subtitle={
          <>
            Quick logging for appointments and memory — not dosing advice from {ZYRA.name}.
            <span className="mt-2 block text-xs text-muted sm:text-sm">
              Private to you. {PRIVACY_ONLY_YOU}
            </span>
          </>
        }
      />

      <HealthLogInteractive
        initialMedicines={medicines}
        initialSymptoms={symptoms}
        showNextSteps={showNextSteps}
      />
    </AppPage>
  );
}
