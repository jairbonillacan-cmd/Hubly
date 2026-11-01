import type { HublyWorkspaceData } from "./types";
import { adoptLegacyKey } from "./account-scoped-storage";
import { mergeWorkspace } from "./workspace-merge";

export type SaveState = "idle" | "saving" | "saved" | "error" | "conflict" | "readonly";
type LiveLoad =
  | { kind: "ok"; data: HublyWorkspaceData; agencyId: string; role: string }
  | { kind: "no_agency" }
  | { kind: "unauthenticated" }
  | { kind: "error" };

const SAVE_DELAY_MS = 500;
let agencyId: string | null = null;
let version = 0;
// Lo último que coincidió con el servidor: la base para unir cambios de otra persona.
let base: HublyWorkspaceData | null = null;
let onMerged: ((data: HublyWorkspaceData) => void) | null = null;
export const onLiveMerge = (listener: (data: HublyWorkspaceData) => void) => {
  onMerged = listener;
};
let pending: HublyWorkspaceData | null = null;
let conflicted: HublyWorkspaceData | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let readOnly = false;
let role: string | null = null;
let agencies: { id: string; name: string }[] = [];
const AGENCY_KEY = "hubly:agencia-activa";
// La copia de conflicto es de quien la generó: otra cuenta en el mismo navegador no debe leerla.
let accountId = "";
const conflictKey = (id: string) => `hubly:conflicto:${id}:${accountId}`;

export const liveAgencies = () => agencies;
export function selectLiveAgency(id: string) {
  try {
    localStorage.setItem(AGENCY_KEY, id);
  } catch { /* Almacenamiento lleno o bloqueado: se sigue sin él. */ }
}
function selectedAgency() {
  try {
    return localStorage.getItem(AGENCY_KEY);
  } catch {
    return null;
  }
}

export const currentAgencyId = () => agencyId;
export const currentRole = () => role;
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
  } catch (error) {
    // Sin esta copia, recargar pierde los cambios en conflicto: que quede rastro.
    console.warn("No se pudo guardar la copia de conflicto", error);
  }
}

function dropConflict() {
  conflicted = null;
  if (!agencyId) return;
  try {
    localStorage.removeItem(conflictKey(agencyId));
  } catch { /* Almacenamiento lleno o bloqueado: se sigue sin él. */ }
}

function restoreConflict() {
  if (!agencyId) return;
  try {
    // Clave antigua (solo agencia): se adopta para esta cuenta y se borra.
    adoptLegacyKey(`hubly:conflicto:${agencyId}`, conflictKey(agencyId), localStorage);
    const saved = localStorage.getItem(conflictKey(agencyId));
    if (!saved) return;
    conflicted = JSON.parse(saved) as HublyWorkspaceData;
    setTimeout(() => emit("conflict"), 0);
  } catch { /* Almacenamiento lleno o bloqueado: se sigue sin él. */ }
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
    accountId = json.data.profile?.id ?? "";
    version = json.version;
    base = json.data;
    role = json.role;
    readOnly = json.role === "viewer";
    if (!readOnly && !conflicted) restoreConflict();
    return { kind: "ok", data: json.data, agencyId: json.agencyId, role: json.role };
  } catch {
    return { kind: "error" };
  }
}

/** Alguien guardó antes. Si no tocó lo mismo se unen los cambios; si no, decide la persona. */
async function mergeWithTeam(sent: HublyWorkspaceData): Promise<boolean> {
  if (!base || !agencyId) return false;
  try {
    const res = await fetch(`/api/workspace?agencyId=${encodeURIComponent(agencyId)}`, { cache: "no-store" });
    if (!res.ok) return false;
    const fresh = (await res.json()) as { data: HublyWorkspaceData; version: number };
    const { merged, conflicts } = mergeWorkspace(base, pending ?? sent, fresh.data);
    if (conflicts.length) return false;
    version = fresh.version;
    base = fresh.data;
    pending = merged;
    onMerged?.(merged);
    void flush();
    return true;
  } catch {
    return false;
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
      if (await mergeWithTeam(data)) return;
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
    base = data;
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
  base = null;
  await flush();
}

/** La persona eligió la versión del equipo: descarta el respaldo; quien llama recarga los datos. */
export function discardMyVersion() {
  dropConflict();
  pending = null;
  emit("idle");
}
