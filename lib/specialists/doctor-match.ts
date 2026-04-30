import type { SpecialistTypeValue } from "./search-query";
import type {
  DoctorMatchApiShape,
  SharedDoctorMatchRecommendation,
} from "@shared/doctor-match/types";

export type DoctorMatchRecommendation = SharedDoctorMatchRecommendation<SpecialistTypeValue>;

function hasAny(input: string, terms: string[]): boolean {
  return terms.some((term) => input.includes(term));
}

function detectPossiblePattern(input: string): string {
  const hasIrregular = hasAny(input, ["irregular", "missed period"]);
  const hasAcne = hasAny(input, ["acne", "hormonal acne"]);
  const hasWeight = hasAny(input, ["weight gain", "weight"]);
  if ((hasIrregular && hasAcne) || (hasIrregular && hasWeight) || (hasAcne && hasWeight)) {
    return "Possible pattern: hormonal imbalance (PCOS-related pattern).";
  }

  if (hasAny(input, ["burning urination", "burning", "uti", "urgency"])) {
    return "Possible pattern: urinary tract irritation (UTI-like pattern).";
  }

  if (hasAny(input, ["bloating", "stomach pain", "abdominal", "digestive"])) {
    return "Possible pattern: digestive discomfort pattern.";
  }

  if (hasAny(input, ["anxiety", "stress"]) && hasAny(input, ["fatigue", "tired", "low energy"])) {
    return "Possible pattern: stress-related symptom pattern.";
  }

  return "";
}

function mapSearchTermToSpecialistType(searchTerm: string): SpecialistTypeValue {
  const t = searchTerm.trim().toLowerCase();
  if (t.includes("primary care physician or gastroenterologist")) return "gastroenterologist";
  if (t.includes("ob-gyn or reproductive endocrinologist")) return "ob_gyn";
  if (t.includes("endocrinologist or ob-gyn")) return "endocrinologist";
  if (t.includes("gastroenterologist")) return "gastroenterologist";
  if (t.includes("reproductive endocrinologist")) return "reproductive_endocrinologist";
  if (t.includes("primary care physician")) return "primary_care_physician";
  if (t.includes("ob-gyn") || t.includes("obgyn")) return "ob_gyn";
  if (t.includes("endocrin")) return "endocrinologist";
  if (t.includes("gynec")) return "gynecologist";
  if (t.includes("urolog")) return "urologist";
  if (t.includes("dermat")) return "dermatologist";
  if (t.includes("therap")) return "therapist";
  if (t.includes("psychiat")) return "psychiatrist";
  if (t.includes("nutrition")) return "nutritionist";
  if (t.includes("urgent care")) return "urgent_care";
  return "primary_care_physician";
}

function normalizeList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 3);
  return normalized.length > 0 ? normalized : fallback;
}

export function normalizeDoctorMatchResponse(
  raw: DoctorMatchApiShape | null | undefined,
): DoctorMatchRecommendation | null {
  if (!raw || typeof raw !== "object") return null;
  const specialist = String(raw.specialist ?? "").trim();
  const pattern = String(raw.pattern ?? "").trim();
  const reason = String(raw.reason ?? "").trim();
  const urgentCareWarning = String(raw.urgentCareWarning ?? "").trim();
  const searchTerm = String(raw.searchTerm ?? "").trim();
  if (!specialist || !reason || !urgentCareWarning || !searchTerm) return null;

  return {
    pattern,
    specialist,
    reason,
    carePath: normalizeList(raw.carePath, [
      "Track your symptoms and timeline.",
      "Start with a suitable first specialist.",
      "Ask if referral is needed based on findings.",
    ]),
    questionsToAsk: normalizeList(raw.questionsToAsk, [
      "What are likely causes of my symptoms?",
      "What tests should I do first?",
      "What warning signs need urgent care?",
    ]),
    urgentCareWarning,
    searchTerm,
    specialistType: mapSearchTermToSpecialistType(searchTerm),
  };
}

