import { NextResponse } from "next/server";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { name, another } = (await request.json().catch(() => ({}))) as { name?: string; another?: boolean };
  const clean = typeof name === "string" ? name.trim() : "";
  if (!clean) return NextResponse.json({ error: "name_required" }, { status: 400 });

  // Repetir el envío no debe crear otra agencia.
  const { data: existing } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();
  if (existing && !another) return NextResponse.json({ agencyId: existing.agency_id });

  const { data, error } = await supabase.rpc("create_agency", { agency_name: clean });
  if (error) return NextResponse.json({ error: "create_failed" }, { status: 500 });
  return NextResponse.json({ agencyId: data });
}
