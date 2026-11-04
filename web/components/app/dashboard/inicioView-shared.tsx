
/* ==========================================================================
   ICONOS E ILUSTRACIONES DE ESTADOS VACÍOS Y WIDGETS DE INICIO
   ========================================================================== */

export function notebookStamp(index: number, updatedAt: string) {
  const date = new Date(updatedAt);
  const number = `N° ${String(index + 1).padStart(2, "0")}`;
  if (Number.isNaN(date.getTime())) return number;
  const month = date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
  return `${number} · ${month} ${String(date.getFullYear()).slice(-2)}`;
}
