import { NextResponse } from "next/server";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const { token } = await params;
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("invitation_preview", { raw_token: token });
  if (!data) return NextResponse.json({ error: "invalid" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(_request: Request, { params }: Ctx) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const { token } = await params;
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("accept_invitation", { raw_token: token });
  if (error) {
    const code = error.message.includes("email_mismatch") ? "email_mismatch" : "invalid";
    return NextResponse.json({ error: code }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
