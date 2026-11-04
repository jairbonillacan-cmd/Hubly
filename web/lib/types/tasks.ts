export type TaskDueBucket = "overdue" | "today" | "tomorrow" | "upcoming";
export type TaskPriority = "Alta" | "Media" | "Baja" | "alta" | "media" | "baja";
export type TaskStatus =
  | "pendiente"
  | "en_curso"
  | "completada"
  | "Pendiente"
  | "En curso"
  | "Completada"
  | "todo"
  | "in_progress"
  | "done";

export interface AgencyTask {
  id: string;
  brandId: string;
  title: string;
  description?: string;
  dueLabel: string;
  dueDate: string; // ISO YYYY-MM-DD
  dueBucket?: TaskDueBucket;
  assignee: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitial: string;
  listName: string;
  listId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  estimatedMinutes?: number;
  spentMinutes?: number;
  highlighted?: boolean;
  tags: string[];
}

export interface TaskListDef {
  id: string;
  brandId: string;
  name: string;
}
