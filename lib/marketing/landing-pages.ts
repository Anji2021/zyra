import type { Metadata } from "next";

const SITE_URL = "https://zyra-gold.vercel.app";

export type LandingPageKey =
  | "symptom-tracker"
  | "cycle-tracker"
  | "period-health-insights"
  | "hormone-health-tracker"
  | "womens-health-ai"
  | "private-health-journal";

type LandingFaq = { question: string; answer: string };
type LandingPageConfig = {
  slug: LandingPageKey;
  title: string;
  description: string;
  h1: string;
  heroBody: string;
  helpsWith: string[];
  supportPoints: { title: string; body: string }[];
  privacyMessage: string;
  keywords: string[];
  faq: LandingFaq[];
};

export const landingPages: Record<LandingPageKey, LandingPageConfig> = {
  "symptom-tracker": {
    slug: "symptom-tracker",
    title: "Symptom Tracker | Zyra Private Women's Health App",
    description:
      "Use Zyra as a private symptom tracking app to log patterns, context, and AI-supported summaries that help prepare for better care conversations.",
    h1: "Private symptom tracking that helps you notice patterns",
    heroBody:
      "Zyra is a women's health app designed for quick, private symptom tracking with context you can actually use during care conversations.",
    helpsWith: [
      "Daily symptom tracking without overcomplicated charts",
      "Tagging intensity, timing, and notes in one place",
      "Spotting repeated patterns across days or cycles",
    ],
    supportPoints: [
      {
        title: "Log in seconds",
        body: "Capture symptoms, severity, and notes quickly so tracking stays practical and consistent.",
      },
      {
        title: "Review AI health insights",
        body: "Get educational summaries from your own entries to support calmer decisions and clearer questions.",
      },
      {
        title: "Prepare for appointments",
        body: "Bring organized symptom history to specialist conversations without guessing from memory.",
      },
    ],
    privacyMessage:
      "Your symptom logs are intended for a private health companion experience, with education-first insights and no diagnosis claims.",
    keywords: [
      "symptom tracking app",
      "women's health app",
      "private health tracking",
      "reproductive health companion",
    ],
    faq: [
      {
        question: "What can I track in Zyra's symptom tracker?",
        answer: "You can track symptoms, severity, notes, and timing context to better understand recurring themes.",
      },
      {
        question: "Does Zyra diagnose conditions from symptoms?",
        answer: "No. Zyra offers educational insights and organization support, not diagnosis or treatment.",
      },
    ],
  },
  "cycle-tracker": {
    slug: "cycle-tracker",
    title: "Cycle Tracker | Zyra Women's Health Companion",
    description:
      "Track menstrual and cycle patterns privately with Zyra. Build clearer cycle insights and support reproductive wellness conversations with clinicians.",
    h1: "Cycle tracking built for clarity, not guesswork",
    heroBody:
      "Zyra helps you track cycle timing, related symptoms, and health context so menstrual wellness tracking feels organized and useful.",
    helpsWith: [
      "Cycle tracking with contextual notes",
      "Seeing trends across months, not single days",
      "Connecting cycle changes with symptoms and routines",
    ],
    supportPoints: [
      {
        title: "Track timing clearly",
        body: "Log start and end windows to build a practical cycle history over time.",
      },
      {
        title: "Understand cycle insights",
        body: "Review educational pattern summaries that help you make sense of what is changing.",
      },
      {
        title: "Support better care preparation",
        body: "Share clean, timeline-based context with clinicians when discussing cycle changes.",
      },
    ],
    privacyMessage:
      "Zyra keeps cycle tracking focused on private health context and clinically aware guidance, never treatment promises.",
    keywords: [
      "cycle tracker",
      "cycle tracking app",
      "menstrual wellness tracking",
      "reproductive wellness",
    ],
    faq: [
      {
        question: "Is Zyra a period and cycle tracker?",
        answer: "Yes. Zyra supports cycle and period tracking with notes and symptom context in one private workspace.",
      },
      {
        question: "Can cycle tracking replace medical care?",
        answer: "No. Tracking supports awareness and care conversations, but medical decisions still require licensed clinicians.",
      },
    ],
  },
  "period-health-insights": {
    slug: "period-health-insights",
    title: "Period Health Insights | Zyra AI Women's Health App",
    description:
      "Explore period health insights from your own logs with Zyra. Understand symptom and cycle context through private, educational AI-supported summaries.",
    h1: "Period health insights from your real tracking history",
    heroBody:
      "Zyra turns your cycle and symptom logs into understandable, private health insights that support reproductive wellness planning.",
    helpsWith: [
      "Turning entries into readable period health context",
      "Identifying recurring cycle and symptom combinations",
      "Preparing thoughtful questions before appointments",
    ],
    supportPoints: [
      {
        title: "Connect patterns over time",
        body: "See what repeats across logs so your history feels useful, not scattered.",
      },
      {
        title: "Stay educational and grounded",
        body: "Insights are framed as support for understanding patterns, not medical diagnosis.",
      },
      {
        title: "Move toward better conversations",
        body: "Bring concise summaries to discussions with specialists for more focused care planning.",
      },
    ],
    privacyMessage:
      "Period health insights are generated from your own tracking context with a privacy-first approach and no guaranteed outcomes.",
    keywords: [
      "period health insights",
      "cycle insights",
      "AI health insights",
      "women's health app",
    ],
    faq: [
      {
        question: "How are Zyra period insights generated?",
        answer: "Insights are based on your logged cycle and symptom data, then summarized in educational language.",
      },
      {
        question: "Are period insights medical advice?",
        answer: "No. They are informational summaries to support care preparation with licensed professionals.",
      },
    ],
  },
  "hormone-health-tracker": {
    slug: "hormone-health-tracker",
    title: "Hormone Health Tracker | Zyra Reproductive Wellness App",
    description:
      "Use Zyra for hormone health tracking with symptom, cycle, and context logging. Build clearer trends and prepare for specialist conversations privately.",
    h1: "Hormone health tracking with practical context",
    heroBody:
      "Zyra helps people managing hormone-related patterns keep private, organized logs that support more confident care preparation.",
    helpsWith: [
      "Tracking hormone health patterns over time",
      "Relating cycle changes to symptoms and routines",
      "Building context before seeing specialists",
    ],
    supportPoints: [
      {
        title: "Log beyond single symptoms",
        body: "Capture cycle context, medicines, and notes to create a fuller view of hormone health tracking.",
      },
      {
        title: "Review private trend summaries",
        body: "Use AI-supported pattern notes as educational guidance for what to discuss next.",
      },
      {
        title: "Prepare with confidence",
        body: "Bring structured tracking history into endocrinology or OB-GYN care conversations.",
      },
    ],
    privacyMessage:
      "Zyra supports hormone health tracking in a private, consumer-friendly way without replacing doctors or treatment plans.",
    keywords: [
      "hormone health tracking",
      "reproductive health companion",
      "private health tracking",
      "AI women's health app",
    ],
    faq: [
      {
        question: "Who is hormone health tracking for?",
        answer: "Anyone wanting to track hormone-related symptom and cycle patterns for better health context.",
      },
      {
        question: "Can Zyra treat hormone issues?",
        answer: "No. Zyra is a tracking and education tool that supports conversations with licensed clinicians.",
      },
    ],
  },
  "womens-health-ai": {
    slug: "womens-health-ai",
    title: "Women's Health AI Companion | Zyra",
    description:
      "Discover Zyra, an AI women's health app that supports cycle tracking, symptom tracking, private health insights, and care preparation.",
    h1: "An AI women's health app built for everyday clarity",
    heroBody:
      "Zyra combines private health tracking with AI-supported summaries so you can understand patterns and prepare for better care conversations.",
    helpsWith: [
      "AI-supported organization of your health context",
      "Cycle and symptom tracking in one workspace",
      "Educational guidance for next-step care planning",
    ],
    supportPoints: [
      {
        title: "Track your context",
        body: "Bring symptoms, cycle timelines, and notes together to reduce uncertainty.",
      },
      {
        title: "Get clearer AI health insights",
        body: "Review educational summaries that help you see patterns without overclaiming certainty.",
      },
      {
        title: "Find sensible care direction",
        body: "Use specialist suggestions and saved context to prepare for licensed care visits.",
      },
    ],
    privacyMessage:
      "Zyra is designed as a private health companion with clinically aware language and consumer-friendly UX.",
    keywords: [
      "AI women's health app",
      "AI health companion",
      "private health companion",
      "reproductive health companion",
    ],
    faq: [
      {
        question: "How does AI help in Zyra?",
        answer: "AI helps summarize your logs, surface trends, and support clearer care preparation questions.",
      },
      {
        question: "Does Zyra replace doctors?",
        answer: "No. Zyra supports understanding and preparation; diagnosis and treatment come from licensed clinicians.",
      },
    ],
  },
  "private-health-journal": {
    slug: "private-health-journal",
    title: "Private Health Journal | Zyra Women's Health Tracking",
    description:
      "Create a private health journal with Zyra for symptom tracking, cycle tracking, and AI-supported reflections that improve care preparation.",
    h1: "A private health journal for symptom and cycle tracking",
    heroBody:
      "Zyra gives you a clean, secure-feeling space to keep reproductive wellness notes, symptom logs, and cycle context together.",
    helpsWith: [
      "Private journaling for health context over time",
      "Combining cycle insights with symptom tracking",
      "Preparing for care visits with organized history",
    ],
    supportPoints: [
      {
        title: "Journal consistently",
        body: "Capture small daily details that are easy to forget before appointments.",
      },
      {
        title: "Reflect with AI support",
        body: "Use educational summaries to review trends in your private health companion timeline.",
      },
      {
        title: "Take useful context to care",
        body: "Convert journaling into structured talking points for specialist discussions.",
      },
    ],
    privacyMessage:
      "This private health journal approach is designed for reflection and preparation, not diagnosis, treatment, or emergency care.",
    keywords: [
      "private health journal",
      "private health tracking",
      "symptom tracking app",
      "cycle tracking",
    ],
    faq: [
      {
        question: "Is Zyra suitable as a private health journal?",
        answer: "Yes. Zyra supports private symptom, cycle, and note tracking in a structured format.",
      },
      {
        question: "What makes this different from a notes app?",
        answer: "Zyra combines tracking structure, AI-supported summaries, and care-prep context in one women's health workflow.",
      },
    ],
  },
};

export const landingPageOrder: LandingPageKey[] = [
  "symptom-tracker",
  "cycle-tracker",
  "period-health-insights",
  "hormone-health-tracker",
  "womens-health-ai",
  "private-health-journal",
];

export function getLandingPage(slug: LandingPageKey): LandingPageConfig {
  return landingPages[slug];
}

export function getRelatedLandingPages(slug: LandingPageKey): Array<Pick<LandingPageConfig, "slug" | "h1">> {
  return landingPageOrder.filter((item) => item !== slug).slice(0, 4).map((item) => ({
    slug: item,
    h1: landingPages[item].h1,
  }));
}

export function getLandingPageMetadata(slug: LandingPageKey): Metadata {
  const page = landingPages[slug];
  const canonicalPath = `/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      url: canonicalPath,
      siteName: "Zyra",
      images: [{ url: "/zyra-icon-512.png", width: 512, height: 512, alt: "Zyra women's health companion" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/zyra-icon-512.png"],
    },
  };
}

export const LANDING_SITE_URL = SITE_URL;
