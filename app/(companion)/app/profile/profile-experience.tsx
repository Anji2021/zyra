"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileRow } from "@/lib/profiles/types";
import { CompanionPanel } from "@/components/product/companion-panel";
import { ProfileForm } from "./profile-form";
import { ProfileSummary } from "./profile-summary";

type ProfileExperienceProps = {
  profile: ProfileRow;
  initialHasSavedHealthProfile: boolean;
};

export function ProfileExperience({ profile, initialHasSavedHealthProfile }: ProfileExperienceProps) {
  const router = useRouter();
  const [hasSavedHealthProfile, setHasSavedHealthProfile] = useState(initialHasSavedHealthProfile);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setHasSavedHealthProfile(initialHasSavedHealthProfile);
  }, [initialHasSavedHealthProfile]);

  const handleSaved = useCallback(() => {
    setHasSavedHealthProfile(true);
    setEditMode(false);
    router.refresh();
  }, [router]);

  const setupMode = !hasSavedHealthProfile;

  if (setupMode) {
    return (
      <CompanionPanel
        eyebrow="You"
        titleLevel={1}
        title="Complete your health profile"
        description="This helps Zyra personalize DoctorMatch, cycle insights, and Clarity Plan recommendations."
      >
        <ProfileForm key={`setup-${profile.updated_at}`} profile={profile} variant="setup" onSaved={handleSaved} />
      </CompanionPanel>
    );
  }

  if (editMode) {
    return (
      <CompanionPanel
        eyebrow="You"
        titleLevel={1}
        title="Edit your health profile"
        description="Update your answers anytime — summaries used for personalization stay private to your account."
      >
        <ProfileForm
          key={`edit-${profile.updated_at}`}
          profile={profile}
          variant="edit"
          onCancel={() => setEditMode(false)}
          onSaved={handleSaved}
        />
      </CompanionPanel>
    );
  }

  return (
    <CompanionPanel
      eyebrow="You"
      titleLevel={1}
      title="Profile"
      description="Saved preferences power DoctorMatch and Clarity insights."
    >
      <ProfileSummary profile={profile} onEdit={() => setEditMode(true)} />
    </CompanionPanel>
  );
}
