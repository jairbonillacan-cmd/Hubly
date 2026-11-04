"use client";

import { useMemo } from "react";
import { MotionConfig } from "motion/react";
import { useHublyStore } from "@/lib/store";
import { selectGreetingAndDate } from "@/lib/domain-selectors";

import "./dashboard.css";
import { InicioContenido } from "./InicioContenido";

export function InicioView() {
  const profile = useHublyStore((s) => s.profile);
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const greetingInfo = useMemo(
    () => selectGreetingAndDate(profile, fixedIsoNow),
    [profile, fixedIsoNow]
  );

  return (
    <MotionConfig reducedMotion="user">
      <InicioContenido greetingInfo={greetingInfo} />
    </MotionConfig>
  );
}
