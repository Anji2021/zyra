import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  ENRICHMENT_FAILED_MESSAGE,
  NO_WEBSITE_MESSAGE,
} from "@/lib/specialists/enrichment-types";
import { fetchGooglePlaceDetails } from "@/lib/specialists/google-place-details";
import { runTinyfishClinicEnrichment } from "@/lib/specialists/tinyfish-enrich";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

async function createSupabaseServerClient() {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
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
}

function normalizeWebsite(raw: string | undefined | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ error: "App is not fully configured." }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) console.error("[api/specialists/enrich] auth", authError.message);
    if (!user) {
      return Response.json({ error: "Sign in to analyze clinic websites." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json(
        { error: "Expected JSON with name, address, and optional website, place_id." },
        { status: 400 },
      );
    }

    const b = body as {
      name?: unknown;
      address?: unknown;
      website?: unknown;
      place_id?: unknown;
    };

    const name = String(b.name ?? "").trim();
    const address = String(b.address ?? "").trim();
    if (!name) {
      return Response.json({ error: "name is required." }, { status: 400 });
    }

    let website = normalizeWebsite(b.website != null ? String(b.website) : null);
    const placeId = String(b.place_id ?? "").trim();

    if (!website && placeId) {
      const googleKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
      if (googleKey) {
        const details = await fetchGooglePlaceDetails(placeId, googleKey);
        if (details?.website) website = normalizeWebsite(details.website);
      }
    }

    if (!website) {
      return Response.json({
        ok: true,
        noWebsite: true,
        message: NO_WEBSITE_MESSAGE,
      });
    }

    const tinyfish = await runTinyfishClinicEnrichment(website);
    if (!tinyfish.ok) {
      console.error("[api/specialists/enrich] Tinyfish error:", tinyfish.logDetail ?? tinyfish.error);
      return Response.json({ error: ENRICHMENT_FAILED_MESSAGE }, { status: 502 });
    }

    return Response.json({
      ok: true,
      noWebsite: false,
      enrichment: tinyfish.enrichment,
    });
  } catch (e) {
    console.error("[api/specialists/enrich]", e);
    return Response.json({ error: ENRICHMENT_FAILED_MESSAGE }, { status: 500 });
  }
}
