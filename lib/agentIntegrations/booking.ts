/**
 * Booking + outreach integration placeholders for the hackathon Zyra Agent flow.
 * Returns structured mock data only — no network calls, no secrets.
 *
 * Sponsor / API integration map (TODO):
 * - Browser Use → `bookViaProviderWebsite` (navigate provider portals, fill forms)
 * - AgentMail → `contactClinicByEmail`, `sendUserConfirmationEmail` (clinic + user email)
 * - Moss → enrich `researchProviderOnline` (semantic retrieval / search over provider + care context)
 * - Supermemory → persist `userContext` / flow state across sessions (wire into each function)
 * - Stripe / Sponge → optional deposits or payment holds before confirmed booking
 */

export type BookingStatus =
  | "not_started"
  | "researching"
  | "ready_for_approval"
  | "outreach_pending"
  | "contacted"
  | "confirmed"
  | "waitlisted"
  | "no_response"
  | "failed";

export type ConfirmationSource =
  | "demo"
  | "voice_api"
  | "email_api"
  | "browser_api"
  | "manual";

/** One row per provider in the agent flow — demo-filled today, API-backed later. */
export type ProviderBookingRecord = {
  providerId: string;
  providerName: string;
  clinicName: string;
  location: string;
  phone: string;
  website: string;
  insuranceStatus: string;
  estimatedCopay: string;
  availableSlots: string[];
  selectedSlot: string | null;
  bookingStatus: BookingStatus;
  confirmationSource: ConfirmationSource;
  confirmationMessage: string;
  intakeLink: string | null;
  lastUpdated: string;
};

export type UserBookingContext = {
  symptoms: string;
  zip: string;
  insurance: string;
  userEmail?: string | null;
};

export type ResearchProviderOnlineResult = {
  ok: boolean;
  providerId: string;
  summary: string;
  lastUpdated: string;
};

export type ContactClinicResult = {
  ok: boolean;
  providerId: string;
  channel: "voice" | "email";
  message: string;
  lastUpdated: string;
};

export type BookWebsiteResult = {
  ok: boolean;
  providerId: string;
  selectedSlot: string;
  holdReference: string;
  message: string;
  lastUpdated: string;
};

export type SendConfirmationEmailResult = {
  ok: boolean;
  messageId: string;
  message: string;
  lastUpdated: string;
};

export type CarePlanSummaryResult = {
  headline: string;
  recommendedNextStep: string;
  whatToBring: string[];
  questionsForClinician: string[];
  lastUpdated: string;
};

/** Mock contact + intake URLs keyed by demo provider id. */
const DEMO_PROVIDER_CONTACT: Record<
  string,
  { phone: string; website: string; intakeLink: string | null }
> = {
  prov_rivera: {
    phone: "(415) 555-0142",
    website: "https://example.com/mission-womens-health",
    intakeLink: "https://example.com/intake/new-patient-rivera",
  },
  prov_chen: {
    phone: "(415) 555-0198",
    website: "https://example.com/bay-area-hormone",
    intakeLink: "https://example.com/portal/intake-chen",
  },
  prov_okafor: {
    phone: "(415) 555-0171",
    website: "https://example.com/bayview-pelvic",
    intakeLink: null,
  },
};

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * TODO: Moss — retrieve structured snippets from indexed provider + clinical context.
 * TODO: Supermemory — merge long-lived user preferences into search query.
 */
export async function researchProviderOnline(provider: {
  id: string;
  name: string;
  clinic: string;
}): Promise<ResearchProviderOnlineResult> {
  await delay(350);
  return {
    ok: true,
    providerId: provider.id,
    summary: `[demo] Web research for ${provider.name} at ${provider.clinic}: verified public listing and specialty focus (mock).`,
    lastUpdated: nowIso(),
  };
}

/**
 * TODO: Voice API / telephony provider — live call or AI-assisted call to clinic front desk.
 * TODO: Supermemory — pass prior visit notes and user availability windows.
 */
export async function contactClinicByVoice(
  provider: { id: string; name: string; clinic: string },
  userContext: UserBookingContext,
): Promise<ContactClinicResult> {
  await delay(400);
  return {
    ok: true,
    providerId: provider.id,
    channel: "voice",
    message: `[demo] Voice outreach simulated for ${provider.clinic} (ZIP ${userContext.zip}).`,
    lastUpdated: nowIso(),
  };
}

/**
 * TODO: AgentMail — send templated email to clinic scheduling / new-patient inbox.
 * TODO: Supermemory — attach summarized intake + insurance card metadata (no PHI in demo).
 */
export async function contactClinicByEmail(
  provider: { id: string; name: string; clinic: string },
  userContext: UserBookingContext,
): Promise<ContactClinicResult> {
  await delay(400);
  return {
    ok: true,
    providerId: provider.id,
    channel: "email",
    message: `[demo] Email to clinic simulated for ${provider.clinic} (context: ${userContext.insurance || "no plan"}).`,
    lastUpdated: nowIso(),
  };
}

/**
 * TODO: Browser Use — automate provider scheduling portal (login, slot pick, submit).
 * TODO: Stripe / Sponge — optional deposit capture before final confirm.
 */
