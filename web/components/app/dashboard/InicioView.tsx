"use client";

import { MotionConfig } from "motion/react";

import { useInicioView } from "./useInicioView";
import { InicioContenido } from "./InicioContenido";

export function InicioView() {
  const view = useInicioView();

  return (
    <MotionConfig reducedMotion="user">
      <InicioContenido view={view} />
    </MotionConfig>
  );
}
