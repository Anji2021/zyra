import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { buildGoogleMapsUrl } from "@/lib/specialists/maps-url";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const runtime = "nodejs";

const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const MAX_QUERY_LEN = 120;
const MAX_LOCATION_LEN = 200;
const MAX_RESULTS = 8;

type PlaceSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
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

    const query = String((body as { query?: unknown })?.query ?? "").trim();
    const location = String((body as { location?: unknown })?.location ?? "").trim();
    if (!query) {
      return Response.json({ error: "Search query is required." }, { status: 400 });
    }
    if (!location) {
      return Response.json({ error: "Location is required." }, { status: 400 });
    }
    if (query.length > MAX_QUERY_LEN || location.length > MAX_LOCATION_LEN) {
      return Response.json({ error: "Search query or location is too long." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
    if (!apiKey) {
      console.error("[api/places/search] GOOGLE_PLACES_API_KEY is missing");
      return Response.json({ error: "Google Places search is not configured." }, { status: 503 });
    }

    const textQuery = `${query} near ${location}`;
    const searchUrl = new URL(TEXT_SEARCH_URL);
    searchUrl.searchParams.set("query", textQuery);
    searchUrl.searchParams.set("key", apiKey);

    const searchRes = await fetch(searchUrl.toString(), { method: "GET", next: { revalidate: 0 } });
    const searchJson = (await searchRes.json()) as {
      status?: string;
      error_message?: string;
      results?: PlaceSearchResult[];
    };

    if (searchJson.status === "REQUEST_DENIED" || searchJson.status === "INVALID_REQUEST") {
      console.error("[api/places/search] Places error:", searchJson.status, searchJson.error_message);
      return Response.json({ error: "Unable to load nearby specialists right now." }, { status: 502 });
    }

    if (searchJson.status !== "OK" && searchJson.status !== "ZERO_RESULTS") {
      console.error("[api/places/search] Places unexpected status:", searchJson.status);
      return Response.json({ error: "Unable to load nearby specialists right now." }, { status: 502 });
    }

    const cleaned = (searchJson.results ?? []).slice(0, MAX_RESULTS).map((r) => {
      const name = (r.name ?? "Unknown place").trim() || "Unknown place";
      const address = (r.formatted_address ?? "").trim() || "Address not available";
      const placeId = (r.place_id ?? "").trim();
      const rating = typeof r.rating === "number" && !Number.isNaN(r.rating) ? r.rating : null;
      const reviewCount =
        typeof r.user_ratings_total === "number" && r.user_ratings_total >= 0
          ? r.user_ratings_total
          : null;
      const openNow = typeof r.opening_hours?.open_now === "boolean" ? r.opening_hours.open_now : null;
      return {
        placeId,
        name,
        address,
        rating,
        reviewCount,
        openNow,
        mapsUrl: buildGoogleMapsUrl(placeId, name, address),
      };
    });

    return Response.json({ results: cleaned });
  } catch (error) {
    console.error("[api/places/search] error:", error);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}
