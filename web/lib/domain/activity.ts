import type { ActivityEvent, ActivityEventType, HublyWorkspaceData } from "../types";

/** Lo mínimo del store que hace falta para fechar una actividad: equipo, reloj y marca. */
type ActivitySource = Pick<HublyWorkspaceData, "team" | "testClock" | "activeBrandId">;

export function createActivityItem(
  state: ActivitySource,
  partial: {
    type: ActivityEventType;
    memberId?: string;
    brandId?: string;
    durationMinutes?: number;
    metadata?: Record<string, string | number | boolean>;
    timestamp?: string;
  }
): ActivityEvent {
  const defaultMemberId = state.team[0]?.id || "tm-1";
  const clockIso = state.testClock?.fixedIsoNow || new Date().toISOString();

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    memberId: partial.memberId || defaultMemberId,
    brandId: partial.brandId || state.activeBrandId,
    type: partial.type,
    timestamp: partial.timestamp || clockIso,
    durationMinutes: partial.durationMinutes ?? 15,
    metadata: partial.metadata,
  };
}
