import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { MediaRecord } from "./media";

// Solo modo demo: sin Supabase los archivos viven en .data, junto al workspace local.
const DIR = path.join(process.cwd(), ".data", "media");
const INDEX = path.join(DIR, "index.json");
const ID = /^[0-9a-f-]{36}$/;

async function readIndex(): Promise<MediaRecord[]> {
  try {
    return JSON.parse(await fs.readFile(INDEX, "utf8")) as MediaRecord[];
  } catch {
    return [];
  }
}

async function writeIndex(records: MediaRecord[]) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(INDEX, JSON.stringify(records, null, 2), "utf8");
}

// Varias subidas simultáneas no deben pisarse el índice: se escribe de una en una.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

export const demoFilePath = (id: string) => (ID.test(id) ? path.join(DIR, id) : null);

export async function demoList(brandId: string) {
  return exclusive(async () => (await readIndex()).filter((r) => r.brandId === brandId && r.status === "ready"));
}

export async function demoCreate(input: Omit<MediaRecord, "id" | "status" | "createdAt">) {
  const record: MediaRecord = { ...input, id: randomUUID(), status: "pending", createdAt: new Date().toISOString() };
  await exclusive(async () => writeIndex([record, ...(await readIndex())]));
  return record;
}

export async function demoGet(id: string) {
  return exclusive(async () => (await readIndex()).find((r) => r.id === id) ?? null);
}

export async function demoUpdate(id: string, patch: Partial<Pick<MediaRecord, "status" | "folder" | "name">>) {
  await exclusive(async () => writeIndex((await readIndex()).map((r) => (r.id === id ? { ...r, ...patch } : r))));
}

export async function demoRemove(id: string) {
  await exclusive(async () => writeIndex((await readIndex()).filter((r) => r.id !== id)));
  const file = demoFilePath(id);
  if (file) await fs.rm(file, { force: true });
}

/** Limpieza diferida: lo que empezó a subirse y nunca se confirmó. */
export async function demoPurgePending(olderThanMs: number) {
  const stale = await exclusive(async () => {
    const records = await readIndex();
    const limit = Date.now() - olderThanMs;
    return records.filter((r) => r.status === "pending" && Date.parse(r.createdAt) < limit);
  });
  for (const r of stale) {
    await demoRemove(r.id);
  }
}
