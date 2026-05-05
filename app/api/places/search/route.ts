import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { haversineMiles } from "@/lib/specialists/haversine";
import { buildGoogleMapsUrl } from "@/lib/specialists/maps-url";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const runtime = "nodejs";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const MAX_QUERY_LEN = 120;
const MAX_LOCATION_LEN = 200;
/** Google Text Search returns up to 20 per page. */
const MAX_PAGE_RESULTS = 20;
const PAGETOKEN_DELAY_MS = 2500;

type PlaceSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  geometry?: { location?: { lat?: number; lng?: number } };
};

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

async function createSupabaseForRequest(request: Request) {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) return { error: Response.json({ error: "App is not fully configured." }, { status: 503 }) };

  const bearer = getBearerToken(request);
  if (bearer) {
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(bearer);
    if (error || !data.user) {
      return { error: Response.json({ error: "Sign in to search for specialists." }, { status: 401 }) };
    }
    return { supabase, user: data.user };
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
  } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Sign in to search for specialists." }, { status: 401 }) };
  return { supabase, user };
}

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString(), { method: "GET", next: { revalidate: 0 } });
  const json = (await res.json()) as {
    status?: string;
    results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
  };
  if (json.status !== "OK" || !json.results?.length) return null;
  const loc = json.results[0]?.geometry?.location;
  if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "POST, OPTIONS" },
  });
}

export async function POST(request: Request) {
  try {
    const resolved = await createSupabaseForRequest(request);
    if ("error" in resolved) return resolved.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const pageToken = String((body as { pageToken?: unknown })?.pageToken ?? "").trim();
    const query = String((body as { query?: unknown })?.query ?? "").trim();
    const location = String((body as { location?: unknown })?.location ?? "").trim();

    if (pageToken) {
      if (!location) {
        return Response.json({ error: "Location is required when loading more results." }, { status: 400 });
      }
    } else {
      if (!query) {
        return Response.json({ error: "Search query is required." }, { status: 400 });
      }
      if (!location) {
        return Response.json({ error: "Location is required." }, { status: 400 });
      }
    }

    if (!pageToken && (query.length > MAX_QUERY_LEN || location.length > MAX_LOCATION_LEN)) {
      return Response.json({ error: "Search query or location is too long." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!apiKey) {
      console.error("[api/places/search] GOOGLE_PLACES_API_KEY is missing");
      return Response.json({ error: "Google Places search is not configured." }, { status: 503 });
    }

    const searchUrl = new URL(TEXT_SEARCH_URL);
    searchUrl.searchParams.set("key", apiKey);

    if (pageToken) {
      await delay(PAGETOKEN_DELAY_MS);
      searchUrl.searchParams.set("pagetoken", pageToken);
    } else {
      const textQuery = `${query} near ${location}`;
      searchUrl.searchParams.set("query", textQuery);
    }

    const searchRes = await fetch(searchUrl.toString(), { method: "GET", next: { revalidate: 0 } });
    const searchJson = (await searchRes.json()) as {
      status?: string;
      error_message?: string;
      results?: PlaceSearchResult[];
      next_page_token?: string;
    };

    if (searchJson.status === "REQUEST_DENIED" || searchJson.status === "INVALID_REQUEST") {
      console.error("[api/places/search] Places error:", searchJson.status, searchJson.error_message);
      return Response.json({ error: "Unable to load nearby specialists right now." }, { status: 502 });
    }

    if (searchJson.status !== "OK" && searchJson.status !== "ZERO_RESULTS") {
      console.error("[api/places/search] Places unexpected status:", searchJson.status);
      return Response.json({ error: "Unable to load nearby specialists right now." }, { status: 502 });
    }

    const origin = await geocodeAddress(location, apiKey);

    const raw = searchJson.results ?? [];
    const cleaned = raw.slice(0, MAX_PAGE_RESULTS).map((r) => {
      const name = (r.name ?? "Unknown place").trim() || "Unknown place";
      const address = (r.formatted_address ?? "").trim() || "Address not available";
      const placeId = (r.place_id ?? "").trim();
      const rating = typeof r.rating === "number" && !Number.isNaN(r.rating) ? r.rating : null;
      const reviewCount =
        typeof r.user_ratings_total === "number" && r.user_ratings_total >= 0
          ? r.user_ratings_total
          : null;
      const openNow = typeof r.opening_hours?.open_now === "boolean" ? r.opening_hours.open_now : null;
      const lat = typeof r.geometry?.location?.lat === "number" ? r.geometry.location.lat : null;
      const lng = typeof r.geometry?.location?.lng === "number" ? r.geometry.location.lng : null;
      let distanceMiles: number | null = null;
      if (origin && lat != null && lng != null) {
        distanceMiles = haversineMiles(origin, { lat, lng });
      }
      return {
        placeId,
        name,
        address,
        rating,
        reviewCount,
        openNow,
        lat,
        lng,
        distanceMiles,
        mapsUrl: buildGoogleMapsUrl(placeId, name, address),
      };
    });

    const nextPageToken =
      typeof searchJson.next_page_token === "string" && searchJson.next_page_token.trim()
        ? searchJson.next_page_token.trim()
        : null;

    return Response.json({
      results: cleaned,
      nextPageToken,
      origin,
    });
  } catch (error) {
    console.error("[api/places/search] error:", error);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}
