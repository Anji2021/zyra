/** Shared DoctorMatch response shape (specialist type remains app-specific union per platform). */
export type SharedDoctorMatchRecommendation<TSpecialistType extends string = string> = {
  pattern: string;
  specialist: string;
  reason: string;
  carePath: string[];
  questionsToAsk: string[];
  urgentCareWarning: string;
  searchTerm: string;
  specialistType: TSpecialistType;
};

export type DoctorMatchApiShape = {
  pattern?: unknown;
  specialist?: unknown;
  reason?: unknown;
  carePath?: unknown;
  questionsToAsk?: unknown;
  urgentCareWarning?: unknown;
  searchTerm?: unknown;
};
