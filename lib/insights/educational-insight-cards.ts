import type { CycleInsights, MedicineInsights, SymptomInsights } from "@/lib/insights/build-summary";

export type EducationalInsightCard = {
  title: string;
  body: string;
};

/**
 * Short educational framing only — no diagnosis. Derived from existing insight objects.
 */
export function buildEducationalInsightCards(
  cycle: CycleInsights,
  symptom: SymptomInsights,
  _medicine: MedicineInsights,
): EducationalInsightCard[] {
  let cycleCard: EducationalInsightCard;
  if (cycle.hasCycles) {
    if (cycle.irregularityNote) {
      cycleCard = {
        title: "Cycle timing can shift",
        body: "Spacing between logged period starts may vary — worth tracking if you want to discuss trends with a clinician; not a label of your health.",
      };
    } else if (cycle.cycleCount >= 2 && cycle.averageCycleLengthDays != null) {
      cycleCard = {
        title: "Cycle length appears fairly consistent",
        body: "From your logged dates so far, intervals may be relatively steady — more months of data still refines this view.",
      };
    } else {
      cycleCard = {
        title: "A few more logs sharpen averages",
        body: "Additional period dates make patterns easier to notice — educational context, not a clinical read.",
      };
    }
  } else {
    cycleCard = {
      title: "Period dates add helpful context",
      body: "Logging starts when you can makes summaries clearer over time — for awareness and care prep, not diagnosis.",
    };
  }

  const symptomCard: EducationalInsightCard =
    symptom.hasSymptoms && symptom.totalCount >= 3
      ? {
          title: "Tracking symptoms regularly helps detect trends",
          body: "Themes often emerge after several entries — pattern-spotting from your own words, not a conclusion about health status.",
        }
      : {
          title: "Light logging still builds a clearer picture",
          body: "Brief entries on busy days can help before visits — no need for a perfect journal.",
        };

  const contextCard: EducationalInsightCard = {
    title: "Lifestyle and stress can affect how patterns feel",
    body: "Sleep, movement, and stress interact with cycles for many people — general education, may be helpful to discuss if it fits your situation.",
  };

  return [cycleCard, symptomCard, contextCard];
}
