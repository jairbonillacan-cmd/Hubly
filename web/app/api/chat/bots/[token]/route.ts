import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { backendEnabled } from "@/lib/supabase/config";

const MAX_BODY_CHARS = 8000;

/** Entrada de los bots: la URL secreta es la credencial, por eso no pide sesión. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!backendEnabled) return NextResponse.json({ error: "not_available" }, { status: 404 });
  const { token } = await params;
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_BODY_CHARS) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("chat_bot_post", { bot_token: token, body: text });
  if (error) {
    if (error.message.includes("invalid_token")) return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    if (error.message.includes("rate_limited")) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    return NextResponse.json({ error: "post_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
