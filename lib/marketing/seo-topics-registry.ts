/**
 * Programmatic SEO: educational topic pages. Editorial, review-based content —
 * extend by adding entries here (no DB required).
 */

import type { Metadata } from "next";
import { ZYRA } from "@/lib/zyra/site";

export type TopicSlug =
  | "irregular-cycles"
  | "cycle-tracking"
  | "period-symptoms"
  | "hormone-balance"
  | "pms-tracking"
  | "mood-and-cycle-patterns"
  | "symptom-journaling"
  | "reproductive-wellness-tracking";

export type TopicFaqItem = { question: string; answer: string };

export type TopicSupportBlock = { title: string; body: string };

export type TopicDefinition = {
  slug: TopicSlug;
  /** Short label for chips / strips */
  cardLabel: string;
  /** <title>-friendly */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  overview: string;
  commonPatternsHeading: string;
  commonPatterns: string[];
  whyTrackingHeading: string;
  whyTracking: string[];
  zyraSupportsHeading: string;
  zyraSupports: TopicSupportBlock[];
  faq: TopicFaqItem[];
  /** Editorial related topics (shown as internal links). */
  relatedSlugs: TopicSlug[];
};

const SAFE =
  "This page is educational. It does not diagnose, treat, or replace care from a licensed clinician.";

function def(partial: Omit<TopicDefinition, "commonPatternsHeading" | "whyTrackingHeading" | "zyraSupportsHeading"> & {
  commonPatternsHeading?: string;
  whyTrackingHeading?: string;
  zyraSupportsHeading?: string;
}): TopicDefinition {
  return {
    commonPatternsHeading: partial.commonPatternsHeading ?? "Patterns people sometimes notice",
    whyTrackingHeading: partial.whyTrackingHeading ?? "Why tracking may help",
    zyraSupportsHeading: partial.zyraSupportsHeading ?? "How Zyra supports private tracking",
    ...partial,
  };
}

