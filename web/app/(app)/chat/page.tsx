"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Hash,
  ChevronDown,
  ChevronRight,
  Send,
  Paperclip,
  Smile,
  AtSign,
  MessageSquarePlus,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";

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
    senderBg: "#F0F1F9",
    senderColor: "#6C77C1",
    text: "Subimos los 3 cortes del taller en Guadalajara y la parrilla de noviembre para revisión.",
    time: "10:42",
  },
  {
    id: "m-min-2",
    targetId: "ch-min",
    sender: "Jair",
    senderInitials: "JA",
    senderBg: "#ECEEF8",
    senderColor: "#4C56A0",
    text: "Excelente, en cuanto Raúl apruebe el carrusel Goodyear welt programamos toda la semana.",
    time: "11:05",
  },
  {
    id: "m-jair-1",
    targetId: "dm-jair",
    sender: "Jair (tú)",
    senderInitials: "J",
    senderBg: "#ECEEF8",
    senderColor: "#5360A5",
    text: "Notas rápidas: conectar las redes de Min y mandar el primer reporte mensual este viernes.",
    time: "09:15",
  },
];

export default function ChatPage() {
  const channels = useHublyStore((s) => s.channels);
  const storeMessages = useHublyStore((s) => s.messages);
  const sendChatMessage = useHublyStore((s) => s.sendChatMessage);

  // Default to null so initial render matches 04-chat-1440.png 1:1 ("Selecciona una conversacion")
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dmOpen, setDmOpen] = useState(true);
  const [minExpanded, setMinExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalThreadMessage[]>(INITIAL_LOCAL_MESSAGES);

  const minSubChannels = [
    { id: "ch-min", name: "general", subtitle: "Canal principal · Min" },
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
        title: "Jair (tú)",
        subtitle: "Espacio personal · Notas, borradores y recordatorios",
        badgeText: "J",
        badgeBg: "#ECEEF8",
        badgeColor: "#5360A5",
      };
    }
    if (selectedId.startsWith("ch-min")) {
      const sub = minSubChannels.find((c) => c.id === selectedId) || minSubChannels[0];
      return {
        id: selectedId,
        title: `Min · # ${sub.name}`,
        subtitle: sub.subtitle,
        badgeText: "M",
        badgeBg: "#6C77C1",
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
        badgeBg: "#F0F1F9",
        badgeColor: "#6C77C1",
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
        senderBg: "#F0F1F9",
        senderColor: "#6C77C1",
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
      sendChatMessage(selectedId, draft.trim(), "Jair", "JA");
    } else {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          targetId: selectedId,
          sender: "Jair",
          senderInitials: "JA",
          senderBg: "#ECEEF8",
          senderColor: "#5360A5",
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
  const showJair = !q || "jair tu mensajes directos".includes(q);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "calc(100vh - 48px)",
        height: "calc(100vh - 48px)",
        background: "var(--ui-surface)",
        borderRadius: 16,
        border: "1px solid #EEF2F6",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left Sidebar Panel (280px matching 04-chat-1440.png) */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid #EEF2F6",
          background: "var(--ui-surface)",
          display: "flex",
          flexDirection: "column",
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
              background: "#F4F5F8",
              border: "1px solid #ECEEF4",
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
              background: "#D1FAE5",
              color: "#047857",
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
              color: "#6C77C1",
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3C7.03 3 3 6.58 3 11c0 1.85.71 3.55 1.89 4.91L4 20l4.38-1.46c1.12.3 2.34.46 3.62.46 4.97 0 9-3.58 9-8s-4.03-8-9-8z"
                    fill="#94A3B8"
                  />
                </svg>
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
                    background: "#ECEEF8",
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
                  Jair <span style={{ color: "var(--ui-text-5)", fontWeight: 400 }}>(tú)</span>
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
                        color: selectedId === "ch-general" ? "#6C77C1" : "var(--ui-text-1)",
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
                      background: "#6C77C1",
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-1)" }}>Min</span>
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
                          color: isSubActive ? "#6C77C1" : "var(--ui-text-3)",
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
        style={{
          flex: 1,
          display: "flex",
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
              <svg width="52" height="48" viewBox="0 0 52 48" fill="none">
                {/* Back speech bubble */}
                <path
                  d="M22 6C12.06 6 4 12.72 4 21c0 3.48 1.42 6.68 3.8 9.22L6 38l8.1-2.74C16.54 35.74 19.2 36 22 36c9.94 0 18-6.72 18-15S31.94 6 22 6z"
                  fill="#94A3B8"
                />
                {/* Front speech bubble with 3 dots */}
                <path
                  d="M31 16c-8.28 0-15 5.6-15 12.5 0 6.9 6.72 12.5 15 12.5 2.34 0 4.55-.45 6.52-1.24L44 42l-1.5-6.48C44.48 33.4 46 30.62 46 28.5 46 21.6 39.28 16 31 16z"
                  fill="#AEB7C4"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle cx="26" cy="28.5" r="1.7" fill="#FFFFFF" />
                <circle cx="31" cy="28.5" r="1.7" fill="#FFFFFF" />
                <circle cx="36" cy="28.5" r="1.7" fill="#FFFFFF" />
              </svg>
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
              Selecciona una conversacion
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
                borderBottom: "1px solid #EEF2F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
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
                background: "#FAFBFC",
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
                      color: "#6C77C1",
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
                        <CheckCheck size={13} style={{ color: "#6C77C1" }} />
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
              onSubmit={handleSend}
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #EEF2F6",
                background: "var(--ui-surface)",
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
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 13.5,
                    color: "var(--ui-text)",
                  }}
                />
                <AtSign size={16} style={{ color: "var(--ui-text-5)", cursor: "pointer" }} />
                <Smile size={16} style={{ color: "var(--ui-text-5)", cursor: "pointer" }} />
                <Sparkles size={16} style={{ color: "#6C77C1", cursor: "pointer" }} />
              </div>

              <button
                type="submit"
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#6C77C1",
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
                <span>Enviar</span>
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
