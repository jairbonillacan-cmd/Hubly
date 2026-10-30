"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { selectOnboardingStatus } from "@/lib/domain-selectors";
import type { OnboardingProgress } from "@/lib/types";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { InviteTeamModal } from "@/components/app/InviteTeamModal";
import { NotebookReaderModal } from "@/components/app/NotebookReaderModal";
import { WidgetConfigModal } from "@/components/app/WidgetConfigModal";
import { AutoSuggestionsModal } from "@/components/app/AutoSuggestionsModal";

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
      {!onboarding.dismissed && !anyModalOpen && (
        <aside
          data-mision-pildora
          aria-label="Checklist de inicio rápido Descubre Hubly"
          style={{
            position: "fixed",
            right: 22,
            bottom: 66,
            width: onboarding.minimized ? "auto" : 272,
            background: "#FFFFFF",
            borderRadius: onboarding.minimized ? 9999 : 16,
            border: "1px solid #E2E8F0",
            padding: onboarding.minimized ? "7px 14px" : "14px 16px 14px",
            zIndex: 68,
            boxShadow:
              "0 10px 28px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.03)",
            color: "#0F172A",
            transition: "all 0.18s ease",
          }}
        >
          {onboarding.minimized ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setOnboardingMinimized(false)}
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
                  color: "#0F172A",
                  fontFamily: "inherit",
                }}
              >
                <HublyCatAvatar size={20} />
                <span>Descubre Hubly</span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 9999,
                    background: "#F0F1F9",
                    color: "#6C77C1",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {status.completedCount} de {status.totalCount}
                </span>
                <ChevronUp size={14} style={{ color: "#64748B" }} />
              </button>

              <button
                type="button"
                onClick={() => setOnboardingDismissed(true)}
                aria-label="Cerrar Descubre Hubly"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94A3B8",
                  padding: 2,
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
                  <Sparkles size={13} style={{ color: "#6C77C1" }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0F172A",
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
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    {status.completedCount} de {status.totalCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnboardingMinimized(true)}
                    aria-label="Minimizar Descubre Hubly"
                    title="Minimizar"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 2,
                      color: "#94A3B8",
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
                      padding: 2,
                      color: "#94A3B8",
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
                  background: "#F1F5F9",
                  overflow: "hidden",
                  marginBottom: 11,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${status.progressPercent}%`,
                    borderRadius: 9999,
                    background: "#6C77C1",
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
                            width: 16,
                            height: 16,
                            borderRadius: 9999,
                            border: step.completed
                              ? "none"
                              : "1.5px solid #CBD5E1",
                            background: step.completed
                              ? "#6C77C1"
                              : "transparent",
                            color: "#FFFFFF",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          {step.completed && <Check size={10} />}
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
                            color: step.completed ? "#94A3B8" : "#334155",
                            textDecoration: step.completed
                              ? "line-through"
                              : "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
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
                          border: "1px solid #E2E8F0",
                          background: "#F8FAFC",
                          color: "#6C77C1",
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          flexShrink: 0,
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

export const DescubreHenryWidget = DescubreHublyWidget;

export default DescubreHublyWidget;
