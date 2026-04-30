export type ApiClientErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type ApiErrorResponse = {
  error?: string;
};

export type GenerateDoctorMatchInput = {
  symptoms: string;
};

export type SpecialistTypeValue =
  | "gynecologist"
  | "ob_gyn"
  | "endocrinologist"
  | "reproductive_endocrinologist"
  | "gastroenterologist"
  | "primary_care_physician"
  | "dermatologist"
  | "urologist"
  | "therapist"
  | "psychiatrist"
  | "nutritionist"
  | "urgent_care";

export type DoctorMatchRecommendation = {
  pattern: string;
  specialist: string;
  reason: string;
  carePath: string[];
  questionsToAsk: string[];
  urgentCareWarning: string;
  searchTerm: string;
  specialistType?: SpecialistTypeValue;
};

export type GenerateDoctorMatchResponse = {
  recommendation: DoctorMatchRecommendation;
};

export type SearchNearbySpecialistsInput = {
  location: string;
  specialistType: SpecialistTypeValue;
};

export type NearbySpecialist = {
  placeId: string;
  place_id?: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  userRatingsTotal?: number | null;
  openNow: boolean | null;
  mapsUrl: string;
  phone?: string | null;
  website?: string | null;
};

export type SearchNearbySpecialistsResponse = {
  results: NearbySpecialist[];
};

export type HealthProfile = {
  user_id: string;
  known_conditions: string[];
  current_concerns: string[];
  cycle_regularity: "regular" | "irregular" | "unsure";
  average_cycle_length: number | null;
  last_period_date: string | null;
  goals: string[];
  baseline_symptoms: string[];
  preferred_search_radius: number;
  created_at?: string;
  updated_at?: string;
};

export type GetHealthProfileResponse = {
  profile: HealthProfile | null;
};

export type SaveHealthProfileInput = Omit<HealthProfile, "user_id" | "created_at" | "updated_at">;

export type SaveHealthProfileResponse = {
  profile: HealthProfile;
};

export type ApiClientOptions = {
  /** Optional explicit API base URL; on mobile fallback is EXPO_PUBLIC_API_BASE_URL. */
  baseUrl?: string;
  fetcher?: typeof fetch;
  headers?: Record<string, string>;
  /** Optional async auth headers resolver, used before each request. */
  getAuthHeaders?: () => Promise<Record<string, string> | null>;
};

export type { CycleRow, MedicineRow, SymptomRow } from "./records";