export async function bookViaProviderWebsite(
  provider: { id: string; name: string; clinic: string },
  selectedSlot: string,
  userContext: UserBookingContext,
): Promise<BookWebsiteResult> {
  await delay(450);
  return {
    ok: true,
    providerId: provider.id,
    selectedSlot,
    holdReference: `demo-hold-${provider.id}-${Date.now()}`,
    message: `[demo] Browser booking flow simulated for ${provider.name} — slot: ${selectedSlot}; intake context length ${userContext.symptoms.length} chars (mock).`,
    lastUpdated: nowIso(),
  };
}

/**
 * TODO: AgentMail — send user-facing confirmation with ICS attachment when APIs are live.
 */
export async function sendUserConfirmationEmail(
  userEmail: string | null | undefined,
  bookingSummary: {
    providerName: string;
    appointmentLine: string;
    clinicLine: string;
    intakeLink: string | null;
    whatToBring: string[];
    questionsForClinician: string[];
  },
): Promise<SendConfirmationEmailResult> {
  await delay(300);
  const to = userEmail?.trim() || "your email on file";
  return {
    ok: true,
    messageId: `demo-msg-${Date.now()}`,
    message: `[demo] Confirmation draft addressed to ${to}: ${bookingSummary.providerName} — ${bookingSummary.appointmentLine}.`,
    lastUpdated: nowIso(),
  };
}

/**
 * TODO: Wire to care-plan LLM or rules engine; optionally Moss for evidence-linked suggestions.
 */
export async function generateCarePlanSummary(flowState: {
  symptoms: string;
  zip: string;
  insurance: string;
  providerNames: string[];
}): Promise<CarePlanSummaryResult> {
  await delay(280);
  return {
    headline: `[demo] Care plan summary for symptoms near ${flowState.zip}.`,
    recommendedNextStep: `Review matches for: ${flowState.providerNames.slice(0, 2).join(", ") || "your selected providers"}.`,
    whatToBring: [
      "Photo ID and insurance card",
      "List of medications and supplements",
      "Recent cycle or symptom notes",
    ],
    questionsForClinician: [
      "What should I prioritize at the first visit?",
      "What follow-up tests might be needed?",
    ],
    lastUpdated: nowIso(),
  };
}

export function getDemoContactForProvider(
  providerId: string,
): { phone: string; website: string; intakeLink: string | null } {
  return (
    DEMO_PROVIDER_CONTACT[providerId] ?? {
      phone: "—",
      website: "—",
      intakeLink: null,
    }
  );
}

function mapOutreachToBookingStatus(
  status: "confirmed" | "waitlist" | "no_response",
): BookingStatus {
  if (status === "confirmed") return "confirmed";
  if (status === "waitlist") return "waitlisted";
  return "no_response";
}

function formatSlotLabel(date: string, time: string): string {
  return `${date} · ${time}`;
}

/** Build full booking rows for the Summary step from demo data + user slot picks + outreach outcomes. */
export function buildProviderBookingRecords(params: {
  providerIds: Array<{ id: string; name: string; clinic: string; address: string; inNetwork: boolean }>;
  selectedSlots: Record<string, string>;
  insurancePlanLabel: string;
  estimatedCopayByProviderId: Record<string, string>;
  availableSlotsByProviderId: Record<string, string[]>;
  outreachByProviderId: Record<
    string,
    { status: "confirmed" | "waitlist" | "no_response"; responseSummary: string }
  >;
  confirmationSource?: ConfirmationSource;
}): ProviderBookingRecord[] {
  const source = params.confirmationSource ?? "demo";
  const ts = nowIso();

  return params.providerIds.map((p) => {
    const contact = getDemoContactForProvider(p.id);
    const outreach = params.outreachByProviderId[p.id];
    const slotKey = params.selectedSlots[p.id];
    const available = params.availableSlotsByProviderId[p.id] ?? [];
    const copay = params.estimatedCopayByProviderId[p.id] ?? "—";

    return {
      providerId: p.id,
      providerName: p.name,
      clinicName: p.clinic,
      location: p.address,
      phone: contact.phone,
      website: contact.website,
      insuranceStatus: p.inNetwork
        ? `In network · ${params.insurancePlanLabel}`
        : `Out of network · ${params.insurancePlanLabel}`,
      estimatedCopay: copay,
      availableSlots: available,
      selectedSlot: slotKey ?? null,
      bookingStatus: outreach
        ? mapOutreachToBookingStatus(outreach.status)
        : "outreach_pending",
      confirmationSource: source,
      confirmationMessage: outreach?.responseSummary ?? "Awaiting outreach result.",
      intakeLink: contact.intakeLink,
      lastUpdated: ts,
    };
  });
}

/** Serialize slot for state: `date|time` from availability entry */
export function slotKeyFromParts(date: string, time: string): string {
  return `${date}|${time}`;
}

export function parseSlotKey(key: string): { date: string; time: string } | null {
  const i = key.indexOf("|");
  if (i === -1) return null;
  return { date: key.slice(0, i), time: key.slice(i + 1) };
}

export function displaySlotFromKey(key: string | null): string {
  if (!key) return "—";
  const p = parseSlotKey(key);
  return p ? formatSlotLabel(p.date, p.time) : key;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
