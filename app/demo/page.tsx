import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { HackathonAgentShell } from "@/components/hackathon/HackathonAgentShell";
import { ZyraAgentFlow } from "@/components/hackathon/ZyraAgentFlow";
import {
  DEMO_INSURANCE_PREFILL,
  DEMO_SYMPTOMS_PREFILL,
  DEMO_ZIP_PREFILL,
} from "@/lib/demoData";
import { HACKATHON_MODE } from "@/lib/featureFlags";
import { ZYRA } from "@/lib/zyra/site";

export const metadata: Metadata = {
  title: `${ZYRA.name} demo`,
  description: "Live demo of the Zyra Agent flow with sample data.",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border/70 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-serif text-lg font-semibold tracking-tight text-foreground"
          >
            {ZYRA.name}
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-soft-rose/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles className="size-3.5" aria-hidden />
            Demo mode · sample data
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs">
          Live demo
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What can {ZYRA.name} help you with today?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          The intake form below is preloaded with sample symptoms, ZIP code,
          and insurance — just press <span className="font-semibold text-foreground">Continue</span> to walk through
          the full journey: Intake → Analysis → Match → Approve → Outreach →
          Summary. No sign-in required.
        </p>

        <div className="mt-8">
          {HACKATHON_MODE ? (
            <HackathonAgentShell>
              <ZyraAgentFlow
                initialSymptoms={DEMO_SYMPTOMS_PREFILL}
                initialZip={DEMO_ZIP_PREFILL}
                initialInsurance={DEMO_INSURANCE_PREFILL}
              />
            </HackathonAgentShell>
          ) : (
            <ZyraAgentFlow
              initialSymptoms={DEMO_SYMPTOMS_PREFILL}
              initialZip={DEMO_ZIP_PREFILL}
              initialInsurance={DEMO_INSURANCE_PREFILL}
            />
          )}
        </div>

        <p className="mt-10 rounded-2xl border border-border/60 bg-soft-rose/25 px-3 py-2.5 text-center text-xs leading-relaxed text-muted sm:px-4 sm:py-3">
          Demo data only. Zyra supports your care; it does not replace your
          clinician.
        </p>
      </main>
    </div>
  );
}
