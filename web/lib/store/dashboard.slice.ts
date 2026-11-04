import type { StateCreator } from "zustand";
import { DEFAULT_WIDGETS_CONFIG, INITIAL_WORKSPACE_DATA } from "../seed-data";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { DashboardMetricId, DashboardWidgetConfig, DashboardWidgetId, DashboardWidgetSpan } from "../types";

type OnboardingStepKey =
  | "redes"
  | "post"
  | "aprueba"
  | "equipo"
  | "brandCreatedOrSelected"
  | "postCreatedOrScheduled"
  | "taskCreatedOrCompleted"
  | "teamCheckedOrInvited";

export interface DashboardSlice {
  dashboardWidgets: DashboardWidgetConfig[];

  toggleWidgetVisibility: (widgetId: DashboardWidgetId) => void;
  setWidgetVisibility: (widgetId: DashboardWidgetId, visible: boolean) => void;
  reorderWidgets: (orderedIds: DashboardWidgetId[]) => void;
  moveWidget: (widgetId: DashboardWidgetId, direction: "up" | "down") => void;
  setWidgetSpan: (widgetId: DashboardWidgetId, span: DashboardWidgetSpan) => void;
  setWidgetMetric: (widgetId: DashboardWidgetId, metric: DashboardMetricId) => void;
  resetWidgetsLayout: () => void;
  toggleOnboardingStep: (stepKey: OnboardingStepKey, forceValue?: boolean) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
  setOnboardingMinimized: (minimized: boolean) => void;
}

export const createDashboardSlice: StateCreator<HublyStoreState, [], [], DashboardSlice> = (set, get) => ({
  dashboardWidgets: INITIAL_WORKSPACE_DATA.widgets.map((w) => ({ ...w, enabled: w.visible })),

  toggleWidgetVisibility: (widgetId) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
    persistWorkspaceState(get());
  },

  setWidgetVisibility: (widgetId, visible) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible } : w
      ),
    }));
    persistWorkspaceState(get());
  },

  reorderWidgets: (orderedIds) => {
    set((s) => {
      const byId = new Map<DashboardWidgetId, DashboardWidgetConfig>(
        s.widgets.map((w) => [w.id, w])
      );
      const reordered: DashboardWidgetConfig[] = [];
      orderedIds.forEach((id, idx) => {
        const found = byId.get(id);
        if (found) {
          reordered.push({ ...found, order: idx + 1 });
          byId.delete(id);
        }
      });
      byId.forEach((remaining) => {
        reordered.push({ ...remaining, order: reordered.length + 1 });
      });
      return {
        widgets: reordered,
      };
    });
    persistWorkspaceState(get());
  },

  moveWidget: (widgetId, direction) => {
    set((s) => {
      const sorted = [...s.widgets].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === widgetId);
      if (index === -1) return s;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return s;

      const temp = sorted[index];
      sorted[index] = sorted[targetIndex];
      sorted[targetIndex] = temp;

      const normalized = sorted.map((w, idx) => ({ ...w, order: idx + 1 }));
      return {
        widgets: normalized,
      };
    });
    persistWorkspaceState(get());
  },

  setWidgetSpan: (widgetId, span) => {
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, span } : w)),
    }));
    persistWorkspaceState(get());
  },

  setWidgetMetric: (widgetId, metric) => {
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, metric } : w)),
    }));
    persistWorkspaceState(get());
  },

  resetWidgetsLayout: () => {
    set({
      widgets: DEFAULT_WIDGETS_CONFIG.map((w) => ({ ...w })),
    });
    persistWorkspaceState(get());
  },

  toggleOnboardingStep: (stepKey, forceValue) => {
    set((s) => {
      const prevOverrides = s.onboarding.manualOverrides || {};
      const currentVal = Boolean(prevOverrides[stepKey]);
      const nextVal = forceValue !== undefined ? forceValue : !currentVal;
      return {
        onboarding: {
          ...s.onboarding,
          manualOverrides: {
            ...prevOverrides,
            [stepKey]: nextVal,
          },
        },
      };
    });
    persistWorkspaceState(get());
  },

  setOnboardingDismissed: (dismissed) => {
    set((s) => ({
      onboarding: {
        ...s.onboarding,
        dismissed,
      },
    }));
    persistWorkspaceState(get());
  },

  setOnboardingMinimized: (minimized) => {
    set((s) => ({
      onboarding: {
        ...s.onboarding,
        minimized,
      },
    }));
    persistWorkspaceState(get());
  },
});
