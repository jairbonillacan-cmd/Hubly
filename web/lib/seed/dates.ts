import { addDays, localIsoDate } from "../date";

export interface SeedDates {
  todayIso: string;
  tomorrowIso: string;
  inTwoDaysIso: string;
  twoDaysAgoIso: string;
}

export function resolveBaseDates(referenceFixture?: boolean): SeedDates {
  if (referenceFixture) {
    return {
      todayIso: "2026-04-19",
      tomorrowIso: "2026-04-20",
      inTwoDaysIso: "2026-04-21",
      twoDaysAgoIso: "2026-04-17",
    };
  }
  const todayIso = localIsoDate();
  return {
    todayIso,
    tomorrowIso: addDays(todayIso, 1),
    inTwoDaysIso: addDays(todayIso, 2),
    twoDaysAgoIso: addDays(todayIso, -2),
  };
}

