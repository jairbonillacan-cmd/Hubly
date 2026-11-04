// Construcción del espacio de trabajo inicial para el modo demo y el fixture de referencia visual.
// Con cuentas reales (`options.live`), `normalizeWorkspacePayload` vacía estas colecciones de ejemplo.
import { addDays, localIsoDate } from "../date";
import type {
  AgencyInfo,
  HublyWorkspaceData,
  WorkspaceNotification,
  WorkspaceProfile,
} from "../types";
import { createSeedActivityEvents } from "./activity";
import { createSeedAds } from "./ads";
import { createSeedAssets } from "./assets";
import { createSeedBrands } from "./brands";
import { createSeedChannels, createSeedMessages } from "./chat";
import { DEFAULT_ONBOARDING, DEFAULT_WIDGETS_CONFIG } from "./dashboard";
import { DEFAULT_NOTEBOOKS } from "./notebooks";
import { createSeedPosts } from "./posts";
import { createSeedProjects } from "./projects";
import { createSeedTasks, type SeedBaseDates } from "./tasks";
import { createSeedTeam } from "./team";

export const REFERENCE_FIXTURE_CLOCK = "2026-04-19T09:30:00-06:00";

export const DEFAULT_PROFILE: WorkspaceProfile = {
  id: "user-jair",
  name: "Jair",
  email: "hola@agencia.demo",
  role: "Dueño",
  avatarInitial: "JA",
  timezone: "America/Mexico_City",
  locale: "es-MX",
  theme: "claro",
};

export const DEFAULT_AGENCY: AgencyInfo = {
  id: "agency-default",
  name: "Tu agencia",
  plan: "Agencia Pro",
  activeDays: 1,
  activeStreak: 1,
  bestStreak: 1,
  xp: 53,
  level: 2,
  nextLevelXp: 200,
  timezone: "America/Mexico_City",
  currency: "USD",
};

const DEFAULT_NOTIFICATIONS: WorkspaceNotification[] = [];

function resolveBaseDates(referenceFixture?: boolean): SeedBaseDates {
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

/** Copia `value` moviendo solo las fechas que siguen idénticas al dato de ejemplo. */
function rebaseUnchanged(value: unknown, seed: unknown, move: (text: string) => string): unknown {
  if (typeof value === "string") return value === seed ? move(value) : value;
  if (Array.isArray(value)) {
    if (!Array.isArray(seed)) return value;
    const hasId = (item: unknown): item is { id: unknown } => typeof item === "object" && item !== null && "id" in item;
    return value.map((item, index) => {
      const match = hasId(item) ? seed.find((s) => hasId(s) && s.id === item.id) : seed[index];
      return match === undefined ? item : rebaseUnchanged(item, match, move);
    });
  }
  if (typeof value === "object" && value !== null) {
    if (typeof seed !== "object" || seed === null) return value;
    const seedRecord = seed as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, key in seedRecord ? rebaseUnchanged(item, seedRecord[key], move) : item])
    );
  }
  return value;
}

/**
 * Repara un espacio guardado con el reloj de prueba de abril. Solo mueve lo que sigue
 * igual que en los datos de ejemplo: lo creado o editado por el usuario no se toca.
 */
export function rebaseStaleFixture(data: HublyWorkspaceData): HublyWorkspaceData {
  if (data.testClock?.fixedIsoNow !== REFERENCE_FIXTURE_CLOCK) return data;
  const fixture = resolveBaseDates(true);
  const current = resolveBaseDates(false);
  const move = (text: string) =>
    text
      .replaceAll(fixture.todayIso, current.todayIso)
      .replaceAll(fixture.tomorrowIso, current.tomorrowIso)
      .replaceAll(fixture.inTwoDaysIso, current.inTwoDaysIso)
      .replaceAll(fixture.twoDaysAgoIso, current.twoDaysAgoIso);
  const seed = createSeedWorkspaceData(data.workspaceId, { referenceFixture: true });
  return { ...(rebaseUnchanged(data, seed, move) as HublyWorkspaceData), testClock: { fixedIsoNow: null } };
}

export function createSeedWorkspaceData(
  workspaceId = "default",
  options?: { referenceFixture?: boolean }
): HublyWorkspaceData {
  const isRef = Boolean(options?.referenceFixture);
  const dates = resolveBaseDates(isRef);

  return {
    workspaceId,
    agencyName: "Tu agencia",
    profile: { ...DEFAULT_PROFILE },
    agency: { ...DEFAULT_AGENCY },
    testClock: {
      fixedIsoNow: isRef ? REFERENCE_FIXTURE_CLOCK : null,
    },
    activeBrandId: "brand-min",
    brands: createSeedBrands(),
    posts: createSeedPosts(dates.todayIso),
    tasks: createSeedTasks(dates),
    notebooks: DEFAULT_NOTEBOOKS.map((n) => ({ ...n })),
    assets: createSeedAssets(),
    projects: createSeedProjects(),
    ads: createSeedAds(),
    channels: createSeedChannels(),
    messages: createSeedMessages(),
    team: createSeedTeam(),
    invitations: [],
    activityEvents: createSeedActivityEvents(),
    notifications: DEFAULT_NOTIFICATIONS.map((n) => ({ ...n })),
    widgets: DEFAULT_WIDGETS_CONFIG.map((w) => ({ ...w })),
    onboarding: { ...DEFAULT_ONBOARDING, manualOverrides: {} },
    dismissedRecommendationIds: [],
    appliedRecommendationsMap: {},
  };
}

export const INITIAL_WORKSPACE_DATA: HublyWorkspaceData = createSeedWorkspaceData("default");
