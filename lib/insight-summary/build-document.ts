import {
  buildCycleInsights,
  buildMedicineInsights,
  buildSymptomInsights,
  hasAnyTracking,
} from "@/lib/insights/build-summary";
import { formatCycleDate } from "@/lib/cycles/format";
import type { CycleRow } from "@/lib/cycles/types";
import type { MedicineRow } from "@/lib/medicines/types";
import type { ProfileRow } from "@/lib/profiles/types";
import type { SymptomRow } from "@/lib/symptoms/types";
import { GLOBAL_MEDICAL_DISCLAIMER } from "@/lib/zyra/medical-disclaimer";
import { ZYRA } from "@/lib/zyra/site";
import type {
  DoctorMatchHistoryRow,
  InsightPatternCard,
  InsightSummaryDocument,
} from "./types";

const DISCLAIMER_SHORT = `${GLOBAL_MEDICAL_DISCLAIMER} Educational only — not a diagnosis or treatment plan.`;

/** Conservative keyword scan on free-text symptoms (educational routing only). */
function redFlagSymptomHints(symptoms: SymptomRow[]): string[] {
  const patterns: { re: RegExp; message: string }[] = [
    {
      re: /\b(chest\s+pain|crushing\s+chest|heart\s+attack)\b/i,
      message:
        "The logs include wording that can sometimes accompany serious conditions — if chest pain, pressure, pain spreading to the arm or jaw, or feeling acutely unwell is present now, seek emergency care immediately.",
    },
    {
      re: /\b(shortness\s+of\s+breath|can't\s+breathe|cannot\s+breathe|sob\b|gasping)\b/i,
      message:
        "The logs mention breathing difficulty — if that is happening now, seek emergency care immediately.",
    },
    {
      re: /\b(severe\s+bleeding|soaking\s+through|hemorrhage|fainting|passed\s+out|syncope)\b/i,
      message:
        "The logs mention severe bleeding or fainting — if that is occurring now or there is a risk of fainting, seek urgent or emergency care.",
    },
    {
      re: /\b(suicid|self[-\s]?harm|kill\s+myself|want\s+to\s+die)\b/i,
      message:
        "If there are thoughts of self-harm, seek immediate help (for example 988 in the US) or the nearest emergency department.",
    },
    {
      re: /\b(high\s+fever|104|105|febrile\s+seizure|stiff\s+neck|worst\s+headache)\b/i,
      message:
        "The logs mention symptoms that may warrant urgent evaluation — very high fever, stiff neck with fever, or sudden severe headache should prompt urgent or emergency care.",
    },
  ];
  const out: string[] = [];
  const blob = symptoms.map((s) => `${s.symptom} ${s.notes ?? ""}`).join(" \n ");
  for (const { re, message } of patterns) {
    if (re.test(blob) && !out.includes(message)) out.push(message);
  }
  return out;
}

function hasEnoughHistoryForTrends(cycleCount: number, symptomCount: number): boolean {
  if (cycleCount >= 3) return true;
  if (cycleCount >= 2 && symptomCount >= 2) return true;
  if (symptomCount >= 5) return true;
  return false;
}

const BULLET_MAX = 88;
const HIGHLIGHT_MAX = 72;

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function patternCard(
  id: "cycle" | "symptom" | "health",
  title: string,
  highlight: string,
  bullets: string[],
): InsightPatternCard {
  const b = bullets.map((s) => clip(s, BULLET_MAX)).filter(Boolean).slice(0, 3);
  const hl = clip(highlight.trim() || "—", HIGHLIGHT_MAX);
  const body = [hl, ...b.map((x) => `• ${x}`)].join("\n");
  return { id, title, highlight: hl, bullets: b, body };
}

function formatLogDate(iso: string): string {
  const datePart = iso.slice(0, 10);
  if (datePart.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return formatCycleDate(datePart);
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function buildPatternCards(
  profile: ProfileRow | null,
  cycle: ReturnType<typeof buildCycleInsights>,
  symptom: ReturnType<typeof buildSymptomInsights>,
  medicine: ReturnType<typeof buildMedicineInsights>,
  latestMatch: DoctorMatchHistoryRow | undefined,
): InsightPatternCard[] {
  const trendOk = hasEnoughHistoryForTrends(cycle.cycleCount, symptom.totalCount);

  let cycleCard: InsightPatternCard;
  if (!cycle.hasCycles) {
    cycleCard = patternCard("cycle", "Cycle pattern", "No period data yet", [
      "Log period starts to see spacing",
      "Trends need a few cycles",
      "Last start will show here once logged",
    ]);
  } else {
    const hl = cycle.irregularityNote
      ? "Variable cycle spacing"
      : !trendOk
        ? "Limited cycle history"
        : "Cycle data on file";
    const bullets: string[] = [
      `${cycle.cycleCount} period${cycle.cycleCount === 1 ? "" : "s"} logged`,
      cycle.lastPeriodStart ? `Last start: ${formatCycleDate(cycle.lastPeriodStart)}` : "Last start: —",
    ];
    if (cycle.averageCycleLengthDays != null) {
      bullets.push(`Avg spacing ~${cycle.averageCycleLengthDays} days`);
    } else {
      bullets.push("Keep logging to firm up spacing trends");
    }
    cycleCard = patternCard("cycle", "Cycle pattern", hl, bullets.slice(0, 3));
  }

  let symptomCard: InsightPatternCard;
  if (!symptom.hasSymptoms) {
    symptomCard = patternCard("symptom", "Symptom pattern", "No symptoms logged yet", [
      "Log symptoms as they occur",
      "Add severity when it helps you",
      "Repeat entries build confidence",
    ]);
  } else {
    const hl =
      symptom.mostFrequent && symptom.mostFrequent.count >= 2
        ? "Recurring symptom label"
        : symptom.totalCount < 3 || !trendOk
          ? "Few symptom entries"
          : "Symptom log building";
    const bullets: string[] = [
      `${symptom.totalCount} symptom entr${symptom.totalCount === 1 ? "y" : "ies"}`,
    ];
    if (symptom.mostRecent) {
      const sev =
        symptom.mostRecent.severity != null ? ` · Intensity ${symptom.mostRecent.severity}/5` : "";
      bullets.push(`Latest: ${symptom.mostRecent.symptom}${sev}`);
    }
    if (symptom.mostFrequent && symptom.mostFrequent.count >= 2) {
      bullets.push(`“${symptom.mostFrequent.label}” ×${symptom.mostFrequent.count}`);
    } else {
      bullets.push("More entries help spot trends");
    }
    symptomCard = patternCard("symptom", "Symptom pattern", hl, bullets.slice(0, 3));
  }

  const medCount = medicine.totalCount;
  const active = medicine.activeCount;
  let healthCard: InsightPatternCard;
  if (!medicine.hasMedicines && !profile?.health_concerns?.length && !latestMatch?.pattern?.trim()) {
    healthCard = patternCard("health", "Medication & health context", "Little medication / profile context", [
      "Add medicines in Health log if relevant",
      "Save concerns in profile for visit prep",
      "DoctorMatch notes appear here when used",
    ]);
  } else {
    let hl = "Profile + context to review";
    if (medicine.hasMedicines && (profile?.health_concerns?.length || latestMatch?.pattern?.trim())) {
      hl = "Medicines + saved context";
    } else if (medicine.hasMedicines) {
      hl = medCount === 1 && active >= 1 ? "Active medication noted" : "Medicines on record";
    } else if (profile?.health_concerns?.length) {
      hl = "Saved concerns on file";
    }
    const bullets: string[] = [];
    if (medicine.hasMedicines) {
      bullets.push(`${medCount} medicine${medCount === 1 ? "" : "s"} on file`);
      if (medicine.mostRecentAdded) {
        bullets.push(
          `${medicine.mostRecentAdded.name} · ${formatLogDate(medicine.mostRecentAdded.created_at)}`,
        );
      }
      if (active > 0) {
        bullets.push(`${active} active — review with clinician if symptoms continue`);
      } else if (bullets.length < 3) {
        bullets.push("Confirm list at visits");
      }
    }
    if (profile?.health_concerns?.length && bullets.length < 3) {
      bullets.push(`Concerns: ${profile.health_concerns.slice(0, 2).join(", ")}${profile.health_concerns.length > 2 ? "…" : ""}`);
    }
    if (latestMatch?.pattern?.trim() && bullets.length < 3) {
      bullets.push("DoctorMatch note saved — bring to visit");
    }
    if (bullets.length < 2) {
      bullets.push("Add context in Health log or profile");
    }
    if (bullets.length < 3) {
      bullets.push("Review list with clinician when needed");
    }
    healthCard = patternCard("health", "Medication & health context", hl, bullets.slice(0, 3));
  }

  return [cycleCard, symptomCard, healthCard];
}

function buildSummaryBullets(
  any: boolean,
  trendOk: boolean,
  cycle: ReturnType<typeof buildCycleInsights>,
  symptom: ReturnType<typeof buildSymptomInsights>,
  medicine: ReturnType<typeof buildMedicineInsights>,
  unusualPatterns: string[],
  profile: ProfileRow | null,
): string[] {
  const bullets: string[] = [];

  if (!trendOk) {
    bullets.push("Not enough history yet for reliable trends — keep logging period starts and symptoms so patterns can be reviewed with more confidence.");
  }

  if (!any) {
    bullets.push(
      `Based on the information saved so far, ${ZYRA.name} does not yet have cycle, symptom, or medicine logs to compare — profile and DoctorMatch notes (if any) still help frame questions for a visit.`,
    );
  } else {
    const counts: string[] = [];
    if (cycle.hasCycles) counts.push(`${cycle.cycleCount} period window(s)`);
    if (symptom.hasSymptoms) counts.push(`${symptom.totalCount} symptom log(s)`);
    if (medicine.hasMedicines) counts.push(`${medicine.totalCount} medicine entr(y/ies)`);
    if (counts.length) {
      bullets.push(
        `Based on the information logged so far, ${ZYRA.name} noticed ${counts.join(", ")} — this is a snapshot, not a clinical assessment.`,
      );
    }
  }

  if (cycle.irregularityNote) {
    bullets.push(
      "Cycle start spacing varies across logs — a possible pattern that may be worth discussing if bleeding, pain, or planning questions come up.",
    );
  }

  if (symptom.mostFrequent && symptom.mostFrequent.count >= 3) {
    bullets.push(
      `The symptom label “${symptom.mostFrequent.label}” recurs in logs — may be related to other entries and worth reviewing with a clinician in context.`,
    );
  }

  if (unusualPatterns.some((p) => p.includes("emergency") || p.includes("988"))) {
    bullets.push(
      "Some logged wording suggests urgent or emergency situations may apply — if anything feels emergent now, use emergency services rather than waiting on this summary.",
    );
  }

  if (profile?.known_conditions?.length && bullets.length < 5) {
    bullets.push(
      `Known conditions saved in the profile (${profile.known_conditions.slice(0, 3).join(", ")}) may be worth connecting to what is being logged now — educational framing only.`,
    );
  }

  if (bullets.length < 3 && symptom.hasSymptoms && symptom.mostRecent) {
    bullets.push(
      `Most recent symptom entry (“${symptom.mostRecent.symptom}”) is a single data point — several more dated entries help separate one-off events from possible patterns.`,
    );
  }

  const deduped = [...new Set(bullets.map((b) => b.trim()).filter(Boolean))];
  return deduped.slice(0, 5);
}

function buildCarePrepNarrativeThirdPerson(input: {
  cycle: ReturnType<typeof buildCycleInsights>;
  symptom: ReturnType<typeof buildSymptomInsights>;
  latestMatch: DoctorMatchHistoryRow | undefined;
  trendOk: boolean;
}): string {
  const { cycle, symptom, latestMatch, trendOk } = input;
  const parts: string[] = [];

  parts.push(
    `Based on the information logged so far, ${ZYRA.name} noticed a limited home snapshot of symptoms, timing, and medicines — educational only, not a diagnosis.`,
  );

  if (!trendOk) {
    parts.push(
      "There is not enough dated history yet to confirm trends; irregular periods and varied symptoms may still be worth tracking together over the next few cycles and visits.",
    );
  }

  if (cycle.hasCycles && cycle.lastPeriodStart) {
    parts.push(
      `Period data includes a most recent start (${cycle.lastPeriodStart})${cycle.averageCycleLengthDays ? ` with spacing near ${cycle.averageCycleLengthDays} days where estimable` : ""} — changes in spacing or flow may be worth discussing with a clinician.`,
    );
  }

  if (symptom.hasSymptoms && symptom.mostRecent) {
    parts.push(
      `Symptom logs include “${symptom.mostRecent.symptom}” on ${symptom.mostRecent.logged_date}${symptom.mostRecent.severity != null ? ` with logged intensity ${symptom.mostRecent.severity}/5` : ""} — persistence or clustering may be worth monitoring.`,
    );
  }

  if (latestMatch?.pattern?.trim()) {
    const clip = latestMatch.pattern.trim().slice(0, 220);
    parts.push(
      `DoctorMatch notes reference a possible pattern (“${clip}${latestMatch.pattern.trim().length > 220 ? "…" : ""}”) — may be worth discussing how that fits the broader picture.`,
    );
  }

  return parts.join(" ");
}

export function buildInsightSummaryDocument(input: {
  profile: ProfileRow | null;
  cycles: CycleRow[];
  symptoms: SymptomRow[];
  medicines: MedicineRow[];
  doctorMatchHistory: DoctorMatchHistoryRow[];
}): InsightSummaryDocument {
  const { profile, cycles, symptoms, medicines, doctorMatchHistory } = input;
  const cycle = buildCycleInsights(profile, cycles);
  const symptom = buildSymptomInsights(symptoms);
  const medicine = buildMedicineInsights(medicines);
  const any = hasAnyTracking(cycle, symptom, medicine);
  const trendOk = hasEnoughHistoryForTrends(cycle.cycleCount, symptom.totalCount);

  const title = "Your insight report";

  const overview = any
    ? `${ZYRA.name} summarized saved logs and profile context for visit prep — not medical advice.`
    : `${ZYRA.name} can summarize profile and DoctorMatch context; add cycle, symptom, or medicine logs for a fuller picture.`;

  const unusualPatterns: string[] = [];
  for (const urgent of redFlagSymptomHints(symptoms)) {
    unusualPatterns.push(urgent);
  }
  if (cycle.irregularityNote) {
    const neutralNote = cycle.irregularityNote.replace(/^Your logged gaps/i, "Logged gaps");
    unusualPatterns.push(`Cycle timing (possible pattern): ${neutralNote}`);
  }
  if (symptom.mostFrequent && symptom.mostFrequent.count >= 3) {
    unusualPatterns.push(
      `Possible pattern: the symptom label “${symptom.mostFrequent.label}” appears ${symptom.mostFrequent.count} times — worth discussing with a clinician; not a diagnosis.`,
    );
  }
  if (symptom.highestSeverity && (symptom.highestSeverity.severity ?? 0) >= 4) {
    unusualPatterns.push(
      `Logged intensity for “${symptom.highestSeverity.symptom}” reached ${symptom.highestSeverity.severity}/5 on ${symptom.highestSeverity.logged_date} — worth discussing if ongoing; not an assessment of cause.`,
    );
  }
  if (profile?.cycle_regularity === "irregular" || profile?.cycle_regular === false) {
    unusualPatterns.push(
      "The profile notes irregular cycles — a possible pattern worth discussing if timing, pain, or flow are concerns.",
    );
  }

  const latestMatch = doctorMatchHistory[0];
  const possibleSpecialist =
    latestMatch?.specialist?.trim() ||
    (profile?.health_concerns?.length
      ? "Women’s health or primary care (based on saved concerns) — worth discussing who best fits next steps."
      : null);

  const patternCards = buildPatternCards(profile, cycle, symptom, medicine, latestMatch);
  const summaryBullets = buildSummaryBullets(any, trendOk, cycle, symptom, medicine, unusualPatterns, profile);

  const questionsToAsk: string[] = [];
  if (cycle.hasCycles && cycle.averageCycleLengthDays) {
    questionsToAsk.push(
      `Whether average spacing of about ${cycle.averageCycleLengthDays} days between period starts could still fall within normal variation for this person.`,
    );
  }
  if (symptom.mostFrequent) {
    questionsToAsk.push(
      `Whether recurring “${symptom.mostFrequent.label}” entries should be tracked together with other symptoms or labs.`,
    );
  }
  if (profile?.known_conditions?.length) {
    questionsToAsk.push(
      `How known conditions (${profile.known_conditions.slice(0, 4).join(", ")}) may relate to what the logs show now.`,
    );
  }
  questionsToAsk.push("What changes or new symptoms should be reported before a follow-up visit?");
  if (questionsToAsk.length > 6) questionsToAsk.splice(6);

  const doctorVisitChecklist: string[] = [
    `${ZYRA.name} summary (printed or on phone).`,
    "Current prescription and over-the-counter medicines with doses.",
  ];
  if (cycle.lastPeriodStart) {
    doctorVisitChecklist.push(`Last logged period start: ${cycle.lastPeriodStart}.`);
  }
  if (medicine.activeCount > 0) {
    doctorVisitChecklist.push(
      `${medicine.activeCount} active medicine(s) in the log — confirm the list with the clinician.`,
    );
  }
  if (latestMatch?.symptoms) {
    doctorVisitChecklist.push("Most recent DoctorMatch symptom text, if it still reflects how things feel.");
  }

  const carePrepScript = buildCarePrepNarrativeThirdPerson({
    cycle,
    symptom,
    latestMatch,
    trendOk,
  });

  return {
    title,
    overview,
    patternCards,
    summaryBullets,
    unusualPatterns,
    possibleSpecialist,
    carePrepScript,
    questionsToAsk,
    doctorVisitChecklist,
    disclaimer: DISCLAIMER_SHORT,
  };
}
