import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { SpecialistsSearch } from "./specialists-search";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { fetchSavedSpecialistsForUser } from "@/lib/specialists/saved-queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
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
    <div className="flex max-w-2xl flex-col gap-4 pb-2 sm:gap-8">
      <header className="space-y-2 sm:space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
          Care team
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Find specialists
          </h1>
          <Link
            href="/app/saved"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-accent/35 bg-soft-rose/40 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-soft-rose/60 sm:py-2.5 sm:text-sm"
          >
            <Bookmark className="size-3.5 sm:size-4" aria-hidden />
            View saved
          </Link>
        </div>
        <p className="max-w-2xl text-sm font-medium leading-snug text-foreground/90 sm:leading-relaxed">
          Zyra helps you discover nearby specialists. Always confirm availability, insurance, and
          services directly with the provider.
        </p>
        <p className="max-w-2xl text-sm leading-snug text-muted sm:leading-relaxed sm:text-base">
          Search by location using Google Places. {ZYRA.name} does not book appointments or endorse
          any listing — discovery only.
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-3 border-b border-border/70 bg-background/95 px-3 py-2 backdrop-blur-sm sm:hidden">
        <Link
          href="/app/saved"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold text-accent transition hover:border-accent/40 hover:bg-soft-rose/25"
        >
          <Bookmark className="size-4 shrink-0" aria-hidden />
          View saved specialists
        </Link>
      </div>

      <SpecialistsSearch
        initialSavedPlaceIds={initialSavedPlaceIds}
        hasHealthContext={hasHealthContext}
      />
    </div>
  );
}
