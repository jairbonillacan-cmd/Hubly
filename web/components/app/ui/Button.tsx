import type { ButtonHTMLAttributes, Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Solo icono: requiere `aria-label`. */
  iconOnly?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/** Receta §9.2 de la guía. `type` es "button" salvo que se pida otro. */
export function Button({ variant = "secondary", size = "md", iconOnly, className, type = "button", ...props }: ButtonProps) {
  const classes = ["hbtn", `hbtn-${variant}`, size !== "md" && `hbtn-${size}`, iconOnly && "hbtn-ic", className];
  return <button type={type} className={classes.filter(Boolean).join(" ")} {...props} />;
}
