import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createSeedWorkspaceData } from "@/lib/seed-data";
import {
  buildReferenceFixtureWorkspace,
  normalizeWorkspacePayload,
} from "@/lib/workspace-repository";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { HublyWorkspaceData } from "@/lib/types";
import { roleLabel } from "@/lib/labels";

const DATA_DIR = path.join(process.cwd(), ".data");
const WORKSPACES_DIR = path.join(DATA_DIR, "workspaces");
const LEGACY_DB_FILE = path.join(DATA_DIR, "hubly-db.json");

function sanitizeWorkspaceId(rawId?: string | null): string {
  const cleaned = (rawId || "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  return cleaned || "default";
}

function getWorkspaceFilePath(workspaceId: string): string {
  const safeId = sanitizeWorkspaceId(workspaceId);
  return path.join(WORKSPACES_DIR, `workspace-${safeId}.json`);
}

async function readWorkspaceDb(workspaceId: string): Promise<HublyWorkspaceData> {
  const safeId = sanitizeWorkspaceId(workspaceId);
  const filePath = getWorkspaceFilePath(safeId);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeWorkspacePayload(parsed, safeId);
  } catch {
    if (safeId === "default") {
      try {
        const legacyRaw = await fs.readFile(LEGACY_DB_FILE, "utf8");
        const legacyParsed = JSON.parse(legacyRaw);
        const migrated = normalizeWorkspacePayload(legacyParsed, safeId);
        await writeWorkspaceDb(safeId, migrated);
        return migrated;
      } catch {
        // Ignore and fall back to fresh seed
      }
    }

    const seeded = createSeedWorkspaceData(safeId);
    await writeWorkspaceDb(safeId, seeded);
    return seeded;
  }
}

async function writeWorkspaceDb(
  workspaceId: string,
  data: HublyWorkspaceData
): Promise<HublyWorkspaceData> {
  const safeId = sanitizeWorkspaceId(workspaceId);
  const filePath = getWorkspaceFilePath(safeId);
  const normalized = normalizeWorkspacePayload(data, safeId);

  await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2), "utf8");

  if (safeId === "default") {
    try {
      await fs.writeFile(LEGACY_DB_FILE, JSON.stringify(normalized, null, 2), "utf8");
    } catch {
      // Non-fatal
    }
  }

  return normalized;
}

const MAX_BODY_BYTES = 8 * 1024 * 1024;

async function liveGet(requestedAgency: string | null) {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role, agencies(name)")
    .eq("user_id", auth.user.id)
    .order("created_at");
  const membership = memberships?.find((m) => m.agency_id === requestedAgency) ?? memberships?.[0];
  if (!membership) return NextResponse.json({ error: "no_agency" }, { status: 404 });

  const { data: row, error } = await supabase
    .from("agency_workspaces")
    .select("data, version")
    .eq("agency_id", membership.agency_id)
    .single();
  if (error || !row) return NextResponse.json({ error: "load_failed" }, { status: 500 });

  const agency = membership.agencies as unknown as { name: string } | null;
  const data = normalizeWorkspacePayload(row.data as Partial<HublyWorkspaceData>, membership.agency_id, { live: true });
  // El perfil es de cada persona: nunca se toma del documento compartido.
  const name = (auth.user.user_metadata?.name as string) || auth.user.email || "";
  data.agencyName = agency?.name || data.agencyName;
  data.agency = { ...data.agency, id: membership.agency_id, name: data.agencyName };
  data.profile = {
    ...data.profile,
    id: auth.user.id,
    email: auth.user.email || "",
    name,
    avatarInitial: name.slice(0, 1).toUpperCase(),
    avatarUrl: (auth.user.user_metadata?.avatar_url as string) || undefined,
    avatarSourceUrl: (auth.user.user_metadata?.avatar_source_url as string) || undefined,
  };
  const { data: members } = await supabase.rpc("list_members", { target_agency: membership.agency_id });
  data.team = ((members ?? []) as { user_id: string; role: string; email: string; name: string }[]).map((m) => {
    const saved = data.team.find((t) => t.email === m.email);
    const memberName = m.user_id === auth.user!.id ? data.profile.name : m.name || saved?.name || m.email;
    const initials = memberName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return {
      ...(saved ?? {
        brandIds: data.brands.map((b) => b.id),
        brandsCount: data.brands.length,
        avatarColor: "#16324F",
        tasksCompleted: 0,
        tasksInProgress: 0,
        postsPublished: 0,
        activeTimeLabel: "—",
        points: 0,
      }),
      id: m.user_id,
      name: memberName,
      email: m.email,
      role: roleLabel(m.role),
      status: "Activo" as const,
      initials,
      avatarInitial: initials.charAt(0),
      baseActiveMinutes: saved?.baseActiveMinutes ?? 0,
    };
  });
  if (!(row.data as Partial<HublyWorkspaceData>)?.agency) {
    Object.assign(data.agency, { plan: "", activeDays: 0, activeStreak: 0, bestStreak: 0, xp: 0, level: 1 });
  }
  return NextResponse.json(
    {
      data,
      version: row.version,
      agencyId: membership.agency_id,
      role: membership.role,
      agencies: (memberships ?? []).map((m) => ({
        id: m.agency_id,
        name: (m.agencies as unknown as { name: string } | null)?.name || "",
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

async function livePost(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }
  const body = (await request.json().catch(() => null)) as {
    agencyId?: string;
    version?: number;
    data?: HublyWorkspaceData;
  } | null;
  if (!body?.agencyId || typeof body.version !== "number" || !Array.isArray(body.data?.brands) || !Array.isArray(body.data?.posts)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("save_workspace", {
    target_agency: body.agencyId,
    // Lo personal no se guarda en el documento de la agencia.
    new_data: { ...body.data, profile: undefined, activeBrandId: undefined },
    expected_version: body.version,
  });
  if (error) {
    const status = error.message.includes("stale_version") ? 409 : error.message.includes("forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true, version: data });
}

export async function GET(request: Request) {
  if (backendEnabled) return liveGet(new URL(request.url).searchParams.get("agencyId"));
  const { searchParams } = new URL(request.url);
  const workspaceId = sanitizeWorkspaceId(
    searchParams.get("workspaceId") || searchParams.get("workspace") || "default"
  );
  const fixture = searchParams.get("fixture");

  if (fixture === "reference" || fixture === "1") {
    const refData = buildReferenceFixtureWorkspace(workspaceId);
    return NextResponse.json(refData);
  }

  const data = await readWorkspaceDb(workspaceId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (backendEnabled) return livePost(request);
  try {
    const { searchParams } = new URL(request.url);
    const body = (await request.json()) as Partial<HublyWorkspaceData> & {
      action?: string;
    };

    const workspaceId = sanitizeWorkspaceId(
      searchParams.get("workspaceId") ||
        searchParams.get("workspace") ||
        body?.workspaceId ||
        "default"
    );

    if (body?.action === "reset") {
      const fresh = createSeedWorkspaceData(workspaceId);
      await writeWorkspaceDb(workspaceId, fresh);
      return NextResponse.json({ ok: true, workspaceId, data: fresh });
    }

    if (!body || !Array.isArray(body.brands) || !Array.isArray(body.posts)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const saved = await writeWorkspaceDb(workspaceId, body as HublyWorkspaceData);
    return NextResponse.json({
      ok: true,
      workspaceId: saved.workspaceId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save workspace" },
      { status: 500 }
    );
  }
}
