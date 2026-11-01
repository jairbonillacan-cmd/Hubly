import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  /** "div" cuando el campo agrupa varios controles y una `label` no le corresponde. */
  as?: "label" | "div";
}

/** Receta §9.4 de la guía: etiqueta visible, control y ayuda opcional. */
export function Field({ label, hint, children, as: Tag = "label" }: FieldProps) {
  return (
    <Tag className="hubly-cal-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </Tag>
  );
}
