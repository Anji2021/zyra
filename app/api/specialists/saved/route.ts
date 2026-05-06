import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchSavedSpecialistsForUser, isSavedSpecialistsSchemaMismatchError } from "@/lib/specialists/saved-queries";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

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

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ error: "App is not fully configured." }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) console.error("[api/specialists/saved] auth", authError.message);
    if (!user) {
      return Response.json({ error: "Sign in to view saved specialists." }, { status: 401 });
    }

    const rows = await fetchSavedSpecialistsForUser(supabase, user.id);
    const items = rows.map(({ user_id: _omit, ...rest }) => rest);

    return Response.json({ items });
  } catch (e) {
    console.error("[api/specialists/saved] GET", e);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}

function parseRating(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function parseOptionalInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number.parseInt(value, 10);
    if (!Number.isNaN(n)) return n;
  }
  return null;
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

    if (authError) console.error("[api/specialists/saved] auth", authError.message);
    if (!user) {
      return Response.json({ error: "Sign in to save specialists." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid body." }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const placeId = String(b.place_id ?? "").trim();
    if (!placeId) {
      return Response.json({ error: "place_id is required to save a specialist." }, { status: 400 });
    }

    const { data: existing, error: findError } = await supabase
      .from("saved_specialists")
      .select("id")
      .eq("user_id", user.id)
      .eq("place_id", placeId)
      .maybeSingle();

    if (findError) {
      console.error("[api/specialists/saved] find", findError.message);
      return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
    }

    if (existing?.id) {
      const { error: delError } = await supabase.from("saved_specialists").delete().eq("id", existing.id);
      if (delError) {
        console.error("[api/specialists/saved] delete", delError.message);
        return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
      }
      return Response.json({ saved: false, place_id: placeId });
    }

    const name = String(b.name ?? "").trim() || null;
    const address = String(b.address ?? "").trim() || null;
    const rating = parseRating(b.rating);
    const review_count = parseOptionalInt(b.review_count ?? (b.reviewCount as unknown));
    const maps_url =
      typeof b.maps_url === "string" && b.maps_url.trim() ? String(b.maps_url).trim().slice(0, 4096) : null;
    const phone = typeof b.phone === "string" && b.phone.trim() ? String(b.phone).trim().slice(0, 80) : null;
    const website = typeof b.website === "string" && b.website.trim() ? String(b.website).trim().slice(0, 2048) : null;
    const specialist_type =
      typeof b.specialist_type === "string" && b.specialist_type.trim()
        ? String(b.specialist_type).trim().slice(0, 160)
        : null;
    const search_location =
      typeof b.search_location === "string" && b.search_location.trim()
        ? String(b.search_location).trim().slice(0, 300)
        : null;

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      place_id: placeId,
      name,
      address,
      rating,
      review_count,
      maps_url,
      phone,
      website,
      specialist_type,
      search_location,
    };

    const insertMinimal: Record<string, unknown> = {
      user_id: user.id,
      place_id: placeId,
      name,
      address,
      rating,
    };

    let insError = (await supabase.from("saved_specialists").insert(insertPayload)).error;
    if (insError && isSavedSpecialistsSchemaMismatchError(insError.message)) {
      console.warn("[api/specialists/saved] insert extended failed; retry minimal columns.");
      insError = (await supabase.from("saved_specialists").insert(insertMinimal)).error;
    }

    if (insError) {
      console.error("[api/specialists/saved] insert", insError.message);
      return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
    }

    return Response.json({ saved: true, place_id: placeId });
  } catch (e) {
    console.error("[api/specialists/saved] POST", e);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}
