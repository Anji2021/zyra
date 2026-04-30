import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const runtime = "nodejs";

const ALLOWED_RADIUS = new Set([5, 10, 25]);

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v ?? "").trim()).filter(Boolean))];
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
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
      return { error: Response.json({ error: "Sign in to access your profile." }, { status: 401 }) };
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
  if (!user) {
    return { error: Response.json({ error: "Sign in to access your profile." }, { status: 401 }) };
  }
  return { supabase, user };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, POST, PUT, OPTIONS" },
  });
}

export async function GET(request: Request) {
  try {
    const resolved = await createSupabaseForRequest(request);
    if ("error" in resolved) return resolved.error;
    const { supabase, user } = resolved;

    const { data, error } = await supabase
      .from("user_health_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[api/profile] GET user_health_profile:", error.message, error.code);
      return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
    }

    return Response.json({ profile: data ?? null });
  } catch (error) {
    console.error("[api/profile] GET failed:", error);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const resolved = await createSupabaseForRequest(request);
    if ("error" in resolved) return resolved.error;
    const { supabase, user } = resolved;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return Response.json({ error: "Expected profile payload object." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;

    const cycle_regularity = String(payload.cycle_regularity ?? "unsure").trim();
    if (!["regular", "irregular", "unsure"].includes(cycle_regularity)) {
      return Response.json({ error: "Invalid cycle regularity value." }, { status: 400 });
    }

    const preferred_search_radius = Math.round(Number(payload.preferred_search_radius));
    if (!ALLOWED_RADIUS.has(preferred_search_radius)) {
      return Response.json({ error: "Invalid preferred search radius." }, { status: 400 });
    }

    const avgRaw = payload.average_cycle_length;
    const average_cycle_length =
      avgRaw == null || String(avgRaw).trim() === "" ? null : Math.round(Number(avgRaw));

    if (
      average_cycle_length != null &&
      (Number.isNaN(average_cycle_length) || average_cycle_length < 15 || average_cycle_length > 60)
    ) {
      return Response.json({ error: "Average cycle length must be between 15 and 60." }, { status: 400 });
    }

    const last_period_date_raw = String(payload.last_period_date ?? "").trim();
    const last_period_date = last_period_date_raw === "" ? null : last_period_date_raw;
    if (last_period_date && !/^\d{4}-\d{2}-\d{2}$/.test(last_period_date)) {
      return Response.json({ error: "Invalid last period date." }, { status: 400 });
    }

    const row = {
      user_id: user.id,
      known_conditions: parseStringList(payload.known_conditions),
      current_concerns: parseStringList(payload.current_concerns),
      cycle_regularity: cycle_regularity as "regular" | "irregular" | "unsure",
      average_cycle_length,
      last_period_date,
      goals: parseStringList(payload.goals),
      baseline_symptoms: parseStringList(payload.baseline_symptoms),
      preferred_search_radius,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_health_profile")
      .upsert(row, { onConflict: "user_id", ignoreDuplicates: false })
      .select("*")
      .single();

    if (error) {
      console.error("[api/profile] POST user_health_profile upsert:", error.message, error.code, error.details);
      return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
    }

    return Response.json({ profile: data });
  } catch (error) {
    console.error("[api/profile] POST failed:", error);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
