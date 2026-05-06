import { redirect } from "next/navigation";
import { TopicGuidesStrip } from "@/components/marketing/topic-guides-strip";
import { AppPage } from "@/components/product/page-system";
import { fetchSavedPlaceIdsForUser } from "@/lib/specialists/saved-queries";
import { createClient } from "@/lib/supabase/server";
import { SpecialistsSearch } from "./specialists-search";

export const dynamic = "force-dynamic";

export default async function SpecialistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const savedPlaceIds = Array.from(await fetchSavedPlaceIdsForUser(supabase, user.id));

  return (
    <AppPage className="gap-4 pb-1 sm:gap-6 sm:pb-2">
      <TopicGuidesStrip variant="specialists" />
      <SpecialistsSearch savedPlaceIds={savedPlaceIds} />
    </AppPage>
  );
}
