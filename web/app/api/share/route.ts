import { NextResponse } from "next/server";
import { readJson } from "@/lib/api-guard";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { brandId, agencyId } = (await readJson<{ brandId?: string; agencyId?: string }>(request, 2048)) ?? {};
  if (!brandId || !agencyId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data, error } = await supabase.rpc("create_share_link", { target_agency: agencyId, target_brand: brandId });
  if (error) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ token: data });
}
