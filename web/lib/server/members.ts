import { NextResponse } from "next/server";
import type { createSupabaseServer } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServer>>;

const noStore = { headers: { "Cache-Control": "no-store" } };

const MEMBER_RPC_ACTIONS = [
  "invite",
  "inviteLink",
  "revokeInvitation",
  "revokeLink",
  "setRole",
  "remove",
] as const;

type MemberRpcAction = (typeof MEMBER_RPC_ACTIONS)[number];

export function isMemberRpcAction(action?: string): action is MemberRpcAction {
  return Boolean(action && (MEMBER_RPC_ACTIONS as readonly string[]).includes(action));
}

export async function listAgencyMembers(supabase: SupabaseServer, agencyId: string) {
  const [members, invitations, links, assignments] = await Promise.all([
    supabase.rpc("list_members", { target_agency: agencyId }),
    supabase
      .from("agency_invitations")
      .select("id,email,role,expires_at,accepted_at,revoked_at")
      .eq("agency_id", agencyId)
      .order("created_at"),
    supabase
      .from("share_links")
      .select("id,brand_id,expires_at,revoked_at,created_at")
      .eq("agency_id", agencyId)
      .order("created_at"),
    supabase.from("brand_members").select("brand_id,user_id").eq("agency_id", agencyId),
  ]);
  if (members.error) return NextResponse.json({ error: "forbidden" }, { status: 403, ...noStore });
  return NextResponse.json(
    {
      members: members.data ?? [],
      invitations: invitations.data ?? [],
      links: links.data ?? [],
      assignments: assignments.data ?? [],
    },
    noStore
  );
}

export async function setMemberBrands(
  supabase: SupabaseServer,
  agencyId: string,
  userId: string,
  brandIds: string[]
) {
  // Primero lo nuevo y luego quitar: si algo falla a medias, nadie gana acceso a todas las marcas.
  if (brandIds.length) {
    const rows = brandIds.map((brand_id) => ({ agency_id: agencyId, brand_id, user_id: userId }));
    const { error } = await supabase
      .from("brand_members")
      .upsert(rows, { onConflict: "agency_id,brand_id,user_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { data: current, error: readError } = await supabase
    .from("brand_members")
    .select("brand_id")
    .eq("agency_id", agencyId)
    .eq("user_id", userId);
  if (readError) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const stale = (current ?? []).map((row) => row.brand_id).filter((id) => !brandIds.includes(id));
  if (stale.length) {
    const { error } = await supabase
      .from("brand_members")
      .delete()
      .eq("agency_id", agencyId)
      .eq("user_id", userId)
      .in("brand_id", stale);
    if (error) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

export async function runMemberAction(
  supabase: SupabaseServer,
  action: MemberRpcAction,
  body: Record<string, string>
) {
  const { agencyId } = body;
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
    }
  };
  const { data, error } = await call();
  if (error) {
    // PGRST202: el proyecto aún no tiene la migración que define la función.
    if (error.code === "PGRST202") return NextResponse.json({ error: "unavailable" }, { status: 503 });
    const code = error.message.includes("last_owner")
      ? "last_owner"
      : error.message.includes("forbidden")
        ? "forbidden"
        : "failed";
    return NextResponse.json({ error: code }, { status: code === "failed" ? 400 : 403 });
  }
  return NextResponse.json({ ok: true, token: action === "invite" || action === "inviteLink" ? data : undefined });
}
