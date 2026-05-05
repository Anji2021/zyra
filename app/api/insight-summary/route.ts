import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { groqChatJsonCompletion } from "@/lib/groq/chat-completion";
import { buildInsightSummaryDocument } from "@/lib/insight-summary/build-document";
import { mergeInsightSummaryFromGroq } from "@/lib/insight-summary/merge-groq-insight";
import type { DoctorMatchHistoryRow } from "@/lib/insight-summary/types";
import { fetchCyclesForUser } from "@/lib/cycles/queries";
import { fetchMedicinesForUser } from "@/lib/medicines/queries";
import { getProfileForUser } from "@/lib/profiles/queries";
import { fetchSymptomsForUser } from "@/lib/symptoms/queries";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const runtime = "nodejs";

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
      return { error: Response.json({ error: "Sign in to generate an insight summary." }, { status: 401 }) };
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
    return { error: Response.json({ error: "Sign in to generate an insight summary." }, { status: 401 }) };
  }
  return { supabase, user };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, POST, OPTIONS" },
  });
}

async function handle(request: Request) {
  try {
    const resolved = await createSupabaseForRequest(request);
    if ("error" in resolved) return resolved.error;
    const { supabase, user } = resolved;

    const [profile, cycles, symptoms, medicines, dmResult] = await Promise.all([
      getProfileForUser(supabase, user.id),
      fetchCyclesForUser(supabase, user.id, 36),
      fetchSymptomsForUser(supabase, user.id, 60),
      fetchMedicinesForUser(supabase, user.id),
      supabase
        .from("doctor_match_history")
        .select("symptoms,pattern,specialist,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (dmResult.error) {
      console.error("[api/insight-summary] doctor_match_history:", dmResult.error.message);
    }

    const doctorMatchHistory = (dmResult.data ?? []) as DoctorMatchHistoryRow[];

    const draft = buildInsightSummaryDocument({
      profile,
      cycles,
      symptoms,
      medicines,
      doctorMatchHistory,
    });

    const groq = await groqChatJsonCompletion({
      temperature: 0.4,
      userContent: `You receive a draft health insights report as JSON (educational only; not a diagnosis). Polish wording for calm, concise clarity. Do not invent symptoms, dates, diagnoses, or new counts — stay aligned with the draft facts.

Return one JSON object using camelCase keys only:
title, overview, patternCards (exactly 3 objects: id "cycle"|"symptom"|"health", title, highlight string, bullets array of 1–3 short strings, body string for compatibility), summaryBullets (3 to 5 strings), unusualPatterns (string array), possibleSpecialist (string or null), carePrepScript (string), questionsToAsk (string array), doctorVisitChecklist (string array), disclaimer (string).

Draft JSON:
${JSON.stringify(draft)}`,
    });

    let summary = draft;
    if (groq.ok) {
      summary = mergeInsightSummaryFromGroq(draft, groq.content);
    } else if (groq.reason !== "missing_api_key") {
      console.error("[api/insight-summary] Groq refine skipped:", groq.reason);
    }

    return Response.json(summary);
  } catch (err) {
    console.error("[api/insight-summary]", err);
    return Response.json({ error: FRIENDLY_TRY_AGAIN }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
