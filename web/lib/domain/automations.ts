import { localIsoDate } from "../date";
import type {
  AgencyTask,
  AutomationRule,
  AutomationTrigger,
  PostStatus,
  SocialPost,
  WorkspaceNotification,
  WorkspaceProfile,
} from "../types";

const STATUS_TO_TRIGGER: Partial<Record<PostStatus, AutomationTrigger>> = {
  pending: "post_pending",
  changes: "post_changes",
  approved: "post_approved",
};


/** Lo mínimo del store que necesitan las reglas: el post, las reglas y las dos acciones que disparan. */
interface AutomationSource {
  posts: SocialPost[];
  automations?: AutomationRule[];
  profile: WorkspaceProfile;
  addTask: (task: {
    brandId: string;
    title: string;
    dueLabel: string;
    dueDate: string;
    assignee: string;
    listName: string;
    status: AgencyTask["status"];
    priority: AgencyTask["priority"];
  }) => void;
  addNotification: (notification: Omit<WorkspaceNotification, "id" | "createdAt" | "read">) => void;
}

/** Se ejecuta en el navegador: sin backend no hay reglas corriendo en segundo plano. */
export function runAutomations(
  get: () => AutomationSource,
  set: (patch: { automations: AutomationRule[] }) => void,
  postId: string,
  status: PostStatus
): void {
  const trigger = STATUS_TO_TRIGGER[status];
  const state = get();
  const post = state.posts.find((p) => p.id === postId);
  if (!trigger || !post) return;
  const fired = (state.automations || []).filter((r) => r.enabled && r.trigger === trigger);
  if (fired.length === 0) return;
  const today = localIsoDate();
  for (const rule of fired) {
    const text = rule.text.split("{post}").join(post.title);
    if (rule.action === "create_task") {
      state.addTask({
        brandId: post.brandId,
        title: text,
        dueLabel: "Hoy",
        dueDate: today,
        assignee: post.assignee || state.profile?.name || "Equipo",
        listName: "Automatizaciones",
        status: "todo",
        priority: "media",
      });
    } else {
      state.addNotification({ brandId: post.brandId, title: rule.name, body: text, kind: "sistema", actionUrl: "/parrillas" });
    }
  }
  const at = new Date().toISOString();
  const firedIds = new Set(fired.map((r) => r.id));
  set({
    automations: (get().automations || []).map((r) =>
      firedIds.has(r.id) ? { ...r, runs: r.runs + 1, lastRunAt: at } : r
    ),
  });
}
