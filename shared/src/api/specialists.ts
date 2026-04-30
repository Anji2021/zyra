import type {
  ApiClientOptions,
  SearchNearbySpecialistsInput,
  SearchNearbySpecialistsResponse,
} from "../types";
import { requestJson } from "./_client";

export async function searchNearbySpecialists(
  input: SearchNearbySpecialistsInput,
  options?: ApiClientOptions,
): Promise<SearchNearbySpecialistsResponse> {
  return requestJson<SearchNearbySpecialistsResponse>(
    "/api/specialists",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    options,
  );
}
