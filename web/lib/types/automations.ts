export type AutomationTrigger = "post_pending" | "post_changes" | "post_approved";
export type AutomationAction = "create_task" | "notify";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  /** Texto de la tarea o notificación; {post} se sustituye por el título. */
  text: string;
  enabled: boolean;
  runs: number;
  lastRunAt?: string; // ISO
}
