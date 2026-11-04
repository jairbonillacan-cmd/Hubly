import { NextResponse } from "next/server";
import { readBodyText } from "@/lib/api-guard";
import {
  demoDiskEnabled,
  loadDemoWorkspace,
  loadLiveWorkspace,
  MAX_WORKSPACE_BODY_BYTES,
  resetDemoWorkspace,
  sanitizeWorkspaceId,
  saveDemoWorkspace,
  saveLiveWorkspace,
} from "@/lib/server/workspace";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { HublyWorkspaceData } from "@/lib/types";

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (backendEnabled) {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    return loadLiveWorkspace(supabase, auth.user, searchParams.get("agencyId"));
  }

  const workspaceId = sanitizeWorkspaceId(
    searchParams.get("workspaceId") || searchParams.get("workspace") || "default"
  );
  const data = await loadDemoWorkspace(workspaceId, searchParams.get("fixture"));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (backendEnabled) {
    const text = await readBodyText(request, MAX_WORKSPACE_BODY_BYTES).catch(() => null);
    if (text === null) return NextResponse.json({ error: "too_large" }, { status: 413 });
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    const body = parseJson<{ agencyId?: string; version?: number; data?: HublyWorkspaceData }>(text);
    if (
      !body?.agencyId ||
      typeof body.version !== "number" ||
      !Array.isArray(body.data?.brands) ||
      !Array.isArray(body.data?.posts)
    ) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    return saveLiveWorkspace(supabase, body.agencyId, body.version, body.data);
  }

  if (!demoDiskEnabled) return NextResponse.json({ error: "demo_read_only" }, { status: 503 });
  const raw = await readBodyText(request, MAX_WORKSPACE_BODY_BYTES).catch(() => undefined);
  if (raw === null) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const body = raw !== undefined ? parseJson<Partial<HublyWorkspaceData> & { action?: string }>(raw) : null;
  if (!body) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const workspaceId = sanitizeWorkspaceId(
    searchParams.get("workspaceId") || searchParams.get("workspace") || body.workspaceId || "default"
  );
  if (body.action === "reset") return resetDemoWorkspace(workspaceId);
  if (!Array.isArray(body.brands) || !Array.isArray(body.posts)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  return saveDemoWorkspace(workspaceId, body as HublyWorkspaceData);
}
