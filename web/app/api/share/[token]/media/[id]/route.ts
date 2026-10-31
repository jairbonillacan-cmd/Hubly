import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/media";
import { backendEnabled, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

type Ctx = { params: Promise<{ token: string; id: string }> };
const SIGNED_SECONDS = 60 * 30;

/** Abre un medio para quien tiene el enlace: la política de Storage valida el token con el post. */
export async function GET(_request: Request, { params }: Ctx) {
  if (!backendEnabled) return NextResponse.json({ error: "backend_disabled" }, { status: 404 });
  const { token, id } = await params;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-hubly-share-token": token } },
  });
  const { data: path } = await supabase.rpc("share_media_path", { raw_token: token, asset_id: id });
  if (!path) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path as string, SIGNED_SECONDS);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
