import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buildGoogleMapsUrl } from "@/lib/specialists/maps-url";
import { fetchGooglePlaceDetails } from "@/lib/specialists/google-place-details";
import {
  isValidSpecialistType,
  SPECIALIST_TYPE_TO_QUERY,
} from "@/lib/specialists/search-query";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const runtime = "nodejs";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const MAX_LOCATION_LEN = 200;
const MAX_RESULTS = 10;

type TextSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  formatted_phone_number?: string;
};

type CleanSpecialist = {
  placeId: string;
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  /** Same as Google `user_ratings_total` (review count). */
  reviewCount: number | null;
  userRatingsTotal: number | null;
  openNow: boolean | null;
  mapsUrl: string;
  phone: string | null;
  website: string | null;
};

export async function POST(request: Request) {
  console.log("Google Places key exists:", !!process.env.GOOGLE_PLACES_API_KEY);

  try {
    const { url, anonKey, isConfigured } = getSupabasePublicEnv();
    if (!isConfigured) {
      return Response.json({ error: "App is not fully configured." }, { status: 503 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* session refresh from Route Handler */
          }
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[api/specialists] auth", authError.message);
    }
    if (!user) {
      return Response.json({ error: "Sign in to search for specialists." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Expected JSON object with location and specialistType." }, { status: 400 });
    }

    const rawLocation = "location" in body ? String((body as { location: unknown }).location ?? "").trim() : "";
    const specialistType =
      "specialistType" in body ? String((body as { specialistType: unknown }).specialistType ?? "").trim() : "";

    if (!rawLocation) {
      return Response.json({ error: "Location is required (city, state, or ZIP)." }, { status: 400 });
    }
    if (rawLocation.length > MAX_LOCATION_LEN) {
      return Response.json({ error: "Location is too long." }, { status: 400 });
    }
    if (!isValidSpecialistType(specialistType)) {
      return Response.json({ error: "Invalid specialist type." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!apiKey) {
      console.error("[api/specialists] GOOGLE_PLACES_API_KEY is missing");
      return Response.json(
        {
          error:
            "Specialist search is not configured yet. Add GOOGLE_PLACES_API_KEY on the server.",
        },
        { status: 503 },
      );
    }

    const typePhrase = SPECIALIST_TYPE_TO_QUERY[specialistType];
    const textQuery = `${typePhrase} near ${rawLocation}`;

    const searchUrl = new URL(TEXT_SEARCH_URL);
    searchUrl.searchParams.set("query", textQuery);
    searchUrl.searchParams.set("key", apiKey);

    const searchRes = await fetch(searchUrl.toString(), { method: "GET", next: { revalidate: 0 } });
    const searchJson = (await searchRes.json()) as {
      status?: string;
      error_message?: string;
      results?: TextSearchResult[];
    };

    if (searchJson.status === "REQUEST_DENIED" || searchJson.status === "INVALID_REQUEST") {
      console.error("[api/specialists] Places text search:", searchJson.status, searchJson.error_message);
      return Response.json(
        { error: searchJson.error_message ?? "Google Places request was denied. Check API key and enabled APIs." },
        { status: 502 },
      );
    }

    if (searchJson.status !== "OK" && searchJson.status !== "ZERO_RESULTS") {
      console.error("[api/specialists] Places text search unexpected status:", searchJson.status, searchJson);
      return Response.json(
        { error: "Could not load results from Google Places. Please try again." },
        { status: 502 },
      );
    }

    const rawResults = searchJson.results ?? [];
    const sliced = rawResults.slice(0, MAX_RESULTS);

    const cleaned: CleanSpecialist[] = await Promise.all(
      sliced.map(async (r) => {
        const placeId = r.place_id ?? "";
        const nameFromSearch = (r.name ?? "Unknown place").trim() || "Unknown place";
        const addressFromSearch = (r.formatted_address ?? "").trim() || "Address not available";

        let phone: string | null =
          typeof r.formatted_phone_number === "string" && r.formatted_phone_number.trim()
            ? r.formatted_phone_number.trim()
            : null;
        let website: string | null = null;
        let name = nameFromSearch;
        let address = addressFromSearch;
        let rating = typeof r.rating === "number" && !Number.isNaN(r.rating) ? r.rating : null;
        let reviewCount: number | null =
          typeof r.user_ratings_total === "number" && r.user_ratings_total >= 0
            ? r.user_ratings_total
            : null;

        if (placeId) {
          const details = await fetchGooglePlaceDetails(placeId, apiKey);
          if (details) {
            if (details.formatted_phone_number) phone = details.formatted_phone_number;
            if (details.website) website = details.website;
            if (details.name) name = details.name;
            if (details.formatted_address) address = details.formatted_address;
            if (details.rating != null) rating = details.rating;
            if (details.user_ratings_total != null) reviewCount = details.user_ratings_total;
          }
        }

        const openNow =
          typeof r.opening_hours?.open_now === "boolean" ? r.opening_hours.open_now : null;

        return {
          placeId,
          place_id: placeId,
          name,
          address,
          rating,
          reviewCount,
          userRatingsTotal: reviewCount,
          openNow,
          mapsUrl: buildGoogleMapsUrl(placeId, name, address),
          phone,
          website,
        };
      }),
    );

    return Response.json({ results: cleaned });
  } catch (error) {
    console.error("SPECIALISTS ERROR:", error);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}
