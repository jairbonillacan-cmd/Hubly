import type { AgencyTask } from "@/lib/types";

export type BoardStatus = "todo" | "in_progress" | "done";

export function normalizedStatus(task: Pick<AgencyTask, "status" | "completed">): BoardStatus {
  if (task.completed) return "done";
  const s = String(task.status).toLowerCase();
  if (s === "done" || s === "completada") return "done";
  if (s === "in_progress" || s === "en_curso" || s === "en curso") return "in_progress";
  return "todo";
}
