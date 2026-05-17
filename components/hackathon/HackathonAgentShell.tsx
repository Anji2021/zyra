"use client";

import type { ReactNode } from "react";
import { AgentContextPanel } from "./AgentContextPanel";
import { AgentWorkspaceProvider } from "./AgentWorkspaceContext";

type HackathonAgentShellProps = {
  /** Renders above the workspace grid (e.g. PageHeader). */
  header?: ReactNode;
  children: ReactNode;
};

/**
 * Hackathon-only workspace: compact header + center (scroll) + right context rail.
 * Desktop: fills main viewport height; internal scroll only. Mobile: stacked, natural height.
 */
export function HackathonAgentShell({
  header,
  children,
}: HackathonAgentShellProps) {
  return (
    <AgentWorkspaceProvider>
      <div className="flex h-full min-h-0 flex-1 flex-col gap-1.5 lg:min-h-0 lg:gap-2">
        {header ? <div className="shrink-0">{header}</div> : null}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-2">
          <div className="order-1 flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-0.5 [scrollbar-gutter:stable] lg:overflow-hidden">
              {children}
            </div>
          </div>
          <div className="order-2 flex min-h-0 min-w-0 flex-col overflow-hidden lg:max-h-full">
            <AgentContextPanel className="max-h-[40vh] min-h-0 overflow-y-auto lg:max-h-none lg:flex-1 lg:overflow-y-auto" />
          </div>
        </div>
      </div>
    </AgentWorkspaceProvider>
  );
}
