import type {
  ApiClientOptions,
  GetHealthProfileResponse,
  SaveHealthProfileInput,
  SaveHealthProfileResponse,
} from "../types";
import { requestJson } from "./_client";

export async function getHealthProfile(options?: ApiClientOptions): Promise<GetHealthProfileResponse> {
  return requestJson<GetHealthProfileResponse>(
    "/api/profile",
    {
      method: "GET",
    },
    options,
  );
}

export async function saveHealthProfile(
  input: SaveHealthProfileInput,
  options?: ApiClientOptions,
): Promise<SaveHealthProfileResponse> {
  return requestJson<SaveHealthProfileResponse>(
    "/api/profile",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    options,
  );
}
