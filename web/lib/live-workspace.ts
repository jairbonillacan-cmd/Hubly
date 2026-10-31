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
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let readOnly = false;

export const currentAgencyId = () => agencyId;
export const hasPendingSave = () => pending !== null || inFlight;

function emit(state: SaveState) {
  window.dispatchEvent(new CustomEvent<SaveState>("hubly:save-state", { detail: state }));
}

export async function loadLiveWorkspace(): Promise<LiveLoad> {
  try {
    const res = await fetch("/api/workspace", { cache: "no-store" });
    if (res.status === 401) return { kind: "unauthenticated" };
    if (res.status === 404) return { kind: "no_agency" };
    if (!res.ok) return { kind: "error" };
    const json = (await res.json()) as { data: HublyWorkspaceData; version: number; agencyId: string; role: string };
    agencyId = json.agencyId;
    version = json.version;
    readOnly = json.role === "viewer";
    return { kind: "ok", data: json.data, agencyId: json.agencyId, role: json.role };
  } catch {
    return { kind: "error" };
  }
}

async function flush() {
  if (inFlight || !pending || !agencyId) return;
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
  pending = data;
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
}

export function retryLiveSave() {
  void flush();
}
