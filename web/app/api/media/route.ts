import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { MEDIA_BUCKET, mediaKindFor, mediaRejection, safeFileName, type MediaRecord } from "@/lib/media";
import { demoCreate, demoList, demoPurgePending } from "@/lib/media-demo-store";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

const STALE_PENDING_MS = 24 * 60 * 60 * 1000;
const noStore = { headers: { "Cache-Control": "no-store" } };

type Row = {
  id: string;
  brand_id: string;
  folder: string;
  name: string;
  kind: MediaRecord["kind"];
  mime: string;
  size_bytes: number;
  status: MediaRecord["status"];
  created_at: string;
};

export const toRecord = (r: Row): MediaRecord => ({
  id: r.id,
  brandId: r.brand_id,
  folder: r.folder,
  name: r.name,
  kind: r.kind,
  mime: r.mime,
  sizeBytes: r.size_bytes,
  status: r.status,
  createdAt: r.created_at,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  if (!backendEnabled) {
    await demoPurgePending(STALE_PENDING_MS);
    return NextResponse.json({ items: await demoList(brandId) }, noStore);
  }

  const agencyId = searchParams.get("agencyId");
  if (!agencyId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  // Limpieza diferida; a quien solo lee, RLS se la impide sin afectar el listado.
  const { data: stale } = await supabase
    .from("media_assets")
    .select("id, path")
    .eq("agency_id", agencyId)
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - STALE_PENDING_MS).toISOString());
  if (stale?.length) {
    await supabase.storage.from(MEDIA_BUCKET).remove(stale.map((s) => s.path));
    await supabase.from("media_assets").delete().in("id", stale.map((s) => s.id));
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, brand_id, folder, name, kind, mime, size_bytes, status, created_at")
    .eq("agency_id", agencyId)
    .eq("brand_id", brandId)
    .eq("status", "ready")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });
  return NextResponse.json({ items: (data as Row[]).map(toRecord) }, noStore);
}

/** Crea el registro y entrega dónde subir. El binario nunca pasa por el documento del workspace. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    agencyId?: string;
    brandId?: string;
    folder?: string;
    name?: string;
    mime?: string;
    sizeBytes?: number;
  } | null;
  if (!body?.brandId || !body.name || !body.mime || typeof body.sizeBytes !== "number") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const rejection = mediaRejection(body.mime, body.sizeBytes);
  const kind = mediaKindFor(body.mime);
  if (rejection || !kind) return NextResponse.json({ error: rejection }, { status: 422 });
  const name = body.name.slice(0, 255);
  const folder = (body.folder ?? "").slice(0, 120);

  if (!backendEnabled) {
    const record = await demoCreate({ brandId: body.brandId, folder, name, kind, mime: body.mime, sizeBytes: body.sizeBytes });
    return NextResponse.json({ record, upload: { url: `/api/media/${record.id}/file`, headers: {} } });
  }

  if (!body.agencyId) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const path = `${body.agencyId}/${safeFileName(body.brandId)}/${randomUUID()}-${safeFileName(name)}`;
  const { data: row, error } = await supabase
    .from("media_assets")
    .insert({ agency_id: body.agencyId, brand_id: body.brandId, folder, name, kind, mime: body.mime, size_bytes: body.sizeBytes, path })
    .select("id, brand_id, folder, name, kind, mime, size_bytes, status, created_at")
    .single();
  if (error || !row) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: signed, error: signError } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (signError || !signed) {
    await supabase.from("media_assets").delete().eq("id", row.id);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
  return NextResponse.json({ record: toRecord(row as Row), upload: { url: signed.signedUrl, headers: { "x-upsert": "false" } } });
}
