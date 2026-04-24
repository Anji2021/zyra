import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, CalendarHeart, ClipboardList, MessageCircleHeart } from "lucide-react";
import { daysBetweenStarts, fetchCyclesForUser } from "@/lib/cycles/queries";
import { formatCycleDate } from "@/lib/cycles/format";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { getProfileCompleteness } from "@/lib/profiles/completeness";
import { getProfileForUser } from "@/lib/profiles/queries";
import { buildGoogleMapsUrl } from "@/lib/specialists/maps-url";
import { fetchSavedSpecialistsForUser } from "@/lib/specialists/saved-queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const profile = await getProfileForUser(supabase, user.id);
  const { percent, missing } = getProfileCompleteness(profile);
  const firstName = profile?.full_name?.trim()?.split(/\s+/)[0] ?? "there";

  const [cycles, medicines, symptoms, savedSpecialistsPreview] = await Promise.all([
    fetchCyclesForUser(supabase, user.id),
    fetchMedicinesForUser(supabase, user.id),
    fetchSymptomsForUser(supabase, user.id),
    fetchSavedSpecialistsForUser(supabase, user.id, 3),
  ]);

  let cycleInsight: string | null = null;
  if (cycles.length >= 2) {
    const days = daysBetweenStarts(cycles[0].start_date, cycles[1].start_date);
    if (days > 0) {
      cycleInsight = `Your last cycle was about ${days} days between period starts — patterns shift, and this isn’t medical advice.`;
    }
  }

  const lastPeriod = cycles[0];
  const recentSymptom = symptoms[0];
  const medicineCount = medicines.length;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-border/70 bg-surface/95 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Today</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Hi, {firstName}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          However your body feels today, you belong here. Move at your own pace — {ZYRA.name}{" "}
          is a quiet companion, not a checklist.
        </p>
        {percent < 100 && missing.length > 0 ? (
          <p className="mt-4 text-xs leading-relaxed text-muted">
            When you have a moment, you can round out your profile from{" "}
            <Link href="/app/more" className="font-semibold text-accent underline-offset-2 hover:underline">
              More → Profile
            </Link>
            .
          </p>
        ) : null}
      </section>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="sr-only">
          Quick actions
        </h2>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Quick actions</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li>
            <Link
              href="/app/cycle"
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-soft-rose/80 text-accent">
                <CalendarHeart className="size-5" aria-hidden />
              </span>
              Log period
            </Link>
          </li>
          <li>
            <Link
              href="/app/health-log"
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-soft-rose/80 text-accent">
                <ClipboardList className="size-5" aria-hidden />
              </span>
              Add symptom
            </Link>
          </li>
          <li>
            <Link
              href="/app/assistant"
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:bg-soft-rose/25"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-soft-rose/80 text-accent">
                <MessageCircleHeart className="size-5" aria-hidden />
              </span>
              Talk to Zyra
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="saved-specialists-heading">
        <h2
          id="saved-specialists-heading"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
        >
          <Bookmark className="size-3.5 shrink-0" aria-hidden />
          Your saved specialists
        </h2>
        {savedSpecialistsPreview.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-background/65 px-4 py-6 text-center sm:px-6">
            <p className="text-sm font-medium text-foreground">You haven&apos;t saved any specialists yet</p>
            <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
              When someone looks like a fit, save them from search — they&apos;ll show up here, only
              for you.
            </p>
            <Link
              href="/app/specialists"
              className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline"
            >
              Find specialists
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <ul className="space-y-3">
              {savedSpecialistsPreview.map((row) => {
                const name = row.name ?? "Saved place";
                const address = row.address ?? "";
                const pid = row.place_id?.trim() ?? "";
                const mapsUrl = buildGoogleMapsUrl(pid, name, address);
                const ratingNum = row.rating != null ? Number(row.rating) : NaN;
                const showRating = !Number.isNaN(ratingNum);
                return (
                  <li
                    key={row.id}
                    className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 sm:px-5"
                  >
                    <p className="font-medium text-foreground">{name}</p>
                    {address ? <p className="mt-1 text-xs text-muted sm:text-sm">{address}</p> : null}
                    {showRating ? (
                      <p className="mt-1 text-[11px] text-muted">Rating {ratingNum.toFixed(1)}</p>
                    ) : null}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      Open in Maps →
                    </a>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/app/saved"
              className="inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline"
            >
              View all saved
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="snapshot-heading">
        <h2 id="snapshot-heading" className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          At a glance
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Last cycle</p>
            {lastPeriod ? (
              <p className="mt-2 font-serif text-lg font-semibold text-foreground">
                Started {formatCycleDate(lastPeriod.start_date)}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">Start tracking your cycle when you&apos;re ready.</p>
            )}
          </li>
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Recent symptom</p>
            {recentSymptom ? (
              <p className="mt-2 font-serif text-lg font-semibold text-foreground">{recentSymptom.symptom}</p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">Log how you&apos;re feeling — no pressure to be “consistent.”</p>
            )}
          </li>
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Medicines</p>
            {medicineCount > 0 ? (
              <p className="mt-2 font-serif text-lg font-semibold text-foreground">
                {medicineCount} saved {medicineCount === 1 ? "entry" : "entries"}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">Add your medications when it helps you remember.</p>
            )}
          </li>
        </ul>
      </section>

      {cycleInsight ? (
        <div className="rounded-2xl border border-border/60 bg-soft-rose/35 px-5 py-4 text-center text-sm leading-relaxed text-foreground">
          <span className="font-medium text-accent">Gentle note:</span> {cycleInsight}
        </div>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-muted">
        Your {ZYRA.name} data stays with your account.{" "}
        <Link href="/app/more" className="font-semibold text-accent underline-offset-2 hover:underline">
          More
        </Link>{" "}
        has resources, specialists, and profile.
      </p>
    </div>
  );
}
