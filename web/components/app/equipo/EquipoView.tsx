"use client";

import { useEquipoView } from "./useEquipoView";
import { EquipoCabecera } from "./EquipoCabecera";
import { EquipoMiembros } from "./EquipoMiembros";
import { EquipoResumen } from "./EquipoResumen";
import { EquipoProgreso } from "./EquipoProgreso";
import { EquipoLogrosRanking } from "./EquipoLogrosRanking";

export function EquipoView() {
  const view = useEquipoView();

  return (
    <div className="hubly-touch" style={{ maxWidth: 1120, width: "100%", paddingBottom: 48 }}>
      <EquipoCabecera view={view} />
      <EquipoMiembros view={view} />
      <EquipoResumen view={view} />
      <EquipoProgreso view={view} />
      <EquipoLogrosRanking view={view} />
    </div>
  );
}
