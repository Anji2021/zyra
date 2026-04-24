import { getInsforgeServerClient } from "@/lib/insforge/server-client";
import { FRIENDLY_TRY_AGAIN } from "@/lib/zyra/user-messages";

export const runtime = "nodejs";

const MAX_TITLE = 200;
const MAX_MESSAGE = 8000;
const MAX_EMAIL = 320;
const ALLOWED_TYPES = new Set(["feedback", "topic_request"]);
const FEEDBACK_TABLE = "feedback_requests" as const;

const isDev = process.env.NODE_ENV === "development";

function logEnvDiagnostics() {
  const hasPublicBase = Boolean(process.env.NEXT_PUBLIC_INSFORGE_BASE_URL?.trim());
  const hasPublicAnon = Boolean(process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim());
  const hasLegacyBase = Boolean(process.env.INSFORGE_BASE_URL?.trim());
  const hasLegacyService = Boolean(process.env.INSFORGE_SERVICE_KEY?.trim());
  const hasLegacyAnon = Boolean(process.env.INSFORGE_ANON_KEY?.trim());

  console.info("[api/feedback] InsForge env (presence only, no secret values)", {
    NEXT_PUBLIC_INSFORGE_BASE_URL: hasPublicBase,
    NEXT_PUBLIC_INSFORGE_ANON_KEY: hasPublicAnon,
    INSFORGE_BASE_URL_legacy: hasLegacyBase,
    INSFORGE_SERVICE_KEY_legacy: hasLegacyService,
    INSFORGE_ANON_KEY_legacy: hasLegacyAnon,
  });
}

/** Safe JSON for logs: PostgREST / InsForge DB errors. */
function serializeInsforgeDbError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { raw: String(error) };
  }
  const e = error as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of ["message", "code", "details", "hint", "name"] as const) {
    if (e[k] !== undefined) out[k] = e[k];
  }
  if (Object.keys(out).length === 0) {
    try {
      return { json: JSON.parse(JSON.stringify(error)) };
    } catch {
      return { stringified: String(error) };
    }
  }
  return out;
}

function devDbErrorMessage(error: unknown): string {
  const s = serializeInsforgeDbError(error);
  const parts = [
    typeof s.message === "string" ? s.message : null,
    typeof s.code === "string" ? `code=${s.code}` : null,
    typeof s.details === "string" && s.details ? `details=${s.details}` : null,
    typeof s.hint === "string" && s.hint ? `hint=${s.hint}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" | ") : FRIENDLY_TRY_AGAIN;
}

export async function POST(request: Request) {
  logEnvDiagnostics();

  try {
    const client = getInsforgeServerClient();
    if (!client) {
      const msg =
        "InsForge client could not be built: set NEXT_PUBLIC_INSFORGE_BASE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY (or legacy INSFORGE_* fallbacks).";
      console.error("[api/feedback]", msg);
      return Response.json(
        { success: false, error: isDev ? msg : FRIENDLY_TRY_AGAIN },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ success: false, error: "Invalid body." }, { status: 400 });
    }

    const b = body as {
      source?: unknown;
      type?: unknown;
      title?: unknown;
      message?: unknown;
      email?: unknown;
    };

    const type = String(b.type ?? "").trim();
    if (!ALLOWED_TYPES.has(type)) {
      return Response.json({ success: false, error: "Invalid type." }, { status: 400 });
    }

    const title = String(b.title ?? "").trim();
    const message = String(b.message ?? "").trim();
    if (!title) {
      return Response.json({ success: false, error: "Title is required." }, { status: 400 });
    }
    if (!message) {
      return Response.json({ success: false, error: "Message is required." }, { status: 400 });
    }
    if (title.length > MAX_TITLE) {
      return Response.json({ success: false, error: "Title is too long." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return Response.json({ success: false, error: "Message is too long." }, { status: 400 });
    }

    const sourceRaw = String(b.source ?? "zyra_app").trim();
    const source = sourceRaw.slice(0, 64) || "zyra_app";

    const email = String(b.email ?? "").trim();
    if (email.length > MAX_EMAIL) {
      return Response.json({ success: false, error: "Email is too long." }, { status: 400 });
    }

    const created_at = new Date().toISOString();
    const row = {
      source,
      type,
      title,
      message,
      email: email.length > 0 ? email : null,
      created_at,
    };

    console.info("[api/feedback] InsForge insert attempt", {
      table: FEEDBACK_TABLE,
      payload: row,
    });

    const { data, error } = await client.database
      .from(FEEDBACK_TABLE)
      .insert([row])
      .select("id")
      .single();

    if (error) {
      console.error("[api/feedback] InsForge insert failed", {
        table: FEEDBACK_TABLE,
        insforgeError: serializeInsforgeDbError(error),
        payload: row,
      });
      return Response.json(
        { success: false, error: isDev ? devDbErrorMessage(error) : FRIENDLY_TRY_AGAIN },
        { status: 502 },
      );
    }

    console.info("[api/feedback] InsForge insert ok", { id: data?.id ?? null });
    return Response.json({ success: true, id: data?.id ?? null });
  } catch (e) {
    const serialized =
      e instanceof Error
        ? { name: e.name, message: e.message, stack: isDev ? e.stack : undefined }
        : serializeInsforgeDbError(e);
    console.error("[api/feedback] unexpected error", serialized);
    return Response.json(
      {
        success: false,
        error: isDev && e instanceof Error ? e.message : FRIENDLY_TRY_AGAIN,
      },
      { status: 500 },
    );
  }
}
