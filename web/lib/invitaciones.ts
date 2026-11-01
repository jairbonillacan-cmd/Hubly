import { currentAgencyId, currentRole, liveAgencies } from "./live-workspace";
import { useHublyStore } from "./store";
import { backendEnabled } from "./supabase/config";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INVITE_ROLES = backendEnabled
  ? [
      { value: "admin", label: "Administración" },
      { value: "editor", label: "Edición" },
      { value: "viewer", label: "Solo lectura" },
    ]
  : [
      { value: "Admin", label: "Administración" },
      { value: "Content Manager", label: "Edición" },
      { value: "Cliente", label: "Solo lectura" },
    ];
export const DEFAULT_INVITE_ROLE = INVITE_ROLES[1].value;

const ERRORS: Record<string, string> = {
  forbidden: "Tu rol no permite invitar. Pídeselo a quien administra la agencia.",
  unavailable: "Los links de invitación aún no están activos en este proyecto.",
  failed: "No pudimos crear la invitación. Revisa tu conexión e inténtalo otra vez.",
};

export type InviteResult = { link: string } | { error: string };

export const canInvite = () => !backendEnabled || ["owner", "admin"].includes(currentRole() ?? "");

/** En quién ya está dentro no tiene sentido gastar una invitación. */
export function alreadyMember(email: string) {
  return useHublyStore.getState().team.some((m) => m.email.trim().toLowerCase() === email);
}

async function post(action: string, body: Record<string, string>): Promise<InviteResult> {
  try {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, agencyId: currentAgencyId() || "", ...body }),
    });
    const json = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!res.ok || !json.token) return { error: ERRORS[json.error ?? ""] || ERRORS.failed };
    return { link: `${window.location.origin}/invitacion/${json.token}` };
  } catch {
    return { error: ERRORS.failed };
  }
}

/** Invitación para un correo. Con cuentas reales vive en Supabase; en demo, en este navegador. */
export async function inviteByEmail(email: string, role: string, brandIds?: string[]): Promise<InviteResult> {
  if (backendEnabled) return post("invite", { email, role });
  return { link: useHublyStore.getState().inviteTeamMember({ email, role, brandIds }).inviteLink };
}

export function createInviteLink(role: string) {
  return post("inviteLink", { role });
}

export interface KnownPerson {
  email: string;
  name: string;
  agency: string;
}

/** Quienes comparten otra agencia contigo y aún no están en la actual. */
export async function loadKnownPeople(): Promise<KnownPerson[]> {
  if (!backendEnabled) return [];
  const others = liveAgencies().filter((a) => a.id !== currentAgencyId());
  const lists = await Promise.all(
    others.map(async (agency) => {
      const res = await fetch(`/api/members?agencyId=${agency.id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("members");
      const { members } = (await res.json()) as { members: { email: string; name: string }[] };
      return members.map((m) => ({ email: m.email.toLowerCase(), name: m.name || m.email, agency: agency.name }));
    })
  );
  const people = new Map<string, KnownPerson>();
  for (const person of lists.flat()) {
    if (!alreadyMember(person.email) && !people.has(person.email)) people.set(person.email, person);
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}
