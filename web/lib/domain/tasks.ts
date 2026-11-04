import type { AgencyTask, BrandWorkspace, TeamMember } from "../types";

export type AddTaskInput = Omit<
  AgencyTask,
  | "id"
  | "completed"
  | "assigneeId"
  | "assigneeName"
  | "assigneeInitial"
  | "tags"
  | "dueBucket"
> & {
  completed?: boolean;
  assigneeId?: string;
  assigneeName?: string;
  assigneeInitial?: string;
  tags?: string[];
  dueBucket?: AgencyTask["dueBucket"];
};

interface TaskContext {
  id: string;
  brands: BrandWorkspace[];
  team: TeamMember[];
  profileName?: string;
}

/** Completa una tarea nueva con lo que el formulario no pide: responsable, etiquetas y estado. */
export function buildTask(input: AddTaskInput, ctx: TaskContext): AgencyTask {
  const brand = ctx.brands.find((b) => b.id === input.brandId);
  const assigneeName = input.assigneeName || input.assignee || ctx.profileName || "Jair";
  const assigneeInitial = input.assigneeInitial || assigneeName.slice(0, 1).toUpperCase() || "J";
  const matchedMember = ctx.team.find((m) => m.name.toLowerCase() === assigneeName.toLowerCase());
  const assigneeId = input.assigneeId || matchedMember?.id || "tm-1";
  const completed =
    input.completed ?? (input.status === "done" || input.status === "completada");
  const tags =
    input.tags && input.tags.length > 0
      ? input.tags
      : [brand?.name || "Agencia", input.listName || "Primeros pasos"];

  return {
    ...input,
    id: ctx.id,
    completed,
    assigneeId,
    assignee: assigneeName,
    assigneeName,
    assigneeInitial,
    tags,
    dueBucket: input.dueBucket || "today",
  };
}

/** Un cambio puntual nunca deja `status` y `completed` contradiciéndose. */
export function mergeTaskPatch(task: AgencyTask, patch: Partial<AgencyTask>): AgencyTask {
  const nextStatus =
    patch.status ?? (patch.completed !== undefined ? (patch.completed ? "done" : "todo") : task.status);
  const nextCompleted =
    patch.completed !== undefined
      ? patch.completed
      : nextStatus === "done" || nextStatus === "completada";
  return { ...task, ...patch, status: nextStatus, completed: nextCompleted };
}

/** Marca o desmarca una tarea. Al reabrirla, la etiqueta vuelve a «Hoy». */
export function toggleTaskState(
  task: AgencyTask,
  nowIso: string
): { task: AgencyTask; becameDone: boolean } {
  const isCurrentlyDone =
    task.status === "done" || task.status === "completada" || task.completed;
  const becameDone = !isCurrentlyDone;
  const nextStatus: AgencyTask["status"] = becameDone ? "done" : "todo";
  return {
    becameDone,
    task: {
      ...task,
      status: nextStatus,
      completed: becameDone,
      completedAt: becameDone ? nowIso : undefined,
      dueLabel: becameDone
        ? "Completada"
        : task.dueLabel === "Completada"
        ? "Hoy"
        : task.dueLabel,
    },
  };
}
