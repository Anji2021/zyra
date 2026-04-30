import { CheckCircle2 } from "lucide-react";
import type { ProfileRow } from "@/lib/profiles/types";
import {
  HEALTH_CONCERN_OPTIONS,
  KNOWN_CONDITION_OPTIONS,
  LEGACY_HEALTH_GOAL_TO_SLUG,
  PROFILE_GOAL_OPTIONS,
  PROFILE_GOAL_SLUG_SET,
  SYMPTOM_BASELINE_OPTIONS,
} from "@/lib/profiles/profile-clarity-options";

function labelFromSlug(slug: string, options: readonly { slug: string; label: string }[]): string | null {
  const row = options.find((o) => o.slug === slug);
  return row?.label ?? null;
}

function goalDisplayLabel(raw: string): string {
  const fromSlug = labelFromSlug(raw, PROFILE_GOAL_OPTIONS);
  if (fromSlug) return fromSlug;
  return raw;
}

function isRecognizedGoal(raw: string): boolean {
  if (PROFILE_GOAL_SLUG_SET.has(raw)) return true;
  return Boolean(LEGACY_HEALTH_GOAL_TO_SLUG[raw]);
}

function normalizeGoalSlug(raw: string): string | null {
  if (PROFILE_GOAL_SLUG_SET.has(raw)) return raw;
  const mapped = LEGACY_HEALTH_GOAL_TO_SLUG[raw];
  return mapped && PROFILE_GOAL_SLUG_SET.has(mapped) ? mapped : null;
}

function ReadChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-border/85 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground sm:text-xs">
      {label}
    </span>
  );
}

function summarySection(title: string, children: React.ReactNode) {
  return (
    <section className="rounded-2xl border border-border/80 bg-background/75 p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function EmptyHint({ onEdit }: { onEdit: () => void }) {
  return (
    <p className="text-xs text-muted">
      Add this to improve personalization.{" "}
      <button type="button" onClick={onEdit} className="font-semibold text-accent hover:underline">
        Edit
      </button>
    </p>
  );
}

function chipGroup(
  slugs: string[],
  options: readonly { slug: string; label: string }[],
  onEdit: () => void,
  fallbackHumanize = false,
) {
  if (slugs.length === 0) {
    return <EmptyHint onEdit={onEdit} />;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {slugs.map((slug) => {
        const lab = fallbackHumanize
          ? (labelFromSlug(slug, options) ?? slug.replace(/_/g, " "))
          : (labelFromSlug(slug, options) ?? slug);
        return <ReadChip key={slug} label={lab} />;
      })}
    </div>
  );
}

function cycleRegularityLabel(v: ProfileRow["cycle_regularity"]): string {
  if (v === "regular") return "Regular";
  if (v === "irregular") return "Irregular";
  return "Unsure";
}

function formatDisplayDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

type ProfileSummaryProps = {
  profile: ProfileRow;
  onEdit: () => void;
};

export function ProfileSummary({ profile, onEdit }: ProfileSummaryProps) {
  const known = [...profile.known_conditions];
  const concerns = [...profile.health_concerns];
  const baselines = [...profile.symptom_baselines];
  const goalItems = [...new Set(profile.health_goals.map(normalizeGoalSlug).filter((v): v is string => Boolean(v)))];

  const sections = [
    Boolean(profile.full_name?.trim() && profile.age != null && profile.location?.trim()),
    known.length > 0,
    Boolean(profile.cycle_regularity !== "unsure" || profile.average_cycle_length != null || profile.last_period_start),
    goalItems.length > 0,
    baselines.length > 0,
    [5, 10, 25].includes(profile.search_radius_miles),
  ];
  const completeCount = sections.filter(Boolean).length;
  const completionPercent = Math.round((completeCount / sections.length) * 100);
  const doctorMatchReady = Boolean((known.length > 0 || concerns.length > 0 || goalItems.length > 0) && profile.location?.trim());
  const cycleInsightsReady = Boolean(profile.average_cycle_length != null && profile.last_period_start);
  const clarityReady = Boolean(baselines.length > 0 || concerns.length > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/25 bg-soft-rose/30 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Your health profile</h2>
            <p className="mt-1 text-sm text-muted">
              Zyra uses this to personalize DoctorMatch and Clarity insights.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">
              Profile {completionPercent}% complete
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Edit profile
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {summarySection(
          "Personal",
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="mt-0.5 font-medium text-foreground">{profile.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Age</dt>
              <dd className="mt-0.5 font-medium text-foreground">{profile.age != null ? `${profile.age}` : "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Location</dt>
              <dd className="mt-0.5 font-medium text-foreground">{profile.location ?? "—"}</dd>
            </div>
          </dl>,
        )}

        {summarySection("Health context", chipGroup(known, KNOWN_CONDITION_OPTIONS, onEdit))}

        {summarySection("Current concerns", chipGroup(concerns, HEALTH_CONCERN_OPTIONS, onEdit))}

        {summarySection(
          "Cycle & hormones",
          <div className="space-y-1.5 text-sm">
            <p>
              <span className="text-muted">Regularity:</span>{" "}
              <span className="font-medium text-foreground">{cycleRegularityLabel(profile.cycle_regularity)}</span>
            </p>
            <p>
              <span className="text-muted">Avg. cycle:</span>{" "}
              <span className="font-medium text-foreground">
                {profile.average_cycle_length != null ? `${profile.average_cycle_length} days` : "—"}
              </span>
            </p>
            <p>
              <span className="text-muted">Last period:</span>{" "}
              <span className="font-medium text-foreground">{formatDisplayDate(profile.last_period_start)}</span>
            </p>
          </div>,
        )}

        {summarySection(
          "Goals",
          goalItems.length === 0 ? (
            <EmptyHint onEdit={onEdit} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {goalItems.filter(isRecognizedGoal).map((g) => (
                <ReadChip key={g} label={goalDisplayLabel(g)} />
              ))}
            </div>
          ),
        )}

        {summarySection("Symptoms", chipGroup(baselines, SYMPTOM_BASELINE_OPTIONS, onEdit, true))}

        {summarySection(
          "Preferences",
          <p className="text-sm">
            Preferred search radius:{" "}
            <span className="font-semibold text-foreground">{profile.search_radius_miles} mi</span>
          </p>,
        )}

        {summarySection(
          "Personalization impact",
          <ul className="space-y-1.5 text-sm">
            {[
              { label: "DoctorMatch accuracy", ok: doctorMatchReady },
              { label: "Cycle insights", ok: cycleInsightsReady },
              { label: "Clarity pattern tracking", ok: clarityReady },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${item.ok ? "text-emerald-600" : "text-muted/70"}`} />
                <span className={item.ok ? "text-foreground" : "text-muted"}>{item.label}</span>
              </li>
            ))}
          </ul>,
        )}
      </div>

      {completionPercent < 100 ? (
        <p className="text-xs text-muted">
          Add a few more details to improve personalization quality.{" "}
          <button type="button" onClick={onEdit} className="font-semibold text-accent hover:underline">
            Edit profile
          </button>
          .
        </p>
      ) : null}
    </div>
  );
}
