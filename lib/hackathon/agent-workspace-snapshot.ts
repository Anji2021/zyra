import type { AgentFlowStep } from "@/lib/hackathon/agent-flow-types";
import type {
  AgentWorkspaceSnapshot,
  WorkspaceActivity,
} from "@/components/hackathon/AgentWorkspaceContext";
import { DEMO_INSURANCE_PREFILL } from "@/lib/demoData";

export function inferRecommendedSpecialty(symptoms: string): string {
  const s = symptoms.toLowerCase();
  if (
    s.includes("pelvic") ||
    s.includes("endometri") ||
    s.includes("pain")
  ) {
    return "Pelvic pain / endometriosis care";
  }
  if (
    s.includes("pcos") ||
    s.includes("cycle") ||
    s.includes("hormon") ||
    s.includes("irregular")
  ) {
    return "OB-GYN / hormonal care";
  }
  if (s.includes("fertility") || s.includes("ivf")) {
    return "Reproductive endocrinology";
  }
  return "Women's health (OB-GYN)";
}

function inferUrgency(symptoms: string): string {
  const s = symptoms.toLowerCase();
  if (s.includes("severe") || s.includes("bleeding") || s.includes("fever")) {
    return "Elevated — same-week access";
  }
  return "Standard coordination";
}

function activitiesForStep(
  step: AgentFlowStep,
  orchestrationPhase: number,
): WorkspaceActivity[] {
  const mk = (
    id: string,
    label: string,
    state: WorkspaceActivity["state"],
    /** Right-column badge: Done / Active / Pending */
    badge?: string,
  ): WorkspaceActivity => ({
    id,
    label,
    state,
    timeLabel:
      badge ??
      (state === "done" ? "Done" : state === "active" ? "Active" : undefined),
  });

  switch (step) {
    case "intake":
      return [
        mk("a", "Symptoms analyzed", "done"),
        mk("b", "Pathway identified", "done"),
        mk("c", "Queued web research", "active"),
        mk("d", "Preparing outreach", "todo"),
        mk("e", "Waiting approval", "todo"),
      ];
    case "research":
      return [
        mk("a", "Symptoms analyzed", "done"),
        mk("b", "Pathway identified", "done"),
        mk("c", "Researching provider quality", "active"),
        mk("d", "Preparing outreach", "todo"),
        mk("e", "Waiting approval", "todo"),
      ];
    case "match":
      return [
        mk("a", "Symptoms analyzed", "done"),
        mk("b", "Pathway identified", "done"),
        mk("c", "Web research distilled", "done"),
        mk("d", "Ranked matches", "done"),
        mk("e", "Waiting approval", "todo"),
      ];
    case "approve":
      return [
        mk("a", "Symptoms analyzed", "done"),
        mk("b", "Pathway identified", "done"),
        mk("c", "Web research distilled", "done"),
        mk("d", "Ranked matches", "done"),
        mk("e", "Waiting approval", "active"),
      ];
    case "act": {
      const labels = [
        "Contacting clinic",
        "Preparing outreach",
        "Checking availability",
        "Email path",
        "Awaiting response",
        "Outcome",
      ];
      const phase = orchestrationPhase;
      return labels.map((label, i) => {
        let state: WorkspaceActivity["state"] = "todo";
        if (phase > i) state = "done";
        else if (phase === i) state = "active";
        else state = "todo";
        return mk(`a${i + 1}`, label, state);
      });
    }
    case "care_plan":
      return [
        mk("a", "Symptoms analyzed", "done"),
        mk("b", "Pathway identified", "done"),
        mk("c", "Web research distilled", "done"),
        mk("d", "Care plan packaged", "done"),
        mk("e", "Ready for next run", "done"),
      ];
    default:
      return [];
  }
}

function insightsForStep(_step: AgentFlowStep): [string, string, string] {
  return ["Autonomous", "Supervised", "Demo"];
}

export function buildAgentWorkspaceSnapshot(input: {
  step: AgentFlowStep;
  symptoms: string;
  zip: string;
  insurance: string;
  orchestrationPhase: number;
}): AgentWorkspaceSnapshot {
  const { step, symptoms, zip, insurance, orchestrationPhase } = input;
  const ins = insurance.trim() || DEMO_INSURANCE_PREFILL;
  return {
    step,
    symptoms: symptoms.trim() || "—",
    zip: zip.trim() || "—",
    insurance: ins,
    recommendedSpecialty: inferRecommendedSpecialty(symptoms),
    urgencyLabel: inferUrgency(symptoms),
    activities: activitiesForStep(step, orchestrationPhase),
    insights: insightsForStep(step),
  };
}
