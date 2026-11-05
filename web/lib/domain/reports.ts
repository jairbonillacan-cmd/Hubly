/**
 * El mes que enseña un reporte público: `YYYY-MM` del enlace si es válido y,
 * si no, el mes de hoy. No estima nada: solo elige la etiqueta.
 */
export function resolveReportMonth(
  requested: string | null | undefined,
  todayIso: string,
): string {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(requested ?? "") ? (requested as string) : todayIso.slice(0, 7);
}
