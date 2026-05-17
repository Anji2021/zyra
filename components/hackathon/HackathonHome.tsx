"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  MapPinned,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { AgentActivityCard } from "./AgentActivityCard";

type QuickAction = {
  label: string;
  prefill: string;
  icon: typeof MapPinned;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Let Zyra research care options",
    prefill:
      "Research women’s health care options near me and shortlist who fits my symptoms.",
    icon: MapPinned,
  },
  {
    label: "Check insurance fit",
    prefill:
      "Zyra, check which nearby specialists are in network for my plan and flag copay estimates.",
    icon: ShieldCheck,
  },
  {
    label: "Have Zyra contact clinics",
    prefill:
      "Zyra, reach out to nearby clinics to confirm availability and insurance on my behalf.",
    icon: PhoneCall,
  },
  {
    label: "Prepare for my visit",
    prefill:
      "Zyra, help me prepare for my upcoming OB-GYN appointment with questions and what to bring.",
    icon: ClipboardCheck,
  },
];

export type HackathonHomeProps = {
  greetingName?: string | null;
  initialPlaceholder?: string;
};

export function HackathonHome({
  greetingName,
  initialPlaceholder = "I have irregular cycles and pelvic pain.",
}: HackathonHomeProps) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function goToAgent(prefill?: string) {
    const next = (prefill ?? value).trim();
    const href = next
      ? `/app/agent?q=${encodeURIComponent(next)}`
      : "/app/agent";
    router.push(href);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAgent();
  }

  const greeting = greetingName ? `Hi ${greetingName} — ` : "";

  return (
    <div className="flex min-w-0 flex-col gap-8 sm:gap-12">
      <section className="mx-auto w-full max-w-3xl pt-2 text-center sm:pt-6">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-soft-rose/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          <Sparkles className="size-3.5" aria-hidden />
          Zyra Agent
        </p>
        <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {greeting}What can Zyra help you with today?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Tell Zyra what&apos;s going on. One agent will research options, match
          you to care, run outreach, and hand you a care plan — without jumping
          between tools.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-7 w-full">
          <label htmlFor="hackathon-home-input" className="sr-only">
            Describe how you&apos;re feeling
          </label>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-accent/50 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-1.5 sm:pl-3">
            <input
              id="hackathon-home-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={initialPlaceholder}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-3 text-base text-foreground placeholder:text-muted/80 focus:outline-none sm:rounded-full sm:py-2.5"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Ask Zyra
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </form>

        <ul className="mx-auto mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.label} className="min-w-0">
                <button
                  type="button"
                  onClick={() => goToAgent(action.prefill)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-surface/95 px-3 py-2.5 text-left text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-soft-rose/30"
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-soft-rose/80 text-accent"
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="agent-activity-heading"
        className="mx-auto w-full max-w-3xl"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
              Agent activity
            </p>
            <h2
              id="agent-activity-heading"
              className="mt-1 font-serif text-lg font-semibold text-foreground sm:text-xl"
            >
              What Zyra is doing for you
            </h2>
          </div>
          <Link
            href="/app/agent"
            className="hidden text-xs font-semibold text-accent underline-offset-2 hover:underline sm:inline"
          >
            Start a flow →
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <AgentActivityCard
            icon={Stethoscope}
            title="Finding nearby specialists"
            detail="Pulls women's health providers near your ZIP."
            status="running"
          />
          <AgentActivityCard
            icon={ShieldCheck}
            title="Checking insurance compatibility"
            detail="Confirms in-network providers and likely copays."
            status="queued"
          />
          <AgentActivityCard
            icon={Building2}
            title="Preparing clinic outreach"
            detail="Drafts intro messages with your symptoms and preferences."
            status="queued"
          />
          <AgentActivityCard
            icon={CalendarCheck2}
            title="Summarizing care options"
            detail="Compares appointments, wait time, and fit."
            status="queued"
          />
        </div>
      </section>
    </div>
  );
}
