"use client";

import { useCallback, useEffect, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { currentAgencyId, liveAgencies, selectLiveAgency } from "@/lib/live-workspace";
import { askConfirm } from "@/components/app/AppDialogHost";

interface Member { user_id: string; role: string; email: string; name: string }
interface Invitation { id: string; email: string; role: string; expires_at: string; accepted_at: string | null; revoked_at: string | null }
interface ShareLink { id: string; brand_id: string; expires_at: string; revoked_at: string | null; created_at: string }

const ROLES: Record<string, string> = { owner: "Dueño", admin: "Administración", editor: "Edición", viewer: "Solo lectura" };
const ERRORS: Record<string, string> = {
  last_owner: "La agencia debe conservar al menos un dueño.",
  forbidden: "Tu rol no permite hacer esto.",
  failed: "No se pudo completar. Inténtalo de nuevo.",
};
const fmt = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export function AccessPanel() {
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const agencyId = currentAgencyId();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!agencyId) return;
    const res = await fetch(`/api/members?agencyId=${agencyId}`, { cache: "no-store" });
    if (!res.ok) return setError(ERRORS.forbidden);
    const json = await res.json();
    setMembers(json.members);
    setInvitations(json.invitations);
    setLinks(json.links);
  }, [agencyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (body: Record<string, string>) => {
    setError(null);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId: agencyId || "", ...body }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(ERRORS[json.error] || ERRORS.failed);
      return null;
    }
    await load();
    return json as { token?: string };
  };

  const mine = members.find((m) => m.email === profile?.email);
  const isOwner = mine?.role === "owner";
  const canManage = isOwner || mine?.role === "admin";
  const openInvites = invitations.filter((i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date());
  const activeLinks = links.filter((l) => !l.revoked_at && new Date(l.expires_at) > new Date());

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <section style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          Agencia
          <select
            value={agencyId || ""}
            onChange={(e) => {
              selectLiveAgency(e.target.value);
              window.location.assign("/dashboard");
            }}
            style={field}
          >
            {liveAgencies().map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <a href="/onboarding?nueva=1" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ui-accent-text-2)" }}>Crear otra agencia</a>
      </section>

      {error && <p role="alert" style={{ margin: 0, color: "#B91C1C", fontSize: 13 }}>{error}</p>}

      <section>
        <h2 style={h2}>Miembros ({members.length})</h2>
        <ul style={list}>
          {members.map((m) => (
            <li key={m.user_id} style={row}>
              <span style={{ flex: "1 1 180px", minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 13.5 }}>{m.name || m.email}{m.email === profile?.email ? " (tú)" : ""}</strong>
                <span style={muted}>{m.email}</span>
              </span>
              {isOwner ? (
                <select aria-label={`Rol de ${m.email}`} value={m.role} onChange={(e) => void act({ action: "setRole", userId: m.user_id, role: e.target.value })} style={field}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              ) : (
                <span style={muted}>{ROLES[m.role]}</span>
              )}
              {isOwner && m.email !== profile?.email && (
                <button
                  type="button"
                  style={danger}
                  onClick={async () => {
                    if (await askConfirm(`¿Quitar a ${m.email} de la agencia?`, "Quitar")) void act({ action: "remove", userId: m.user_id });
                  }}
                >
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {canManage && (
        <section>
          <h2 style={h2}>Invitar</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setInviteLink(null);
              const res = await act({ action: "invite", email: email.trim(), role });
              if (res?.token) {
                setInviteLink(`${window.location.origin}/invitacion/${res.token}`);
                setEmail("");
              }
            }}
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@agencia.com" aria-label="Correo a invitar" style={{ ...field, flex: "1 1 200px" }} />
            <select aria-label="Rol de la invitación" value={role} onChange={(e) => setRole(e.target.value)} style={field}>
              <option value="admin">Administración</option>
              <option value="editor">Edición</option>
              <option value="viewer">Solo lectura</option>
            </select>
            <button type="submit" style={primary}>Crear invitación</button>
          </form>
          {inviteLink && (
            <p role="status" style={{ fontSize: 12.5, margin: "8px 0 0", wordBreak: "break-all" }}>
              Comparte este enlace, caduca en 7 días y solo se muestra ahora: <code>{inviteLink}</code>{" "}
              <button type="button" onClick={() => navigator.clipboard?.writeText(inviteLink).catch(() => {})} style={linkBtn}>Copiar</button>
            </p>
          )}
          {openInvites.length > 0 && (
            <ul style={{ ...list, marginTop: 10 }}>
              {openInvites.map((i) => (
                <li key={i.id} style={row}>
                  <span style={{ flex: "1 1 180px", fontSize: 13 }}>{i.email} · {ROLES[i.role]}</span>
                  <span style={muted}>Caduca {fmt(i.expires_at)}</span>
                  <button type="button" style={danger} onClick={() => void act({ action: "revokeInvitation", id: i.id })}>Revocar</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 style={h2}>Enlaces de revisión activos ({activeLinks.length})</h2>
        {activeLinks.length === 0 ? (
          <p style={muted}>Se crean al compartir una parrilla con un cliente.</p>
        ) : (
          <ul style={list}>
            {activeLinks.map((l) => (
              <li key={l.id} style={row}>
                <span style={{ flex: "1 1 180px", fontSize: 13 }}>{brands.find((b) => b.id === l.brand_id)?.name || l.brand_id}</span>
                <span style={muted}>Creado {fmt(l.created_at)} · caduca {fmt(l.expires_at)}</span>
                <button type="button" style={danger} onClick={() => void act({ action: "revokeLink", id: l.id })}>Revocar</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const h2 = { fontSize: 15, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 10px" } as const;
const list = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 } as const;
const row = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "10px 12px" } as const;
const muted = { fontSize: 12, color: "var(--ui-text-4)" } as const;
const field = { border: "1px solid var(--ui-border-strong)", borderRadius: 9, padding: "7px 9px", fontSize: 13, background: "var(--ui-surface)", minWidth: 0 } as const;
const primary = { border: 0, borderRadius: 9, background: "var(--hb-accent)", color: "#FFFFFF", padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const;
const danger = { border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" } as const;
const linkBtn = { border: 0, background: "transparent", color: "var(--ui-accent-text-2)", fontWeight: 600, cursor: "pointer", padding: 0 } as const;
