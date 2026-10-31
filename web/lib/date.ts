/** Fecha YYYY-MM-DD en la zona horaria del usuario; toISOString la adelantaría de noche. */
export function localIsoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
