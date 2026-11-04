import { isTaskCompleted } from "./tasks";
import type { HublyWorkspaceData } from "../types";

interface OnboardingStepItem {
  id: "redes" | "post" | "aprueba" | "equipo";
  key:
    | "brandCreatedOrSelected"
    | "postCreatedOrScheduled"
    | "taskCreatedOrCompleted"
    | "teamCheckedOrInvited";
  label: string;
  fullTitle: string;
  href: string;
  icon: "link" | "post" | "approve" | "team";
  completed: boolean;
}

interface OnboardingStatusResult {
  completedCount: number;
  totalCount: 4;
  progressPercent: number;
  steps: OnboardingStepItem[];
  dismissed: boolean;
  minimized: boolean;
  brandCreatedOrSelected: boolean;
  taskCreatedOrCompleted: boolean;
  postCreatedOrScheduled: boolean;
  teamCheckedOrInvited: boolean;
}

export function selectOnboardingStatus(
  state: Partial<HublyWorkspaceData>
): OnboardingStatusResult {
  const overrides = state.onboarding?.manualOverrides || {};
  const brands = state.brands || [];
  const posts = state.posts || [];
  const tasks = state.tasks || [];
  const invitations = state.invitations || [];
  const team = state.team || [];

  const derivedBrand =
    Boolean(state.onboarding?.brandCreatedOrSelected) || brands.length > 3;
  const derivedPost =
    Boolean(state.onboarding?.postCreatedOrScheduled) || posts.length > 9;
  const derivedTask =
    Boolean(state.onboarding?.taskCreatedOrCompleted) ||
    tasks.some((t) => (t.id === "onb-1" || t.id === "onb-2") && isTaskCompleted(t));
  const derivedTeam =
    Boolean(state.onboarding?.teamCheckedOrInvited) ||
    invitations.length > 0 ||
    team.length > 3;

  const resolveStep = (
    id: "redes" | "post" | "aprueba" | "equipo",
    key:
      | "brandCreatedOrSelected"
      | "postCreatedOrScheduled"
      | "taskCreatedOrCompleted"
      | "teamCheckedOrInvited",
    derived: boolean
  ): boolean => {
    if (typeof overrides[id] === "boolean") return overrides[id];
    if (typeof overrides[key] === "boolean") return overrides[key];
    return derived;
  };

  const brandCreatedOrSelected = resolveStep(
    "redes",
    "brandCreatedOrSelected",
    derivedBrand
  );
  const postCreatedOrScheduled = resolveStep(
    "post",
    "postCreatedOrScheduled",
    derivedPost
  );
  const taskCreatedOrCompleted = resolveStep(
    "aprueba",
    "taskCreatedOrCompleted",
    derivedTask
  );
  const teamCheckedOrInvited = resolveStep(
    "equipo",
    "teamCheckedOrInvited",
    derivedTeam
  );

  const steps: OnboardingStepItem[] = [
    {
      id: "redes",
      key: "brandCreatedOrSelected",
      label: "Las redes de tu cliente, c...",
      fullTitle: "Las redes de tu cliente, conectadas",
      href: "/parrillas?cuentas=1",
      icon: "link",
      completed: brandCreatedOrSelected,
    },
    {
      id: "post",
      key: "postCreatedOrScheduled",
      label: "Tu primer post, program...",
      fullTitle: "Tu primer post, programado",
      href: "/parrillas?new=post",
      icon: "post",
      completed: postCreatedOrScheduled,
    },
    {
      id: "aprueba",
      key: "taskCreatedOrCompleted",
      label: "Tu cliente lo aprueba de...",
      fullTitle: "Tu cliente lo aprueba desde su link",
      href: "/parrillas?tab=calendario&new=parrilla",
      icon: "approve",
      completed: taskCreatedOrCompleted,
    },
    {
      id: "equipo",
      key: "teamCheckedOrInvited",
      label: "Invitar a tu equipo",
      fullTitle: "Invitar a tu equipo",
      href: "/ajustes?tab=equipo",
      icon: "team",
      completed: teamCheckedOrInvited,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return {
    completedCount,
    totalCount: 4,
    progressPercent: Math.round((completedCount / 4) * 100),
    steps,
    dismissed: Boolean(state.onboarding?.dismissed),
    minimized: Boolean(state.onboarding?.minimized),
    brandCreatedOrSelected,
    taskCreatedOrCompleted,
    postCreatedOrScheduled,
    teamCheckedOrInvited,
  };
}
