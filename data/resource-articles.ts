import type { ResourceArticle } from "./resource-types";

const baseDisclaimer =
  "Zyra shares general education only. It does not diagnose, treat, or replace care from a qualified clinician. If you have urgent symptoms, contact a clinician or emergency services.";

export const resources: ResourceArticle[] = [
  {
    id: "pcos-basics",
    title: "PCOS basics",
    category: "PCOS/PCOD",
    description:
      "What people usually mean by PCOS, common patterns, and how to talk about it calmly with a clinician.",
    readTime: "6 min",
    paragraphs: [
      "Polycystic ovary syndrome (PCOS) is a hormonal pattern that can affect periods, skin, hair growth, metabolism, and fertility. The name can sound alarming, but it does not mean every person has cysts in a dangerous way, and it is not a judgment of your body.",
      "People with PCOS may have irregular ovulation, higher androgen levels on labs, or ultrasound findings that fit a certain pattern. Diagnosis belongs to a clinician who reviews your history, exam, and tests — not to an app or article.",
      "PCOS is common and manageable for many people with support from gynecology, primary care, or endocrinology. Care often focuses on what matters most to you: cycle comfort, skin or hair concerns, mood, energy, fertility goals, or long-term wellness.",
      "Tracking cycles and symptoms can help you notice patterns over months. That information supports conversations with your clinician; it does not replace them.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Cycle length and bleeding days (rough ranges are fine).",
      "Energy, sleep, and stress when you remember.",
      "Skin or hair changes you want to mention.",
      "Any medications or supplements you take (to review with a clinician).",
    ],
    questionsToAskDoctor: [
      "What criteria did you use to consider PCOS in my case?",
      "What follow-up tests might help, and what are they for?",
      "What are my options if I want help with periods, skin, hair, fertility, or metabolic health?",
      "How often should we revisit this plan?",
    ],
    whenToSeekCare: [
      "Very heavy bleeding, bleeding that will not stop, or feeling faint.",
      "Severe pelvic pain that is new or worsening.",
      "Signs of high blood sugar or dehydration you cannot manage at home.",
      "If you are trying to conceive and have questions — a clinician can personalize guidance.",
    ],
  },
  {
    id: "pcos-vs-pcod-naming",
    title: "PCOS vs PCOD: what the names mean",
    category: "PCOS/PCOD",
    description:
      "Why you might hear both terms, how language differs by region, and what to focus on in a visit.",
    readTime: "4 min",
    paragraphs: [
      "You may see “PCOS” (polycystic ovary syndrome) and “PCOD” (polycystic ovary disease) used online or in conversation. In many clinical settings, PCOS is the more common label for a pattern of symptoms and findings reviewed by a clinician.",
      "Names vary by country, culture, and individual providers. The important part is not the acronym — it is whether your symptoms, exam, and tests are understood in context of your goals and overall health.",
      "No website or app should tell you which label “fits” you. A clinician can explain what they see, what it means for you today, and what follow-up makes sense.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Which words your clinician uses in your chart (you can ask them to spell it).",
      "Questions that feel confusing so you can ask for plain-language explanations.",
      "Cycle patterns across a few months.",
    ],
    questionsToAskDoctor: [
      "How do you describe my findings in my record?",
      "Is there anything I should read that matches how you are thinking about my care?",
      "If I see conflicting information online, what sources do you recommend?",
    ],
    whenToSeekCare: [
      "If conflicting labels online increase anxiety, bring questions to your visit — you deserve clarity.",
      "If symptoms change suddenly, check in with a clinician rather than self-diagnosing from terminology alone.",
    ],
  },
  {
    id: "irregular-periods-support",
    title: "Irregular periods: gentle context",
    category: "Periods",
    description:
      "Why cycles vary, what “irregular” can mean in plain language, and how tracking can support a visit.",
    readTime: "5 min",
    paragraphs: [
      "A “regular” cycle is a range, not a single perfect number. Stress, travel, illness, sleep changes, medications, and life stages can all shift timing. Some bodies naturally have more variation than others.",
      "Irregular bleeding can mean many things — from normal variation to patterns that deserve evaluation. This page cannot sort that for you; it can help you prepare for a thoughtful conversation.",
      "Tracking start dates and bleeding intensity over several months often gives clearer information than one anxious moment of counting days. You are allowed to track imperfectly.",
      "If periods are absent for a long time, very frequent, very heavy, or paired with pain or other symptoms, a clinician can help you understand why and what options exist.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "First day of bleeding (approximate is okay).",
      "Number of heavy days vs light days, if you notice a pattern.",
      "Spotting between periods.",
      "Life changes that coincide with shifts (travel, stress, new meds).",
    ],
    questionsToAskDoctor: [
      "For my age and history, what cycle length range would you consider typical?",
      "What patterns would you want me to report sooner rather than later?",
      "What tests help you understand irregular bleeding, and what will they tell us?",
    ],
    whenToSeekCare: [
      "Soaking through pads or tampons very quickly, large clots, or dizziness.",
      "Bleeding after menopause or bleeding after sex — discuss with a clinician.",
      "Severe pain, fever, or foul discharge with bleeding.",
    ],
  },
  {
    id: "late-periods-when-to-notice",
    title: "Late periods: staying grounded",
    category: "Periods",
    description:
      "Common reasons a period might be late, how anxiety fits in, and when to involve a clinician.",
    readTime: "5 min",
    paragraphs: [
      "A late period is common. Ovulation timing can shift, which shifts bleeding. Stress, sleep disruption, illness, weight change, thyroid shifts, breastfeeding, perimenopause, and some medications can all play a role.",
      "If pregnancy is possible and you are unsure, a pregnancy test is a reasonable step — your clinician or pharmacist can guide timing. Zyra does not replace testing or medical advice.",
      "One late cycle is not automatically a crisis. Patterns over time — especially with other symptoms — are often more informative for clinicians.",
      "If you feel stuck in worry spirals, that is understandable. Pair tracking with grounding routines and reach out for support from trusted people or professionals when needed.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Date of last period start and any home test dates (for your records, not for self-diagnosis).",
      "Other symptoms: breast tenderness, nausea, headaches, pain.",
      "New medications or major life stressors.",
    ],
    questionsToAskDoctor: [
      "If my period is late again, when should I test or call?",
      "Could any of my medications or supplements affect timing?",
      "What symptoms would make you want to see me urgently?",
    ],
    whenToSeekCare: [
      "Positive pregnancy test with pain or bleeding — seek timely clinical guidance.",
      "No period for several months when that is not expected for you.",
      "Symptoms of severe anemia or dehydration.",
    ],
  },
  {
    id: "endometriosis-basics",
    title: "Endometriosis: a calm overview",
    category: "General Health",
    description:
      "What endometriosis is in simple terms, why symptoms vary, and how to advocate without self-diagnosing.",
    readTime: "6 min",
    paragraphs: [
      "Endometriosis is a condition where tissue similar to the lining of the uterus grows outside the uterus. It can cause painful periods, pain with sex, pelvic pain at other times, digestive symptoms, fatigue, and sometimes fertility challenges — but experiences vary widely.",
      "Severity of symptoms does not always match what imaging shows. Listening to your body still matters, and so does clinician evaluation when pain disrupts your life.",
      "Diagnosis may involve history, exam, imaging, and sometimes surgery, depending on your situation. Zyra cannot diagnose endometriosis; it can help you organize questions and patterns.",
      "Treatment paths are personal and may include medications, physical therapy, lifestyle supports, or surgery in some cases. Your clinician can explain tradeoffs in your context.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Pain location, timing with cycles, and severity in words (mild / moderate / severe).",
      "Bowel or bladder symptoms that line up with your cycle.",
      "What helps or hurts: heat, movement, rest, medications (as prescribed).",
    ],
    questionsToAskDoctor: [
      "What conditions are you considering given my symptoms?",
      "What are the next evaluation steps and what do they rule in or out?",
      "If I need time-sensitive relief, what options exist while we learn more?",
    ],
    whenToSeekCare: [
      "Pain that keeps you from school, work, or daily activities.",
      "New severe pain, fever, vomiting, or inability to pass stool or urine.",
      "Heavy bleeding with weakness or shortness of breath.",
    ],
  },
  {
    id: "thyroid-and-your-cycle",
    title: "Thyroid and cycle changes",
    category: "Hormones",
    description:
      "How an under- or overactive thyroid can show up in periods and energy — and why labs matter.",
    readTime: "5 min",
    paragraphs: [
      "Your thyroid helps set the pace for metabolism, temperature, mood, and more. When thyroid hormone levels are too low or too high, periods may become heavier, lighter, irregular, or absent for some people.",
      "Other symptoms can include fatigue, heart rate changes, weight shifts, hair changes, feeling cold or hot, or anxiety. These symptoms overlap with many common issues, so testing and context matter.",
      "Only a clinician should interpret thyroid labs and decide treatment. Apps can help you notice patterns to share, not replace lab work.",
      "If you already take thyroid medication, timing, dosing changes, pregnancy, or other medications can affect levels — another reason to keep regular follow-up as advised.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Cycle changes alongside energy, heart rate, or temperature sensitivity.",
      "Medication dose changes and dates.",
      "Pregnancy or postpartum timing if relevant.",
    ],
    questionsToAskDoctor: [
      "Should we check thyroid labs given my symptoms or cycle changes?",
      "How often should thyroid levels be monitored for me?",
      "Could any of my other medications affect thyroid results?",
    ],
    whenToSeekCare: [
      "Racing heartbeat, severe shortness of breath, or fainting.",
      "Swelling in the neck with trouble breathing or swallowing.",
      "Confusion or severe weakness.",
    ],
  },
  {
    id: "pms-vs-pmdd",
    title: "PMS vs PMDD: what is the difference?",
    category: "Hormones",
    description:
      "How premenstrual mood and body symptoms differ from a more severe pattern — and why support matters.",
    readTime: "6 min",
    paragraphs: [
      "Premenstrual syndrome (PMS) describes physical and emotional symptoms that often show up in the days before a period — bloating, breast tenderness, irritability, tiredness, and more. Many people notice a mild version at some point.",
      "Premenstrual dysphoric disorder (PMDD) is a more severe pattern linked to the cycle, often with intense mood symptoms that interfere with relationships, work, or school. It is a clinical diagnosis made by a qualified professional using specific criteria — not by a checklist online alone.",
      "Tracking symptoms across at least two cycles can help clinicians see timing. Treatments may include lifestyle supports, therapy, supplements or medications as prescribed, or hormonal approaches — individualized to you.",
      "If you feel hopeless before every period, you deserve evaluation and support. This is not “just PMS” if it dominates your life.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Daily mood notes for two full cycles (simple words are enough).",
      "Physical symptoms and when they start relative to bleeding.",
      "Sleep and stress during those weeks.",
    ],
    questionsToAskDoctor: [
      "Could my symptoms fit PMDD or another condition with similar timing?",
      "What treatments have evidence for people with my goals and health history?",
      "If I need urgent mental health support, what resources do you recommend?",
    ],
    whenToSeekCare: [
      "Thoughts of harming yourself — seek immediate help from crisis lines or emergency services.",
      "Severe panic, inability to function, or relationship breakdown tied to the cycle.",
    ],
  },
  {
    id: "fertility-basics-overview",
    title: "Fertility basics",
    category: "Fertility",
    description:
      "How ovulation fits into conception in plain language — without promises or pressure.",
    readTime: "5 min",
    paragraphs: [
      "Fertility is a broad word. For many people trying to conceive, the core idea is that sperm meets an egg around the time of ovulation. Cycles vary, so “fertile windows” are estimates, not guarantees.",
      "Age, health conditions, medications, anatomy, partner factors, and chance all matter. General education cannot predict your timeline or replace a fertility clinician when needed.",
      "Preconception care can include folic acid as advised, reviewing medications, managing chronic conditions, and discussing vaccines or infections — your clinician personalizes this.",
      "If trying to conceive feels heavy, you are not alone. Support from medical teams and mental health professionals can help.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Cycle length and approximate ovulation signs you notice (cervical mucus, test strips if you use them).",
      "How long you have been trying, if relevant to your goals.",
      "Partner health factors worth mentioning to a clinician.",
    ],
    questionsToAskDoctor: [
      "When would you recommend evaluation if we are trying to conceive?",
      "What preconception steps make sense for me?",
      "What should we avoid assuming from apps or online calculators?",
    ],
    whenToSeekCare: [
      "If you have been trying for a year (or six months if age 35+) — ask your clinician about next steps.",
      "Pain with sex, very irregular cycles, or known conditions that may affect fertility.",
    ],
  },
  {
    id: "birth-control-basics",
    title: "Birth control basics",
    category: "Sexual Health",
    description:
      "Categories of contraception in simple terms — decisions stay between you and your clinician.",
    readTime: "6 min",
    paragraphs: [
      "Birth control methods fall into broad groups: barriers (like condoms), hormonal options (pills, patches, rings, shots, implants, some IUDs), copper IUDs, fertility awareness–based methods, sterilization, and emergency contraception when applicable.",
      "Each method has benefits, side effects, and access considerations. What works for a friend may not be best for your body, values, or medical history.",
      "Condoms also reduce STI risk; many hormonal methods do not protect against STIs on their own.",
      "Choosing or changing birth control is a shared decision with a clinician who knows your blood pressure history, migraine history, smoking status, medications, and future pregnancy plans.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Side effects you notice in the first months of a new method.",
      "Bleeding patterns after starting or switching methods.",
      "Questions that come up between visits.",
    ],
    questionsToAskDoctor: [
      "Given my history, which methods are safest and most effective for me?",
      "What side effects are common in the first three months?",
      "How do I access emergency contraception if needed?",
    ],
    whenToSeekCare: [
      "Severe headache with vision changes on hormonal birth control — urgent evaluation.",
      "Leg pain, chest pain, or shortness of breath — seek urgent care guidance.",
      "Signs of pregnancy while on a method — contact a clinician.",
    ],
  },
  {
    id: "sexual-health-sti-screening",
    title: "Sexual health and STI screening",
    category: "Sexual Health",
    description:
      "Why screening exists, what “routine” can mean, and how to reduce shame while staying informed.",
    readTime: "6 min",
    paragraphs: [
      "Sexual health includes consent, pleasure, infection prevention, relationships, and reproductive goals. STI screening is one piece: testing for infections you may not feel yet, so you can treat or manage them early.",
      "Who needs which tests and how often depends on your anatomy, partners, condom use, pregnancy plans, and local guidelines. A clinician can recommend a schedule without judgment.",
      "Many STIs are treatable. Some require ongoing management. Knowing status helps protect you and partners.",
      "If you feel embarrassed asking questions, you are still allowed to ask. Clinicians trained in sexual health prefer honest conversations.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "New partners or changes in protection use (private notes for you).",
      "Symptoms: discharge, odor, sores, burning, pelvic pain — to report, not to self-diagnose.",
      "Vaccination history (HPV, hepatitis B) if you are unsure.",
    ],
    questionsToAskDoctor: [
      "Which STI tests do you recommend for me right now?",
      "How do I contact you if symptoms appear between visits?",
      "What prevention tools fit my life (condoms, PrEP, vaccines)?",
    ],
    whenToSeekCare: [
      "Pelvic pain with fever.",
      "Painful sores, severe genital swelling, or inability to urinate.",
      "Sexual assault — seek immediate medical and advocacy support as you choose.",
    ],
  },
  {
    id: "vaginal-health-basics",
    title: "Vaginal health basics",
    category: "Sexual Health",
    description:
      "Normal variation, hygiene myths, and when discharge or odor deserves a clinician’s look.",
    readTime: "5 min",
    paragraphs: [
      "The vagina is self-cleaning. Gentle external care with water or mild unscented soap on the vulva is usually enough for many people. Douching and harsh products can disrupt healthy balance and cause irritation.",
      "Discharge changes with the cycle, arousal, pregnancy, and hormones. A new color, odor, itch, burning, or pain after sex can be worth mentioning to a clinician — many causes are treatable and not a reflection of cleanliness.",
      "Yeast and bacterial imbalances are common and can overlap with other conditions. Self-treating repeatedly without evaluation can miss the real issue.",
      "If something feels “off,” you deserve a calm exam and clear explanations — not shame.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Discharge appearance relative to your usual (words, not pictures needed).",
      "Itch or pain timing with periods, sex, or new products.",
      "New soaps, detergents, pads, tampons, or lubricants.",
    ],
    questionsToAskDoctor: [
      "Could this be infection, irritation, or something else?",
      "What treatment options exist and how will we know they worked?",
      "What products or habits do you recommend I avoid?",
    ],
    whenToSeekCare: [
      "Fever with pelvic pain.",
      "Bleeding unrelated to your period that persists.",
      "Severe pain or swelling.",
    ],
  },
  {
    id: "perimenopause-basics",
    title: "Perimenopause basics",
    category: "Hormones",
    description:
      "The transition before menopause often includes changing cycles and symptoms — explained gently.",
    readTime: "6 min",
    paragraphs: [
      "Perimenopause is the phase leading up to menopause, when ovaries gradually produce less predictable hormones. Cycles may shorten, lengthen, or skip. Hot flashes, sleep changes, mood shifts, vaginal dryness, or brain fog can appear — not everyone has every symptom.",
      "Menopause is usually defined clinically after twelve months without a period (for people with typical uterine bleeding patterns). Timing varies widely.",
      "Some symptoms overlap with thyroid issues, anemia, depression, or other conditions, so clinicians may check labs or history before assuming hormones alone.",
      "Treatments range from lifestyle strategies to nonhormonal or hormonal therapies when appropriate. Shared decision-making should include your preferences and health risks.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Period timing and flow changes over several months.",
      "Hot flashes or night sweats frequency (simple tally).",
      "Sleep quality and mood patterns you want to discuss.",
    ],
    questionsToAskDoctor: [
      "Could my symptoms be perimenopause or something else?",
      "What are my options for bothersome hot flashes or sleep disruption?",
      "How do we think about bone health and heart health in this phase?",
    ],
    whenToSeekCare: [
      "Bleeding after a long stretch without periods — needs evaluation.",
      "Very heavy bleeding or signs of anemia.",
      "Chest pain, severe shortness of breath, or neurological symptoms — urgent care.",
    ],
  },
  {
    id: "when-to-see-gynecologist",
    title: "When to see a gynecologist",
    category: "Doctor Visit Prep",
    description:
      "Common reasons people book visits — from routine screening to symptoms — framed without fear.",
    readTime: "5 min",
    paragraphs: [
      "Gynecologists focus on reproductive and pelvic health across the lifespan: periods, contraception, infections, pain, screening for certain cancers, pregnancy-related care in their scope, and menopause support, among other topics.",
      "Routine visits depend on age, history, and guidelines where you live. They may include discussion of vaccines, screening tests, and goals — not only pelvic exams.",
      "You can book a visit for new symptoms, family planning questions, gender-affirming care needs within their specialty, or simply to establish care if you have never had a pelvic clinician.",
      "If you feel nervous, say so. Many clinicians can adjust pacing, explain each step, or offer chaperones according to policy.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Symptoms or questions you do not want to forget.",
      "Date of last period and last screening tests if you know them.",
      "List of medications and allergies.",
    ],
    questionsToAskDoctor: [
      "Which screenings or tests are recommended for me this year?",
      "What will today’s visit include and can I opt out of any part?",
      "How do I reach you if symptoms change after this visit?",
    ],
    whenToSeekCare: [
      "Urgent symptoms like severe pain, heavy bleeding, or fever — may need urgent or emergency care rather than a routine slot.",
    ],
  },
  {
    id: "questions-for-your-doctor",
    title: "Questions to ask your doctor",
    category: "Doctor Visit Prep",
    description:
      "A flexible list you can borrow, shorten, or mix — to make visits feel less one-sided.",
    readTime: "4 min",
    paragraphs: [
      "Good questions invite collaboration. You can ask what a diagnosis means in plain words, what alternatives exist, what side effects to expect, what to do if symptoms worsen, and how soon to follow up.",
      "If something feels rushed, it is okay to say, “Can we slow down on this part?” or “Can you write that down?” Many clinicians appreciate specifics.",
      "Bring one top priority if time is short: “Today I most need help with ___.”",
      "If you do not understand an answer, ask again. Understanding your body is not rude.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Three priorities ranked before the visit.",
      "Terms you heard but did not understand.",
      "Medication names that confused you.",
    ],
    questionsToAskDoctor: [
      "What is the most likely explanation for my symptoms, and what else are we ruling out?",
      "What are the benefits and risks of each option?",
      "What would you do if you were in my shoes, knowing what you know about me?",
      "Who do I contact after hours if this gets worse?",
    ],
    whenToSeekCare: [
      "If you leave a visit still unclear about red-flag symptoms, ask before you go: “When should I call urgently?”",
    ],
  },
  {
    id: "preparing-for-womens-health-visit",
    title: "How to prepare for a women’s health appointment",
    category: "Doctor Visit Prep",
    description:
      "Practical steps from paperwork to clothing — to reduce friction on the day.",
    readTime: "5 min",
    paragraphs: [
      "Confirm time, location, and whether the visit is in person or virtual. For in-person visits, ask if you need a full bladder for ultrasound or the opposite — instructions vary.",
      "Bring insurance information, a photo ID, a list of medications and doses, and any prior records if you are seeing someone new.",
      "Wear comfortable clothes. You usually do not need special grooming; clinicians have seen all bodies.",
      "Write three questions on paper or your phone. If anxiety spikes, you can read them verbatim.",
      "After the visit, jot down what you agreed to do — tests, prescriptions, follow-up dates — while it is fresh.",
    ],
    disclaimer: baseDisclaimer,
    whatToTrack: [
      "Symptoms with dates since your last visit.",
      "Names of pharmacies or specialists you prefer.",
      "Insurance barriers you ran into (for your advocate or clinic social worker).",
    ],
    questionsToAskDoctor: [
      "Do I need any tests before our next visit?",
      "How will I receive results?",
      "Is there a patient portal or nurse line for follow-up questions?",
    ],
    whenToSeekCare: [
      "If appointment wait times feel unsafe for your symptoms, ask about urgent options or nurse triage lines.",
    ],
  },
];
