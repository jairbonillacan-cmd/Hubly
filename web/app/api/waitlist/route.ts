const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 16 * 1024;

// Reenvía cada registro a WAITLIST_WEBHOOK_URL (Zapier, Make, n8n, Google Apps Script...).
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }

  let payload: { email?: unknown; website?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  // Campo oculto: solo los bots lo rellenan, y se les responde como si nada.
  if (payload.website) {
    return Response.json({ ok: true });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (email.length > 254 || !EMAIL.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (!webhook) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, signedUpAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return Response.json({ error: "upstream_failed" }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "upstream_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
