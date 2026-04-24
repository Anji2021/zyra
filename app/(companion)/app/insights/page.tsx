import { CompanionPanel } from "@/components/product/companion-panel";

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-8">
      <CompanionPanel
        eyebrow="Insights"
        titleLevel={1}
        title="Patterns worth noticing"
        description="When tracking is connected, this space will surface gentle summaries — cycle length changes, symptom clusters you logged, and medicine timing — always framed as memory support, not diagnosis."
      >
        <p className="text-sm leading-relaxed text-muted">
          Charts and highlights will stay minimal and opt-in. Nothing here replaces labs, imaging,
          or your clinician’s interpretation.
        </p>
      </CompanionPanel>
    </div>
  );
}
