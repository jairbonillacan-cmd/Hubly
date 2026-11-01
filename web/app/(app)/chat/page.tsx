"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import {
  GENERAL_CHANNEL_ID,
  SELF_CHANNEL_ID,
  channelRoots,
  continuesPrevious,
  groupByDay,
  initialsOf,
  matchesQuery,
  repliesOf,
  replyCounts,
} from "@/lib/chat";
import { dueLabelFor, localIsoDate } from "@/lib/date";
import type { ChatAttachment, ChatMessage } from "@/lib/types";
import {
  HublyArrowLeftIcon,
  HublyBellIcon,
  HublyBellOffIcon,
  HublyChatIcon,
  HublyCloseIcon,
  HublyPinIcon,
  HublySearchIcon,
} from "@/components/app/icons/DuotoneIcons";
import { ChatSidebar, type ChatListItem } from "@/components/app/chat/ChatSidebar";
import { ChatMessageRow } from "@/components/app/chat/ChatMessageRow";
import { ChatComposer } from "@/components/app/chat/ChatComposer";

const MUTED_KEY = "hubly-chat-muted";
const PINNED_KEY = "hubly-chat-pinned";

function readIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* Sin almacenamiento: el aviso se queda solo en esta sesión. */
  }
}

function preview(m: ChatMessage | undefined): string {
  if (!m) return "Sin mensajes";
  if (m.text) return m.text;
  return m.attachment ? m.attachment.title : "Sin mensajes";
}

