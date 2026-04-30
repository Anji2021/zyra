import type { ApiClientErrorCode, ApiClientOptions, ApiErrorResponse } from "../types";

export class ApiClientError extends Error {
  status: number;
  code: ApiClientErrorCode;
  details?: unknown;
  url?: string;

  constructor(
    message: string,
    status: number,
    code: ApiClientErrorCode,
    details?: unknown,
    url?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

function inferErrorCode(status: number): ApiClientErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

export function resolveApiBaseUrl(options?: ApiClientOptions): string {
  if (options?.baseUrl) return normalizeBaseUrl(options.baseUrl);

  const fromExpo =
    typeof process !== "undefined"
      ? (process.env.EXPO_PUBLIC_API_BASE_URL ?? "")
      : "";

  return normalizeBaseUrl(fromExpo);
}

export async function requestJson<TResponse>(
  path: string,
  init: RequestInit,
  options?: ApiClientOptions,
): Promise<TResponse> {
  const fetcher = options?.fetcher ?? fetch;
  const base = resolveApiBaseUrl(options);
  const url = `${base}${path}`;

  try {
    const response = await fetcher(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
        ...(init.headers ?? {}),
      },
    });

    const rawText = await response.text().catch(() => "");
    let maybeJson: ApiErrorResponse | TResponse | null = null;
    if (rawText) {
      try {
        maybeJson = JSON.parse(rawText) as ApiErrorResponse | TResponse;
      } catch {
        maybeJson = null;
      }
    }

    if (!response.ok) {
      const isHtml = rawText.trimStart().startsWith("<!doctype html") || rawText.trimStart().startsWith("<html");
      let message =
        (maybeJson && typeof maybeJson === "object" && "error" in maybeJson && maybeJson.error) ||
        `Request failed (${response.status})`;
      if (response.status === 404) {
        message = "API route not found.";
      } else if (isHtml) {
        message = `Unexpected non-JSON response from API (${response.status}).`;
      }
      console.error("[shared api] request failed", {
        url,
        status: response.status,
        responseText: rawText.slice(0, 500),
      });
      throw new ApiClientError(
        String(message),
        response.status,
        inferErrorCode(response.status),
        maybeJson ?? rawText,
        url,
      );
    }

    if (!maybeJson) {
      console.error("[shared api] invalid json response", {
        url,
        status: response.status,
        responseText: rawText.slice(0, 500),
      });
      throw new ApiClientError("Invalid JSON response from API.", response.status, "UNKNOWN", rawText, url);
    }

    return maybeJson as TResponse;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    console.error("[shared api] network error", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ApiClientError(
      "Network error while contacting Zyra API.",
      0,
      "NETWORK_ERROR",
      error,
      url,
    );
  }
}
