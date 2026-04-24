import { redirect } from "next/navigation";
import { hasProfileRow } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";
import { ZYRA } from "@/lib/zyra/site";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const exists = await hasProfileRow(supabase, user.id);
  if (exists) {
    redirect("/app");
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const defaultFullName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Welcome in
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Let’s set up your private profile
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          A few questions help {ZYRA.name} feel personal — not clinical. Take your time;
          you can adjust answers later.
        </p>
      </div>

      <div className="rounded-3xl border border-border/80 bg-surface/90 p-6 shadow-sm sm:p-8">
        <OnboardingForm defaultFullName={defaultFullName} />
      </div>
    </div>
  );
}
