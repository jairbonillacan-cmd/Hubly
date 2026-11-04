import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { brandFromRow, groupWorkspaceItems, type BrandRow, type WorkspaceItemRow } from "@/lib/brand-rows";
import { ROLE_LABEL } from "@/lib/labels";
import { createSeedWorkspaceData } from "@/lib/seed-data";
import type { createSupabaseServer } from "@/lib/supabase/server";
import type { HublyWorkspaceData } from "@/lib/types";
import {
  buildReferenceFixtureWorkspace,
  normalizeWorkspacePayload,
} from "@/lib/workspace-repository";

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServer>>;
type AuthUser = NonNullable<Awaited<ReturnType<SupabaseServer["auth"]["getUser"]>>["data"]["user"]>;

const DATA_DIR = path.join(process.cwd(), ".data");
const WORKSPACES_DIR = path.join(DATA_DIR, "workspaces");
const LEGACY_DB_FILE = path.join(DATA_DIR, "hubly-db.json");

// El modo demo no tiene cuentas: publicado sin Supabase, cualquiera escribiría en el disco del servidor.
export const demoDiskEnabled = process.env.NODE_ENV !== "production";
export const MAX_WORKSPACE_BODY_BYTES = 8 * 1024 * 1024;

export function sanitizeWorkspaceId(rawId?: string | null): string {
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

export async function loadDemoWorkspace(
  workspaceId: string,
  fixture: string | null
): Promise<HublyWorkspaceData> {
  if (fixture === "reference" || fixture === "1") {
    return buildReferenceFixtureWorkspace(workspaceId);
  }
  if (!demoDiskEnabled) return createSeedWorkspaceData(workspaceId);
  return readWorkspaceDb(workspaceId);
}

export async function resetDemoWorkspace(workspaceId: string) {
  const fresh = createSeedWorkspaceData(workspaceId);
  await writeWorkspaceDb(workspaceId, fresh);
  return NextResponse.json({ ok: true, workspaceId, data: fresh });
}

export async function saveDemoWorkspace(workspaceId: string, data: HublyWorkspaceData) {
  try {
    const saved = await writeWorkspaceDb(workspaceId, data);
    return NextResponse.json({
      ok: true,
      workspaceId: saved.workspaceId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save workspace" }, { status: 500 });
  }
}

export async function loadLiveWorkspace(
  supabase: SupabaseServer,
  user: AuthUser,
  requestedAgency: string | null
) {
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role, agencies(name)")
    .eq("user_id", user.id)
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
  const name = (user.user_metadata?.name as string) || user.email || "";
  data.agencyName = agency?.name || data.agencyName;
  data.agency = { ...data.agency, id: membership.agency_id, name: data.agencyName };
  data.profile = {
    ...data.profile,
    id: user.id,
    email: user.email || "",
    name,
    avatarInitial: name.slice(0, 1).toUpperCase(),
    avatarUrl: (user.user_metadata?.avatar_url as string) || undefined,
    avatarSourceUrl: (user.user_metadata?.avatar_source_url as string) || undefined,
  };
  const { data: members } = await supabase.rpc("list_members", { target_agency: membership.agency_id });
  data.team = ((members ?? []) as { user_id: string; role: string; email: string; name: string }[]).map((m) => {
    const saved = data.team.find((t) => t.email === m.email);
    const memberName = m.user_id === user.id ? data.profile.name : m.name || saved?.name || m.email;
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

export async function saveLiveWorkspace(
  supabase: SupabaseServer,
  agencyId: string,
  version: number,
  workspaceData: HublyWorkspaceData
) {
  const { data, error } = await supabase.rpc("save_workspace", {
    target_agency: agencyId,
    // Lo personal no se guarda en el documento de la agencia.
    new_data: { ...workspaceData, profile: undefined, activeBrandId: undefined },
    expected_version: version,
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
