import { resolveDateInTimezone, sanitizeTimezone } from "./time";
import type { WorkspaceProfile } from "../types";

interface GreetingAndDateResult {
  greetingPrefix: "Buenos días" | "Buenas tardes" | "Buenas noches";
  greeting: string;
  userName: string;
  period: "morning" | "afternoon" | "night";
  weatherEmoji: "🌤️" | "☀️" | "🌙";
  dateFormatted: string; // ej. "domingo, 19 de abril"
  dateTitleCase: string; // ej. "Domingo, 19 de abril"
  isoDate: string; // YYYY-MM-DD en la zona horaria del perfil
  hour: number;
  timezone: string;
}


function capitalizeWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function selectGreetingAndDate(
  profile?: Partial<WorkspaceProfile> | null,
  testClockNow?: string | Date | null
): GreetingAndDateResult {
  const userName = profile?.name?.trim() || "Jair";
  const timezone = sanitizeTimezone(profile?.timezone);
  const { isoDate, day, hour, weekdayLong, monthLong } = resolveDateInTimezone(
    testClockNow,
    timezone
  );

  let greetingPrefix: "Buenos días" | "Buenas tardes" | "Buenas noches";
  let period: "morning" | "afternoon" | "night";
  let weatherEmoji: "🌤️" | "☀️" | "🌙";

  if (hour >= 5 && hour <= 11) {
    greetingPrefix = "Buenos días";
    period = "morning";
    weatherEmoji = "🌤️";
  } else if (hour >= 12 && hour <= 19) {
    greetingPrefix = "Buenas tardes";
    period = "afternoon";
    weatherEmoji = "🌤️";
  } else {
    greetingPrefix = "Buenas noches";
    period = "night";
    weatherEmoji = "🌙";
  }

  const dateFormatted = `${weekdayLong}, ${day} de ${monthLong}`;
  const dateTitleCase = `${capitalizeWord(weekdayLong)}, ${day} de ${monthLong.toLowerCase()}`;

  return {
    greetingPrefix,
    greeting: `${greetingPrefix}, ${userName}`,
    userName,
    period,
    weatherEmoji,
    dateFormatted,
    dateTitleCase,
    isoDate,
    hour,
    timezone,
  };
}

/* ========================================================================== */
/* 2. SELECTOR DE DESGLOSE Y AGRUPACIÓN DE TAREAS                             */
/* ========================================================================== */

