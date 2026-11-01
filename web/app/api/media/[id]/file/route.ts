import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { Readable } from "node:stream";
import { MEDIA_BUCKET } from "@/lib/media";
import { demoDiskEnabled, demoFilePath, demoGet } from "@/lib/media-demo-store";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };
const SIGNED_SECONDS = 60 * 60;

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;

  if (backendEnabled) {
    const supabase = await createSupabaseServer();
    const { data: asset } = await supabase.from("media_assets").select("path").eq("id", id).maybeSingle();
    if (!asset) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(asset.path, SIGNED_SECONDS);
    if (!data) return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
    return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "private, max-age=1800" } });
  }

  const record = await demoGet(id);
  const file = demoFilePath(id);
  if (!record || !file) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const info = await fs.stat(file).catch(() => null);
  if (!info) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Los videos piden rangos para poder adelantar.
  const headers = { "Content-Type": record.mime, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" };
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${info.size}` },
    });
  }
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers: { ...headers, "Content-Length": String(info.size) } });
}

/** Solo modo demo: con Supabase el navegador sube directo a la URL firmada. */
export async function PUT(request: Request, { params }: Ctx) {
  if (backendEnabled || !demoDiskEnabled) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { id } = await params;
  const record = await demoGet(id);
  const file = demoFilePath(id);
  if (!record || !file || !request.body) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length !== record.sizeBytes) return NextResponse.json({ error: "size_mismatch" }, { status: 422 });
  await fs.writeFile(file, bytes);
  return NextResponse.json({ ok: true });
}
