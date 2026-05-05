import type { CarePrepScriptAiJson } from "@zyra/shared";
import { buildFallbackCarePrepScript } from "@zyra/shared";
import { saveCarePrepToButterbase } from "@/lib/butterbase/client";
import { groqChatJsonCompletion } from "@/lib/groq/chat-completion";
import { extractJsonObject } from "@/lib/groq/extract-json";

export const runtime = "nodejs";

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

function buildLocalCarePrepAiJson(input: {
  symptoms: string;
  pattern: string;
  specialist: string;
  carePath: string[];
  questionsToAsk: string[];
  urgentCareWarning: string;
}): CarePrepScriptAiJson {
  const fb = buildFallbackCarePrepScript({
    symptomsText: input.symptoms,
    recommendation: {
      pattern: input.pattern,
      specialist: input.specialist,
      carePath: input.carePath,
      questionsToAsk: input.questionsToAsk,
      urgentCareWarning: input.urgentCareWarning,
    },
  });
  const checklist = fb.doctorVisitChecklist.map((x) => String(x).trim()).filter(Boolean).slice(0, 6);
  const padded =
    checklist.length >= 4
      ? checklist
      : [
          ...checklist,
          "Bring a list of current medications and supplements.",
          "Note when symptoms started and what makes them better or worse.",
          "Write down your top questions before the visit.",
        ].slice(0, 6);

  return {
    title: fb.videoTitle.trim(),
    narration: fb.narrationScript.trim(),
    visualPrompt: fb.visualDirection.trim(),
    checklist: padded,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = normalizeInput(body);
  if (!input) {
    return Response.json(
      { error: "Missing DoctorMatch context (symptoms or recommendation fields)." },
      { status: 400 },
    );
  }

  const localFallback = buildLocalCarePrepAiJson(input);
  const userPayload = JSON.stringify(input, null, 0);

  const userContent = `DoctorMatch context (for educational CarePrep video script only):
${userPayload}

Hard rules for your JSON output:
- Educational preparation for a doctor visit ONLY — never medical advice, never a diagnosis, never certainty about conditions.
- Calm, supportive, inclusive tone. Use "may," "could discuss," "worth mentioning."
- Personalize using the user's symptoms and suggested specialist type from DoctorMatch context.
- Narration must be readable aloud in roughly 20–30 seconds (about 55–85 words).
- visualPrompt: one concise paragraph describing a soft, calming explain-style video look (cream/blush palette, abstract icons, no graphic anatomy). Say it's informational only.
- checklist: exactly 4–6 practical bullets for visit prep (short phrases).

Output MUST be a single JSON object only (no markdown), with keys exactly:
{"title":"","narration":"","visualPrompt":"","checklist":[]}`;

  let out: CarePrepScriptAiJson = localFallback;
  const groq = await groqChatJsonCompletion({
    userContent,
    temperature: 0.4,
  });

  if (groq.ok) {
    const parsed = parseCarePrepAi(groq.content);
    if (parsed) {
      out = {
        title: parsed.title,
        narration: parsed.narration,
        visualPrompt: parsed.visualPrompt,
        checklist: parsed.checklist.slice(0, 6),
      };
    } else {
      console.error("[careprep-script] Groq response could not be parsed as CarePrep JSON; using local fallback.");
    }
  } else {
    if (groq.reason !== "missing_api_key") {
      console.error("[careprep-script] Groq unavailable:", groq.reason, "— using local fallback.");
    }
  }

  try {
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
    console.error("[careprep-script] butterbase / response:", e);
    return Response.json(out);
  }
}
