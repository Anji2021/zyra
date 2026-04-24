export const RESOURCE_CATEGORIES = ["PCOS", "Periods", "Hormones", "General Health"] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export type ResourceArticle = {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  /** Plain paragraphs for reading on the detail page */
  paragraphs: string[];
  readTime: string;
};

export const resources: ResourceArticle[] = [
  {
    id: "what-is-pcos",
    title: "What is PCOS?",
    category: "PCOS",
    description:
      "A calm overview of polycystic ovary syndrome — what people mean by the name, and what it is not.",
    readTime: "4 min read",
    paragraphs: [
      "Polycystic ovary syndrome (PCOS) is a common hormonal pattern that can affect how the ovaries work. The name mentions cysts, but it does not mean everyone with PCOS has pain or the same ultrasound picture. People use the term to describe a cluster of signs that often show up together — such as irregular periods, excess androgen-related symptoms, or findings on imaging — not a single lab value.",
      "PCOS is a real medical label, but it is not a judgment about your body. Different clinicians may use slightly different criteria. This article cannot tell you whether you have PCOS; only a qualified professional can do that after your history, exam, and any tests they think are appropriate.",
      "If you are navigating a new diagnosis or a long journey with symptoms, you deserve clear explanations and choices. Write down questions before visits, and bring notes about your cycle if you can — small steps that help you stay centered.",
    ],
  },
  {
    id: "pcos-vs-pcod",
    title: "PCOS vs PCOD: what’s the difference?",
    category: "PCOS",
    description:
      "Why you might hear both terms, and how to think about them without getting lost in labels.",
    readTime: "3 min read",
    paragraphs: [
      "You may hear “PCOS” (polycystic ovary syndrome) and “PCOD” (polycystic ovarian disease) used in articles, communities, or clinics. Sometimes they describe similar experiences; sometimes one term is used more often in a particular country or tradition. There is no universal dictionary that makes them identical for every clinician.",
      "What matters most is what you are feeling, how your cycle behaves, and what your care team finds on exam and tests — not the abbreviation alone. If a word on a screen worries you, it is okay to ask: “What does this label mean for my care plan?”",
      "Zyra offers education, not a second opinion on a diagnosis. Use this space to prepare questions, not to replace a visit where someone can examine you and review your records.",
    ],
  },
  {
    id: "why-periods-get-delayed",
    title: "Why periods sometimes arrive late",
    category: "Periods",
    description:
      "Common, non-alarming reasons cycles shift — and when a delay is worth mentioning to a clinician.",
    readTime: "4 min read",
    paragraphs: [
      "A menstrual cycle is sensitive to stress, sleep changes, travel, illness, and shifts in weight or exercise. Hormones from the brain and ovaries talk to each other month to month; when life is intense, that conversation can quiet down for a bit. A late period once in a while is common and does not by itself prove anything specific.",
      "Medicines, thyroid conditions, breastfeeding, and perimenopause can also change timing. This list is not complete, and reading it is not the same as being evaluated.",
      "Consider contacting a clinician if you miss periods repeatedly, have very heavy bleeding, severe pain, pregnancy possibilities, or symptoms that feel new and frightening to you. Trust your instinct when something feels off for your body.",
    ],
  },
  {
    id: "irregular-cycles-explained",
    title: "Irregular cycles, explained gently",
    category: "Periods",
    description:
      "What “irregular” can mean in everyday language — without turning your calendar into a verdict.",
    readTime: "3 min read",
    paragraphs: [
      "People say “irregular” to mean many things: cycles that vary in length, bleeding that shows up unexpectedly, or months without a period. Charts and apps can help you notice patterns, but they cannot tell you why the pattern exists without medical context.",
      "Tracking dates, flow, and how you feel can still be valuable. It helps you describe what changed and when — which is often the first thing a clinician will ask.",
      "If your pattern worries you, you are allowed to ask for help even if someone else says you should “wait it out.” You live in your body every day.",
    ],
  },
  {
    id: "common-period-symptoms",
    title: "Common period symptoms many people notice",
    category: "Periods",
    description:
      "Cramps, mood shifts, and tiredness — normalized without minimizing pain that deserves care.",
    readTime: "3 min read",
    paragraphs: [
      "Many people experience cramping, bloating, breast tenderness, headaches, or mood changes around menstruation. For some, symptoms are mild; for others, they disrupt school, work, or rest. Both realities are valid.",
      "Heat packs, gentle movement, hydration, and sleep can help some people. They are not cures for everyone, and they do not replace care when pain is severe or new.",
      "If pain stops you from normal activities, or you bleed so heavily you feel dizzy, seek urgent or emergency care as appropriate in your area. This article cannot triage emergencies.",
    ],
  },
  {
    id: "when-to-see-a-doctor",
    title: "When to bring cycle questions to a clinician",
    category: "General Health",
    description:
      "Practical prompts for booking a visit — educational, not a checklist for self-diagnosis.",
    readTime: "4 min read",
    paragraphs: [
      "Clinicians are trained to connect your story with exam findings and, when needed, tests. Educational reading can prepare you, but it cannot replace that process.",
      "Many people choose to book care when cycles change suddenly, pain is intense, bleeding is very heavy, they might be pregnant, or they are trying to conceive and want support. These are examples, not a complete list of when care is appropriate.",
      "If you are unsure, it is reasonable to call a nurse line or schedule a routine visit. Asking questions is not overreacting — it is participating in your health.",
    ],
  },
  {
    id: "hormonal-balance-basics",
    title: "Hormonal balance: a small, honest primer",
    category: "Hormones",
    description:
      "What “balance” usually means in everyday language — and what products cannot promise.",
    readTime: "3 min read",
    paragraphs: [
      "Hormones are chemical messengers. They shift naturally across the day, the cycle, pregnancy, stress, and age. Marketing sometimes sells “balance” as a fixed state you can buy in a bottle; bodies are more dynamic than that.",
      "Nutrition, sleep, movement, and mental health all interact with hormones in broad ways. Details are individual, and social media rarely captures your full medical picture.",
      "If someone suggests supplements or diets as a cure-all, slow down and ask your clinician how those ideas fit your history and medications. Zyra does not endorse specific products.",
    ],
  },
  {
    id: "gentle-cycle-tracking",
    title: "Tracking your cycle at home, gently",
    category: "General Health",
    description:
      "How a simple log can support conversations with your care team — without turning numbers into fear.",
    readTime: "3 min read",
    paragraphs: [
      "Writing down start dates, symptoms, or moods can help you remember what happened between visits. The goal is memory support, not perfection. Missing a day does not erase the value of what you did record.",
      "Share only what you want to share. Your notes belong to you first.",
      "If tracking ever feels obsessive or upsetting, pause and talk with a trusted clinician or counselor. Tools should serve your peace of mind, not steal it.",
    ],
  },
];

export function getResourceById(id: string): ResourceArticle | undefined {
  return resources.find((a) => a.id === id);
}

export function getAllResourceIds(): string[] {
  return resources.map((a) => a.id);
}
