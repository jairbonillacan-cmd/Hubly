import { NextResponse } from "next/server";
import { readJson } from "@/lib/api-guard";
import { MEDIA_BUCKET } from "@/lib/media";
import { demoDiskEnabled, demoGet, demoRemove, demoUpdate } from "@/lib/media-demo-store";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Confirma una subida terminada, o mueve y renombra un archivo. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await readJson<{ status?: "ready"; folder?: string; name?: string }>(request, 2048)) ?? {};
  const patch = {
    ...(body.status === "ready" ? { status: "ready" as const } : {}),
    ...(typeof body.folder === "string" ? { folder: body.folder.slice(0, 120) } : {}),
    ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim().slice(0, 255) } : {}),
  };

  if (!backendEnabled) {
    if (!demoDiskEnabled || !(await demoGet(id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await demoUpdate(id, patch);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("media_assets").update(patch).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!backendEnabled) {
    if (!demoDiskEnabled) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await demoRemove(id);
    return NextResponse.json({ ok: true });
  }
  const supabase = await createSupabaseServer();
  const { data: asset } = await supabase.from("media_assets").select("path").eq("id", id).maybeSingle();
  if (!asset) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data: removed, error } = await supabase.from("media_assets").delete().eq("id", id).select("id").maybeSingle();
  if (error || !removed) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await supabase.storage.from(MEDIA_BUCKET).remove([asset.path]);
  return NextResponse.json({ ok: true });
}
