// Eventos de actividad exclusivos del modo demo y del fixture de referencia visual.
import type { ActivityEvent } from "../types";

const DEFAULT_ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: "evt-1",
    memberId: "tm-1",
    brandId: "brand-min",
    type: "session_active",
    timestamp: "2026-10-30T09:15:00-06:00",
    durationMinutes: 1,
    metadata: { dayOfWeek: "viernes", xpEarned: 53 },
  },
  {
    id: "evt-2",
    memberId: "tm-1",
    brandId: "brand-min",
    type: "task_started",
    timestamp: "2026-10-29T11:20:00-06:00",
    durationMinutes: 15,
    metadata: { taskTitle: "Conecta las redes de tu cliente" },
  },
  {
    id: "evt-3",
    memberId: "tm-2",
    brandId: "brand-bruma",
    type: "post_published",
    timestamp: "2026-10-29T16:00:00-06:00",
    durationMinutes: 45,
    metadata: { postId: "post-101" },
  },
  {
    id: "evt-4",
    memberId: "tm-2",
    brandId: "brand-bruma",
    type: "task_completed",
    timestamp: "2026-10-28T14:30:00-06:00",
    durationMinutes: 60,
    metadata: { taskId: "task-5" },
  },
  {
    id: "evt-5",
    memberId: "tm-3",
    brandId: "brand-min",
    type: "commitment_updated",
    timestamp: "2026-10-27T10:15:00-06:00",
    durationMinutes: 30,
    metadata: { metric: "Click Score 100" },
  },
  {
    id: "evt-6",
    memberId: "tm-1",
    brandId: "brand-min",
    type: "session_active",
    timestamp: "2026-04-19T09:15:00-06:00",
    durationMinutes: 1,
    metadata: { fixture: true, xpEarned: 53 },
  },
];

export function createSeedActivityEvents(): ActivityEvent[] {
  return DEFAULT_ACTIVITY_EVENTS.map((e) => ({ ...e }));
}
