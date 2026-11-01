"use client";

import { useEquipoView } from "./team/useEquipoView";
import { EquipoCabecera } from "./team/EquipoCabecera";
import { EquipoMiembros } from "./team/EquipoMiembros";
import { EquipoResumen } from "./team/EquipoResumen";
import { EquipoProgreso } from "./team/EquipoProgreso";
import { EquipoLogrosRanking } from "./team/EquipoLogrosRanking";
import { EquipoCatalogo } from "./team/EquipoCatalogo";

export function EquipoView() {
  const view = useEquipoView();

  return (
    <div className="hubly-touch" style={{ maxWidth: 1120, width: "100%", paddingBottom: 48 }}>
      <EquipoCabecera view={view} />
      <EquipoMiembros view={view} />
      <EquipoResumen view={view} />
      <EquipoProgreso view={view} />
      <EquipoLogrosRanking view={view} />
      <EquipoCatalogo view={view} />
    </div>
  );
}
