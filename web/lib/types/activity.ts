export type ActivityEventType =
  | "task_completed"
  | "task_started"
  | "post_published"
  | "post_submitted"
  | "post_approved"
  | "notebook_updated"
  | "commitment_updated"
  | "session_active";

export interface ActivityEvent {
  id: string;
  memberId: string;
  brandId?: string;
  type: ActivityEventType;
  timestamp: string; // ISO string
  durationMinutes?: number;
  metadata?: Record<string, string | number | boolean>;
}

