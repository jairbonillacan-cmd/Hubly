"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { useHubiChats, type HubiTurn } from "@/lib/hubi-chats";
import { useModalPresence } from "@/lib/use-modal-presence";
import { confirmDeleteChat, HubiChatUndoToasts } from "@/components/app/HubiChatList";
import {
  selectAccountRecommendations,
  selectAccountsHealth,
  selectTasksBreakdown,
  selectTodayPostsAndApprovals,
} from "@/lib/domain-selectors";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyArrowUpIcon as ArrowUp,
  HublyCalendarIcon as CalendarDays,
  HublyChartIcon as BarChart3,
  HublyCheckCircleIcon as CheckCircle2,
  HublyChevronRightIcon as ChevronRight,
  HublyCloseIcon as X,
  HublyExpandIcon as Maximize2,
  HublyPeopleIcon as Users,
  HublyPlugIcon as Plug,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";


// Backwards-compatible alias so any existing import of HublyAvatarIllustration renders the Hubly cat

const QUICK_PROMPTS = [
  "¿Qué tareas vencen hoy o están vencidas?",
  "Resumen de salud de cuentas y sugerencias",
  "¿Qué publicaciones esperan aprobación?",
  "Sugerir ideas de copy para la marca activa",
];

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function FloatingAIDrawer() {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const aiDrawerOpen = useHublyStore((s) => s.aiDrawerOpen);
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const aiDrawerPrompt = useHublyStore((s) => s.aiDrawerPrompt);
  const setAiDrawerPrompt = useHublyStore((s) => s.setAiDrawerPrompt);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const teamMembers = useHublyStore((s) => s.team);
  const teamInvitations = useHublyStore((s) => s.invitations);
  const dismissedRecommendationIds = useHublyStore(
    (s) => s.dismissedRecommendationIds
  );
  const appliedRecommendationsMap = useHublyStore(
    (s) => s.appliedRecommendationsMap
  );
  const openComposer = useHublyStore((s) => s.openComposer);
  const setAutoSuggestionsModalOpen = useHublyStore(
    (s) => s.setAutoSuggestionsModalOpen
  );
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);

  // Hide floating launcher pill when another modal dialog is open
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const newBrandModalOpen = useHublyStore((s) => s.newBrandModalOpen);
  const inviteModalOpen = useHublyStore((s) => s.inviteModalOpen);
  const cmdkOpen = useHublyStore((s) => s.cmdkOpen);
  const widgetConfigModalOpen = useHublyStore((s) => s.widgetConfigModalOpen);
  const autoSuggestionsModalOpen = useHublyStore(
    (s) => s.autoSuggestionsModalOpen
  );

  const anyOtherModalOpen =
    composerOpen ||
    newBrandModalOpen ||
    inviteModalOpen ||
    cmdkOpen ||
    widgetConfigModalOpen ||
    autoSuggestionsModalOpen;

  const activeBrand =
    brands.find((b) => b.id === activeBrandId) || brands[0] || null;

  const pathname = usePathname();
  const hydrated = useHublyStore((s) => s.hydrated);
  const workspaceId = useHublyStore((s) => s.workspaceId);
  // Los chats de Hubi se separan por agencia y por cuenta: otra cuenta en el mismo
  // navegador no debe leer las conversaciones, ni seguir en la agencia anterior al cambiar.
  const chatAgency = useHublyStore((s) => s.agency?.id) ?? workspaceId;
  const chatAccount = useHublyStore((s) => s.profile?.id) ?? "";
  const activeChat = useHubiChats(
    (s) => s.chats.find((chat) => chat.id === s.activeChatId) ?? null
  );
  const activeChatId = activeChat?.id ?? null;
  const fullView = useHubiChats((s) => s.fullView);
  const appendTurns = useHubiChats((s) => s.appendTurns);
  const loadChats = useHubiChats((s) => s.loadChats);
  const setFullView = useHubiChats((s) => s.setFullView);
  const turns = activeChat?.turns ?? [];

  const [prompt, setPrompt] = useState("");
  const [expanded, setExpanded] = useState(false);
  const panelPresence = useModalPresence(aiDrawerOpen, fullView ? 150 : 250);

  const handleClose = () => {
    setAiDrawerOpen(false);
  };

  useEffect(() => {
    if (hydrated) loadChats(`${chatAgency}:${chatAccount}`);
  }, [hydrated, chatAgency, chatAccount, loadChats]);

  // La vista completa ocupa la pantalla: se va al navegar o si borran su conversación.
  useEffect(() => {
    if (fullView) setAiDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (fullView && aiDrawerOpen && !activeChatId) setAiDrawerOpen(false);
  }, [fullView, aiDrawerOpen, activeChatId, setAiDrawerOpen]);

  useEffect(() => {
    if (!panelPresence.mounted) setFullView(false);
  }, [panelPresence.mounted, setFullView]);

  useEffect(() => {
    setPrompt(""); // eslint-disable-line react-hooks/set-state-in-effect -- responde a un cambio externo de conversación
    if (aiDrawerOpen) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  // Focus trap, Escape key, Initial focus & Scroll lock when drawer is open
  useEffect(() => {
    if (!aiDrawerOpen) return;

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;

    const rafId = window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      } else {
        const focusables = getFocusableElements(dialogRef.current);
        focusables[0]?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.querySelector('[role="alertdialog"]')) return;
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown, true);
      const prevEl = previousActiveElementRef.current;
      if (prevEl && document.body.contains(prevEl)) {
        window.requestAnimationFrame(() => {
          prevEl.focus();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDrawerOpen]);

  const buildLocalDiagnosticAnswer = (
    question: string
  ): Omit<HubiTurn, "id" | "role" | "timestamp"> => {
    const q = question.toLowerCase();
    const brandLabel = activeBrand?.name || "tu marca activa";

    // 1. Tasks query
    if (
      q.includes("tarea") ||
      q.includes("venc") ||
      q.includes("pendiente") ||
      q.includes("hoy")
    ) {
      const breakdown = selectTasksBreakdown(tasks, activeBrand?.id);
      const allBreakdown = selectTasksBreakdown(tasks, null);
      const overdueCount = breakdown.overdue.length;
      const todayCount = breakdown.today.length;
      const tomorrowCount = breakdown.tomorrow.length;

      const overdueTitles = breakdown.overdue
        .slice(0, 3)
        .map((t) => `• [Vencida] ${t.title} (${t.assignee})`)
        .join("\n");
      const todayTitles = breakdown.today
        .slice(0, 3)
        .map((t) => `• [Hoy] ${t.title} (${t.assignee})`)
        .join("\n");

      const lines = [
        `📋 Estado de tareas en ${brandLabel} (datos locales del store):`,
        `• Vencidas: ${overdueCount} | Para hoy: ${todayCount} | Para mañana: ${tomorrowCount}`,
        `• Total pendientes en toda la agencia: ${allBreakdown.pendingCount} (${allBreakdown.completedCount} completadas).`,
      ];
      if (overdueTitles) lines.push(overdueTitles);
      if (todayTitles) lines.push(todayTitles);
      if (!overdueTitles && !todayTitles) {
        lines.push(
          `No tienes tareas vencidas ni urgentes hoy para ${brandLabel}.`
        );
      }

      return {
        text: lines.join("\n"),
        actionType: "open_composer",
        actionLabel: "Programar entregable",
      };
    }

    // 2. Account health & recommendations query
    if (
      q.includes("salud") ||
      q.includes("cuenta") ||
      q.includes("sugerencia") ||
      q.includes("compromiso") ||
      q.includes("riesgo")
    ) {
      const healthResult = selectAccountsHealth(brands, tasks, posts);
      const recs = selectAccountRecommendations(
        brands,
        tasks,
        posts,
        dismissedRecommendationIds,
        appliedRecommendationsMap
      ).filter((r) => !r.applied);

      const { summary, accounts } = healthResult;

      const topLines = [
        `📊 Diagnóstico de Salud de Cuentas (${summary.totalAccounts} marcas en el store):`,
        `• Completas: ${summary.completeCount} | En progreso: ${summary.inProgressCount} | En riesgo: ${summary.atRiskCount}`,
      ];

      accounts.slice(0, 4).forEach((row) => {
        topLines.push(
          `• ${row.name}: ${row.computedHealthScore}% (${row.computedHealthStatus}) — Posts ${row.periodSnapshot.postsCompleted}/${row.periodSnapshot.postsCommitted}, Reels ${row.periodSnapshot.reelsCompleted}/${row.periodSnapshot.reelsCommitted}`
        );
      });

      topLines.push(
        `💡 Tienes ${recs.length} sugerencia(s) automática(s) lista(s) para aplicar según el cumplimiento del último mes.`
      );

      return {
        text: topLines.join("\n"),
        actionType: "open_suggestions",
        actionLabel: `Revisar sugerencias (${recs.length})`,
      };
    }

    // 3. Approvals & scheduled posts query
    if (
      q.includes("aprobaci") ||
      q.includes("post") ||
      q.includes("publicaci") ||
      q.includes("parrilla")
    ) {
      const { todayPosts, approvalPosts } = selectTodayPostsAndApprovals(
        posts,
        null
      );

      const lines = [
        `🗓️ Resumen de Publicaciones y Aprobaciones:`,
        `• Esperando visto bueno (En aprobación): ${approvalPosts.length} pieza(s)`,
        `• Programadas para hoy: ${todayPosts.length} pieza(s)`,
      ];

      approvalPosts.slice(0, 3).forEach((item) => {
        const bName =
          brands.find((b) => b.id === item.brandId)?.name || "Marca";
        lines.push(
          `• [${bName}] "${item.title}" (${item.network || item.networks?.[0] || "Instagram"} · ${item.format})`
        );
      });

      return {
        text: lines.join("\n"),
        actionType: "open_composer",
        actionLabel: "Abrir compositor de posts",
      };
    }

    // 4. Copy / creative ideas
    if (q.includes("copy") || q.includes("idea") || q.includes("redact")) {
      const tone =
        activeBrand?.core?.toneOfVoice ||
        "Cercano, editorial y enfocado en conversión";
      const industry = activeBrand?.industry || "Estrategia Digital";
      const handle = activeBrand?.handle || "@marca";

      return {
        text: [
          `✍️ 3 propuestas de copy para ${brandLabel} (${industry}):`,
          `Tono de marca: "${tone}"`,
          `1️⃣ Carrusel educativo: "3 detalles detrás de cada proyecto en ${brandLabel} que transforman la experiencia de nuestros clientes. Desliza para conocer el proceso → ${handle}"`,
          `2️⃣ Reel dinámico (9:16): "Un día real en ${brandLabel}: del concepto a la entrega final en 30 segundos. ¿Cuál es tu parte favorita?"`,
          `3️⃣ Story interactiva: "Estamos preparando las novedades de la semana en ${brandLabel}. Vota en la encuesta qué te gustaría ver primero 👇"`,
        ].join("\n"),
        actionType: "open_composer",
        actionLabel: "Usar en el compositor",
      };
    }

    // 5. General workspace summary fallback
    const breakdown = selectTasksBreakdown(tasks, activeBrand?.id);
    const { approvalPosts } = selectTodayPostsAndApprovals(posts, null);
    const pendingInvites = teamInvitations.filter(
      (i) => i.status === "Pendiente"
    ).length;

    return {
      text: [
        `🐱 Soy Hubi. Resumen en vivo de tu workspace:`,
        `• Marca activa: ${brandLabel} (${activeBrand?.industry || "Agencia"})`,
        `• Tareas de ${brandLabel}: ${breakdown.overdue.length} vencida(s), ${breakdown.today.length} para hoy, ${breakdown.completedCount} completada(s).`,
        `• Publicaciones esperando aprobación: ${approvalPosts.length}.`,
        `• Equipo: ${teamMembers.length} miembro(s) activo(s) y ${pendingInvites} invitación(es) local(es) pendiente(s).`,
      ].join("\n"),
      actionType: "open_composer",
      actionLabel: "Crear publicación",
    };
  };

  const handleSubmitPrompt = (rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;

    const nowTime = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userTurn: HubiTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      text: clean,
      timestamp: nowTime,
    };

    const reply = buildLocalDiagnosticAnswer(clean);
    const assistantTurn: HubiTurn = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      text: reply.text,
      timestamp: nowTime,
      actionType: reply.actionType,
      actionLabel: reply.actionLabel,
    };

    appendTurns([userTurn, assistantTurn]);
    setPrompt("");
  };

  // Una pregunta hecha desde el buscador llega ya respondida.
  useEffect(() => {
    if (!aiDrawerPrompt) return;
    setAiDrawerPrompt(null);
    handleSubmitPrompt(aiDrawerPrompt); // eslint-disable-line react-hooks/set-state-in-effect -- responde a un cambio externo de conversación
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDrawerPrompt]);

  const handleTriggerTurnAction = (
    actionType?: HubiTurn["actionType"]
  ) => {
    handleClose();
    window.requestAnimationFrame(() => {
      if (actionType === "open_composer") {
        openComposer(null);
      } else if (actionType === "open_suggestions") {
        setAutoSuggestionsModalOpen(true);
      } else if (actionType === "open_invite") {
        setInviteModalOpen(true);
      }
    });
  };

  return (
    <>
      {/* Botón flotante de Hubi */}
      {!aiDrawerOpen && !anyOtherModalOpen && (
        <button
          type="button"
          data-hb-fab
          className="hubly-hubi-fab"
          onClick={() => setAiDrawerOpen(true)}
          aria-label="Pregúntale a Hubi"
          title="Pregúntale a Hubi"
        >
          <HublyCatAvatar size={36} />
        </button>
      )}

      <HubiChatUndoToasts />

      {/* Panel lateral de Hubi */}
      {panelPresence.mounted && (
          <aside
            ref={dialogRef}
            data-hubi-panel
            data-state={panelPresence.state}
            data-expanded={expanded}
            data-view={fullView ? "full" : "panel"}
            className="hubly-hubi-panel"
            role="dialog"
            aria-labelledby={titleId}
          >
            <div className="hubly-hubi-head">
              <div>
                <HublyCatAvatar size={24} />
                <h2 id={titleId}>Hubi</h2>
              </div>
              <div>
                {activeChat && (
                  <button
                    type="button"
                    onClick={() => void confirmDeleteChat(activeChat.id, activeChat.title)}
                    title="Eliminar conversación"
                    aria-label="Eliminar conversación"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                {!fullView && (
                  <button
                    type="button"
                    className="hubly-hubi-expand"
                    onClick={() => setExpanded((v) => !v)}
                    title="Expandir"
                    aria-label="Expandir el panel de Hubi"
                    aria-pressed={expanded}
                  >
                    <Maximize2 size={14} />
                  </button>
                )}
                <button type="button" onClick={handleClose} title="Cerrar" aria-label="Cerrar Hubi">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Conversation Body */}
            <div className="hubly-hubi-body">
              {turns.length === 0 ? (
                <div className="hubly-hubi-intro">
                  <div className="hubly-hubi-avatar">
                    <i />
                    <HublyCatAvatar size={48} />
                  </div>
                  <strong>Hubi</strong>
                  <p>Te falta conectar {activeBrand?.name || "tu marca"}. Con eso te armo el reporte y la parrilla.</p>
                  <button type="button" className="hubly-hubi-action is-blue" onClick={() => handleSubmitPrompt(QUICK_PROMPTS[0])}>
                    <Plug size={18} />
                    <span>Conectar las redes</span>
                    <ChevronRight size={15} />
                  </button>
                  <button type="button" className="hubly-hubi-action is-lilac" onClick={() => handleTriggerTurnAction("open_composer")}>
                    <CalendarDays size={18} />
                    <span>Traer mis diseños y programarlos</span>
                    <ChevronRight size={15} />
                  </button>
                  <small>También puedo</small>
                  <div className="hubly-hubi-grid">
                    <button type="button" className="is-green" onClick={() => handleTriggerTurnAction("open_invite")}>
                      <Users size={15} />
                      <span>Invitar a mi equipo</span>
                    </button>
                    <button type="button" className="is-rose" onClick={() => handleSubmitPrompt(QUICK_PROMPTS[1] || QUICK_PROMPTS[0])}>
                      <BarChart3 size={15} />
                      <span>Estatus del proyecto</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {turns.map((turn) => (
                    <div
                      key={turn.id}
                      style={{
                        alignSelf:
                          turn.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "90%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          padding: "11px 13px",
                          borderRadius:
                            turn.role === "user"
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                          background:
                            turn.role === "user" ? "var(--hb-accent)" : "var(--ui-surface-2)",
                          border:
                            turn.role === "user"
                              ? "none"
                              : "1px solid #E2E8F0",
                          color:
                            turn.role === "user" ? "#FFFFFF" : "var(--ui-text-1)",
                          fontSize: 12.5,
                          lineHeight: 1.55,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {turn.text}
                      </div>

                      {turn.role === "assistant" && turn.actionType && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleTriggerTurnAction(turn.actionType)
                            }
                            style={{
                              padding: "5px 11px",
                              borderRadius: 8,
                              border: "1px solid #BFE2F4",
                              background: "var(--ui-accent-soft)",
                              color: "var(--hb-accent-text)",
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>{turn.actionLabel || "Abrir"}</span>
                          </button>
                          <span style={{ fontSize: 10.5, color: "var(--ui-text-5)" }}>
                            {turn.timestamp}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                                  </>
              )}
            </div>

            {/* Mensaje */}
            <form
              className="hubly-hubi-composer"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitPrompt(prompt);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Mensaje…"
                aria-label="Escribe una consulta para Hubi"
              />
              <div>
                
                <span>Demo local con datos de tu workspace</span>
                <button type="submit" aria-label="Enviar consulta a Hubi" disabled={!prompt.trim()}>
                  <ArrowUp size={15} />
                </button>
              </div>
            </form>
          </aside>
      )}
    </>
  );
}

