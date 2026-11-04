import { NextResponse } from "next/server";
import { readJson } from "@/lib/api-guard";
import {
  isMemberRpcAction,
  listAgencyMembers,
  runMemberAction,
  setMemberBrands,
} from "@/lib/server/members";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET(request: Request) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const agencyId = new URL(request.url).searchParams.get("agencyId");
  if (!agencyId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401, ...noStore });
  return listAgencyMembers(supabase, agencyId);
}

export async function POST(request: Request) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const body = (await readJson<Record<string, string> & { brandIds?: unknown }>(request, 16 * 1024)) ?? {};
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { action, agencyId } = body;
  if (action === "setBrands") {
    if (!Array.isArray(body.brandIds) || !body.brandIds.every((id) => typeof id === "string")) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    return setMemberBrands(supabase, agencyId, body.userId, body.brandIds);
  }
  if (!isMemberRpcAction(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  return runMemberAction(supabase, action, body);
}