export default function ChatPage() {
  const channels = useHublyStore((s) => s.channels);
  const messages = useHublyStore((s) => s.messages);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const profileName = useHublyStore((s) => s.profile?.name);
  const sendChatMessage = useHublyStore((s) => s.sendChatMessage);
  const editChatMessage = useHublyStore((s) => s.editChatMessage);
  const deleteChatMessage = useHublyStore((s) => s.deleteChatMessage);
  const toggleChatReaction = useHublyStore((s) => s.toggleChatReaction);
  const toggleChatPin = useHublyStore((s) => s.toggleChatPin);
  const markChatRead = useHublyStore((s) => s.markChatRead);
  const addTask = useHublyStore((s) => s.addTask);

  const myName = profileName || "Equipo";
  const myInitials = initialsOf(myName);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [channelQuery, setChannelQuery] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [muted, setMuted] = useState<string[]>([]);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMuted(readIds(MUTED_KEY));
    setPinnedChats(readIds(PINNED_KEY));
    const params = new URLSearchParams(window.location.search);
    const channel = params.get("c");
    if (channel) {
      setSelectedId(channel);
      setFocusId(params.get("m"));
    }
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Canales: los del espacio de trabajo más el general de la agencia y las notas propias.
  const items = useMemo<ChatListItem[]>(() => {
    const lastOf = (id: string) => channelRoots(messages, id).at(-1);
    const base: ChatListItem[] = [
      { id: GENERAL_CHANNEL_ID, name: "General", group: "agencia", preview: preview(lastOf(GENERAL_CHANNEL_ID)), unread: 0, muted: false, pinned: false, initials: "#" },
      { id: SELF_CHANNEL_ID, name: `${myName} (tú)`, group: "directos", preview: preview(lastOf(SELF_CHANNEL_ID)), unread: 0, muted: false, pinned: false, initials: myInitials },
    ];
    const fromStore = channels.map<ChatListItem>((c) => ({
      id: c.id,
      name: c.name.replace(/^#\s*/, ""),
      group: c.type === "brand" ? "marcas" : "directos",
      preview: preview(lastOf(c.id)),
      unread: c.unread,
      muted: false,
      pinned: false,
      initials: initialsOf(c.name.replace(/\s*\(.*\)$/, "")),
    }));
    return [...base, ...fromStore].map((i) => ({ ...i, muted: muted.includes(i.id), pinned: pinnedChats.includes(i.id) }));
  }, [channels, messages, muted, pinnedChats, myName, myInitials]);

  const visibleItems = useMemo(() => {
    const q = listQuery.trim();
    if (!q) return items;
    return items.filter(
      (i) => matchesQuery({ text: i.name, sender: "" }, q) || messages.some((m) => m.channelId === i.id && matchesQuery(m, q))
    );
  }, [items, listQuery, messages]);

  const active = items.find((i) => i.id === selectedId) ?? null;
  const isMuted = active ? muted.includes(active.id) : false;
  const brandName = (id?: string) => brands.find((b) => b.id === id)?.name;

  const roots = useMemo(() => (selectedId ? channelRoots(messages, selectedId) : []), [messages, selectedId]);
  const counts = useMemo(() => replyCounts(messages), [messages]);
  const shown = useMemo(() => roots.filter((m) => matchesQuery(m, channelQuery)), [roots, channelQuery]);
  const days = useMemo(() => groupByDay(shown), [shown]);
  const pinned = useMemo(() => roots.filter((m) => m.pinned), [roots]);
  const threadRoot = threadId ? messages.find((m) => m.id === threadId) ?? null : null;
  const replies = useMemo(() => (threadId ? repliesOf(messages, threadId) : []), [messages, threadId]);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      setThreadId(null);
      setSearchOpen(false);
      setChannelQuery("");
      setFocusId(null);
      if (id) markChatRead(id);
    },
    [markChatRead]
  );

  // Al abrir una liga a un mensaje, el canal queda leído y el mensaje se muestra.
  useEffect(() => {
    if (selectedId) markChatRead(selectedId);
  }, [selectedId, markChatRead]);

  useEffect(() => {
    if (focusId) {
      const el = document.getElementById(`msg-${focusId}`);
      if (el) {
        el.scrollIntoView({ block: "center" });
        return;
      }
    }
    if (!channelQuery) endRef.current?.scrollIntoView({ block: "end" });
  }, [selectedId, roots.length, focusId, channelQuery]);

  const toggleMuteOf = (id: string) => {
    const was = muted.includes(id);
    const next = was ? muted.filter((m) => m !== id) : [...muted, id];
    setMuted(next);
    writeIds(MUTED_KEY, next);
    setNotice(was ? "Volverás a recibir avisos de este chat" : "Dejarás de recibir avisos de este chat");
  };

  const togglePinOf = (id: string) => {
    const next = pinnedChats.includes(id) ? pinnedChats.filter((p) => p !== id) : [...pinnedChats, id];
    setPinnedChats(next);
    writeIds(PINNED_KEY, next);
  };

  const toggleMute = () => {
    if (active) toggleMuteOf(active.id);
  };

  const send = (text: string, attachment?: ChatAttachment, parentId?: string) => {
    if (!selectedId) return;
    sendChatMessage(selectedId, text, myName, myInitials, { parentId, attachment });
  };

  const createTask = (m: ChatMessage) => {
    const channel = channels.find((c) => c.id === m.channelId);
    const today = localIsoDate();
    const title = (m.text || m.attachment?.title || "Tarea desde el chat").slice(0, 90);
    addTask({
      brandId: channel?.brandId ?? activeBrandId,
      title,
      description: m.text,
      dueDate: today,
      dueLabel: dueLabelFor(today, today),
      assignee: myName,
      listName: "Chat",
      status: "pendiente",
      priority: "Media",
    });
    setNotice("Tarea creada en Tareas");
  };

  const rowFor = (m: ChatMessage, prev: ChatMessage | undefined, inThread: boolean) => (
    <ChatMessageRow
      key={m.id}
      message={m}
      myName={myName}
      compact={continuesPrevious(prev, m)}
      replyCount={counts.get(m.id) ?? 0}
      canReply={!inThread}
      query={inThread ? "" : channelQuery}
      highlighted={m.id === focusId}
      onReply={() => setThreadId(m.id)}
      onEdit={(text) => editChatMessage(m.id, text)}
      onDelete={() => {
        if (threadId === m.id) setThreadId(null);
        deleteChatMessage(m.id);
      }}
      onPin={() => toggleChatPin(m.id)}
      onReact={(emoji) => toggleChatReaction(m.id, emoji, myName)}
      onCreateTask={() => createTask(m)}
      onNotice={setNotice}
    />
  );

  const subtitle = active
    ? active.group === "marcas"
      ? `Canal de ${brandName(channels.find((c) => c.id === active.id)?.brandId) ?? "la marca"}`
      : active.id === SELF_CHANNEL_ID
        ? "Notas, borradores y recordatorios"
        : active.group === "agencia"
          ? "Todo el equipo"
          : "Mensaje directo"
    : "";

  return (
    <div className="hubly-chat" data-conversacion={selectedId ? "abierta" : "ninguna"} data-hilo={threadRoot ? "abierto" : "cerrado"}>
      <ChatSidebar items={visibleItems} selectedId={selectedId} query={listQuery} onQuery={setListQuery} onSelect={select} onTogglePin={togglePinOf} onToggleMute={toggleMuteOf} onMarkRead={markChatRead} />

      <section className="hubly-chat-panel" aria-label={active ? `Conversación ${active.name}` : "Conversación"}>
        {!active ? (
          <div className="hubly-chat-vacio">
            <HublyChatIcon size={40} />
            <h1 className="hubly-chat-vacio-title">Chat</h1>
            <p>Elige un canal o un mensaje directo para empezar.</p>
          </div>
        ) : (
          <>
            <header className="hubly-chat-header">
              <button type="button" className="hubly-cal-icon hubly-chat-volver" aria-label="Volver a conversaciones" title="Volver a conversaciones" onClick={() => select(null)}>
                <HublyArrowLeftIcon size={17} />
              </button>
              <div className="hubly-chat-header-title">
                <h1>{active.name}</h1>
                <span>{subtitle}</span>
              </div>
              <div className="hubly-chat-header-actions">
                <button
                  type="button"
                  className="hubly-cal-icon"
                  aria-label="Buscar en este canal"
                  title="Buscar en este canal"
                  aria-pressed={searchOpen}
                  onClick={() => {
                    setSearchOpen((v) => !v);
                    setChannelQuery("");
                  }}
                >
                  <HublySearchIcon size={17} />
                </button>
                <button
                  type="button"
                  className="hubly-cal-icon"
                  aria-label={isMuted ? "Volver a avisarme aquí" : "Dejar de avisarme aquí"}
                  title={isMuted ? "Volver a avisarme aquí" : "Dejar de avisarme aquí"}
                  aria-pressed={isMuted}
                  onClick={toggleMute}
                >
                  {isMuted ? <HublyBellOffIcon size={17} /> : <HublyBellIcon size={17} />}
                </button>
              </div>
            </header>

            {searchOpen ? (
              <div className="hubly-chat-findbar">
                <HublySearchIcon size={15} />
                <input
                  type="search"
                  autoFocus
                  value={channelQuery}
                  placeholder="Buscar en este canal"
                  aria-label="Buscar en este canal"
                  onChange={(e) => setChannelQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setChannelQuery("");
                    }
                  }}
                />
                <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar búsqueda" onClick={() => { setSearchOpen(false); setChannelQuery(""); }}>
                  <HublyCloseIcon size={14} />
                </button>
              </div>
            ) : null}

            {pinned.length > 0 && !searchOpen ? (
              <button
                type="button"
                className="hubly-chat-pinbar"
                onClick={() => document.getElementById(`msg-${pinned[pinned.length - 1].id}`)?.scrollIntoView({ block: "center" })}
              >
                <HublyPinIcon size={14} />
                <span className="hubly-chat-pinbar-text">{preview(pinned[pinned.length - 1])}</span>
                <span className="hubly-chat-pinbar-count">{pinned.length === 1 ? "1 fijado" : `${pinned.length} fijados`}</span>
              </button>
            ) : null}

            <div className="hubly-chat-scroll">
              {roots.length === 0 ? (
                <div className="hubly-chat-vacio">
                  <h2 className="hubly-chat-vacio-title">Sin mensajes</h2>
                  <p>Escribe el primero para coordinar con tu equipo.</p>
                </div>
              ) : shown.length === 0 ? (
                <div className="hubly-chat-vacio">
                  <h2 className="hubly-chat-vacio-title">Sin resultados</h2>
                  <p>Ningún mensaje coincide con «{channelQuery.trim()}».</p>
                  <button type="button" className="hbtn hbtn-sm hbtn-secondary" onClick={() => setChannelQuery("")}>Limpiar búsqueda</button>
                </div>
              ) : (
                days.map((day) => (
                  <section key={day.day} className="hubly-chat-day" aria-label={day.label}>
                    <h2 className="hubly-chat-day-label"><span>{day.label}</span></h2>
                    {day.messages.map((m, i) => rowFor(m, day.messages[i - 1], false))}
                  </section>
                ))
              )}
              <div ref={endRef} />
            </div>

            {notice ? <div className="hubly-chat-notice" role="status">{notice}</div> : null}

            <div className="hubly-chat-foot">
              <ChatComposer
                key={active.id}
                label={`Mensaje en ${active.name}`}
                placeholder={active.id === SELF_CHANNEL_ID ? "Anota algo…" : `Escribe en ${active.name}…`}
                onSend={(text, attachment) => send(text, attachment)}
              />
            </div>
          </>
        )}
      </section>

      {threadRoot ? (
        <aside className="hubly-chat-hilo" aria-label="Hilo">
          <header className="hubly-chat-hilo-head">
            <h2>Hilo</h2>
            <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar hilo" onClick={() => setThreadId(null)}>
              <HublyCloseIcon size={14} />
            </button>
          </header>
          <div className="hubly-chat-hilo-scroll">
            {rowFor(threadRoot, undefined, true)}
            {replies.length === 0 ? (
              <p className="hubly-chat-hilo-vacio">Aún no hay respuestas.</p>
            ) : (
              <div className="hubly-chat-hilo-replies">
                {replies.map((m, i) => rowFor(m, replies[i - 1], true))}
              </div>
            )}
          </div>
          <div className="hubly-chat-foot">
            <ChatComposer
              key={threadRoot.id}
              label="Responder en el hilo"
              placeholder="Responder en el hilo…"
              onSend={(text, attachment) => send(text, attachment, threadRoot.id)}
            />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
