/* eslint-disable @next/next/no-img-element */
const RATIOS = { isologo: 1613 / 420, isotipo: 1, logotipo: 1520 / 643 } as const;

type LogoKind = keyof typeof RATIOS;

/** `on` es el fondo donde se muestra; "auto" sigue el tema elegido en Hubly. */
export function HublyBrandLogo({
  kind = "isologo",
  on = "auto",
  height = 36,
  alt = "Hubly",
}: {
  kind?: LogoKind;
  on?: "auto" | "light" | "dark";
  height?: number;
  alt?: string;
}) {
  const width = Math.round(height * RATIOS[kind]);
  const src = (variant: "light" | "dark") => `/brand/logos/hubly-${kind}-${variant}.svg`;

  if (on !== "auto") {
    return (
      <span className="hubly-brand" style={{ height }}>
        <img src={src(on)} alt={alt} width={width} height={height} />
      </span>
    );
  }
  return (
    <span className="hubly-brand hubly-brand--auto" style={{ height }}>
      <img className="hubly-brand-light" src={src("light")} alt={alt} width={width} height={height} />
      <img className="hubly-brand-dark" src={src("dark")} alt={alt} width={width} height={height} />
    </span>
  );
}
