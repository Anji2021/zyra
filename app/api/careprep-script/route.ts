import type { CarePrepScriptAiJson } from "@zyra/shared";
import { saveCarePrepToButterbase } from "@/lib/butterbase/client";

export const runtime = "nodejs";

const ZAI_CHAT_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const DEFAULT_ZAI_MODEL = "glm-4-flash";

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

function normalizeInput(body: unknown): {
  symptoms: string;
  pattern: string;
  specialist: string;
  carePath: string[];
  questionsToAsk: string[];
  urgentCareWarning: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  let symptoms = "";
  if (typeof o.symptoms === "string") symptoms = o.symptoms.trim();
  else if (Array.isArray(o.symptoms)) symptoms = o.symptoms.map((x) => String(x).trim()).filter(Boolean).join(", ");

  const pattern = typeof o.pattern === "string" ? o.pattern : "";
  const specialist = typeof o.specialist === "string" ? o.specialist : "";
  const carePath = Array.isArray(o.carePath) ? o.carePath.map((x) => String(x).trim()).filter(Boolean) : [];
  const questionsToAsk = Array.isArray(o.questionsToAsk)
    ? o.questionsToAsk.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const urgentCareWarning = typeof o.urgentCareWarning === "string" ? o.urgentCareWarning : "";

  if (!symptoms && !specialist && carePath.length === 0 && questionsToAsk.length === 0) return null;

  return { symptoms, pattern, specialist, carePath, questionsToAsk, urgentCareWarning };
}

function parseCarePrepAi(content: string): CarePrepScriptAiJson | null {
  const extracted = extractJsonObject(content);
  if (!extracted) return null;
  try {
    const parsed = JSON.parse(extracted) as Record<string, unknown>;
    const title = String(parsed.title ?? "").trim();
    const narration = String(parsed.narration ?? "").trim();
    const visualPrompt = String(parsed.visualPrompt ?? "").trim();
    const checklistRaw = parsed.checklist;
    const checklist = Array.isArray(checklistRaw)
      ? checklistRaw.map((x) => String(x).trim()).filter(Boolean)
      : [];
    if (!title || !narration || !visualPrompt || checklist.length < 1) return null;
    return { title, narration, visualPrompt, checklist };
  } catch {
    return null;
  }
}

function messageContentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (content == null) return "";
  return JSON.stringify(content);
}

export async function POST(request: Request) {
  const apiKey = process.env.ZAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "CarePrep AI is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = normalizeInput(body);
  if (!input) {
    return Response.json({ error: "Missing DoctorMatch context (symptoms or recommendation fields)." }, { status: 400 });
  }

  const model = process.env.ZAI_MODEL?.trim() || DEFAULT_ZAI_MODEL;

  const systemPrompt = `You write short, supportive educational scripts for Zyra — a women's health companion app.

Hard rules:
- Educational preparation for a doctor visit ONLY — never medical advice, never a diagnosis, never certainty about conditions.
- Calm, supportive, inclusive tone. Acknowledge uncertainty ("may," "could discuss," "worth mentioning").
- Personalize using the user's symptoms and suggested specialist type from DoctorMatch context.
- Narration must be readable aloud in roughly 20–30 seconds (about 55–85 words).
- visualPrompt: one concise paragraph describing a soft, calming explain-style video look (cream/blush palette, abstract icons, no graphic anatomy). Say it's informational only.
- checklist: exactly 4–6 practical bullets for visit prep (bring notes, mention timeline, questions from context, etc.). Short phrases.

Output MUST be a single JSON object only (no markdown), with keys exactly:
{"title":"","narration":"","visualPrompt":"","checklist":[]}`;

  const userPayload = JSON.stringify(input, null, 0);

  try {
    const zaiRes = await fetch(ZAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.55,
        stream: false,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `DoctorMatch context (for educational CarePrep video script only):\n${userPayload}`,
          },
        ],
      }),
    });

    if (!zaiRes.ok) {
      const errText = await zaiRes.text();
      console.error("[careprep-script] Z.A.I HTTP error:", zaiRes.status, errText.slice(0, 600));
      return Response.json({ error: "CarePrep generation failed." }, { status: 502 });
    }

    const zaiJson = (await zaiRes.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const rawContent = messageContentToString(zaiJson?.choices?.[0]?.message?.content);
    const parsed = parseCarePrepAi(rawContent);
    if (!parsed) {
      console.error("[careprep-script] Could not parse model JSON:", rawContent.slice(0, 400));
      return Response.json({ error: "CarePrep generation failed." }, { status: 502 });
    }

    const out: CarePrepScriptAiJson = {
      title: parsed.title,
      narration: parsed.narration,
      visualPrompt: parsed.visualPrompt,
      checklist: parsed.checklist.slice(0, 6),
    };

    const butterbaseSaved = await saveCarePrepToButterbase({
      symptoms: input.symptoms,
      pattern: input.pattern,
      specialist: input.specialist,
      title: out.title,
      narration: out.narration,
      visualPrompt: out.visualPrompt,
      checklist: out.checklist,
      videoStatus: "script_generated",
      videoUrl: "",
      createdAt: new Date().toISOString(),
    });

    return Response.json({ ...out, ...(butterbaseSaved ? { butterbaseSaved: true } : {}) });
  } catch (e) {
    console.error("[careprep-script]", e);
    return Response.json({ error: "CarePrep generation failed." }, { status: 502 });
  }
}
