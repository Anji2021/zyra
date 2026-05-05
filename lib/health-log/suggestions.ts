/** Symptom chips + searchable pool (client-only UX helpers). */
export const SYMPTOM_CHIP_LABELS = [
  "Irregular periods",
  "Cramps",
  "Fatigue",
  "Hormonal acne",
] as const;

export const SYMPTOM_SEARCH_POOL: readonly string[] = [
  ...SYMPTOM_CHIP_LABELS,
  "Bloating",
  "Headache",
  "Mood swings",
  "Nausea",
  "Heavy bleeding",
  "Spotting",
  "Hot flashes",
  "Insomnia",
  "Breast tenderness",
  "Pelvic pain",
  "Hair loss",
  "Anxiety",
  "Brain fog",
];

export function filterSymptomSuggestions(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...SYMPTOM_SEARCH_POOL].slice(0, limit);
  }
  const scored = SYMPTOM_SEARCH_POOL.map((label) => {
    const low = label.toLowerCase();
    const idx = low.indexOf(q);
    const score = idx === 0 ? 0 : idx === -1 ? 100 : idx + 10;
    return { label, score: idx === -1 ? 999 : score };
  });
  return scored
    .filter((x) => x.score < 999)
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((x) => x.label);
}

export const COMMON_MEDICINE_LABELS = [
  "Ibuprofen",
  "Acetaminophen",
  "Combined oral contraceptive",
  "Metformin",
  "Spironolactone",
  "Levonorgestrel IUD",
  "Prenatal vitamin",
  "Iron supplement",
  "Magnesium",
  "Vitamin D",
] as const;

export const COMMON_MEDICINE_SEARCH_POOL: readonly string[] = [...COMMON_MEDICINE_LABELS, "Naproxen", "Antihistamine"];

export function filterMedicineSuggestions(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...COMMON_MEDICINE_SEARCH_POOL].slice(0, limit);
  }
  return COMMON_MEDICINE_SEARCH_POOL.filter((name) => name.toLowerCase().includes(q)).slice(0, limit);
}
