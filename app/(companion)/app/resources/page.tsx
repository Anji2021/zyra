import { resources } from "@/data/resources";
import { GLOBAL_MEDICAL_DISCLAIMER } from "@/lib/zyra/medical-disclaimer";
import { ZYRA } from "@/lib/zyra/site";
import { ResourcesExplorer } from "./resources-explorer";

export const dynamic = "force-static";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      <header className="space-y-2 sm:space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">Learn</p>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Resources
        </h1>
        <p className="max-w-2xl text-sm leading-snug text-muted sm:leading-relaxed sm:text-base">
          Short reads you can trust — written for clarity, not clicks. {ZYRA.name} does not
          replace your clinician; these pages help you feel a little more prepared.
        </p>
      </header>

      <p className="rounded-xl border border-border/60 bg-soft-rose/20 px-3 py-2 text-center text-[11px] leading-relaxed text-muted sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-xs">
        {GLOBAL_MEDICAL_DISCLAIMER}
      </p>

      <ResourcesExplorer articles={resources} />
    </div>
  );
}
