/** Maps dropdown value to the phrase used in Places text search (before " near …"). */
export const SPECIALIST_TYPE_TO_QUERY = {
  gynecologist: "gynecologist",
  pcos: "PCOS specialist",
  womens_health: "women's health clinic",
  fertility: "fertility specialist",
  endocrinologist: "endocrinologist",
} as const;

export type SpecialistTypeValue = keyof typeof SPECIALIST_TYPE_TO_QUERY;

export const SPECIALIST_OPTIONS: { value: SpecialistTypeValue; label: string }[] = [
  { value: "gynecologist", label: "Gynecologist" },
  { value: "pcos", label: "PCOS specialist" },
  { value: "womens_health", label: "Women’s health clinic" },
  { value: "fertility", label: "Fertility specialist" },
  { value: "endocrinologist", label: "Endocrinologist" },
];

export function isValidSpecialistType(value: string): value is SpecialistTypeValue {
  return Object.prototype.hasOwnProperty.call(SPECIALIST_TYPE_TO_QUERY, value);
}
