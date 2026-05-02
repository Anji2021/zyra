import { redirect } from "next/navigation";
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
    <div className="flex flex-col gap-4 pb-2 sm:gap-6">
      <SpecialistsSearch />
    </div>
  );
}
