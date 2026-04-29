import { redirect } from "next/navigation";
import { SpecialistsSearch } from "./specialists-search";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { fetchSavedSpecialistsForUser } from "@/lib/specialists/saved-queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SpecialistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const [savedRows, cyclesProbe, symptomsProbe] = await Promise.all([
    fetchSavedSpecialistsForUser(supabase, user.id),
    fetchCyclesForUser(supabase, user.id, 1),
    fetchSymptomsForUser(supabase, user.id, 1),
  ]);

  const initialSavedPlaceIds = savedRows
    .map((r) => r.place_id?.trim())
    .filter((id): id is string => Boolean(id && id.length > 0));

  const hasHealthContext = cyclesProbe.length > 0 || symptomsProbe.length > 0;

  return (
    <div className="flex flex-col gap-4 pb-2 sm:gap-6">
      <SpecialistsSearch
        initialSavedPlaceIds={initialSavedPlaceIds}
        hasHealthContext={hasHealthContext}
      />
    </div>
  );
}
