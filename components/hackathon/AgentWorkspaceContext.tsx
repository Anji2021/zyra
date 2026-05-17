"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgentFlowStep } from "@/lib/hackathon/agent-flow-types";

export type WorkspaceActivityState = "done" | "active" | "todo";

export type WorkspaceActivity = {
  id: string;
  label: string;
  state: WorkspaceActivityState;
  /** Right-column status badge (Done / Active / Pending). */
  timeLabel?: string;
};

export type AgentWorkspaceSnapshot = {
  step: AgentFlowStep;
  symptoms: string;
  zip: string;
  insurance: string;
  recommendedSpecialty: string;
  urgencyLabel: string;
  activities: WorkspaceActivity[];
  insights: [string, string, string];
};

const defaultSnapshot: AgentWorkspaceSnapshot = {
  step: "intake",
  symptoms: "",
  zip: "",
  insurance: "",
  recommendedSpecialty: "—",
  urgencyLabel: "Standard",
  activities: [
    { id: "a", label: "Symptoms analyzed", state: "done", timeLabel: "Done" },
    { id: "b", label: "Pathway identified", state: "done", timeLabel: "Done" },
    { id: "c", label: "Queued web research", state: "active", timeLabel: "Active" },
    { id: "d", label: "Preparing outreach", state: "todo" },
    { id: "e", label: "Waiting approval", state: "todo" },
  ],
  insights: [
    "Zyra will triage once symptoms and ZIP are set.",
    "Nothing is sent without your approval.",
    "Research and outreach stay in this workspace.",
  ],
};

type AgentWorkspaceContextValue = {
  snapshot: AgentWorkspaceSnapshot;
  setSnapshot: React.Dispatch<React.SetStateAction<AgentWorkspaceSnapshot>>;
  merge: (partial: Partial<AgentWorkspaceSnapshot>) => void;
};

const AgentWorkspaceContext = createContext<AgentWorkspaceContextValue | null>(
  null,
);

/** Deep-ish compare for small snapshot fragments (activities, insights tuples). */
function workspaceValuesDiffer(a: unknown, b: unknown): boolean {
  if (a === b) return false;
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    return JSON.stringify(a) !== JSON.stringify(b);
  }
  return true;
}

function workspacePartialChangesSnapshot(
  prev: AgentWorkspaceSnapshot,
  partial: Partial<AgentWorkspaceSnapshot>,
): boolean {
  for (const key of Object.keys(partial) as Array<keyof AgentWorkspaceSnapshot>) {
    if (!Object.prototype.hasOwnProperty.call(partial, key)) continue;
    const nextVal = partial[key];
    const prevVal = prev[key];
    if (workspaceValuesDiffer(prevVal, nextVal)) return true;
  }
  return false;
}

export function AgentWorkspaceProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AgentWorkspaceSnapshot>(defaultSnapshot);

  const merge = useCallback((partial: Partial<AgentWorkspaceSnapshot>) => {
    setSnapshot((prev) => {
      if (!workspacePartialChangesSnapshot(prev, partial)) return prev;
      return { ...prev, ...partial };
    });
  }, []);

  const value = useMemo(
    () => ({ snapshot, setSnapshot, merge }),
    [snapshot, merge],
  );

  return (
    <AgentWorkspaceContext.Provider value={value}>
      {children}
    </AgentWorkspaceContext.Provider>
  );
}

export function useAgentWorkspace(): AgentWorkspaceContextValue {
  const v = useContext(AgentWorkspaceContext);
  if (!v) {
    throw new Error("useAgentWorkspace must be used within AgentWorkspaceProvider");
  }
  return v;
}

export function useOptionalAgentWorkspace(): AgentWorkspaceContextValue | null {
  return useContext(AgentWorkspaceContext);
}
