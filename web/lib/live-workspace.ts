import type { HublyWorkspaceData } from "./types";

export type SaveState = "idle" | "saving" | "saved" | "error" | "conflict" | "readonly";
export type LiveLoad =
  | { kind: "ok"; data: HublyWorkspaceData; agencyId: string; role: string }
  | { kind: "no_agency" }
  | { kind: "unauthenticated" }
  | { kind: "error" };

const SAVE_DELAY_MS = 500;
let agencyId: string | null = null;
let version = 0;
let pending: HublyWorkspaceData | null = null;
let conflicted: HublyWorkspaceData | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let readOnly = false;
let agencies: { id: string; name: string }[] = [];
const AGENCY_KEY = "hubly:agencia-activa";
const conflictKey = (id: string) => `hubly:conflicto:${id}`;

export const liveAgencies = () => agencies;
export function selectLiveAgency(id: string) {
  try {
    localStorage.setItem(AGENCY_KEY, id);
  } catch {}
}
function selectedAgency() {
  try {
    return localStorage.getItem(AGENCY_KEY);
  } catch {
    return null;
  }
}

export const currentAgencyId = () => agencyId;
export const hasPendingSave = () => pending !== null || inFlight || conflicted !== null;

function emit(state: SaveState) {
  window.dispatchEvent(new CustomEvent<SaveState>("hubly:save-state", { detail: state }));
}

/** Copia de respaldo: el cambio rechazado sobrevive a una recarga hasta que la persona decida. */
function keepConflict(data: HublyWorkspaceData) {
  conflicted = data;
  if (!agencyId) return;
  try {
    localStorage.setItem(conflictKey(agencyId), JSON.stringify(data));
  } catch {}
}

function dropConflict() {
  conflicted = null;
  if (!agencyId) return;
  try {
    localStorage.removeItem(conflictKey(agencyId));
  } catch {}
}

function restoreConflict() {
  if (!agencyId) return;
  try {
    const saved = localStorage.getItem(conflictKey(agencyId));
    if (!saved) return;
    conflicted = JSON.parse(saved) as HublyWorkspaceData;
    setTimeout(() => emit("conflict"), 0);
  } catch {}
}

export async function loadLiveWorkspace(): Promise<LiveLoad> {
  try {
    const wanted = selectedAgency();
    const res = await fetch(`/api/workspace${wanted ? `?agencyId=${encodeURIComponent(wanted)}` : ""}`, { cache: "no-store" });
    if (res.status === 401) return { kind: "unauthenticated" };
    if (res.status === 404) return { kind: "no_agency" };
    if (!res.ok) return { kind: "error" };
    const json = (await res.json()) as { data: HublyWorkspaceData; version: number; agencyId: string; role: string; agencies?: { id: string; name: string }[] };
    agencies = json.agencies ?? [];
    agencyId = json.agencyId;
    version = json.version;
    readOnly = json.role === "viewer";
    if (!readOnly && !conflicted) restoreConflict();
    return { kind: "ok", data: json.data, agencyId: json.agencyId, role: json.role };
  } catch {
    return { kind: "error" };
  }
}

async function flush() {
  if (inFlight || !pending || !agencyId || conflicted) return;
  const data = pending;
  pending = null;
  inFlight = true;
  emit("saving");
  try {
    const res = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, version, data }),
    });
    inFlight = false;
    if (res.status === 409) {
      keepConflict(pending ?? data);
      pending = null;
      emit("conflict");
      return;
    }
    if (!res.ok) {
      pending = pending ?? data;
      emit("error");
      return;
    }
    version = ((await res.json()) as { version: number }).version;
    if (pending) void flush();
    else emit("saved");
  } catch {
    inFlight = false;
    pending = pending ?? data;
    emit("error");
  }
}

/** Guarda solo el último estado y nunca dos a la vez, para no chocar con su propia versión. */
export function queueLiveSave(data: HublyWorkspaceData) {
  if (readOnly) {
    emit("readonly");
    return;
  }
  if (conflicted) {
    keepConflict(data);
    emit("conflict");
    return;
  }
  pending = data;
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
}

export function retryLiveSave() {
  void flush();
}

/** La persona eligió conservar su versión: reemplaza a la del equipo, nunca de forma automática. */
export async function keepMyVersion() {
  const mine = conflicted;
  if (!mine || !agencyId) return;
  try {
    const res = await fetch(`/api/workspace?agencyId=${encodeURIComponent(agencyId)}`, { cache: "no-store" });
    if (!res.ok) {
      emit("error");
      return;
    }
    version = ((await res.json()) as { version: number }).version;
  } catch {
    emit("error");
    return;
  }
  dropConflict();
  pending = mine;
  await flush();
}

/** La persona eligió la versión del equipo: descarta el respaldo; quien llama recarga los datos. */
export function discardMyVersion() {
  dropConflict();
  pending = null;
  emit("idle");
}
