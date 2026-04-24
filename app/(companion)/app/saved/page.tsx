import { redirect } from "next/navigation";
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
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Care team</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Saved specialists
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Places you wanted to remember from search. {ZYRA.name} doesn&apos;t book visits or
          verify quality — this is your private shortlist.
        </p>
      </header>

      <SavedSpecialistsList initial={rows} />
    </div>
  );
}
