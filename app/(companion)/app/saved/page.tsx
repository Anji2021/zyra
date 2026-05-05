import { redirect } from "next/navigation";
import { AppPage, PageHeader } from "@/components/product/page-system";
import { fetchSavedSpecialistsForUser } from "@/lib/specialists/saved-queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { SavedSpecialistsList } from "./saved-specialists-list";

export const dynamic = "force-dynamic";

export default async function SavedSpecialistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const rows = await fetchSavedSpecialistsForUser(supabase, user.id);

  return (
    <AppPage>
      <PageHeader
        eyebrow="Care team"
        title="Saved specialists"
        subtitle={
          <>
            Places you wanted to remember from search. {ZYRA.name} doesn&apos;t book visits or verify quality — this is
            your private shortlist.
          </>
        }
      />

      <SavedSpecialistsList initial={rows} />
    </AppPage>
  );
}
