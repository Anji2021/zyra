import { parseCarePrepButterbasePayload, saveCarePrepToButterbase } from "@/lib/butterbase/client";

export const runtime = "nodejs";

/** Server-side mirror for async CarePrep video completion (polling). Optional env-gated. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ butterbaseSaved: false }, { status: 400 });
  }

  const payload = parseCarePrepButterbasePayload(body);
  if (!payload) {
    return Response.json({ butterbaseSaved: false }, { status: 400 });
  }

  const butterbaseSaved = await saveCarePrepToButterbase(payload);
  return Response.json({ butterbaseSaved });
}
