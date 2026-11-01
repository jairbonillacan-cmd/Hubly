"use client";

import React, { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { selectOnboardingStatus } from "@/lib/domain-selectors";
import type { OnboardingProgress } from "@/lib/types";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyCheckIcon as Check,
  HublyChevronDownIcon as ChevronDown,
  HublyChevronUpIcon as ChevronUp,
  HublyCloseIcon as X,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

const MOVIL = "(max-width: 767.98px)";
const suscribirMovil = (cb: () => void) => {
  const mq = window.matchMedia(MOVIL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const esMovil = () => window.matchMedia(MOVIL).matches;
const noMovil = () => false;

export function DescubreHublyWidget() {
  const router = useRouter();

  const onboarding = useHublyStore((s) => s.onboarding);
  const brands = useHublyStore((s) => s.brands);
  const posts = useHublyStore((s) => s.posts);
  const tasks = useHublyStore((s) => s.tasks);
  const team = useHublyStore((s) => s.team);
  const invitations = useHublyStore((s) => s.invitations);

  const toggleOnboardingStep = useHublyStore((s) => s.toggleOnboardingStep);
  const setOnboardingMinimized = useHublyStore((s) => s.setOnboardingMinimized);
  const setOnboardingDismissed = useHublyStore((s) => s.setOnboardingDismissed);
  // Fuera del dashboard empieza plegado para no tapar calendarios y tableros.
  const pathname = usePathname();
  const [expandedHere, setExpandedHere] = React.useState(false);
  // En móvil también empieza plegado: desplegado cubriría el contenido de la pantalla.
  const isMobile = useSyncExternalStore(suscribirMovil, esMovil, noMovil);
  const onDashboard = pathname === "/dashboard" && !isMobile;
  const minimized = onDashboard ? onboarding.minimized : !expandedHere;
  const setMinimized = (next: boolean) => {
    if (onDashboard) setOnboardingMinimized(next);
    else setExpandedHere(!next);
  };
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const openComposer = useHublyStore((s) => s.openComposer);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);

  // Modal visibility flags so we hide the floating card whenever any modal/drawer is open
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const newBrandModalOpen = useHublyStore((s) => s.newBrandModalOpen);
  const inviteModalOpen = useHublyStore((s) => s.inviteModalOpen);
  const cmdkOpen = useHublyStore((s) => s.cmdkOpen);
  const widgetConfigModalOpen = useHublyStore((s) => s.widgetConfigModalOpen);
  const autoSuggestionsModalOpen = useHublyStore(
    (s) => s.autoSuggestionsModalOpen
  );
  const aiDrawerOpen = useHublyStore((s) => s.aiDrawerOpen);

  const anyModalOpen =
    composerOpen ||
    newBrandModalOpen ||
    inviteModalOpen ||
    cmdkOpen ||
    widgetConfigModalOpen ||
    autoSuggestionsModalOpen ||
    aiDrawerOpen;

  const status = selectOnboardingStatus({
    onboarding,
    brands,
    posts,
    tasks,
    team,
    invitations,
  });

  const STEP_DISPLAY_LABELS: Record<
    keyof Pick<
      OnboardingProgress,
      | "brandCreatedOrSelected"
      | "postCreatedOrScheduled"
      | "taskCreatedOrCompleted"
      | "teamCheckedOrInvited"
    >,
    { title: string; ctaLabel: string }
  > = {
    brandCreatedOrSelected: {
      title: "Conecta las redes de tu cliente",
      ctaLabel: "Marca",
    },
    postCreatedOrScheduled: {
      title: "Programa tu primer post",
      ctaLabel: "Post",
    },
    taskCreatedOrCompleted: {
      title: "Prueba el link que aprueba todo",
      ctaLabel: "Tareas",
    },
    teamCheckedOrInvited: {
      title: "Súmale a tu equipo",
      ctaLabel: "Invitar",
    },
  };

  const handleStepAction = (
    key: keyof Pick<
      OnboardingProgress,
      | "brandCreatedOrSelected"
      | "postCreatedOrScheduled"
      | "taskCreatedOrCompleted"
      | "teamCheckedOrInvited"
    >
  ) => {
    if (key === "brandCreatedOrSelected") {
      toggleOnboardingStep("brandCreatedOrSelected", true);
      setNewBrandModalOpen(true);
    } else if (key === "postCreatedOrScheduled") {
      openComposer(null);
    } else if (key === "taskCreatedOrCompleted") {
      toggleOnboardingStep("taskCreatedOrCompleted", true);
      router.push("/tareas");
    } else if (key === "teamCheckedOrInvited") {
      setInviteModalOpen(true);
    }
  };

  return (
    <>
      {!onboarding.dismissed && !anyModalOpen && !(isMobile && pathname.startsWith("/agentes")) && (
        <aside
          data-mision-pildora
          data-desplegado={minimized ? undefined : ""}
          aria-label="Checklist de inicio rápido Descubre Hubly"
          style={{
            position: "fixed",
            right: 22,
            bottom: 66,
            width: minimized ? "auto" : 272,
            background: "var(--ui-surface)",
            borderRadius: minimized ? 9999 : 16,
            border: "1px solid var(--ui-border)",
            padding: minimized ? (isMobile ? "0 2px 0 14px" : "7px 14px") : "14px 16px 14px",
            zIndex: 68,
            boxShadow:
              "0 10px 28px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.03)",
            color: "var(--ui-text)",
            transition: "all 0.18s ease",
          }}
        >
          {minimized ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setMinimized(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                  fontFamily: "inherit",
                  minHeight: isMobile ? 44 : undefined,
                }}
              >
                <HublyCatAvatar size={20} />
                <span>Descubre Hubly</span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 9999,
                    background: "var(--ui-accent-soft)",
                    color: "var(--hb-accent-text)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {status.completedCount} de {status.totalCount}
                </span>
                <ChevronUp size={14} style={{ color: "var(--ui-text-4)" }} />
              </button>

              <button
                type="button"
                onClick={() => setOnboardingDismissed(true)}
                aria-label="Cerrar Descubre Hubly"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--ui-text-5)",
                  padding: isMobile ? 0 : 2,
                  width: isMobile ? 44 : undefined,
                  height: isMobile ? 44 : undefined,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 7 }}
                >
                  <Sparkles size={13} style={{ color: "var(--hb-accent-text)" }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--ui-text)",
                    }}
                  >
                    Descubre Hubly
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      color: "var(--ui-text-4)",
                      fontWeight: 600,
                    }}
                  >
                    {status.completedCount} de {status.totalCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMinimized(true)}
                    aria-label="Minimizar Descubre Hubly"
                    title="Minimizar"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: isMobile ? 0 : 2,
                      width: isMobile ? 44 : undefined,
                      height: isMobile ? 44 : undefined,
                      justifyContent: "center",
                      color: "var(--ui-text-5)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingDismissed(true)}
                    aria-label="Cerrar Descubre Hubly"
                    title="Ocultar"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: isMobile ? 0 : 2,
                      width: isMobile ? 44 : undefined,
                      height: isMobile ? 44 : undefined,
                      justifyContent: "center",
                      color: "var(--ui-text-5)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <div
                aria-hidden="true"
                style={{
                  height: 4,
                  width: "100%",
                  borderRadius: 9999,
                  background: "var(--ui-muted)",
                  overflow: "hidden",
                  marginBottom: 11,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${status.progressPercent}%`,
                    borderRadius: 9999,
                    background: "var(--hb-accent)",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>

              {/* 4 Steps List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {status.steps.map((step) => {
                  const meta = STEP_DISPLAY_LABELS[step.key];
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={step.completed}
                          aria-label={`Marcar paso: ${meta.title}`}
                          onClick={() =>
                            toggleOnboardingStep(step.key, !step.completed)
                          }
                          style={{
                            width: isMobile ? 44 : 16,
                            height: isMobile ? 44 : 16,
                            border: "none",
                            background: "transparent",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 9999,
                              border: step.completed
                                ? "none"
                                : "1.5px solid var(--ui-border-strong)",
                              background: step.completed
                                ? "var(--hb-accent)"
                                : "transparent",
                              color: "var(--on-accent)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {step.completed && <Check size={10} />}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStepAction(step.key)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            textAlign: "left",
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: step.completed ? "var(--ui-text-4)" : "var(--ui-text-2)",
                            textDecoration: step.completed
                              ? "line-through"
                              : "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minHeight: isMobile ? 44 : undefined,
                          }}
                        >
                          {meta.title}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStepAction(step.key)}
                        style={{
                          padding: "2px 7px",
                          borderRadius: 6,
                          border: "1px solid var(--ui-border)",
                          background: "var(--ui-surface-2)",
                          color: "var(--hb-accent-text)",
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          flexShrink: 0,
                          minHeight: isMobile ? 44 : undefined,
                          minWidth: isMobile ? 44 : undefined,
                        }}
                      >
                        {meta.ctaLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}


