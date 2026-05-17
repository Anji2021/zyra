"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { SpecialistsSearch } from "@/app/(companion)/app/specialists/specialists-search";
import { AgentResearchStage } from "./AgentResearchStage";
import { AgentActivityCard } from "./AgentActivityCard";
import { ConfirmationEmailPreviewCard } from "./ConfirmationEmailPreviewCard";
import { ProviderApprovalCard } from "./ProviderApprovalCard";
import {
  bookViaProviderWebsite,
  buildProviderBookingRecords,
  displaySlotFromKey,
  getDemoContactForProvider,
  sendUserConfirmationEmail,
  slotKeyFromParts,
  type ProviderBookingRecord,
  type UserBookingContext,
} from "@/lib/agentIntegrations/booking";
import {
  DEMO_AVAILABILITY,
  DEMO_CARE_SUMMARY,
  DEMO_INSURANCE_CHECKS,
  DEMO_INSURANCE_PREFILL,
  DEMO_OUTREACH_RESULTS,
  DEMO_PROVIDERS,
  DEMO_SYMPTOMS_PREFILL,
  DEMO_ZIP_PREFILL,
  type DemoOutreachResult,
  type DemoProvider,
} from "@/lib/demoData";
import { getResearchNarrativeForProvider } from "@/lib/hackathon/provider-research-narrative";
import type { AgentFlowStep } from "@/lib/hackathon/agent-flow-types";
import {
  buildAgentWorkspaceSnapshot,
  inferRecommendedSpecialty,
} from "@/lib/hackathon/agent-workspace-snapshot";
import { getRankedProvidersWithDemoResearch } from "@/lib/agentIntegrations/webWrangler";
import { HACKATHON_MODE } from "@/lib/featureFlags";
import { useOptionalAgentWorkspace } from "./AgentWorkspaceContext";

const WORKSPACE_INTAKE_SYMPTOM_CHIPS = [
  "irregular cycles",
  "pelvic pain",
  "fatigue",
  "hormonal acne",
  "PCOS symptoms",
] as const;

const ACT_STEPS: Array<{
  key: string;
  title: string;
  detail: string;
  icon: typeof PhoneCall;
}> = [
  {
    key: "contact",
    title: "Contacting clinic",
    detail: "Zyra reaches scheduling with your approved context.",
    icon: PhoneCall,
  },
  {
    key: "availability",
    title: "Checking availability",
    detail: "Comparing first-available slots across clinics.",
    icon: CalendarCheck2,
  },
  {
    key: "insurance",
    title: "Verifying insurance",
    detail: "Confirming in-network status and estimated copay.",
    icon: ShieldCheck,
  },
  {
    key: "care-plan-prep",
    title: "Preparing your care plan",
    detail: "Packaging intake links, what to bring, and next questions.",
    icon: Building2,
  },
];

function initialSelectedSlots(): Record<string, string> {
  const m: Record<string, string> = {};
  for (const a of DEMO_AVAILABILITY) {
    const first = a.slots[0];
    if (first) m[a.providerId] = slotKeyFromParts(first.date, first.time);
  }
  return m;
}

const CONFIRMATION_SOURCE_LABEL: Record<
  ProviderBookingRecord["confirmationSource"],
  string
> = {
  demo: "Demo (simulated)",
  voice_api: "Voice API",
  email_api: "Email API",
  browser_api: "Browser automation",
  manual: "Manual / staff",
};

const BOOKING_STATUS_LABEL: Record<
  ProviderBookingRecord["bookingStatus"],
  string
> = {
  not_started: "Not started",
  researching: "Researching",
  ready_for_approval: "Ready for approval",
  outreach_pending: "Outreach pending",
  contacted: "Contacted",
  confirmed: "Confirmed",
  waitlisted: "Waitlisted",
  no_response: "No response",
  failed: "Failed",
};

export type ZyraAgentFlowProps = {
  /** Saved Google Place IDs for the embedded specialist search (same as /app/specialists). */
  savedPlaceIds?: string[];
  initialSymptoms?: string;
  initialZip?: string;
  initialInsurance?: string;
  /** Skip intake and start at Research (legacy demo bootstrap). */
  autoStart?: boolean;
};

