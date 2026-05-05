import { AppPage } from "@/components/product/page-system";
import { CompanionPanel } from "@/components/product/companion-panel";
import { getProfileForUser, hasUserHealthProfileRow } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";
import { ProfileExperience } from "./profile-experience";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, hasSavedHealthProfile] = user
    ? await Promise.all([
        getProfileForUser(supabase, user.id),
        hasUserHealthProfileRow(supabase, user.id),
      ])
    : [null, false];

  if (user && !profile) {
    console.error("[profile page] missing profile row for user", user.id);
  }

  return (
    <AppPage>
      {profile ? (
        <ProfileExperience profile={profile} initialHasSavedHealthProfile={hasSavedHealthProfile} />
      ) : (
        <CompanionPanel
          eyebrow="You"
          titleLevel={1}
          title="Profile"
          description="Structured preferences power DoctorMatch and Clarity insights. Everything stays private to your account."
        >
          <p className="text-sm text-muted" role="status">
            {FRIENDLY_TRY_AGAIN}
          </p>
        </CompanionPanel>
      )}
    </AppPage>
  );
}
