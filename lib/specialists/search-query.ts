/** Maps dropdown value to the phrase used in Places text search (before " near …"). */
export const SPECIALIST_TYPE_TO_QUERY = {
  gynecologist: "gynecologist",
  ob_gyn: "ob-gyn",
  endocrinologist: "endocrinologist",
  reproductive_endocrinologist: "reproductive endocrinologist",
  gastroenterologist: "gastroenterologist",
  primary_care_physician: "primary care physician",
  dermatologist: "dermatologist",
  urologist: "urologist",
  therapist: "therapist",
  psychiatrist: "psychiatrist",
  nutritionist: "nutritionist",
  urgent_care: "urgent care",
} as const;

export type SpecialistTypeValue = keyof typeof SPECIALIST_TYPE_TO_QUERY;

export const SPECIALIST_OPTIONS: { value: SpecialistTypeValue; label: string }[] = [
  { value: "gynecologist", label: "Gynecologist" },
  { value: "ob_gyn", label: "OB-GYN" },
  { value: "endocrinologist", label: "Endocrinologist" },
  { value: "reproductive_endocrinologist", label: "Reproductive Endocrinologist" },
  { value: "gastroenterologist", label: "Gastroenterologist" },
  { value: "primary_care_physician", label: "Primary Care Physician" },
  { value: "dermatologist", label: "Dermatologist" },
  { value: "urologist", label: "Urologist" },
  { value: "therapist", label: "Therapist" },
  { value: "psychiatrist", label: "Psychiatrist" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "urgent_care", label: "Urgent Care" },
];

export function getSpecialistLabel(value: SpecialistTypeValue): string {
  return SPECIALIST_OPTIONS.find((option) => option.value === value)?.label ?? "Primary Care Physician";
}

export function isValidSpecialistType(value: string): value is SpecialistTypeValue {
  return Object.prototype.hasOwnProperty.call(SPECIALIST_TYPE_TO_QUERY, value);
}
