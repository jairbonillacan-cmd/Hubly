import type { ReactNode } from "react";

/** Vacío de pantalla, receta §9.8 de la guía: título «Sin + objeto» y una línea de texto. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="hubly-cal-empty">
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}
