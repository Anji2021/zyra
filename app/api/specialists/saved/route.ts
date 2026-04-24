import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

    const { data, error } = await supabase
      .from("saved_specialists")
      .select("id,name,address,place_id,rating,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/specialists/saved] GET", error.message);
      return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
    }

    return Response.json({ items: data ?? [] });
  } catch (e) {
    console.error("[api/specialists/saved] GET", e);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
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

    const placeId = String((body as { place_id?: unknown }).place_id ?? "").trim();
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

    const name = String((body as { name?: unknown }).name ?? "").trim() || null;
    const address = String((body as { address?: unknown }).address ?? "").trim() || null;
    const ratingRaw = (body as { rating?: unknown }).rating;
    let rating: number | null = null;
    if (typeof ratingRaw === "number" && !Number.isNaN(ratingRaw)) {
      rating = ratingRaw;
    } else if (typeof ratingRaw === "string" && ratingRaw.trim() !== "") {
      const n = Number(ratingRaw);
      if (!Number.isNaN(n)) rating = n;
    }

    const { error: insError } = await supabase.from("saved_specialists").insert({
      user_id: user.id,
      place_id: placeId,
      name,
      address,
      rating,
    });

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
