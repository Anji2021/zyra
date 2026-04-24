import { CompanionPanel } from "@/components/product/companion-panel";
import { getProfileForUser } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfileForUser(supabase, user.id) : null;
  if (user && !profile) {
    console.error("[profile page] missing profile row for user", user.id);
  }

  return (
    <div className="flex flex-col gap-8">
      <CompanionPanel
        eyebrow="You"
        titleLevel={1}
        title="Profile"
        description="What you shared during onboarding is stored privately for your companion experience. Richer editing, export, and deletion controls will arrive in a later release."
      >
        {profile ? (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Name</dt>
              <dd className="mt-1 text-foreground">{profile.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Age</dt>
              <dd className="mt-1 text-foreground">{profile.age ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Location</dt>
              <dd className="mt-1 text-foreground">{profile.location ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Goals</dt>
              <dd className="mt-1 text-muted">
                {profile.health_goals?.length
                  ? profile.health_goals.join(" · ")
                  : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Context</dt>
              <dd className="mt-1 text-muted">
                {profile.conditions?.length ? profile.conditions.join(" · ") : "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted" role="status">
            {FRIENDLY_TRY_AGAIN}
          </p>
        )}
      </CompanionPanel>
    </div>
  );
}
