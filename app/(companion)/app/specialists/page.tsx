import { redirect } from "next/navigation";
import { SpecialistsSearch } from "./specialists-search";
import { fetchSavedSpecialistsForUser } from "@/lib/specialists/saved-queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

export default async function SpecialistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const savedRows = await fetchSavedSpecialistsForUser(supabase, user.id);
  const initialSavedPlaceIds = savedRows
    .map((r) => r.place_id?.trim())
    .filter((id): id is string => Boolean(id && id.length > 0));

  return (
    <div className="flex max-w-2xl flex-col gap-8 pb-2">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Care team</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Find specialists
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Search by location for women&apos;s health–related providers using Google Places.{" "}
          {ZYRA.name} does not book appointments or endorse any listing — this is discovery only.
        </p>
      </header>

      <SpecialistsSearch initialSavedPlaceIds={initialSavedPlaceIds} />
    </div>
  );
}