export const SEO_TOPICS: Record<TopicSlug, TopicDefinition> = {
  "irregular-cycles": def({
    slug: "irregular-cycles",
    cardLabel: "Irregular cycles",
    metaTitle: "Irregular cycles & tracking tips | Zyra",
    metaDescription:
      "Learn how cycle tracking may help users understand irregular periods and patterns over time—with private logging and clinician-ready context. Educational only—not medical advice.",
    keywords: [
      "irregular cycle tracking",
      "irregular periods",
      "cycle insights",
      "private health tracking",
      "women's health app",
    ],
    h1: "Irregular cycles: understanding patterns without jumping to conclusions",
    overview: `Cycles vary for many reasons, including stress, travel, hormonal shifts, medications, sleep, or life stage changes. Noticing longer, shorter, or skipped cycles does not explain why on its own—but noticing when shifts happen often helps conversations with clinicians. ${SAFE}`,
    commonPatterns: [
      "Shorter gaps between bleeding for a few cycles, then a return closer to baseline",
      "Bleeding that starts later than usual with clear life-context notes (stress, illness, jet lag)",
      "Spotting logged between fuller flow days—in the app as simple dates and notes only",
      "Pain or mood shifts that cluster around predictable cycle windows alongside timing changes",
    ],
    whyTracking: [
      "A lightweight timeline reduces recall bias—you are not reconstructing weeks from memory in the waiting room.",
      "Pairing discomfort or mood entries with approximate cycle timing may help clinicians ask better follow‑up questions.",
      "Seeing what changed around the same weeks can help prepare questions without self‑diagnosing.",
    ],
    zyraSupports: [
      {
        title: "Private timeline",
        body: "Zyra supports cycle and symptom logs that stay oriented to your account so you control what goes into summaries.",
      },
      {
        title: "Insights are educational",
        body: `${ZYRA.name} summarizes patterns from what you tracked to support understanding—not conclusions about disease.`,
      },
      {
        title: "Care prep",
        body: "Export-style summaries and Insights can help you prepare for clearer discussions with women's health clinicians.",
      },
    ],
    faq: [
      {
        question: "Does an irregular tracking pattern mean something is seriously wrong?",
        answer:
          "Not necessarily—many benign factors influence timing. Persistent changes or troubling symptoms merit a clinician, not guesses from an app.",
      },
      {
        question: "Can Zyra tell me what's causing irregular cycles?",
        answer:
          "No. Zyra may help organize what you observe and summarize trends in educational language. Diagnosis belongs to licensed professionals.",
      },
    ],
    relatedSlugs: ["cycle-tracking", "hormone-balance", "period-symptoms", "reproductive-wellness-tracking"],
  }),

  "cycle-tracking": def({
    slug: "cycle-tracking",
    cardLabel: "Cycle tracking",
    metaTitle: "Cycle tracking for clarity & visit prep | Zyra",
    metaDescription:
      "Cycle tracking explained: what to log, how it supports menstrual wellness insights, and how Zyra keeps records private while helping you prepare for care conversations.",
    keywords: ["cycle tracking", "period tracking app", "menstrual wellness", "women's health app", "cycle insights"],
    h1: "Cycle tracking as a grounded habit—not a guessing game",
    overview: `Consistent cycle tracking captures start days, symptom context, and life notes without requiring medical interpretation in the moment. Used well, it can help users understand rhythms and rehearse clearer questions ahead of appointments. ${SAFE}`,
    commonPatterns: [
      "Bleeding onset with optional notes on cramps, headache, mood, sleep, or travel",
      "Logging “no period yet” markers when calendars feel uncertain—not as a verdict, only as dated context",
      "Side‑by‑side entries for OTC medicines or contraception changes paired with subjective symptoms",
      "Short weekly reflection lines that summarize energy or stress without diagnosing causes",
    ],
    whyTracking: [
      "Builds continuity—longitudinal context is harder to articulate from memory.",
      "Makes menstrual wellness tangible for people whose cycles drift over months or seasons.",
      "Supports fair expectations: apps describe patterns observed, never guaranteed outcomes.",
    ],
    zyraSupports: [
      {
        title: "Unified logging",
        body: `${ZYRA.name} aligns cycle timelines with symptom and medicine logs so summaries stay cohesive.`,
      },
      {
        title: "Private by design",
        body: "Your entries can feed educational AI insights tailored to what you intentionally recorded—not public forums.",
      },
      {
        title: "Appointment framing",
        body: "Use Insights and Health log views to prioritize “what changed since last visit?” talking points.",
      },
    ],
    faq: [
      {
        question: "What's the smallest useful cycle log?",
        answer:
          'Often "first day of flow" dates plus occasional symptom notes—even brief entries beat perfect notebooks you never maintain.',
      },
      {
        question: "Does Zyra forecast ovulation?",
        answer:
          "Zyra avoids clinical predictions. It may summarize patterns relevant to reproductive wellness conversations you pursue with clinicians.",
      },
    ],
    relatedSlugs: ["irregular-cycles", "mood-and-cycle-patterns", "pms-tracking", "symptom-journaling"],
  }),

  "period-symptoms": def({
    slug: "period-symptoms",
    cardLabel: "Period symptoms",
    metaTitle: "Period symptoms & private tracking | Zyra",
    metaDescription:
      "Track period symptoms thoughtfully: common patterns users log, why detail helps care preparation, and how Zyra offers private AI-assisted summaries—not diagnosis.",
    keywords: ["period symptoms", "PMS tracking", "symptom journaling", "women's health tracking"],
    h1: "Period symptoms: logging what happens, calmly and privately",
    overview: `Headaches, bloating, fatigue, mood shifts, and GI changes often travel with cycles—and many people experience different bundles each month. Tracking does not label you; it helps describe how your body felt over time. ${SAFE}`,
    commonPatterns: [
      "Cramping intensity by day of flow (not for scoring—just for relative comparison weeks apart)",
      "GI upset or appetite changes that cluster pre‑flow vs mid‑flow",
      "Skin or breast tenderness windows that repeat loosely around the same calendar stretch",
      "Sleep debt or stress notes attached to heavier symptom days",
    ],
    whyTracking: [
      `Reduces “everything feels random” noise when something is actually recurring.`,
      "Helps discern what to mention first if visit time is short.",
      "Supports honest self‑advocacy without overstating or understating impact.",
    ],
    zyraSupports: [
      {
        title: "Symptom entries",
        body: "Log intensity, free text, and dates that match your comfort level—no forced medical categories.",
      },
      {
        title: "Pattern-friendly summaries",
        body: "Educational AI health insights may highlight themes from your own words; they are not treatment plans.",
      },
      {
        title: "Specialist search context",
        body: "Pair symptom notes with specialist discovery when you want to prepare next steps with a clinician.",
      },
    ],
    faq: [
      {
        question: "Should I log every tiny symptom?",
        answer:
          "Only what helps you. Many people log high-impact days or new changes first, then expand if patterns stay unclear.",
      },
      {
        question: "Can tracking replace a pelvic exam or labs?",
        answer: "No. Tracking supplements your story; exams and tests are ordered and interpreted by licensed professionals.",
      },
    ],
    relatedSlugs: ["pms-tracking", "irregular-cycles", "symptom-journaling", "cycle-tracking"],
  }),

  "hormone-balance": def({
    slug: "hormone-balance",
    cardLabel: "Hormone balance",
    metaTitle: "Hormone health tracking & context | Zyra",
    metaDescription:
      "Explore hormone-related cycle and symptom context: what people track, why longitudinal notes help, and how Zyra supports private preparation for women's health visits—without treatment claims.",
    keywords: ["hormone health tracking", "reproductive health companion", "cycle symptoms", "private health insights"],
    h1: "Hormone-related patterns: track context, not internet verdicts",
    overview: `People use “hormone balance” casually online. In real care, hormones interact with sleep, stress, nutrition, thyroid health, medications, and more. ${ZYRA.name} never promises to “fix” hormones—it helps you carry cleaner context into conversations. ${SAFE}`,
    commonPatterns: [
      "Cycle length shifts noted alongside sleep or stress tags you choose to add",
      "Skin, hair, or energy changes logged with approximate timing vs bleeding",
      "Medication or supplement changes recorded as neutral facts for visit prep",
      "Temperature or exercise changes you want to remember but not self‑interpret",
    ],
    whyTracking: [
      "Separates correlation ideas from proof—useful for asking smart questions, not self‑diagnosing.",
      "Captures slow drifts that month-by-month memory blurs.",
      "Helps clinicians see what else was happening when symptoms flared.",
    ],
    zyraSupports: [
      {
        title: "Private companion view",
        body: "Keep hormone-adjacent notes with cycle and symptom entries in one secure-feeling workspace.",
      },
      {
        title: "Educational framing",
        body: "AI-supported language stays cautious—supporting understanding and care preparation, not prescribing.",
      },
      {
        title: "Specialist direction",
        body: "DoctorMatch-style suggestions can help orient “what type of conversation might come next” with a licensed clinician.",
      },
    ],
    faq: [
      {
        question: "Can an app measure my hormone levels?",
        answer: "No. Zyra does not perform labs. It helps organize experiences and dates you can discuss if testing is appropriate.",
      },
      {
        question: "Is 'hormone imbalance' a diagnosis?",
        answer:
          "Clinicians determine diagnoses. Colloquial labels online are not substitutes for evaluation and personalized guidance.",
      },
    ],
    relatedSlugs: ["irregular-cycles", "mood-and-cycle-patterns", "reproductive-wellness-tracking", "pms-tracking"],
  }),

  "pms-tracking": def({
    slug: "pms-tracking",
    cardLabel: "PMS tracking",
    metaTitle: "PMS tracking & visit preparation | Zyra",
    metaDescription:
      "How PMS tracking may help users notice premenstrual patterns, reduce surprise flare-ups, and prepare for OB-GYN or primary care visits—with private logging on Zyra.",
    keywords: ["PMS tracking", "premenstrual symptoms", "symptom tracking app", "cycle insights"],
    h1: "PMS tracking: gentle pattern-spotting before your next visit",
    overview: `Premenstrual experiences differ widely. Some people track mood, pain, bloating, focus, or social bandwidth. The goal is not to pathologize having a cycle—it's to notice what tends to cluster so you can plan support and ask informed questions. ${SAFE}`,
    commonPatterns: [
      "Irritability or anxiety windows in the days before bleeding with simple 1–5 check-ins",
      "Physical symptoms (bloating, breast tenderness) peaking on consistent offsets from flow",
      "Sleep disruption or appetite shifts that map loosely to the same pre-flow window",
      "Helpful coping notes (movement, hydration, therapy) you want to remember worked",
    ],
    whyTracking: [
      "Validates your experience with dated evidence without comparing you to strangers online.",
      "Separates PMS-like timing from unrelated stressful weeks when both overlap.",
      "Supports shared decision-making if lifestyle or clinical options are on the table.",
    ],
    zyraSupports: [
      {
        title: "Quick logs",
        body: "Short entries on busy days still build a timeline you can revisit before appointments.",
      },
      {
        title: "Private AI insights",
        body: "Summaries may help phrase what changed month to month—always educational, never a prescription.",
      },
      {
        title: "Link to Specialists",
        body: "When you're ready for in-person navigation, pairing notes with Specialist search clarifies priorities.",
      },
    ],
    faq: [
      {
        question: "How is PMS different from PMDD?",
        answer:
          "PMDD is a clinical classification requiring professional evaluation—not something an app should label. Detailed logging can assist those conversations.",
      },
      {
        question: "Will tracking make me obsess over symptoms?",
        answer:
          "Use granularity that stays helpful for you—some people taper detail once patterns feel clear.",
      },
    ],
    relatedSlugs: ["mood-and-cycle-patterns", "period-symptoms", "cycle-tracking", "symptom-journaling"],
  }),

  "mood-and-cycle-patterns": def({
    slug: "mood-and-cycle-patterns",
    cardLabel: "Mood & cycles",
    metaTitle: "Mood patterns & menstrual cycles | Zyra",
    metaDescription:
      "Understand mood and cycle patterns over time—without diagnosis language. Discover how thoughtful logging and private AI insights may support clearer mental-health and women's health conversations.",
    keywords: ["mood and cycle patterns", "cycle tracking mental health", "symptom tracking", "women's wellness"],
    h1: "Mood and cycle patterns: context for care—not a checklist for self-diagnosis",
    overview: `Mood naturally fluctuates across a month—for cycle-related reasons and many others. Responsible tracking observes timing alongside context (sleep events, meds, grief, burnout) rather than asserting causes. ${SAFE}`,
    commonPatterns: [
      "Low motivation or heightened anxiety clustered in repeatable pre-menstrual windows",
      "Energy rebound notes after bleeding starts for some individuals—every body differs",
      "Concurrent stressors explicitly tagged so patterns are not over-attributed to hormones alone",
      "Positive coping tools that worked on harder days (gentle movement, therapy, social support)",
    ],
    whyTracking: [
      "Helps separate chronic mental health needs from cyclical irritations when both exist.",
      `Empowers specific questions for therapists or clinicians instead of vague “I feel off.”`,
      "May reduce shame by showing patterns are sometimes time-bound, not character flaws.",
    ],
    zyraSupports: [
      {
        title: "Private journaling tone",
        body: "Track emotional words you actually use—Zyra supports turning them into neutral summaries for yourself or clinicians.",
      },
      {
        title: "Cross-feature context",
        body: "Combine mood notes with cycle dates and Health log entries for a rounded personal story.",
      },
      {
        title: "Educational guardrails",
        body: "Language stays supportive; it does not instruct medication or therapy changes.",
      },
    ],
    faq: [
      {
        question: "Should I use this instead of mental health care?",
        answer:
          "No. Zyra complements awareness. Therapy, psychiatry, or crisis resources remain essential when mood symptoms are severe or persistent.",
      },
      {
        question: "Can AI interpret my mood accurately?",
        answer:
          "AI reflects patterns in what *you* logged; it cannot read your mind or replace professional assessment.",
      },
    ],
    relatedSlugs: ["pms-tracking", "symptom-journaling", "hormone-balance", "cycle-tracking"],
  }),

  "symptom-journaling": def({
    slug: "symptom-journaling",
    cardLabel: "Symptom journaling",
    metaTitle: "Symptom journaling & private notes | Zyra",
    metaDescription:
      "Symptom journaling that stays private: why short daily notes help, what to include, and how Zyra turns entries into educational summaries for better care preparation.",
    keywords: ["symptom journaling", "private health journal", "symptom tracking app", "care preparation"],
    h1: "Symptom journaling that stays useful—and stays yours",
    overview: `The best journal is the one you keep. Micro-notes (a sentence, a severity tap, a context tag) often outperform long essays that never get written. ${ZYRA.name} supports turning consistent fragments into structured history for visits. ${SAFE}`,
    commonPatterns: [
      `Three-word check-ins on busy days (“heavy headache”, “sharp cramps”)`,
      "Timing markers: morning vs evening flares or post-meal notes when relevant",
      "Medication or supplement changes with start dates only—no dosing advice from the app",
      "Photo-free, text-first privacy for people who avoid camera-based tracking",
    ],
    whyTracking: [
      "Builds a corpus of your own language—clinicians hear your words, not generic templates.",
      `Reduces the “forgot to mention” phenomenon after long waits in lobbies.`,
      "Helps you notice if an intervention from your care team correlates with later entries (still to be interpreted professionally).",
    ],
    zyraSupports: [
      {
        title: "Fast capture",
        body: "Designed for thumb-friendly mobile logging so friction stays low.",
      },
      {
        title: "Pattern surfacing",
        body: "Educational AI health insights may cluster recurring phrases or severity trends from your history.",
      },
      {
        title: "Health log companion",
        body: "Symptom journaling pairs with medicine logs when you want a fuller pre-visit packet.",
      },
    ],
    faq: [
      {
        question: "How detailed should entries be?",
        answer:
          "Match your capacity. Consistency beats perfection—dates plus a few honest words often suffice initially.",
      },
      {
        question: "Who can read my journal?",
        answer: "Zyra is built as a private health companion; keep account credentials secure and review our privacy policy for specifics.",
      },
    ],
    relatedSlugs: ["period-symptoms", "cycle-tracking", "reproductive-wellness-tracking", "pms-tracking"],
  }),

  "reproductive-wellness-tracking": def({
    slug: "reproductive-wellness-tracking",
    cardLabel: "Reproductive wellness",
    metaTitle: "Reproductive wellness tracking | Zyra",
    metaDescription:
      "Reproductive wellness tracking with a premium, privacy-first women’s health app: combine cycle, symptom, and context logs to prepare for better conversations—without diagnosis or treatment promises.",
    keywords: [
      "reproductive wellness tracking",
      "women's health app",
      "private health companion",
      "cycle insights",
    ],
    h1: "Reproductive wellness tracking: whole-person context, zero hype",
    overview: `Reproductive wellness includes cycle health, symptoms, medications, mental well-being, and life context that affects how you feel. ${ZYRA.name} helps users track privately and reflect with educational AI assistance—never replacing clinicians. ${SAFE}`,
    commonPatterns: [
      "Cycle timing plus energy or mood tags that matter to you personally",
      "Medication or device changes noted briefly for timing reference",
      "Seasonal workload or caregiving stress markers when they overlap symptom spikes",
      "Questions you want to ask—saved as bullets so visits stay focused",
    ],
    whyTracking: [
      "Produces a nuanced narrative instead of fragmented app silos.",
      "May help prioritize what to discuss first when appointments are brief.",
      "Keeps sovereignty in your hands: you choose what enters summaries.",
    ],
    zyraSupports: [
      {
        title: "Premium, calm UX",
        body: `Designed to feel like a trustworthy femtech companion—never noisy or alarmist.`,
      },
      {
        title: "Insights + Specialists",
        body: "Bridge from longitudinal logs to clinician conversations and curated search—not “Dr. Internet.”",
      },
      {
        title: "Ethical framing",
        body: `${ZYRA.name} reinforces that educational guidance supports preparation, not guaranteed outcomes.`,
      },
    ],
    faq: [
      {
        question: "Is reproductive wellness tracking only for fertility?",
        answer:
          "No. People use longitudinal logs for diverse goals—from pain management conversations to general body awareness.",
      },
      {
        question: "Does Zyra guarantee better health outcomes?",
        answer:
          "No app can. Tracking may help users understand patterns and prepare; outcomes depend on many personal and clinical factors.",
      },
    ],
    relatedSlugs: ["cycle-tracking", "hormone-balance", "irregular-cycles", "symptom-journaling"],
  }),
};

