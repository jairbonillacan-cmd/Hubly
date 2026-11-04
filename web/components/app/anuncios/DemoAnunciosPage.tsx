"use client";

import { useDemoAnunciosPage } from "./useDemoAnunciosPage";
import { AnunciosCabecera } from "./AnunciosCabecera";
import { AnunciosTarjetas } from "./AnunciosTarjetas";
import { AnunciosDiagnostico } from "./AnunciosDiagnostico";

export function DemoAnunciosPage() {
  const view = useDemoAnunciosPage();

  return (
    <div
      className="hubly-touch"
      style={{
        color: "var(--ui-text)",
        minHeight: "calc(100vh - 64px)",
        position: "relative",
        paddingBottom: 60,
      }}
    >
      <AnunciosCabecera view={view} />
      <AnunciosTarjetas view={view} />
      <AnunciosDiagnostico view={view} />
    </div>
  );
}
