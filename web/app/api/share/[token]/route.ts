import { NextResponse } from "next/server";
import { readJson } from "@/lib/api-guard";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };
const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET(_request: Request, { params }: Ctx) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const { token } = await params;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("get_share_portal", { raw_token: token });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500, ...noStore });
  if (!data?.brand) return NextResponse.json({ error: "invalid_link" }, { status: 404, ...noStore });
  return NextResponse.json(data, noStore);
}

export async function POST(request: Request, { params }: Ctx) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const { token } = await params;
  const body = (await readJson<{
    postId?: string;
    decision?: string;
    comment?: string;
    signer?: string;
  }>(request, 16 * 1024)) ?? {};
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("submit_share_decision", {
    raw_token: token,
    target_post: body.postId ?? "",
    decision: body.decision ?? "",
    comment_text: body.comment ?? "",
    signer: body.signer ?? "",
  });
  if (error) return NextResponse.json({ error: "invalid_decision" }, { status: 400, ...noStore });
  if (!data) return NextResponse.json({ error: "not_allowed" }, { status: 404, ...noStore });
  return NextResponse.json({ ok: true }, noStore);
}
