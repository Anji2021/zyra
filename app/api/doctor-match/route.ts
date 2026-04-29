import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Groq from "groq-sdk";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_SYMPTOM_CHARS = 800;

export const runtime = "nodejs";

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

export async function POST(request: Request) {
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
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Sign in to use DoctorMatch AI." }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({ error: "DoctorMatch AI is not configured." }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const symptoms = String((body as { symptoms?: unknown })?.symptoms ?? "").trim();
    if (!symptoms) {
      return Response.json({ error: "Symptoms are required." }, { status: 400 });
    }
    if (symptoms.length > MAX_SYMPTOM_CHARS) {
      return Response.json({ error: "Symptoms are too long." }, { status: 400 });
    }

    const prompt = `You are a healthcare guidance assistant (not a doctor).
Based on user symptoms, suggest the most relevant specialist and guidance.

Return STRICT JSON:
{
  "pattern": "",
  "specialist": "",
  "reason": "",
  "carePath": ["", "", ""],
  "questionsToAsk": ["", "", ""],
  "urgentCareWarning": "",
  "searchTerm": ""
}

Rules:
- Be cautious and non-diagnostic
- Do not provide medical diagnosis
- Keep answers short and clear
- If multiple symptoms are provided, identify a cautious common pattern.
- Use language like "Possible pattern" or "May be related to".
- Always include a fallback specialist (Primary Care Physician if unsure)
- Keep "pattern" concise (one line)

Pattern examples:
- irregular periods + acne + weight gain -> Possible pattern: hormonal imbalance (PCOS-related pattern)
- burning urination + urgency -> Possible pattern: urinary tract irritation (UTI-like pattern)
- bloating + stomach pain -> Possible pattern: digestive discomfort pattern
- anxiety + fatigue -> Possible pattern: stress-related symptom pattern

User input:
${symptoms}`;

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : "";
    const jsonString = extractJsonObject(text);
    if (!jsonString) {
      return Response.json({ error: "Could not parse DoctorMatch response." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return Response.json({ error: "Could not parse DoctorMatch response." }, { status: 502 });
    }

    return Response.json({ recommendation: parsed });
  } catch (error) {
    console.error("[api/doctor-match] failed:", error);
    return Response.json({ error: "Could not generate recommendation." }, { status: 502 });
  }
}
