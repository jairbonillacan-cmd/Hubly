import { NextResponse } from "next/server";
import { readJson } from "@/lib/api-guard";
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
  const [members, invitations, links] = await Promise.all([
    supabase.rpc("list_members", { target_agency: agencyId }),
    supabase.from("agency_invitations").select("id,email,role,expires_at,accepted_at,revoked_at").eq("agency_id", agencyId).order("created_at"),
    supabase.from("share_links").select("id,brand_id,expires_at,revoked_at,created_at").eq("agency_id", agencyId).order("created_at"),
  ]);
  if (members.error) return NextResponse.json({ error: "forbidden" }, { status: 403, ...noStore });
  return NextResponse.json(
    { members: members.data ?? [], invitations: invitations.data ?? [], links: links.data ?? [] },
    noStore
  );
}

export async function POST(request: Request) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const body = (await readJson<Record<string, string>>(request, 4096)) ?? {};
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { action, agencyId } = body;
  const call = () => {
    switch (action) {
      case "invite":
        return supabase.rpc("create_invitation", { target_agency: agencyId, invite_email: body.email, invite_role: body.role });
      case "inviteLink":
        return supabase.rpc("create_invite_link", { target_agency: agencyId, invite_role: body.role });
      case "revokeInvitation":
        return supabase.rpc("revoke_invitation", { invitation_id: body.id });
      case "revokeLink":
        return supabase.rpc("revoke_share_link", { link_id: body.id });
      case "setRole":
        return supabase.rpc("update_member_role", { target_agency: agencyId, target_user: body.userId, new_role: body.role });
      case "remove":
        return supabase.rpc("remove_member", { target_agency: agencyId, target_user: body.userId });
      default:
        return null;
    }
  };
  const pending = call();
  if (!pending) return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  const { data, error } = await pending;
  if (error) {
    // PGRST202: el proyecto aún no tiene la migración que define la función.
    if (error.code === "PGRST202") return NextResponse.json({ error: "unavailable" }, { status: 503 });
    const code = error.message.includes("last_owner") ? "last_owner" : error.message.includes("forbidden") ? "forbidden" : "failed";
    return NextResponse.json({ error: code }, { status: code === "failed" ? 400 : 403 });
  }
  return NextResponse.json({ ok: true, token: action === "invite" || action === "inviteLink" ? data : undefined });
}
