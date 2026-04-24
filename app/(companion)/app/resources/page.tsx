import { resources } from "@/data/resources";
import { ZYRA } from "@/lib/zyra/site";
import { ResourcesExplorer } from "./resources-explorer";

export const dynamic = "force-static";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Learn</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Resources
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Short reads you can trust — written for clarity, not clicks. {ZYRA.name} does not
          replace your clinician; these pages help you feel a little more prepared.
        </p>
      </header>

      <ResourcesExplorer articles={resources} />
    </div>
  );
}
