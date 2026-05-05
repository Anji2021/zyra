import { redirect } from "next/navigation";
import { AppPage } from "@/components/product/page-system";
import { SpecialistsSearch } from "./specialists-search";
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

  return (
    <AppPage className="gap-4 pb-1 sm:gap-6 sm:pb-2">
      <SpecialistsSearch />
    </AppPage>
  );
}
