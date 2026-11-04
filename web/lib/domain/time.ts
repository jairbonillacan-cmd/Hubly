/* Zona horaria y fechas: los selectores de todas las pantallas parten de aquí. */

export function sanitizeTimezone(tz?: string | null): string {
  if (!tz || typeof tz !== "string") return "America/Mexico_City";
  const cleaned = tz.split("(")[0].trim();
  if (!cleaned) return "America/Mexico_City";
  try {
    Intl.DateTimeFormat("es-MX", { timeZone: cleaned });
    return cleaned;
  } catch {
    return "America/Mexico_City";
  }
}

export function resolveDateInTimezone(
  referenceNow?: string | Date | null,
  timezone = "America/Mexico_City"
): {
  dateObj: Date;
  isoDate: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  weekdayLong: string;
  monthLong: string;
} {
  const tz = sanitizeTimezone(timezone);
  let dateObj: Date;
  if (referenceNow instanceof Date) {
    dateObj = isNaN(referenceNow.getTime()) ? new Date() : referenceNow;
  } else if (typeof referenceNow === "string" && referenceNow.trim().length > 0) {
    const parsed = new Date(referenceNow);
    dateObj = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    dateObj = new Date();
  }

  const numericParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(dateObj);

  const getPart = (type: string, fallback: string) =>
    numericParts.find((p) => p.type === type)?.value || fallback;

  const yearStr = getPart("year", "2026");
  const monthStr = getPart("month", "10");
  const dayStr = getPart("day", "30");
  const rawHour = Number(getPart("hour", "12"));
  const hour = rawHour === 24 ? 0 : rawHour;

  const esParts = new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(dateObj);

  const weekdayLong = (
    esParts.find((p) => p.type === "weekday")?.value || "viernes"
  ).toLowerCase();
  const monthLong = (
    esParts.find((p) => p.type === "month")?.value || "octubre"
  ).toLowerCase();

  return {
    dateObj,
    isoDate: `${yearStr}-${monthStr}-${dayStr}`,
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
    hour,
    weekdayLong,
    monthLong,
  };
}


export function addDaysToIsoDate(isoDate: string, daysOffset: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const utc = new Date(Date.UTC(y, m - 1, d + daysOffset));
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

