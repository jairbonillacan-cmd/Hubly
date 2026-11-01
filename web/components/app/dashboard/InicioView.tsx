"use client";

import { MotionConfig } from "motion/react";

import { useInicioView } from "./inicio/useInicioView";
import { InicioContenido } from "./inicio/InicioContenido";

export function InicioView() {
  const view = useInicioView();

  return (
    <MotionConfig reducedMotion="user">
      <InicioContenido view={view} />
    </MotionConfig>
  );
}
