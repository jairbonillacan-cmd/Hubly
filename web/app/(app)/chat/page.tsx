"use client";

import React, { useMemo, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import {
  HublyAtIcon as AtSign,
  HublyChatIcon as MessageSquarePlus,
  HublyCheckIcon as CheckCheck,
  HublyChevronDownIcon as ChevronDown,
  HublyChevronRightIcon as ChevronRight,
  HublyHashIcon as Hash,
  HublyPaperclipIcon as Paperclip,
  HublyPlusIcon as Plus,
  HublySearchIcon as Search,
  HublySendIcon as Send,
  HublySmileIcon as Smile,
  HublySparkIcon as Sparkles,
  HublyArrowLeftIcon,
} from "@/components/app/icons/DuotoneIcons";

interface LocalThreadMessage {
  id: string;
  targetId: string;
  sender: string;
  senderInitials: string;
  senderBg: string;
  senderColor: string;
  text: string;
  time: string;
}

const INITIAL_LOCAL_MESSAGES: LocalThreadMessage[] = [
  {
    id: "m-min-1",
    targetId: "ch-min",
    sender: "Diego Morales",
    senderInitials: "DM",
    senderBg: "#EAF6FC",
    senderColor: "var(--hb-accent)",
    text: "Subimos los 3 cortes del taller en Guadalajara y la parrilla de noviembre para revisión.",
    time: "10:42",
  },
  {
    id: "m-min-2",
    targetId: "ch-min",
    sender: "Jair",
    senderInitials: "JA",
    senderBg: "#E6F4FB",
    senderColor: "var(--hb-accent-edge)",
    text: "Excelente, en cuanto Raúl apruebe el carrusel Goodyear welt programamos toda la semana.",
    time: "11:05",
  },
  {
    id: "m-jair-1",
    targetId: "dm-jair",
    sender: "Jair (tú)",
    senderInitials: "J",
    senderBg: "#E6F4FB",
    senderColor: "var(--hb-accent-text)",
    text: "Notas rápidas: conectar las redes y mandar el primer reporte mensual este viernes.",
    time: "09:15",
  },
];

export default function ChatPage() {
  const channels = useHublyStore((s) => s.channels);
  const storeMessages = useHublyStore((s) => s.messages);
  const sendChatMessage = useHublyStore((s) => s.sendChatMessage);

  // Default to null so initial render matches 04-chat-1440.png 1:1 ("Selecciona una conversación")
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const myName = useHublyStore((st) => st.profile?.name) || "Equipo";
  const brandLabel = useHublyStore((st) => st.brands.find((b) => b.id === st.activeBrandId)?.name) || "Marca";
  const [dmOpen, setDmOpen] = useState(true);
  const [minExpanded, setMinExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalThreadMessage[]>(backendEnabled ? [] : INITIAL_LOCAL_MESSAGES);

  const minSubChannels = [
    { id: "ch-min", name: "general", subtitle: `Canal principal · ${brandLabel}` },
    { id: "ch-min-contenido", name: "contenido", subtitle: "Parrillas y entregables" },
    { id: "ch-min-aprobaciones", name: "aprobaciones", subtitle: "Feedback de cliente" },
  ];

  const activeMeta = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId === "ch-general") {
      return {
        id: "ch-general",
        title: "# General",
        subtitle: "Canal general de la agencia · Sin mensajes aún",
        badgeText: "#",
        badgeBg: "#F1F5F9",
        badgeColor: "#475569",
      };
    }
    if (selectedId === "dm-jair") {
      return {
        id: "dm-jair",
        title: `${myName} (tú)`,
        subtitle: "Espacio personal · Notas, borradores y recordatorios",
        badgeText: "J",
        badgeBg: "#E6F4FB",
        badgeColor: "var(--hb-accent-text)",
      };
    }
    if (selectedId.startsWith("ch-min")) {
      const sub = minSubChannels.find((c) => c.id === selectedId) || minSubChannels[0];
      return {
        id: selectedId,
        title: `${brandLabel} · # ${sub.name}`,
        subtitle: sub.subtitle,
        badgeText: "M",
        badgeBg: "var(--hb-accent)",
        badgeColor: "#FFFFFF",
      };
    }
    const found = channels.find((c) => c.id === selectedId);
    if (found) {
      return {
        id: found.id,
        title: found.name,
        subtitle: found.type === "brand" ? "Canal de marca" : "Mensaje directo",
        badgeText: found.type === "brand" ? "#" : found.name.slice(0, 1).toUpperCase(),
        badgeBg: "#EAF6FC",
        badgeColor: "var(--hb-accent)",
      };
    }
    return null;
  }, [selectedId, channels]);

  const threadMessages = useMemo(() => {
    if (!selectedId) return [];
    const fromStore = storeMessages
      .filter((m) => m.channelId === selectedId)
      .map((m) => ({
        id: m.id,
        targetId: m.channelId,
        sender: m.sender,
        senderInitials: m.senderInitials,
        senderBg: "#EAF6FC",
        senderColor: "var(--hb-accent)",
        text: m.text,
        time: m.time,
      }));
    const fromLocal = localMessages.filter((m) => m.targetId === selectedId);
    return [...fromLocal, ...fromStore];
  }, [selectedId, storeMessages, localMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const isStoreChannel = channels.some((c) => c.id === selectedId);
    if (isStoreChannel) {
      sendChatMessage(selectedId, draft.trim(), myName, myName.slice(0, 2).toUpperCase());
    } else {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          targetId: selectedId,
          sender: myName,
          senderInitials: "JA",
          senderBg: "#E6F4FB",
          senderColor: "var(--hb-accent-text)",
          text: draft.trim(),
          time,
        },
      ]);
    }
    setDraft("");
  };

  const q = searchQuery.trim().toLowerCase();
  const showGeneral = !q || "general agencia".includes(q);
  const showMin = !q || "min marcas general contenido aprobaciones".includes(q);
  const showJair = !q || `${myName} tu mensajes directos`.toLowerCase().includes(q);

  return (
    <div
      className="hubly-chat"
      data-conversacion={selectedId ? "abierta" : "ninguna"}
      style={{
        display: "flex",
        width: "100%",
        background: "var(--ui-surface)",
        borderRadius: 16,
        border: "1px solid var(--ui-border)",
        overflow: "hidden",
      }}
    >
      {/* Left Sidebar Panel (280px matching 04-chat-1440.png) */}
      <aside
        className="hubly-chat-lista"
        style={{
          flexShrink: 0,
          background: "var(--ui-surface)",
          userSelect: "none",
        }}
      >
        {/* Top Search & Online Avatar Row */}
        <div
          style={{
            padding: "14px 14px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ui-muted)",
              border: "1px solid var(--ui-border)",
              borderRadius: 999,
              padding: "9px 14px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
            }}
          >
            <Search size={14} style={{ color: "var(--ui-text-5)", flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el chat"
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 13,
                color: "var(--ui-text-1)",
                width: "100%",
              }}
            />
          </div>

          {/* Online Avatar Button "J" matching 04-chat-1440.png */}
          <button
            type="button"
            onClick={() => setSelectedId("dm-jair")}
            title="Tu cuenta · En línea"
            aria-label="Tu cuenta · en línea"
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: "var(--hubly-success-bg)",
              color: "var(--tinta-exito)",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              display: "grid",
              placeItems: "center",
              position: "relative",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            J
            <span
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#4ADE80",
                border: "2px solid var(--ui-surface)",
              }}
            />
          </button>
        </div>

        {/* Subheader: Chat title + New Chat '+' button */}
        <div
          style={{
            padding: "4px 16px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--ui-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Chat
          </span>
          <button
            type="button"
            onClick={() => setSelectedId("ch-general")}
            title="Nueva conversación"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--ui-accent-soft)",
              color: "var(--hb-accent-text)",
              border: "none",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* Empty channels notice matching 04-chat-1440.png */}
        <div
          style={{
            padding: "4px 22px 14px",
            fontSize: 12,
            color: "var(--ui-text-5)",
            lineHeight: 1.45,
            borderBottom: "1px solid var(--ui-muted)",
          }}
        >
          Todavía no hay canales con conversación.
        </div>

        {/* Scrollable Navigation Sections */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 10px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Direct Messages Section (exact match to 04-chat-1440.png) */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 8px",
                marginBottom: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setDmOpen(!dmOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--ui-text-2)",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {/* Speech bubbles mini icon */}
                <MessageSquarePlus size={18} />
                <span>Mensajes directos</span>
                <span style={{ color: "var(--ui-text-5)", fontWeight: 500, fontSize: 12 }}>1</span>
              </button>

              <button
                type="button"
                onClick={() => setDmOpen(!dmOpen)}
                aria-label="Cerrar Mensajes directos"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ui-text-5)",
                  cursor: "pointer",
                  padding: 2,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {dmOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {dmOpen && showJair && (
              <button
                type="button"
                onClick={() => setSelectedId("dm-jair")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedId === "dm-jair" ? "var(--ui-accent-soft)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: "#E6F4FB",
                    color: "var(--ui-accent-text)",
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  J
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#4ADE80",
                      border: "1.5px solid var(--ui-surface)",
                    }}
                  />
                </span>
                <span style={{ fontSize: 13, color: "var(--ui-text-1)", fontWeight: 500 }}>
                  {myName} <span style={{ color: "var(--ui-text-5)", fontWeight: 400 }}>(tú)</span>
                </span>
              </button>
            )}
          </div>

          {/* AGENCIA Section */}
          {showGeneral && (
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ui-text-5)",
                  padding: "2px 8px 6px",
                }}
              >
                AGENCIA
              </div>

              <button
                type="button"
                onClick={() => setSelectedId("ch-general")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedId === "ch-general" ? "var(--ui-accent-soft)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: "var(--ui-muted)",
                      color: "var(--ui-text-3)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Hash size={14} />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: selectedId === "ch-general" ? "var(--hb-accent-text)" : "var(--ui-text-1)",
                      }}
                    >
                      # General
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ui-text-5)" }}>Sin mensajes aún</span>
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* MARCAS Section */}
          {showMin && (
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ui-text-5)",
                  padding: "2px 8px 6px",
                }}
              >
                MARCAS
              </div>

              {/* Collapsible Brand Group: Min (3 canales) */}
              <button
                type="button"
                onClick={() => {
                  setMinExpanded(!minExpanded);
                  setSelectedId("ch-min");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    selectedId?.startsWith("ch-min") && !minExpanded ? "var(--ui-accent-soft)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: "var(--hb-accent)",
                      color: "#FFFFFF",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    M
                  </span>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-1)" }}>{brandLabel}</span>
                    <span style={{ fontSize: 11, color: "var(--ui-text-5)" }}>3 canales</span>
                  </span>
                </span>
                <span style={{ color: "var(--ui-text-5)" }}>
                  {minExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>

              {minExpanded && (
                <div
                  style={{
                    paddingLeft: 18,
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {minSubChannels.map((sub) => {
                    const isSubActive = selectedId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedId(sub.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: isSubActive ? "var(--ui-accent-soft)" : "transparent",
                          color: isSubActive ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                          fontWeight: isSubActive ? 600 : 500,
                          fontSize: 12.5,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Hash size={13} />
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Right Main Area */}
      <section
        className="hubly-chat-panel"
        style={{
          flex: 1,
          flexDirection: "column",
          background: "var(--ui-surface)",
          minWidth: 0,
        }}
      >
        {!activeMeta ? (
          /* Centered Empty State matching 04-chat-1440.png 1:1 */
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              textAlign: "center",
            }}
          >
            {/* Overlapping Speech Bubbles Illustration matching 04-chat-1440.png */}
            <div style={{ marginBottom: 14 }}>
              <MessageSquarePlus size={48} />
            </div>

            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ui-text-1)",
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}
            >
              Selecciona una conversación
            </h2>

            <p
              style={{
                fontSize: 13,
                color: "var(--ui-text-5)",
                margin: 0,
                maxWidth: 235,
                lineHeight: 1.5,
              }}
            >
              Elige un canal o mensaje directo para comenzar.
            </p>
          </div>
        ) : (
          /* Active Conversation Thread */
          <>
            {/* Thread Header */}
            <header
              style={{
                padding: "14px 22px",
                borderBottom: "1px solid var(--ui-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <button
                  type="button"
                  className="hubly-cal-icon hubly-chat-volver"
                  aria-label="Volver a conversaciones"
                  title="Volver a conversaciones"
                  onClick={() => setSelectedId(null)}
                >
                  <HublyArrowLeftIcon size={17} />
                </button>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: activeMeta.badgeBg,
                    color: activeMeta.badgeColor,
                    fontWeight: 700,
                    fontSize: 14,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {activeMeta.badgeText}
                </span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ui-text)" }}>
                    {activeMeta.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ui-text-5)" }}>{activeMeta.subtitle}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--ui-border)",
                  background: "var(--ui-surface)",
                  color: "var(--ui-text-4)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cerrar vista
              </button>
            </header>

            {/* Messages Body */}
            <div
              style={{
                flex: 1,
                padding: "24px 26px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                background: "var(--ui-surface-2)",
              }}
            >
              {threadMessages.length === 0 ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    maxWidth: 320,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--ui-accent-soft)",
                      color: "var(--hb-accent-text)",
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <MessageSquarePlus size={20} />
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ui-text)", marginBottom: 4 }}>
                    Comienza la conversación en {activeMeta.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ui-text-5)", lineHeight: 1.5 }}>
                    Sin mensajes aún. Escribe el primer mensaje abajo para coordinar con tu equipo.
                  </div>
                </div>
              ) : (
                threadMessages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        background: m.senderBg,
                        color: m.senderColor,
                        fontSize: 12,
                        fontWeight: 700,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {m.senderInitials}
                    </span>

                    <div style={{ maxWidth: 620 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                          {m.sender}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--ui-text-5)" }}>{m.time}</span>
                        <CheckCheck size={13} style={{ color: "var(--hb-accent-text)" }} />
                      </div>
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "4px 14px 14px 14px",
                          background: "var(--ui-surface)",
                          border: "1px solid var(--ui-border)",
                          fontSize: 13.5,
                          color: "var(--ui-text-1)",
                          lineHeight: 1.5,
                          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Composer Footer */}
            <form
              className="hubly-chat-form"
              onSubmit={handleSend}
              style={{
                borderTop: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--ui-surface-2)",
                  border: "1px solid var(--ui-border)",
                  borderRadius: 12,
                  padding: "9px 14px",
                }}
              >
                <Paperclip size={16} style={{ color: "var(--ui-text-5)", cursor: "pointer" }} />
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Escribe un mensaje en ${activeMeta.title}...`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 13.5,
                    color: "var(--ui-text)",
                  }}
                />
                <AtSign className="hubly-chat-extra" size={16} style={{ color: "var(--ui-text-5)", cursor: "pointer" }} />
                <Smile className="hubly-chat-extra" size={16} style={{ color: "var(--ui-text-5)", cursor: "pointer" }} />
                <Sparkles className="hubly-chat-extra" size={16} style={{ color: "var(--hb-accent-text)", cursor: "pointer" }} />
              </div>

              <button
                type="submit"
                aria-label="Enviar"
                style={{
                  flexShrink: 0,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <Send size={14} />
                <span className="hubly-chat-enviar">Enviar</span>
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
