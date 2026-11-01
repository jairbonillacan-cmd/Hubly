"use client";

import { Button } from "@/components/app/ui/Button";
import { useState } from "react";
import { AccessPanel } from "@/components/app/AccessPanel";
import { askConfirm } from "@/components/app/AppDialogHost";
import { HublyPencilIcon, HublyPlusIcon } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import type { TeamMember } from "@/lib/types";
import { AjustesModal, PanelHead } from "./Panel";
import { ROLES } from "./RolesPanel";

function MarcasDeMiembro({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const brands = useHublyStore((s) => s.brands).filter((b) => !b.archived);
  const updateTeamMember = useHublyStore((s) => s.updateTeamMember);
  const [ids, setIds] = useState<string[]>(member.brandIds ?? []);
  const toggle = (id: string) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  return (
    <AjustesModal
      open
      title={`Marcas de ${member.name}`}
      onClose={onClose}
      onSubmit={() => {
        updateTeamMember(member.id, { brandIds: ids });
        onClose();
      }}
    >
      <div className="hubly-ajustes-list">
        {brands.map((b) => (
          <label key={b.id} className="hubly-ajustes-check">
            <input type="checkbox" checked={ids.includes(b.id)} onChange={() => toggle(b.id)} />
            <span className="hubly-ajustes-dot" style={{ background: b.color, color: "var(--on-accent)" }}>{b.initials}</span>
            {b.name}
          </label>
        ))}
      </div>
    </AjustesModal>
  );
}

export function EquipoPanel() {
  const team = useHublyStore((s) => s.team);
  const brands = useHublyStore((s) => s.brands);
  const profile = useHublyStore((s) => s.profile);
  const updateTeamMember = useHublyStore((s) => s.updateTeamMember);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  if (backendEnabled) {
    return (
      <section className="hubly-ajustes-panel" aria-label="Equipo">
        <PanelHead title="Equipo" subtitle="Miembros de la agencia y sus roles" />
        <AccessPanel />
      </section>
    );
  }

  const activeBrandIds = brands.filter((b) => !b.archived).map((b) => b.id);
  const addAll = async () => {
    if (!(await askConfirm("¿Agregar a todo el equipo a todas las marcas?", "Agregar"))) return;
    team.forEach((m) => updateTeamMember(m.id, { brandIds: activeBrandIds }));
  };

  return (
    <section className="hubly-ajustes-panel" aria-label="Equipo">
      <PanelHead
        title="Equipo"
        subtitle="Miembros de la agencia y sus roles"
        actions={
          <>
            <Button variant="secondary" onClick={() => void addAll()}>Agregar a todas las marcas</Button>
            <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
              <HublyPlusIcon size={17} /> Agregar miembro
            </Button>
          </>
        }
      />
      <div className="hubly-ajustes-list">
        {team.map((m) => (
          <div key={m.id} className="hubly-ajustes-row">
            <span className="hubly-ajustes-dot" style={{ background: m.avatarColor, color: "var(--on-accent)" }}>{m.initials}</span>
            <div className="hubly-ajustes-row-text">
              <div className="hubly-ajustes-row-title">
                {m.name}{m.email === profile?.email ? " (tú)" : ""}
              </div>
              <div className="hubly-ajustes-row-meta">{m.email}{m.status === "Invitado" ? " · Invitación pendiente" : ""}</div>
            </div>
            <div className="hubly-ajustes-row-actions">
              <Button variant="secondary" size="sm" onClick={() => setEditing(m)}>
                <HublyPencilIcon size={15} /> Editar marcas
              </Button>
              <select
                className="hubly-cal-line hubly-ajustes-select"
                aria-label={`Rol de ${m.name}`}
                value={m.role}
                onChange={(e) => updateTeamMember(m.id, { role: e.target.value })}
              >
                {!ROLES.some((r) => r.value === m.role) && <option value={m.role}>{m.role}</option>}
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.title}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
      {editing && <MarcasDeMiembro member={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