export function ZyraAgentFlow({
  savedPlaceIds = [],
  initialSymptoms = "",
  initialZip = "",
  initialInsurance = "",
  autoStart = false,
}: ZyraAgentFlowProps) {
  const [step, setStep] = useState<AgentFlowStep>(autoStart ? "research" : "intake");
  const [symptoms, setSymptoms] = useState(
    initialSymptoms || (autoStart ? DEMO_SYMPTOMS_PREFILL : ""),
  );
  const [zip, setZip] = useState(initialZip || (autoStart ? DEMO_ZIP_PREFILL : ""));
  const [insurance, setInsurance] = useState(
    initialInsurance || (autoStart ? DEMO_INSURANCE_PREFILL : ""),
  );
  const [orchestrationIndex, setOrchestrationIndex] = useState(0);
  const [outreach, setOutreach] = useState<DemoOutreachResult[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>(
    initialSelectedSlots,
  );
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<null | "book" | "email">(null);
  const [emailConfirmationSimulated, setEmailConfirmationSimulated] =
    useState(false);
  const [previewOutreachOpen, setPreviewOutreachOpen] = useState(false);
  const [matchDetailProviderId, setMatchDetailProviderId] = useState<string | null>(
    null,
  );

  const agentWs = useOptionalAgentWorkspace();
  const workspaceMode = HACKATHON_MODE && agentWs !== null;
  const stepRef = useRef<HTMLDivElement | null>(null);

  const workspaceSnapshot = useMemo(
    () =>
      buildAgentWorkspaceSnapshot({
        step,
        symptoms,
        zip,
        insurance,
        orchestrationPhase: step === "act" ? orchestrationIndex : 0,
      }),
    [step, symptoms, zip, insurance, orchestrationIndex],
  );

  const mergeWorkspaceSnapshot = agentWs?.merge;
  useEffect(() => {
    if (!workspaceMode || !mergeWorkspaceSnapshot) return;
    mergeWorkspaceSnapshot(workspaceSnapshot);
  }, [workspaceMode, workspaceSnapshot, mergeWorkspaceSnapshot]);

  const userContext: UserBookingContext = useMemo(
    () => ({
      symptoms,
      zip,
      insurance,
      userEmail: null,
    }),
    [symptoms, zip, insurance],
  );

  const completeResearch = useCallback(() => {
    setStep("match");
  }, []);

  useEffect(() => {
    if (step !== "match") setMatchDetailProviderId(null);
  }, [step]);

  useEffect(() => {
    if (workspaceMode || step === "intake") return;
    stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, workspaceMode]);

  useEffect(() => {
    if (step !== "act") return;
    const ticks = workspaceMode ? 6 : ACT_STEPS.length;
    const delay = workspaceMode ? 850 : 1100;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < ticks; i++) {
      timers.push(
        setTimeout(() => setOrchestrationIndex(i + 1), delay * (i + 1)),
      );
    }
    timers.push(
      setTimeout(() => {
        setOutreach(DEMO_OUTREACH_RESULTS);
        setStep("care_plan");
      }, delay * (ticks + 1)),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [step, workspaceMode]);

  const providers = useMemo(
    () =>
      getRankedProvidersWithDemoResearch(DEMO_PROVIDERS, {
        symptoms,
        zip,
        insurance: insurance.trim() || DEMO_INSURANCE_PREFILL,
      }),
    [symptoms, zip, insurance],
  );
  const insuranceById = useMemo(
    () => new Map(DEMO_INSURANCE_CHECKS.map((c) => [c.providerId, c])),
    [],
  );
  const availabilityById = useMemo(
    () => new Map(DEMO_AVAILABILITY.map((a) => [a.providerId, a])),
    [],
  );

  const estimatedCopayByProviderId = useMemo(() => {
    const m: Record<string, string> = {};
    insuranceById.forEach((v, k) => {
      m[k] = v.estimatedCopay;
    });
    return m;
  }, [insuranceById]);

  const availableSlotsByProviderId = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const a of DEMO_AVAILABILITY) {
      m[a.providerId] = a.slots.map((s) =>
        displaySlotFromKey(slotKeyFromParts(s.date, s.time)),
      );
    }
    return m;
  }, []);

  const outreachByProviderId = useMemo(() => {
    const m: Record<
      string,
      { status: DemoOutreachResult["status"]; responseSummary: string }
    > = {};
    for (const o of outreach) {
      m[o.providerId] = {
        status: o.status,
        responseSummary: o.responseSummary,
      };
    }
    return m;
  }, [outreach]);

  const bookingRecords: ProviderBookingRecord[] = useMemo(() => {
    if (step !== "care_plan") return [];
    return buildProviderBookingRecords({
      providerIds: providers.map((p) => ({
        id: p.id,
        name: p.name,
        clinic: p.clinic,
        address: p.address,
        inNetwork: p.inNetwork,
      })),
      selectedSlots,
      insurancePlanLabel: insurance.trim() || DEMO_INSURANCE_PREFILL,
      estimatedCopayByProviderId,
      availableSlotsByProviderId,
      outreachByProviderId,
      confirmationSource: "demo",
    });
  }, [
    step,
    providers,
    selectedSlots,
    insurance,
    estimatedCopayByProviderId,
    availableSlotsByProviderId,
    outreachByProviderId,
  ]);

  const firstConfirmedBooking = useMemo(() => {
    return bookingRecords.find((r) => r.bookingStatus === "confirmed") ?? null;
  }, [bookingRecords]);

  function handleIntakeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("research");
  }

  function handleApproveOutreach() {
    setApprovalNotice(null);
    setOrchestrationIndex(0);
    setStep("act");
  }

  async function handleBookSelectedSlot() {
    const primary = providers[0];
    if (!primary) return;
    const key = selectedSlots[primary.id];
    if (!key) return;
    setBusyAction("book");
    setApprovalNotice(null);
    try {
      await bookViaProviderWebsite(
        primary,
        displaySlotFromKey(key),
        userContext,
      );
      setApprovalNotice(
        "Demo: slot hold simulated — ready for Browser Use integration.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSendConfirmationEmailApproval() {
    const primary = providers[0];
    if (!primary) return;
    const key = selectedSlots[primary.id] ?? "";
    setBusyAction("email");
    setApprovalNotice(null);
    try {
      await sendUserConfirmationEmail(null, {
        providerName: primary.name,
        appointmentLine: displaySlotFromKey(key),
        clinicLine: `${primary.clinic} — ${primary.address}`,
        intakeLink: getDemoContactForProvider(primary.id).intakeLink,
        whatToBring: DEMO_CARE_SUMMARY.whatToBring,
        questionsForClinician: DEMO_CARE_SUMMARY.questionsForClinician,
      });
      setApprovalNotice(
        "Confirmation email simulated — ready for AgentMail integration.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSendConfirmationFromSummary() {
    if (!firstConfirmedBooking) return;
    await sendUserConfirmationEmail(null, {
      providerName: firstConfirmedBooking.providerName,
      appointmentLine: displaySlotFromKey(firstConfirmedBooking.selectedSlot),
      clinicLine: `${firstConfirmedBooking.clinicName} — ${firstConfirmedBooking.location}`,
      intakeLink: firstConfirmedBooking.intakeLink,
      whatToBring: DEMO_CARE_SUMMARY.whatToBring,
      questionsForClinician: DEMO_CARE_SUMMARY.questionsForClinician,
    });
    setEmailConfirmationSimulated(true);
  }

  function fillDemoCase() {
    setSymptoms(DEMO_SYMPTOMS_PREFILL);
    setZip(DEMO_ZIP_PREFILL);
    setInsurance(DEMO_INSURANCE_PREFILL);
  }

  const appendIntakeSymptomChip = useCallback((chip: string) => {
    setSymptoms((prev) => {
      const t = prev.trim();
      const needle = chip.toLowerCase();
      if (!t) return chip;
      if (t.toLowerCase().includes(needle)) return prev;
      return `${t}, ${chip}`;
    });
  }, []);

  return (
    <div
      ref={stepRef}
      className={
        workspaceMode
          ? "flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden"
          : "flex min-w-0 flex-col gap-6"
      }
    >
      {workspaceMode ? (
        <div className="shrink-0 space-y-0.5">
          <FlowProgress current={step} compact />
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border/40 bg-background/40 px-1.5 py-0.5 text-[9px] leading-tight text-foreground/85">
            <span className="shrink-0 font-semibold uppercase tracking-[0.08em] text-muted">
              Demo
            </span>
            <span className="text-border/60" aria-hidden>
              ·
            </span>
            <span className="min-w-0 flex-1 truncate">
              {agentStatusMessage(step, providers.length, orchestrationIndex)}
            </span>
          </div>
        </div>
      ) : (
        <>
          <FlowProgress current={step} />
          <p className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-xs leading-relaxed text-muted sm:items-center sm:px-4">
            <Info
              className="mt-0.5 size-4 shrink-0 text-accent sm:mt-0"
              aria-hidden
            />
            <span>
              <span className="font-medium text-foreground">Demo mode:</span>{" "}
              outreach and booking results are simulated. API integration ready for
              voice, email, browser, and web automation.
            </span>
          </p>
        </>
      )}

      <div
        className={
          workspaceMode
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "contents"
        }
      >

      {step === "intake" ? (
        workspaceMode ? (
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
          <form
            onSubmit={handleIntakeSubmit}
            className="rounded-lg border border-border/50 bg-surface/95 p-2 shadow-sm"
          >
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-accent">
              Step 1 · Intake
            </p>
            <label htmlFor="symptoms" className="sr-only">
              Tell Zyra what&apos;s going on
            </label>
            <textarea
              id="symptoms"
              required
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Tell Zyra what's going on…"
              className="mt-1 w-full resize-none rounded-md border border-border bg-background/80 px-2 py-1.5 text-[13px] leading-snug text-foreground placeholder:text-muted/70 focus:border-accent/40 focus:outline-none"
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {WORKSPACE_INTAKE_SYMPTOM_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => appendIntakeSymptomChip(chip)}
                  className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[9px] font-medium text-foreground/90 capitalize transition hover:border-accent/30"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="zip"
                  className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted"
                >
                  ZIP
                </label>
                <input
                  id="zip"
                  required
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="94110"
                  className="mt-0.5 w-full rounded-md border border-border bg-background/80 px-1.5 py-1 text-[11px] text-foreground focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="insurance"
                  className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted"
                >
                  Insurance
                </label>
                <input
                  id="insurance"
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  placeholder="Plan / carrier"
                  className="mt-0.5 w-full rounded-md border border-border bg-background/80 px-1.5 py-1 text-[11px] text-foreground focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Specialty
                </p>
                <p className="mt-0.5 truncate rounded-md border border-border/50 bg-background/60 px-1.5 py-1 text-[11px] font-medium text-foreground/90">
                  {inferRecommendedSpecialty(symptoms)}
                </p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={fillDemoCase}
                className="inline-flex min-h-7 items-center justify-center rounded-full border border-border/70 bg-background/80 px-3 text-[11px] font-semibold text-muted transition hover:text-foreground"
              >
                Use demo case
              </button>
              <button
                type="submit"
                className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full bg-accent px-3 text-[11px] font-semibold text-accent-foreground transition hover:opacity-90"
              >
                Start care research
                <ArrowRight className="size-3" aria-hidden />
              </button>
            </div>
          </form>
          </div>
        ) : (
        <form
          onSubmit={handleIntakeSubmit}
          className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Step 1 · Tell Zyra what&apos;s going on
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
            What&apos;s happening with your body?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Zyra uses this to research care options and coordinate next steps — not
            as a diagnosis.
          </p>

          <div className="mt-5 space-y-4">
            <FieldLabel htmlFor="symptoms" label="Symptoms" hint="Free text — describe what you're feeling.">
              <textarea
                id="symptoms"
                required
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={DEMO_SYMPTOMS_PREFILL}
                className="w-full resize-none rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/80 focus:border-accent/50 focus:outline-none"
              />
            </FieldLabel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldLabel htmlFor="zip" label="ZIP code" hint="Zyra uses this for distance and the live care search panel in Match.">
                <input
                  id="zip"
                  required
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="94110"
                  className="w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/80 focus:border-accent/50 focus:outline-none"
                />
              </FieldLabel>
              <FieldLabel htmlFor="insurance" label="Insurance" hint="Plan name or carrier — optional.">
                <input
                  id="insurance"
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  placeholder="Blue Shield PPO"
                  className="w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/80 focus:border-accent/50 focus:outline-none"
                />
              </FieldLabel>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </form>
        )
      ) : null}

      {step === "research" ? (
        workspaceMode ? (
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
            <AgentResearchStage
              insuranceLabel={insurance.trim() || DEMO_INSURANCE_PREFILL}
              symptomsText={symptoms}
              zipText={zip}
              onComplete={completeResearch}
              variant="compact"
            />
          </div>
        ) : (
        <AgentResearchStage
          insuranceLabel={insurance.trim() || DEMO_INSURANCE_PREFILL}
          symptomsText={symptoms}
          zipText={zip}
          onComplete={completeResearch}
          variant="full"
        />
        )
      ) : null}

      {step === "match" ? (
        workspaceMode ? (
          <section className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
            <div className="shrink-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
                Step 3 · Match
              </p>
              <p className="text-[10px] leading-tight text-foreground/85">
                Ranked for your case — open details only when you need them.
              </p>
            </div>

            <ul
              role="list"
              className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 content-start gap-1.5 overflow-hidden sm:grid-cols-2 sm:gap-2 [&>li:only-child]:sm:col-span-2 [&>li:only-child]:sm:mx-auto [&>li:only-child]:sm:max-w-md [&>li:last-child:nth-child(odd):not(:first-child)]:sm:col-span-2 [&>li:last-child:nth-child(odd):not(:first-child)]:sm:mx-auto [&>li:last-child:nth-child(odd):not(:first-child)]:sm:max-w-md"
            >
              {providers.map((provider, idx) => (
                <CompactMatchProviderCard
                  key={provider.id}
                  provider={provider}
                  rank={idx + 1}
                  onOpenDetails={() => setMatchDetailProviderId(provider.id)}
                  onSelectForOutreach={() => setStep("approve")}
                />
              ))}
            </ul>

            <div className="flex shrink-0 flex-wrap justify-end gap-1 border-t border-border/35 pt-1">
              <button
                type="button"
                onClick={() => {
                  setApprovalNotice(null);
                  setOutreach([]);
                  setStep("care_plan");
                }}
                className="inline-flex min-h-7 items-center justify-center rounded-full border border-border/70 bg-surface px-3 text-[11px] font-semibold text-muted transition hover:text-foreground"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => setStep("approve")}
                className="inline-flex min-h-7 items-center justify-center gap-1 rounded-full bg-accent px-3 text-[11px] font-semibold text-accent-foreground transition hover:opacity-90"
              >
                Continue
                <ArrowRight className="size-3" aria-hidden />
              </button>
            </div>

            <MatchProviderDetailOverlay
              provider={
                matchDetailProviderId
                  ? (providers.find((p) => p.id === matchDetailProviderId) ?? null)
                  : null
              }
              insurancePlanName={insurance.trim() || DEMO_INSURANCE_PREFILL}
              open={matchDetailProviderId !== null}
              onClose={() => setMatchDetailProviderId(null)}
            />
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Step 3 · Match
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
                Zyra ranked these care matches from web research
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Providers Zyra investigated for your case{zip ? ` near ${zip}` : ""}
                {insurance ? ` · ${insurance}` : ""}. The embedded care search below uses the same flow,
                unified inside the agent workspace.
              </p>
            </div>

            <ul className="space-y-3">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  insurancePlanName={insurance || DEMO_INSURANCE_PREFILL}
                  rationaleBullets={
                    getResearchNarrativeForProvider(provider.id)?.selectionRationale
                  }
                />
              ))}
            </ul>

            <div className="rounded-2xl border border-border/70 bg-surface/95 p-3 shadow-sm sm:rounded-3xl sm:p-4">
              <SpecialistsSearch
                savedPlaceIds={savedPlaceIds}
                embedVariant="agent"
                agentInitialLocation={zip}
                agentInitialSymptomsText={symptoms}
                agentAutoRun={Boolean(zip.trim() && symptoms.trim())}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setApprovalNotice(null);
                  setOutreach([]);
                  setStep("care_plan");
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/80 bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                Skip coordination for now
              </button>
              <button
                type="button"
                onClick={() => setStep("approve")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
              >
                Continue to coordination
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </section>
        )
      ) : null}

      {step === "approve" ? (
        <section
          className={
            workspaceMode
              ? "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pr-0.5"
              : "space-y-3"
          }
        >
          {!workspaceMode ? (
            <div className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Step 4 · Approve
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
                Delegate outreach to Zyra
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Choose preferred slots, optionally simulate booking or email, then
                authorize Zyra to contact clinics on your behalf.
              </p>
            </div>
          ) : null}

          {approvalNotice ? (
            <p
              className="rounded-xl border border-sage/30 bg-sage/10 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              {approvalNotice}
            </p>
          ) : null}

          <ProviderApprovalCard
            providers={providers}
            availabilityById={availabilityById}
            selectedSlots={selectedSlots}
            onSlotChange={(providerId, slotKey) => {
              setSelectedSlots((prev) => ({ ...prev, [providerId]: slotKey }));
            }}
            onApproveContact={handleApproveOutreach}
            onDecline={() => {
              setApprovalNotice(null);
              setOutreach([]);
              setStep("care_plan");
            }}
            onBookSelectedSlot={handleBookSelectedSlot}
            onSendConfirmationEmail={handleSendConfirmationEmailApproval}
            busyAction={busyAction}
            layout={workspaceMode ? "workspace" : "default"}
            onEditSelections={
              workspaceMode ? () => setStep("match") : undefined
            }
            onBackToResearch={
              workspaceMode ? () => setStep("research") : undefined
            }
            onPreviewOutreach={
              workspaceMode ? () => setPreviewOutreachOpen(true) : undefined
            }
          />
        </section>
      ) : null}

      {step === "act" ? (
        workspaceMode ? (
          <section className="rounded-lg border border-border/50 bg-surface/90 p-2 shadow-sm">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted">
              Step 5 · Act
            </p>
            <ActOperationsBoard
              providers={providers}
              orchestrationPhase={orchestrationIndex}
            />
          </section>
        ) : (
          <section className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Step 5 · Act
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
              Zyra is acting on your approvals
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Outreach channels, booking holds, and confirmations — orchestrated as
              one run. Below is the simulated run; wire your APIs when ready.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReadinessBadge label="Browser-ready" tone="ready" />
              <ReadinessBadge label="Voice-ready" tone="ready" />
              <ReadinessBadge label="Email-ready" tone="ready" />
              <ReadinessBadge label="API pending" tone="pending" />
            </div>
            <p className="mt-2 text-xs text-muted">
              Ready for Browser Use / AgentMail integration when you connect APIs.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ACT_STEPS.map((s, idx) => (
                <AgentActivityCard
                  key={s.key}
                  icon={s.icon}
                  title={s.title}
                  detail={s.detail}
                  status={
                    idx < orchestrationIndex
                      ? "done"
                      : idx === orchestrationIndex
                        ? "running"
                        : "queued"
                  }
                />
              ))}
            </div>
          </section>
        )
      ) : null}

      {step === "care_plan" ? (
        <div
          className={
            workspaceMode ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5" : ""
          }
        >
        <SummarySection
          providers={providers}
          outreach={outreach}
          bookingRecords={bookingRecords}
          availabilityById={availabilityById}
          insuranceById={insuranceById}
          firstConfirmedBooking={firstConfirmedBooking}
          emailConfirmationSimulated={emailConfirmationSimulated}
          onSendConfirmationEmail={() =>
            void handleSendConfirmationFromSummary()
          }
          workspaceLayout={workspaceMode}
          onRestart={() => {
            setOrchestrationIndex(0);
            setSymptoms("");
            setZip("");
            setInsurance("");
            setOutreach([]);
            setSelectedSlots(initialSelectedSlots());
            setApprovalNotice(null);
            setEmailConfirmationSimulated(false);
            setMatchDetailProviderId(null);
            setStep("intake");
          }}
        />
        </div>
      ) : null}
      </div>

      {previewOutreachOpen && workspaceMode ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
          role="presentation"
          onClick={() => setPreviewOutreachOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/70 bg-surface p-5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="outreach-preview-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="outreach-preview-title"
              className="font-serif text-lg font-semibold text-foreground"
            >
              Outreach preview (simulated)
            </h3>
            <p className="mt-2 text-xs text-muted">
              Copy Zyra would send on your behalf after you approve — no messages
              leave this demo.
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border/60 bg-background/70 p-3 font-sans text-[11px] leading-relaxed text-foreground">
              {`Subject: New patient request — ${symptoms.slice(0, 60)}${symptoms.length > 60 ? "…" : ""}\n\nHello,\n\nI'm Zyra, coordinating on behalf of a patient in ${zip || "—"} with ${insurance.trim() || DEMO_INSURANCE_PREFILL}. They are interested in ${providers[0]?.name ?? "your clinic"} on ${displaySlotFromKey(
                providers[0]
                  ? selectedSlots[providers[0].id] ?? null
                  : null,
              )}.\n\nPlease confirm availability or suggest the next best slot.\n\n— Zyra (demo)`}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewOutreachOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActOperationsBoard({
  providers,
  orchestrationPhase,
}: {
  providers: DemoProvider[];
  orchestrationPhase: number;
}) {
  const stages = [
    { status: "Queued", channel: "—", next: "Await queue", src: "Demo" },
    {
      status: "Contacting",
      channel: "Phone",
      next: "Reach scheduling",
      src: "Demo",
    },
    {
      status: "Browser-ready",
      channel: "Web",
      next: "Check booking page",
      src: "Browser Use-ready",
    },
    {
      status: "Email-ready",
      channel: "Email",
      next: "Draft confirmation",
      src: "AgentMail-ready",
    },
    {
      status: "Awaiting response",
      channel: "Mixed",
      next: "Collect clinic replies",
      src: "Demo",
    },
    {
      status: "Outcome",
      channel: "Mixed",
      next: "Sync to care plan",
      src: "Demo (simulated)",
    },
  ];

  return (
    <div className="mt-1 overflow-x-auto rounded-md border border-border/45">
      <table className="w-full min-w-[320px] border-collapse text-left text-[10px]">
        <thead>
          <tr className="border-b border-border/50 bg-background/60 text-[8px] font-semibold uppercase tracking-[0.08em] text-muted">
            <th className="px-1.5 py-1">Provider</th>
            <th className="px-1.5 py-1">Status</th>
            <th className="px-1.5 py-1">Next</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p, idx) => {
            const stageIdx = Math.min(
              stages.length - 1,
              Math.max(0, orchestrationPhase - 1 - idx),
            );
            const row = stages[stageIdx];
            const shortName = p.name.split(",")[0]?.trim() ?? p.name;
            return (
              <tr
                key={p.id}
                className="border-b border-border/30 last:border-0 odd:bg-background/25"
              >
                <td className="px-1.5 py-1 font-medium text-foreground">{shortName}</td>
                <td className="px-1.5 py-1 text-foreground">{row.status}</td>
                <td className="px-1.5 py-1 text-muted">{row.next}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function agentStatusMessage(
  step: AgentFlowStep,
  _providerCount: number,
  _orchestrationPhase: number,
): string {
  switch (step) {
    case "intake":
      return "Ready to analyze symptoms, identify care path, and research provider options.";
    case "research":
      return "Zyra is comparing provider quality, access, reviews, and insurance signals.";
    case "match":
      return "Ranked by fit, access, and insurance signals.";
    case "approve":
      return "Review the plan before Zyra contacts clinics.";
    case "act":
      return "Outreach and booking actions are queued for API-backed execution.";
    case "care_plan":
      return "Care plan generated from selected provider and outreach status.";
    default:
      return "";
  }
}

function FieldLabel({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1 text-[11px] text-muted/90">{hint}</p> : null}
    </div>
  );
}

function FlowProgress({
  current,
  compact,
}: {
  current: AgentFlowStep;
  compact?: boolean;
}) {
  const stages: Array<{ key: AgentFlowStep; label: string }> = [
    { key: "intake", label: "Intake" },
    { key: "research", label: "Research" },
    { key: "match", label: "Match" },
    { key: "approve", label: "Approve" },
    { key: "act", label: "Act" },
    { key: "care_plan", label: "Care Plan" },
  ];
  const order: AgentFlowStep[] = stages.map((s) => s.key);
  const currentIndex = Math.max(0, order.indexOf(current));

  return (
    <ol
      aria-label="Progress"
      className={
        compact
          ? "flex w-full min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border border-border/65 bg-surface/95 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-muted [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-surface/95 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      {stages.map((stage, idx) => {
        const isCurrent = idx === currentIndex;
        const isDone = idx < currentIndex;
        return (
          <li
            key={stage.key}
            className={`flex items-center gap-0.5 whitespace-nowrap rounded-full transition-colors ${
              compact ? "px-1.5 py-0.5" : "gap-1.5 px-2.5 py-1"
            } ${
              isCurrent
                ? "bg-accent text-accent-foreground"
                : isDone
                  ? "bg-sage/15 text-sage"
                  : "text-muted"
            }`}
          >
            {isDone ? (
              <CheckCircle2 className={compact ? "size-2.5" : "size-3"} aria-hidden />
            ) : isCurrent ? (
              compact ? (
                <span className="relative flex size-2.5 shrink-0 items-center justify-center">
                  <span className="absolute size-2 rounded-full bg-accent/35 motion-safe:animate-pulse" />
                  <span className="relative size-1 rounded-full bg-accent" />
                </span>
              ) : (
                <Loader2
                  className={`${compact ? "size-2.5" : "size-3"} animate-spin`}
                  aria-hidden
                />
              )
            ) : (
              <span
                className={`inline-block rounded-full bg-current opacity-50 ${compact ? "size-1" : "size-1.5"}`}
                aria-hidden
              />
            )}
            {stage.label}
          </li>
        );
      })}
    </ol>
  );
}

function ReadinessBadge({
  label,
  tone,
}: {
  label: string;
  tone: "ready" | "pending";
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        tone === "ready"
          ? "border-sage/40 bg-sage/10 text-sage"
          : "border-border/70 bg-background/80 text-muted"
      }`}
    >
      {label}
    </span>
  );
}

function MatchProviderDetailOverlay({
  provider,
  insurancePlanName,
  open,
  onClose,
}: {
  provider: DemoProvider | null;
  insurancePlanName: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !provider) return null;
  const r = provider.providerResearch;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.address)}`;

  const clip = (s: string, n: number) => {
    const t = s.trim();
    return t.length <= n ? t : `${t.slice(0, n)}…`;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-h-[min(420px,78dvh)] w-full max-w-sm overflow-y-auto rounded-xl border border-border/60 bg-surface p-3 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              id="match-detail-title"
              className="truncate font-semibold text-sm text-foreground"
            >
              {provider.name}
            </p>
            <p className="truncate text-[10px] text-muted">{provider.clinic}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 p-1 text-muted transition hover:text-foreground"
            aria-label="Close details"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        {r ? (
          <div className="mt-2 space-y-2 text-[10px] leading-snug text-muted">
            <section>
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                Signals
              </p>
              <ul className="mt-0.5 space-y-0.5">
                {r.reputationSignals.slice(0, 5).map((x) => (
                  <li key={x}>· {clip(x, 96)}</li>
                ))}
              </ul>
            </section>
            <section>
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                Reviews
              </p>
              <ul className="mt-0.5 space-y-0.5">
                {r.reviewHighlights.slice(0, 4).map((x) => (
                  <li key={x}>· {clip(x, 96)}</li>
                ))}
              </ul>
            </section>
            <section>
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                Insurance
              </p>
              <ul className="mt-0.5 space-y-0.5">
                {r.insuranceSignals.slice(0, 4).map((x) => (
                  <li key={x}>· {clip(x, 96)}</li>
                ))}
              </ul>
            </section>
            <section>
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                Access
              </p>
              <ul className="mt-0.5 space-y-0.5">
                {r.accessSignals.slice(0, 4).map((x) => (
                  <li key={x}>· {clip(x, 96)}</li>
                ))}
              </ul>
            </section>
            {r.redFlags.length > 0 ? (
              <p className="rounded border border-border/50 bg-background/70 px-1.5 py-1 text-foreground">
                <span className="font-semibold">Flag · </span>
                {r.redFlags.map((x) => clip(x, 120)).join(" ")}
              </p>
            ) : null}
            <p className="text-[9px] text-muted/80">{insurancePlanName} · demo</p>
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-accent"
            >
              <ExternalLink className="size-2.5" aria-hidden />
              Open in Maps
            </a>
          </div>
        ) : (
          <p className="mt-2 text-[10px] text-muted">Research signals not available.</p>
        )}
      </div>
    </div>
  );
}

function CompactMatchProviderCard({
  provider,
  rank,
  onOpenDetails,
  onSelectForOutreach,
}: {
  provider: DemoProvider;
  rank: number;
  onOpenDetails: () => void;
  onSelectForOutreach?: () => void;
}) {
  const r = provider.providerResearch;
  const matchScore = r?.matchScore ?? Math.max(72, 94 - rank * 6);
  const confidence = r?.confidenceScore;
  const accessShort =
    provider.nextAvailable.includes("May 19") ||
    provider.nextAvailable.includes("May 20")
      ? "This week"
      : provider.nextAvailable.split("·")[0]?.trim() ?? provider.nextAvailable;
  const sigs = (
    [
      r?.reputationSignals[0],
      r?.reviewHighlights[0],
      r?.accessSignals[0] ?? r?.insuranceSignals[0],
    ].filter(Boolean) as string[]
  ).slice(0, 3);

  const clip = (s: string, n: number) => {
    const t = s.trim();
    return t.length <= n ? t : `${t.slice(0, n)}…`;
  };

  return (
    <li className="flex h-full min-h-0 flex-col rounded-lg border border-border/45 bg-surface/95 p-1.5 shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
            <span className="font-normal text-muted">#{rank}</span> {provider.name}
          </p>
          <p className="truncate text-[9px] text-muted">{provider.clinic}</p>
        </div>
        <span className="shrink-0 rounded-full border border-accent/20 bg-soft-rose/40 px-1.5 py-0.5 text-[8px] font-bold tabular-nums text-foreground">
          {matchScore}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[9px] text-muted">
        <span className={provider.inNetwork ? "font-medium text-sage" : "text-foreground/85"}>
          {provider.inNetwork ? "In-network" : "OON"}
        </span>
        <span className="text-border/50" aria-hidden>
          ·
        </span>
        <span className="truncate">{accessShort}</span>
        <span className="text-border/50" aria-hidden>
          ·
        </span>
        <span className="tabular-nums text-foreground/80">
          Conf {confidence ?? "—"}
        </span>
      </div>

      <ul className="mt-1 min-h-0 flex-1 space-y-0">
        {sigs.map((s, i) => (
          <li
            key={`${provider.id}-sig-${i}`}
            className="flex gap-1 text-[9px] leading-tight text-foreground/85"
          >
            <span className="shrink-0 text-sage" aria-hidden>
              ✓
            </span>
            <span className="line-clamp-2">{clip(s, 64)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-1.5 flex justify-end gap-1 border-t border-border/35 pt-1">
        <button
          type="button"
          onClick={onOpenDetails}
          className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[9px] font-semibold text-foreground transition hover:bg-background"
        >
          Details
        </button>
        {onSelectForOutreach ? (
          <button
            type="button"
            onClick={onSelectForOutreach}
            className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Select
          </button>
        ) : null}
      </div>
    </li>
  );
}

function ProviderCard({
  provider,
  insurancePlanName,
  rationaleBullets,
}: {
  provider: DemoProvider;
  insurancePlanName: string;
  rationaleBullets?: string[];
}) {
  return (
    <li className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-semibold text-foreground">
            {provider.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {provider.specialty} · {provider.clinic}
          </p>
          <p className="mt-1 truncate text-xs text-muted">
            {provider.address} · {provider.distanceMiles.toFixed(1)} mi away
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            provider.inNetwork
              ? "bg-sage/15 text-sage"
              : "bg-soft-rose/60 text-accent"
          }`}
        >
          {provider.inNetwork
            ? `In network · ${insurancePlanName}`
            : "Out of network"}
        </span>
      </div>

      {rationaleBullets && rationaleBullets.length > 0 ? (
        <div className="mt-3 rounded-xl border border-accent/20 bg-soft-rose/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            Why Zyra ranked this provider
          </p>
          <ul className="mt-1.5 space-y-1 text-xs leading-snug text-foreground">
            {rationaleBullets.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {provider.providerResearch ? (
        <div className="mt-3 rounded-xl border border-border/55 bg-background/55 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            Web Research Summary
          </p>
          <p className="mt-1 text-xs leading-snug text-foreground/90">
            {provider.providerResearch.webResearchSummary}
          </p>
          <p className="mt-2 text-[10px] font-semibold text-foreground">
            Match {provider.providerResearch.matchScore} · Confidence{" "}
            {provider.providerResearch.confidenceScore}
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-snug text-muted">
            {provider.providerResearch.reputationSignals.slice(0, 2).map((s) => (
              <li key={s}>· {s}</li>
            ))}
            {provider.providerResearch.reviewHighlights[0] ? (
              <li key="rh">· {provider.providerResearch.reviewHighlights[0]}</li>
            ) : null}
            {provider.providerResearch.accessSignals[0] ? (
              <li key="ac">· {provider.providerResearch.accessSignals[0]}</li>
            ) : null}
          </ul>
          <p className="mt-2 text-[10px] text-muted/90">
            Demo research shown. Browser/search APIs can replace mocked signals during sponsor
            integration.
          </p>
        </div>
      ) : null}

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {provider.highlights.map((h) => (
          <li
            key={h}
            className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] text-muted"
          >
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          {provider.rating.toFixed(1)} · {provider.reviewCount} reviews
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck2 className="size-3.5 text-accent" aria-hidden />
          Next available: {provider.nextAvailable}
        </span>
      </div>
    </li>
  );
}

function SummarySection({
  providers,
  outreach,
  bookingRecords,
  availabilityById,
  insuranceById,
  firstConfirmedBooking,
  emailConfirmationSimulated,
  onSendConfirmationEmail,
  onRestart,
  workspaceLayout = false,
}: {
  providers: DemoProvider[];
  outreach: DemoOutreachResult[];
  bookingRecords: ProviderBookingRecord[];
  availabilityById: Map<string, (typeof DEMO_AVAILABILITY)[number]>;
  insuranceById: Map<string, (typeof DEMO_INSURANCE_CHECKS)[number]>;
  firstConfirmedBooking: ProviderBookingRecord | null;
  emailConfirmationSimulated: boolean;
  onSendConfirmationEmail: () => void;
  onRestart: () => void;
  workspaceLayout?: boolean;
}) {
  const showedOutreach = outreach.length > 0;

  if (workspaceLayout) {
    const primaryRow = bookingRecords[0] ?? null;
    const intake =
      primaryRow?.intakeLink ?? firstConfirmedBooking?.intakeLink ?? null;

    return (
      <section className="space-y-2">
        <div className="rounded-lg border border-border/50 bg-surface/90 p-2 shadow-sm">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
            Step 6 · Care plan
          </p>
          <h2 className="mt-0.5 font-serif text-sm font-semibold text-foreground">
            Ready for your visit
          </h2>
          {primaryRow ? (
            <dl className="mt-1.5 space-y-1 text-[10px] leading-tight">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <dt className="text-muted">Provider</dt>
                <dd className="font-medium text-foreground">{primaryRow.providerName}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted">Status</dt>
                <dd className="text-foreground">
                  {BOOKING_STATUS_LABEL[primaryRow.bookingStatus]}
                </dd>
                <span className="text-muted">·</span>
                <dd className="text-foreground/90">
                  {displaySlotFromKey(primaryRow.selectedSlot)}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted">Clinic</dt>
                <dd className="truncate text-foreground/90">{primaryRow.clinicName}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-1 text-[10px] text-muted">
              No locked visit in this demo — restart or approve outreach next run.
            </p>
          )}

          <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
            <div className="rounded border border-border/45 bg-background/50 px-1.5 py-1">
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                Intake
              </p>
              <p className="truncate text-[10px] text-foreground" title={intake ?? ""}>
                {intake ?? "—"}
              </p>
            </div>
            <div className="rounded border border-border/45 bg-background/50 px-1.5 py-1">
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                Email
              </p>
              <p className="text-[10px] text-foreground">
                {emailConfirmationSimulated ? "Simulated sent" : "Ready to send"}
              </p>
            </div>
          </div>

          <div className="mt-1.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
              Bring
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] text-foreground/90">
              {DEMO_CARE_SUMMARY.whatToBring.join(" · ")}
            </p>
          </div>

          <div className="mt-1.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
              Next
            </p>
            <ul className="mt-0.5 space-y-0.5 text-[10px] text-foreground/85">
              <li>· Calendar the slot once the clinic confirms.</li>
              <li>· Complete intake before arrival.</li>
            </ul>
          </div>
        </div>

        {showedOutreach ? (
          <div className="rounded-md border border-border/45 bg-background/45 p-1.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
              Outreach
            </p>
            <ul className="mt-1 space-y-0.5">
              {outreach.map((result) => {
                const provider = providers.find((p) => p.id === result.providerId);
                if (!provider) return null;
                return (
                  <li
                    key={result.providerId}
                    className="flex flex-wrap items-center justify-between gap-1 text-[10px]"
                  >
                    <span className="truncate font-medium text-foreground">{provider.name}</span>
                    <OutreachBadge status={result.status} />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {firstConfirmedBooking ? (
          <ConfirmationEmailPreviewCard
            layout="workspace"
            providerName={firstConfirmedBooking.providerName}
            appointmentLine={displaySlotFromKey(
              firstConfirmedBooking.selectedSlot,
            )}
            clinicLine={`${firstConfirmedBooking.clinicName} — ${firstConfirmedBooking.location}`}
            intakeLink={firstConfirmedBooking.intakeLink}
            whatToBring={DEMO_CARE_SUMMARY.whatToBring}
            questionsForClinician={DEMO_CARE_SUMMARY.questionsForClinician}
            onSend={onSendConfirmationEmail}
            sent={emailConfirmationSimulated}
          />
        ) : null}

        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-7 items-center justify-center rounded-full border border-border/70 bg-surface px-3 text-[11px] font-semibold text-foreground transition hover:bg-background"
          >
            New flow
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-sage/30 bg-sage/10 p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sage">
          Step 6 · Care plan
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
          Zyra completed coordination work for you
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
          {DEMO_CARE_SUMMARY.headline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {DEMO_CARE_SUMMARY.recommendedNextStep}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          You delegated this run to Zyra. Demo result shown — real booking will
          activate once sponsor APIs are connected.
        </p>
      </div>

      {bookingRecords.length > 0 ? (
        <div className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Coordination & booking status
          </h3>
          <p className="mt-1 text-sm text-muted">
            Each row reflects your selected slot, simulated outreach outcome, and
            how confirmation would be attributed once APIs are live.
          </p>
          <ul className="mt-4 space-y-3">
            {bookingRecords.map((row) => (
              <li
                key={row.providerId}
                className="rounded-2xl border border-border/60 bg-background/70 p-3 sm:p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {row.providerName}
                    </p>
                    <p className="text-xs text-muted">{row.clinicName}</p>
                    <p className="mt-1 text-xs text-muted">{row.location}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <span className="rounded-full bg-soft-rose/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                      {BOOKING_STATUS_LABEL[row.bookingStatus]}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {CONFIRMATION_SOURCE_LABEL[row.confirmationSource]}
                    </span>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-foreground">Selected slot</dt>
                    <dd>{displaySlotFromKey(row.selectedSlot)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Insurance / copay</dt>
                    <dd>
                      {row.insuranceStatus} · {row.estimatedCopay}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Phone</dt>
                    <dd>{row.phone}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Website</dt>
                    <dd className="break-all">{row.website}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-foreground">Intake link</dt>
                    <dd className="break-all">
                      {row.intakeLink ?? "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-foreground">Outreach note</dt>
                    <dd className="text-foreground">{row.confirmationMessage}</dd>
                  </div>
                  {getResearchNarrativeForProvider(row.providerId)?.selectionRationale?.[0] ? (
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-foreground">Zyra rationale</dt>
                      <dd className="text-foreground/90">
                        {getResearchNarrativeForProvider(row.providerId)?.selectionRationale?.[0]}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Email confirmation:{" "}
            {emailConfirmationSimulated
              ? "Simulated send completed (AgentMail placeholder)."
              : "Not sent yet — use the preview below when you have a confirmed visit."}
          </p>
        </div>
      ) : null}

      {showedOutreach ? (
        <div className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Outreach results
          </h3>
          <ul className="mt-3 space-y-2.5">
            {outreach.map((result) => {
              const provider = providers.find(
                (p) => p.id === result.providerId,
              );
              if (!provider) return null;
              return (
                <li
                  key={result.providerId}
                  className="rounded-2xl border border-border/60 bg-background/70 p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {provider.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {provider.clinic}
                      </p>
                    </div>
                    <OutreachBadge status={result.status} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {result.responseSummary}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                    <span>
                      Insurance:{" "}
                      {insuranceById.get(result.providerId)?.estimatedCopay ??
                        "—"}
                    </span>
                    <span>
                      Slots:{" "}
                      {availabilityById
                        .get(result.providerId)
                        ?.slots.map((s) => `${s.date} ${s.time}`)
                        .join(" · ") ?? "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {firstConfirmedBooking ? (
        <ConfirmationEmailPreviewCard
          providerName={firstConfirmedBooking.providerName}
          appointmentLine={displaySlotFromKey(
            firstConfirmedBooking.selectedSlot,
          )}
          clinicLine={`${firstConfirmedBooking.clinicName} — ${firstConfirmedBooking.location}`}
          intakeLink={firstConfirmedBooking.intakeLink}
          whatToBring={DEMO_CARE_SUMMARY.whatToBring}
          questionsForClinician={DEMO_CARE_SUMMARY.questionsForClinician}
          onSend={onSendConfirmationEmail}
          sent={emailConfirmationSimulated}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:p-5">
          <h3 className="font-serif text-base font-semibold text-foreground sm:text-lg">
            What to bring
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {DEMO_CARE_SUMMARY.whatToBring.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-sage"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-sm sm:p-5">
          <h3 className="font-serif text-base font-semibold text-foreground sm:text-lg">
            Questions to ask
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {DEMO_CARE_SUMMARY.questionsForClinician.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 size-4 shrink-0 text-accent"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/80 bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-background"
        >
          Start a new flow
        </button>
      </div>
    </section>
  );
}

function OutreachBadge({ status }: { status: DemoOutreachResult["status"] }) {
  const config = {
    confirmed: {
      label: "Confirmed",
      cls: "bg-sage/15 text-sage",
    },
    waitlist: {
      label: "Waitlist",
      cls: "bg-soft-rose/60 text-accent",
    },
    no_response: {
      label: "No response yet",
      cls: "bg-background text-muted",
    },
  }[status];
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${config.cls}`}
    >
      {config.label}
    </span>
  );
}