/** Deterministic crawl / nav order */
export const TOPIC_SLUGS_ORDERED: TopicSlug[] = [
  "irregular-cycles",
  "cycle-tracking",
  "period-symptoms",
  "hormone-balance",
  "pms-tracking",
  "mood-and-cycle-patterns",
  "symptom-journaling",
  "reproductive-wellness-tracking",
];

export function getTopicOrNull(slug: string): TopicDefinition | null {
  if (slug in SEO_TOPICS) return SEO_TOPICS[slug as TopicSlug];
  return null;
}

export function getTopicSlugs(): TopicSlug[] {
  return [...TOPIC_SLUGS_ORDERED];
}

export function getRelatedTopicCards(slug: TopicSlug): { slug: TopicSlug; cardLabel: string }[] {
  return SEO_TOPICS[slug].relatedSlugs.map((s) => ({ slug: s, cardLabel: SEO_TOPICS[s].cardLabel }));
}

export function buildTopicMetadata(slug: TopicSlug): Metadata {
  const t = SEO_TOPICS[slug];
  const path = `/topics/${slug}`;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    keywords: [...t.keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      type: "article",
      url: path,
      siteName: ZYRA.name,
      images: [
        {
          url: "/zyra-icon-512.png",
          width: 512,
          height: 512,
          alt: `${ZYRA.name} — women's health education`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDescription,
      images: ["/zyra-icon-512.png"],
    },
  };
}
