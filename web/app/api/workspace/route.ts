import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createSeedWorkspaceData } from "@/lib/seed-data";
import {
  buildReferenceFixtureWorkspace,
  normalizeWorkspacePayload,
} from "@/lib/workspace-repository";
import { readBodyText } from "@/lib/api-guard";
import { brandFromRow, groupWorkspaceItems, type BrandRow, type WorkspaceItemRow } from "@/lib/brand-rows";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { HublyWorkspaceData } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const WORKSPACES_DIR = path.join(DATA_DIR, "workspaces");
const LEGACY_DB_FILE = path.join(DATA_DIR, "hubly-db.json");

// El modo demo no tiene cuentas: publicado sin Supabase, cualquiera escribiría en el disco del servidor.
const demoDiskEnabled = process.env.NODE_ENV !== "production";

function sanitizeWorkspaceId(rawId?: string | null): string {
  const cleaned = (rawId || "default")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 64);
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

let workspaceWriteQueue: Promise<unknown> = Promise.resolve();
function exclusiveWorkspaceWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = workspaceWriteQueue.then(task, task);
  workspaceWriteQueue = run.catch(() => {});
  return run;
}

async function writeWorkspaceDb(
  workspaceId: string,
  data: HublyWorkspaceData
): Promise<HublyWorkspaceData> {
  return exclusiveWorkspaceWrite(async () => {
    const safeId = sanitizeWorkspaceId(workspaceId);
    const filePath = getWorkspaceFilePath(safeId);
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    const normalized = normalizeWorkspacePayload(data, safeId);

    await fs.mkdir(WORKSPACES_DIR, { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(normalized, null, 2), "utf8");
    await fs.rename(tmpPath, filePath);

    if (safeId === "default") {
      try {
        const legacyTmp = `${LEGACY_DB_FILE}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
        await fs.writeFile(legacyTmp, JSON.stringify(normalized, null, 2), "utf8");
        await fs.rename(legacyTmp, LEGACY_DB_FILE);
      } catch {
        // Non-fatal
      }
    }

    return normalized;
  });
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

  // El cliente de Supabase tipa esta relación como lista, aunque aquí devuelve una sola fila.
  const agency = membership.agencies as unknown as { name: string } | null;
  // Con la tabla de marcas poblada, ella manda y aplica los permisos por marca. Sin filas, o sin
  // la migración, se sigue con el documento. Va antes de normalizar: las filas reciben lo mismo que él.
  const doc = { ...(row.data as Partial<HublyWorkspaceData>) };
  const { data: brandRows, error: brandsError } = await supabase
    .from("brands")
    .select("id, name, slug, data")
    .eq("agency_id", membership.agency_id)
    .order("position");
  if (!brandsError && brandRows?.length) {
    doc.brands = (brandRows as BrandRow[]).map(brandFromRow);
    // 0014 copia posts y tareas: una lista vacía es real, y volver al documento mostraría lo que no puede ver.
    const [posts, tasks] = await Promise.all(
      ["posts", "tasks"].map((table) =>
        supabase.from(table).select("data").eq("agency_id", membership.agency_id).order("position")
      )
    );
    if (!posts.error) doc.posts = (posts.data ?? []).map((item) => item.data);
    if (!tasks.error) doc.tasks = (tasks.data ?? []).map((item) => item.data);
    // Sin la migración 0015 la consulta falla y estas colecciones siguen saliendo del documento.
    const { data: items, error: itemsError } = await supabase
      .from("workspace_items")
      .select("collection, data")
      .eq("agency_id", membership.agency_id)
      .order("position");
    if (!itemsError) Object.assign(doc, groupWorkspaceItems(items as WorkspaceItemRow[]));
  }

  const data = normalizeWorkspacePayload(doc, membership.agency_id, { live: true });
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
  const ROLE_LABEL: Record<string, string> = { owner: "Dueño", admin: "Administración", editor: "Edición", viewer: "Solo lectura" };
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
      role: ROLE_LABEL[m.role] || m.role,
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
  const text = await readBodyText(request, MAX_BODY_BYTES).catch(() => null);
  if (text === null) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const body = parseJson<{
    agencyId?: string;
    version?: number;
    data?: HublyWorkspaceData;
  }>(text);
  if (!body?.agencyId || typeof body.version !== "number" || !Array.isArray(body.data?.brands) || !Array.isArray(body.data?.posts)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("save_workspace", {
    target_agency: body.agencyId,
    // Lo personal no se guarda en el documento de la agencia.
    new_data: { ...body.data, profile: undefined, activeBrandId: undefined },
    expected_version: body.version,
  });
  if (error) {
    const known = { stale_version: 409, forbidden: 403, too_large: 413, too_deep: 413, invalid_payload: 400 } as const;
    const code = (Object.keys(known) as (keyof typeof known)[]).find((k) => error.message.includes(k));
    return code
      ? NextResponse.json({ error: code }, { status: known[code] })
      : NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, version: data });
}

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
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

  if (!demoDiskEnabled) return NextResponse.json(createSeedWorkspaceData(workspaceId));
  const data = await readWorkspaceDb(workspaceId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (backendEnabled) return livePost(request);
  if (!demoDiskEnabled) return NextResponse.json({ error: "demo_read_only" }, { status: 503 });
  let body: (Partial<HublyWorkspaceData> & { action?: string }) | null = null;
  try {
    const raw = await readBodyText(request, MAX_BODY_BYTES);
    if (raw === null) {
      return NextResponse.json({ error: "too_large" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
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
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const saved = await writeWorkspaceDb(workspaceId, body as HublyWorkspaceData);
    return NextResponse.json({
      ok: true,
      workspaceId: saved.workspaceId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save workspace" }, { status: 500 });
  }
}
