import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createSeedWorkspaceData } from "@/lib/seed-data";
import {
  buildReferenceFixtureWorkspace,
  normalizeWorkspacePayload,
} from "@/lib/workspace-repository";
import type { HublyWorkspaceData } from "@/lib/types";

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

export async function GET(request: Request) {
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
