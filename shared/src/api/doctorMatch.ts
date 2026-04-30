import type {
  ApiClientOptions,
  GenerateDoctorMatchInput,
  GenerateDoctorMatchResponse,
  SpecialistTypeValue,
} from "../types";
import { requestJson } from "./_client";

export async function generateDoctorMatch(
  input: GenerateDoctorMatchInput,
  options?: ApiClientOptions,
): Promise<GenerateDoctorMatchResponse> {
  return requestJson<GenerateDoctorMatchResponse>(
    "/api/doctor-match",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    options,
  );
}

export function inferSpecialistTypeFromDoctorMatch(
  recommendation: GenerateDoctorMatchResponse["recommendation"],
): SpecialistTypeValue {
  if (recommendation.specialistType) return recommendation.specialistType;
  const searchTerm = (recommendation.searchTerm ?? "").trim().toLowerCase();
  if (searchTerm.includes("primary care physician or gastroenterologist")) return "gastroenterologist";
  if (searchTerm.includes("ob-gyn or reproductive endocrinologist")) return "ob_gyn";
  if (searchTerm.includes("endocrinologist or ob-gyn")) return "endocrinologist";
  if (searchTerm.includes("gastroenterologist")) return "gastroenterologist";
  if (searchTerm.includes("reproductive endocrinologist")) return "reproductive_endocrinologist";
  if (searchTerm.includes("primary care physician")) return "primary_care_physician";
  if (searchTerm.includes("ob-gyn") || searchTerm.includes("obgyn")) return "ob_gyn";
  if (searchTerm.includes("endocrin")) return "endocrinologist";
  if (searchTerm.includes("gynec")) return "gynecologist";
  if (searchTerm.includes("urolog")) return "urologist";
  if (searchTerm.includes("dermat")) return "dermatologist";
  if (searchTerm.includes("therap")) return "therapist";
  if (searchTerm.includes("psychiat")) return "psychiatrist";
  if (searchTerm.includes("nutrition")) return "nutritionist";
  if (searchTerm.includes("urgent care")) return "urgent_care";
  return "primary_care_physician";
}
