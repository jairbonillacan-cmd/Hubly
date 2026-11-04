"use client";

import { useState } from "react";
import { useHublyStore } from "@/lib/store";
import type { EvaluatedTeamMember } from "@/lib/domain/team";
import type { BrandWorkspace } from "@/lib/types";
import {
  HublyCheckIcon as Check,
  HublyPencilIcon as Pencil,
} from "@/components/app/icons/DuotoneIcons";

interface EquipoResumenProps {
  member: EvaluatedTeamMember;
  isPrimaryOwner: boolean;
  assignedBrands: BrandWorkspace[];
  onToggleBrand: (brandId: string) => void;
}

export function EquipoResumen({
  member,
  isPrimaryOwner,
  assignedBrands,
  onToggleBrand,
}: EquipoResumenProps) {
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const [editingBrandsOpen, setEditingBrandsOpen] = useState(false);

  return (
    <div className="hubly-equipo-profile-row">
      <div className="hubly-equipo-profile-main">
        <div className="hubly-equipo-avatar-lg">
          {member.avatarInitial.slice(0, 1)}
        </div>

        <div>
          <h3 className="hubly-equipo-profile-name">
            <span>{isPrimaryOwner ? profile.name : member.name}</span>
            {isPrimaryOwner && (
              <span className="hubly-equipo-profile-you">(tú)</span>
            )}
          </h3>
          <div className="hubly-equipo-profile-role">
            {isPrimaryOwner ? profile.role : member.role}
          </div>
          <div className="hubly-equipo-profile-brands-count">
            {assignedBrands.length}{" "}
            {assignedBrands.length === 1 ? "marca" : "marcas"}
          </div>
        </div>
      </div>

      <div className="hubly-equipo-brands-editor">
        <button
          type="button"
          onClick={() => setEditingBrandsOpen((prev) => !prev)}
          className="hbtn-outline hubly-equipo-edit-brands-btn"
          aria-expanded={editingBrandsOpen}
        >
          <Pencil size={12.5} />
          <span>Editar marcas</span>
        </button>

        {editingBrandsOpen && (
          <div className="hubly-equipo-brands-popover">
            <div className="hubly-equipo-brands-popover-title">
              Marcas asignadas a {member.name}
            </div>
            <div className="hubly-equipo-brands-popover-list">
              {brands.map((b) => {
                const isAssigned = assignedBrands.some((ab) => ab.id === b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={isAssigned}
                    onClick={() => onToggleBrand(b.id)}
                    className="hubly-equipo-brand-option"
                  >
                    <span className="hubly-equipo-brand-option-left">
                      <span
                        className="hubly-equipo-brand-dot"
                        style={{ background: b.color || "var(--hb-accent)" }}
                      >
                        {b.initials.slice(0, 1)}
                      </span>
                      <span>{b.name}</span>
                    </span>
                    {isAssigned && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