export function recommendSpecialistFromSymptoms(rawInput: string): DoctorMatchRecommendation {
  const input = rawInput.trim().toLowerCase();
  const pattern = detectPossiblePattern(input);

  if (hasAny(input, ["irregular", "missed period"])) {
    return {
      pattern,
      specialist: "OB-GYN",
      specialistType: "ob_gyn",
      reason:
        "Irregular or missed periods are often best reviewed first with an OB-GYN to check cycle-related causes.",
      carePath: [
        "Track recent cycle dates and related symptoms.",
        "Start with an OB-GYN visit for baseline evaluation.",
        "Ask if hormone tests or imaging are needed.",
      ],
      questionsToAsk: [
        "What are likely causes of my irregular or missed periods?",
        "Should I get hormone tests or an ultrasound?",
        "What signs mean I should seek urgent care?",
      ],
      urgentCareWarning:
        "Seek urgent care for very heavy bleeding, severe one-sided pain, fainting, fever, or pregnancy concerns.",
      searchTerm: "OB-GYN",
    };
  }

  if (hasAny(input, ["pcos", "hormonal acne", "weight gain"])) {
    return {
      pattern: pattern || "Possible pattern: hormonal imbalance (PCOS-related pattern).",
      specialist: "Endocrinologist or OB-GYN",
      specialistType: "endocrinologist",
      reason:
        "PCOS-like and hormonal-pattern symptoms can involve endocrine and reproductive health, so endocrinology or OB-GYN is a practical starting point.",
      carePath: [
        "Log cycle changes, skin changes, and weight patterns.",
        "Start with OB-GYN or endocrinology depending on local access.",
        "Discuss lab work and long-term symptom management options.",
      ],
      questionsToAsk: [
        "Could these symptoms fit PCOS or another hormone issue?",
        "Which labs should I consider first?",
        "What treatment options and follow-up plan are typical?",
      ],
      urgentCareWarning:
        "Seek urgent care for severe abdominal pain, heavy bleeding, chest pain, fainting, or rapidly worsening symptoms.",
      searchTerm: "Endocrinologist",
    };
  }

  if (hasAny(input, ["pain", "pelvic", "cramps"])) {
    return {
      pattern,
      specialist: "Gynecologist",
      specialistType: "gynecologist",
      reason:
        "Pelvic pain and severe cramps are commonly assessed in gynecology to rule out cycle-related causes.",
      carePath: [
        "Track pain timing, severity, and triggers.",
        "Begin with gynecology for focused pelvic evaluation.",
        "Discuss next steps if pain persists or worsens.",
      ],
      questionsToAsk: [
        "What common causes could explain this pain?",
        "Do I need imaging or other tests?",
        "How should I manage pain safely while waiting for follow-up?",
      ],
      urgentCareWarning:
        "Seek urgent care for severe worsening pain, fever, vomiting, fainting, or possible pregnancy-related severe pain.",
      searchTerm: "Gynecologist",
    };
  }

  if (hasAny(input, ["fertility", "pregnancy"])) {
    return {
      pattern,
      specialist: "OB-GYN or Reproductive Endocrinologist",
      specialistType: "ob_gyn",
      reason:
        "Fertility and pregnancy planning are commonly managed by OB-GYN teams, with reproductive endocrinology when needed.",
      carePath: [
        "Track cycle timing and conception goals.",
        "Start with OB-GYN for initial planning and screening.",
        "Consider reproductive endocrinology for advanced fertility support.",
      ],
      questionsToAsk: [
        "When should I seek fertility-focused testing?",
        "What preconception checks should I do now?",
        "When is referral to a reproductive endocrinologist recommended?",
      ],
      urgentCareWarning:
        "Seek urgent care for severe pain with pregnancy, heavy bleeding, dizziness/fainting, or sudden worsening symptoms.",
      searchTerm: "Fertility specialist",
    };
  }

  if (hasAny(input, ["stomach", "abdominal", "digestive"])) {
    return {
      pattern: pattern || "Possible pattern: digestive discomfort pattern.",
      specialist: "Primary Care Physician or Gastroenterologist",
      specialistType: "gastroenterologist",
      reason:
        "Stomach pain can come from digestive, hormonal, infection-related, or general health causes, so primary care or gastroenterology is a reasonable starting point.",
      carePath: [
        "Track pain location, duration, triggers, and related symptoms.",
        "Start with primary care if symptoms are unclear.",
        "Consider gastroenterology if pain is recurring, severe, or digestion-related.",
      ],
      questionsToAsk: [
        "What could be causing this pain?",
        "Do I need blood work, imaging, or a specialist referral?",
        "What symptoms should make me seek urgent care?",
      ],
      urgentCareWarning:
        "Seek urgent care for severe pain, fever, vomiting, fainting, blood in stool/vomit, chest pain, pregnancy-related severe pain, or pain that suddenly worsens.",
      searchTerm: "Gastroenterologist",
    };
  }

  if (hasAny(input, ["anxiety", "stress", "mood"])) {
    return {
      pattern,
      specialist: "Therapist or Primary Care Physician",
      specialistType: "therapist",
      reason:
        "Mood and stress symptoms can involve mental and physical health factors, so therapy or primary care can be a safe starting point.",
      carePath: [
        "Track sleep, stress triggers, and mood patterns.",
        "Start with a therapist or primary care visit.",
        "Discuss ongoing support options and follow-up timing.",
      ],
      questionsToAsk: [
        "What support options fit my current symptoms?",
        "Should I consider therapy, medication, or both?",
        "How often should I follow up?",
      ],
      urgentCareWarning:
        "Seek urgent care immediately for thoughts of self-harm, inability to stay safe, chest pain, or severe panic symptoms.",
      searchTerm: "Therapist",
    };
  }

  if (hasAny(input, ["skin", "acne", "rash"])) {
    return {
      pattern,
      specialist: "Dermatologist",
      specialistType: "dermatologist",
      reason:
        "Skin symptoms like acne or rash are commonly assessed in dermatology, with hormonal follow-up if needed.",
      carePath: [
        "Track symptom pattern and possible triggers.",
        "Start with dermatology for skin-focused evaluation.",
        "Ask about hormonal workup if symptoms align with cycle changes.",
      ],
      questionsToAsk: [
        "What type of acne or rash does this look like?",
        "Could hormones be contributing to this?",
        "What treatment plan and timeline should I expect?",
      ],
      urgentCareWarning:
        "Seek urgent care for severe rash with fever, facial swelling, breathing trouble, or rapid worsening.",
      searchTerm: "Dermatologist",
    };
  }

  if (hasAny(input, ["urinary", "burning", "uti"])) {
    return {
      pattern: pattern || "Possible pattern: urinary tract irritation (UTI-like pattern).",
      specialist: "Primary Care Physician or Urologist",
      specialistType: "urologist",
      reason:
        "Urinary burning or UTI-like symptoms are often first managed in primary care, with urology support when recurring.",
      carePath: [
        "Track urinary symptoms, frequency, and pain severity.",
        "Start with primary care for testing and treatment.",
        "Consider urology if symptoms are frequent or persistent.",
      ],
      questionsToAsk: [
        "Could this be a UTI or another urinary issue?",
        "What tests should I do now?",
        "When should I see urology?",
      ],
      urgentCareWarning:
        "Seek urgent care for fever, flank/back pain, vomiting, blood in urine, pregnancy-related urinary pain, or worsening symptoms.",
      searchTerm: "Urologist",
    };
  }

  return {
    pattern,
    specialist: "Primary Care Physician",
    specialistType: "primary_care_physician",
    reason:
      "When symptoms are mixed or unclear, primary care is a practical first step to guide next referrals.",
    carePath: [
      "Track your main symptoms and when they occur.",
      "Start with primary care for an initial evaluation.",
      "Ask for specialist referral based on findings.",
    ],
    questionsToAsk: [
      "What are the most likely causes of these symptoms?",
      "What tests should I do first?",
      "Which specialist should I see next if symptoms continue?",
    ],
    urgentCareWarning:
      "Seek urgent care for severe pain, breathing issues, fainting, chest pain, heavy bleeding, or rapidly worsening symptoms.",
    searchTerm: "Primary care physician",
  };
}
