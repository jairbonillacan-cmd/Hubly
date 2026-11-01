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
  isDormant,
  matchesQuery,
  repliesOf,
  replyCounts,
  scheduledLabel,
} from "@/lib/chat";
import { dueLabelFor, localIsoDate } from "@/lib/date";
import type { ChatAttachment, ChatMessage } from "@/lib/types";
import {
  HublyArrowLeftIcon,
  HublyBellIcon,
  HublyBellOffIcon,
  HublyChatIcon,
  HublyChevronDownIcon,
  HublyChevronRightIcon,
  HublyClockIcon,
  HublyCloseIcon,
  HublyHashIcon,
  HublyPinIcon,
  HublySearchIcon,
} from "@/components/app/icons/DuotoneIcons";
import { askText } from "@/components/app/AppDialogHost";
import { ChatAvatar } from "@/components/app/chat/ChatAvatar";
import { ChatComposer, type ChatComposerHandle, type ChatMentionOption } from "@/components/app/chat/ChatComposer";
import { ChatDetails } from "@/components/app/chat/ChatDetails";
import { ChatMessageRow } from "@/components/app/chat/ChatMessageRow";
import { ChatSidebar, type ChatListItem } from "@/components/app/chat/ChatSidebar";

const MUTED_KEY = "hubly-chat-muted";
const PINNED_KEY = "hubly-chat-pinned";
const HIDDEN_KEY = "hubly-chat-hidden";
const PAGE_SIZE = 50;

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
    /* Sin almacenamiento: la preferencia se queda solo en esta sesión. */
  }
}

function usePreferenceList(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(readIds(key)), [key]);
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      writeIds(key, next);
      return next;
    });
  }, [key]);
  return [ids, toggle] as const;
}

const hasFile = (m: ChatMessage) => m.attachment?.kind === "file" || m.attachment?.kind === "voice";

export default function ChatPage() {
  const channels = useHublyStore((s) => s.channels);
  const messages = useHublyStore((s) => s.messages);
  const team = useHublyStore((s) => s.team);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const profile = useHublyStore((s) => s.profile);
  const scheduled = useHublyStore((s) => s.chatScheduled);
  const sendChatMessage = useHublyStore((s) => s.sendChatMessage);
  const editChatMessage = useHublyStore((s) => s.editChatMessage);
  const deleteChatMessage = useHublyStore((s) => s.deleteChatMessage);
  const toggleChatReaction = useHublyStore((s) => s.toggleChatReaction);
  const toggleChatPin = useHublyStore((s) => s.toggleChatPin);
  const markChatRead = useHublyStore((s) => s.markChatRead);
  const addChatChannel = useHublyStore((s) => s.addChatChannel);
  const updateChatChannel = useHublyStore((s) => s.updateChatChannel);
  const deleteChatChannel = useHublyStore((s) => s.deleteChatChannel);
  const scheduleChatMessage = useHublyStore((s) => s.scheduleChatMessage);
  const cancelChatScheduled = useHublyStore((s) => s.cancelChatScheduled);
  const addChatReminder = useHublyStore((s) => s.addChatReminder);
  const addTask = useHublyStore((s) => s.addTask);

  const myName = profile?.name || "Equipo";
  const myInitials = initialsOf(myName);
  const myPhoto = profile?.avatarUrl;
  const myId = profile?.id ?? "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [channelQuery, setChannelQuery] = useState("");
  const [side, setSide] = useState<{ kind: "thread"; id: string } | { kind: "details" } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [queueOpen, setQueueOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [muted, toggleMutedId] = usePreferenceList(MUTED_KEY);
  const [pinnedChats, togglePinOf] = usePreferenceList(PINNED_KEY);
  const [hiddenChats, toggleHiddenOf] = usePreferenceList(HIDDEN_KEY);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ChatComposerHandle>(null);

  useEffect(() => {
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

  const people = useMemo<ChatMentionOption[]>(
    () =>
      team
        .filter((m) => m.status === "Activo" && m.name !== myName && m.email !== profile?.email)
        .map((m) => ({ id: m.id, name: m.name, initials: m.initials || initialsOf(m.name) })),
    [team, myName, profile?.email]
  );
  const me = useMemo<ChatMentionOption>(() => ({ id: myId || "yo", name: myName, initials: myInitials }), [myId, myName, myInitials]);
  const mentionNames = useMemo(() => [myName, ...people.map((p) => p.name)], [myName, people]);

  const items = useMemo<ChatListItem[]>(() => {
    const now = Date.now();
    const base = [
      { id: GENERAL_CHANNEL_ID, name: "General", group: "agencia" as const, unread: 0, initials: "#" },
      { id: SELF_CHANNEL_ID, name: `${myName} (tú)`, group: "directos" as const, unread: 0, initials: myInitials, photo: myPhoto, online: true },
    ];
    const fromStore = channels.map((c) => ({
      id: c.id,
      name: c.name.replace(/^#\s*/, ""),
      group: c.type === "brand" ? ("marcas" as const) : c.type === "agency" ? ("agencia" as const) : ("directos" as const),
      unread: c.unread,
      initials: initialsOf(c.name.replace(/\s*\(.*\)$/, "")),
    }));
    return [...base, ...fromStore].map((i) => ({
      ...i,
      muted: muted.includes(i.id),
      pinned: pinnedChats.includes(i.id),
      hidden: hiddenChats.includes(i.id),
      dormant: isDormant(messages, i.id, now),
    }));
  }, [channels, messages, muted, pinnedChats, hiddenChats, myName, myInitials, myPhoto]);

  const visibleItems = useMemo(() => {
    const q = listQuery.trim();
    if (!q) return items;
    return items.filter(
      (i) => matchesQuery({ text: i.name, sender: "" }, q) || messages.some((m) => m.channelId === i.id && matchesQuery(m, q))
    );
  }, [items, listQuery, messages]);

  const active = items.find((i) => i.id === selectedId) ?? null;
  const channel = channels.find((c) => c.id === selectedId);
  const isMuted = active?.muted ?? false;
  const brandId = channel?.brandId ?? activeBrandId;
  const brandName = brands.find((b) => b.id === channel?.brandId)?.name;

  const roots = useMemo(() => (selectedId ? channelRoots(messages, selectedId) : []), [messages, selectedId]);
  const counts = useMemo(() => replyCounts(messages), [messages]);
  const shown = useMemo(() => roots.filter((m) => matchesQuery(m, channelQuery)), [roots, channelQuery]);
  const paged = useMemo(() => (focusId || channelQuery ? shown : shown.slice(-limit)), [focusId, channelQuery, shown, limit]);
  const hiddenCount = shown.length - paged.length;
  const days = useMemo(() => groupByDay(paged), [paged]);
  const pinned = useMemo(() => roots.filter((m) => m.pinned), [roots]);
  const channelFiles = useMemo(() => messages.filter((m) => m.channelId === selectedId && hasFile(m)), [messages, selectedId]);
  const threadRoot = side?.kind === "thread" ? messages.find((m) => m.id === side.id) ?? null : null;
  const replies = useMemo(() => (threadRoot ? repliesOf(messages, threadRoot.id) : []), [messages, threadRoot]);
  const queue = useMemo(
    () => (scheduled ?? []).filter((q) => q.channelId === selectedId && q.authorId === myId).sort((a, b) => a.sendAt - b.sendAt),
    [scheduled, selectedId, myId]
  );

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setSide(null);
    setSearchOpen(false);
    setChannelQuery("");
    setFocusId(null);
    setLimit(PAGE_SIZE);
    setQueueOpen(false);
  }, []);

  useEffect(() => {
    if (selectedId) markChatRead(selectedId);
  }, [selectedId, markChatRead, messages.length]);

  useEffect(() => {
    if (focusId) {
      document.getElementById(`msg-${focusId}`)?.scrollIntoView({ block: "center" });
      return;
    }
    const el = scrollRef.current;
    if (el && !channelQuery) el.scrollTop = el.scrollHeight;
  }, [selectedId, roots.length, focusId, channelQuery]);

  const toggleMute = (id: string) => {
    setNotice(muted.includes(id) ? "Avisos activados en este chat" : "Avisos silenciados en este chat");
    toggleMutedId(id);
  };

  const send = (text: string, attachments: ChatAttachment[], parentId?: string) => {
    if (!selectedId) return;
    if (attachments.length === 0) {
      sendChatMessage(selectedId, text, myName, myInitials, { parentId });
      return;
    }
    // El texto acompaña al primer adjunto; cada archivo más va en su propio mensaje.
    attachments.forEach((attachment, i) =>
      sendChatMessage(selectedId, i === 0 ? text : "", myName, myInitials, { parentId, attachment })
    );
  };

  const createTask = (m: ChatMessage) => {
    const owner = channels.find((c) => c.id === m.channelId);
    const today = localIsoDate();
    addTask({
      brandId: owner?.brandId ?? activeBrandId,
      title: (m.text || m.attachment?.title || "Tarea desde el chat").slice(0, 90),
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

  const newChannel = async () => {
    const name = (await askText("Nombre del canal nuevo", "", "Crear canal"))?.trim();
    if (!name) return;
    select(addChatChannel({ name, type: "agency" }).id);
  };

  const openPerson = (person: ChatMentionOption) => {
    const existing = channels.find((c) => c.type === "direct" && (c.memberId === person.id || c.name === person.name));
    select(existing ? existing.id : addChatChannel({ name: person.name, type: "direct", memberId: person.id }).id);
  };

  const openMessage = (id: string) => {
    setFocusId(id);
    document.getElementById(`msg-${id}`)?.scrollIntoView({ block: "center" });
  };

  const rowFor = (m: ChatMessage, prev: ChatMessage | undefined, inThread: boolean) => (
    <ChatMessageRow
      key={m.id}
      message={m}
      myName={myName}
      myPhoto={myPhoto}
      mentionNames={mentionNames}
      compact={continuesPrevious(prev, m)}
      replyCount={counts.get(m.id) ?? 0}
      canReply={!inThread}
      query={inThread ? "" : channelQuery}
      highlighted={m.id === focusId}
      onReply={() => setSide({ kind: "thread", id: m.id })}
      onEdit={(text) => editChatMessage(m.id, text)}
      onDelete={() => {
        if (threadRoot?.id === m.id) setSide(null);
        deleteChatMessage(m.id);
      }}
      onPin={() => toggleChatPin(m.id)}
      onReact={(emoji) => toggleChatReaction(m.id, emoji, myName)}
      onCreateTask={() => createTask(m)}
      onRemind={(at, label) => {
        addChatReminder({
          channelId: m.channelId,
          messageId: m.parentId ?? m.id,
          text: (m.text || m.attachment?.title || "Mensaje del chat").slice(0, 120),
          remindAt: at,
          authorId: myId,
        });
        setNotice(`Te lo recordamos: ${label.charAt(0).toLowerCase()}${label.slice(1)}`);
      }}
      onNotice={setNotice}
    />
  );

  const subtitle = !active
    ? ""
    : channel?.description
      ? channel.description
      : active.group === "marcas"
        ? `Canal de ${brandName ?? "la marca"}`
        : active.id === SELF_CHANNEL_ID
          ? "Notas, borradores y recordatorios"
          : active.group === "agencia"
            ? "Canal de la agencia"
            : "Mensaje directo";

  const members: ChatMentionOption[] = !active
    ? []
    : active.id === SELF_CHANNEL_ID
      ? [me]
      : channel?.type === "direct"
        ? [me, ...people.filter((p) => p.id === channel.memberId || channel.name.startsWith(p.name))]
        : channel?.type === "brand"
          ? [
              me,
              ...team
                .filter((m) => m.status === "Activo" && m.name !== myName && m.brandIds?.includes(channel.brandId ?? ""))
                .map((m) => ({ id: m.id, name: m.name, initials: m.initials || initialsOf(m.name) })),
            ]
          : [me, ...people];

  const lastPinned = pinned[pinned.length - 1];

  return (
    <div className="hubly-chat" data-conversacion={selectedId ? "abierta" : "ninguna"} data-hilo={side && active ? "abierto" : "cerrado"}>
      <ChatSidebar
        items={visibleItems}
        selectedId={selectedId}
        query={listQuery}
        myInitials={myInitials}
        myPhoto={myPhoto}
        people={people}
        onQuery={setListQuery}
        onSelect={select}
        onOpenSelf={() => select(SELF_CHANNEL_ID)}
        onNewChannel={newChannel}
        onOpenPerson={openPerson}
        onTogglePin={togglePinOf}
        onToggleMute={toggleMute}
        onToggleHidden={toggleHiddenOf}
        onMarkRead={markChatRead}
      />

      <section
        className="hubly-chat-panel"
        aria-label={active ? `Conversación ${active.name}` : "Conversación"}
        onDragOver={(e) => {
          if (active && e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          if (!dragging) return;
          e.preventDefault();
          setDragging(false);
          composerRef.current?.addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        {!active ? (
          <div className="hubly-chat-vacio">
            <HublyChatIcon size={40} />
            <h1 className="hubly-chat-vacio-title">Elige una conversación</h1>
            <p>Abre un canal o un mensaje directo para empezar.</p>
          </div>
        ) : (
          <>
            <header className="hubly-chat-header">
              <button type="button" className="hubly-cal-icon hubly-chat-volver" aria-label="Volver a conversaciones" onClick={() => select(null)}>
                <HublyArrowLeftIcon size={17} />
              </button>
              <button
                type="button"
                className="hubly-chat-pill"
                aria-label={`Ver detalles de ${active.name}`}
                aria-expanded={side?.kind === "details"}
                onClick={() => setSide(side?.kind === "details" ? null : { kind: "details" })}
              >
                {active.group === "directos" ? (
                  <ChatAvatar initials={active.initials} photo={active.photo} size="sm" online={active.online} />
                ) : (
                  <span className="hubly-chat-item-hash"><HublyHashIcon size={15} /></span>
                )}
                <h1>{active.name}</h1>
              </button>
              <div className="hubly-chat-header-actions">
                <button
                  type="button"
                  className="hubly-chat-pill-btn"
                  aria-label="Buscar en este chat"
                  data-tip="Buscar en este chat"
                  data-tip-below
                  data-tip-end
                  aria-pressed={searchOpen}
                  onClick={() => {
                    setSearchOpen((v) => !v);
                    setChannelQuery("");
                  }}
                >
                  <HublySearchIcon size={16} />
                </button>
                <button
                  type="button"
                  className="hubly-chat-pill-btn"
                  aria-label={isMuted ? "Activar avisos" : "Silenciar avisos"}
                  data-tip={isMuted ? "Activar avisos" : "Silenciar avisos"}
                  data-tip-below
                  data-tip-end
                  aria-pressed={isMuted}
                  onClick={() => toggleMute(active.id)}
                >
                  {isMuted ? <HublyBellOffIcon size={16} /> : <HublyBellIcon size={16} />}
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
                  placeholder="Buscar en este chat"
                  aria-label="Buscar en este chat"
                  onChange={(e) => setChannelQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setChannelQuery("");
                    }
                  }}
                />
                <button type="button" className="hubly-chat-file-remove" aria-label="Cerrar búsqueda" onClick={() => { setSearchOpen(false); setChannelQuery(""); }}>
                  <HublyCloseIcon size={13} />
                </button>
              </div>
            ) : null}

            {lastPinned && !searchOpen ? (
              <button type="button" className="hubly-chat-pinbar" onClick={() => openMessage(lastPinned.id)}>
                <HublyPinIcon size={14} />
                <span className="hubly-chat-pinbar-text">{lastPinned.text || lastPinned.attachment?.title}</span>
                <span className="hubly-chat-pinbar-count">{pinned.length === 1 ? "1 fijado" : `${pinned.length} fijados`}</span>
              </button>
            ) : null}

            <div className="hubly-chat-scroll" ref={scrollRef}>
              {roots.length === 0 ? (
                <div className="hubly-chat-vacio">
                  <h2 className="hubly-chat-vacio-title">Sin mensajes</h2>
                  <p>{active.id === SELF_CHANNEL_ID ? "Guarda aquí notas y borradores." : `Escribe el primero en ${active.name}.`}</p>
                </div>
              ) : shown.length === 0 ? (
                <div className="hubly-chat-vacio">
                  <h2 className="hubly-chat-vacio-title">Sin resultados</h2>
                  <p>Ningún mensaje coincide con «{channelQuery.trim()}».</p>
                  <button type="button" className="hbtn hbtn-sm hbtn-secondary" onClick={() => setChannelQuery("")}>Limpiar búsqueda</button>
                </div>
              ) : (
                <>
                  {hiddenCount > 0 ? (
                    <button type="button" className="hbtn hbtn-xs hbtn-ghost hubly-chat-older" onClick={() => setLimit((v) => v + PAGE_SIZE)}>
                      Ver mensajes anteriores
                    </button>
                  ) : null}
                  {days.map((day) => (
                    <section key={day.day} aria-label={day.label}>
                      <h2 className="hubly-chat-day-label"><span>{day.label}</span></h2>
                      {day.messages.map((m, i) => rowFor(m, day.messages[i - 1], false))}
                    </section>
                  ))}
                </>
              )}
            </div>

            {notice ? <div className="hubly-chat-notice" role="status">{notice}</div> : null}

            <div className="hubly-chat-foot">
              {queue.length > 0 ? (
                <div className="hubly-chat-queue">
                  <button type="button" className="hubly-chat-queue-head" aria-expanded={queueOpen} onClick={() => setQueueOpen((v) => !v)}>
                    <HublyClockIcon size={14} />
                    <span>Programados ({queue.length})</span>
                    {queueOpen ? <HublyChevronDownIcon size={14} /> : <HublyChevronRightIcon size={14} />}
                  </button>
                  {queueOpen ? (
                    <ul className="hubly-chat-queue-list">
                      {queue.map((q) => (
                        <li key={q.id}>
                          <span className="hubly-chat-queue-when">
                            {scheduledLabel(q.sendAt)}
                            {q.repeat === "weekly" ? " · cada semana" : q.repeat === "monthly" ? " · cada mes" : ""}
                          </span>
                          <span className="hubly-chat-queue-text" title={q.text}>{q.text}</span>
                          <button type="button" className="hubly-chat-file-remove" aria-label={`Cancelar «${q.text}»`} onClick={() => cancelChatScheduled(q.id)}>
                            <HublyCloseIcon size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              <ChatComposer
                key={active.id}
                ref={composerRef}
                label={`Mensaje en ${active.name}`}
                placeholder={active.id === SELF_CHANNEL_ID ? "Escribe una nota…" : `Escribe en ${active.name}…`}
                brandId={brandId}
                mentions={people}
                onSend={(text, attachments) => send(text, attachments)}
                onSchedule={(text, at, repeat) => {
                  scheduleChatMessage({
                    channelId: active.id,
                    text: text.trim(),
                    sendAt: at,
                    repeat,
                    authorId: myId,
                    sender: myName,
                    senderInitials: myInitials,
                  });
                  setQueueOpen(true);
                  setNotice(`Se enviará: ${scheduledLabel(at)}`);
                }}
              />
            </div>

            {dragging ? <div className="hubly-chat-drop">Suelta los archivos para adjuntarlos</div> : null}
          </>
        )}
      </section>

      {active && side?.kind === "details" ? (
        <ChatDetails
          key={active.id}
          name={active.name}
          subtitle={subtitle}
          description={channel?.description}
          editable={channel?.type === "agency"}
          members={members}
          pinned={pinned}
          files={channelFiles}
          onClose={() => setSide(null)}
          onOpenMessage={openMessage}
          onSave={(patch) => {
            updateChatChannel(active.id, patch);
            setNotice("Cambios guardados");
          }}
          onDelete={() => {
            deleteChatChannel(active.id);
            select(null);
          }}
        />
      ) : null}

      {threadRoot ? (
        <aside className="hubly-chat-hilo" aria-label="Hilo">
          <header className="hubly-chat-hilo-head">
            <h2>Hilo</h2>
            <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar hilo" onClick={() => setSide(null)}>
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
              brandId={brandId}
              mentions={people}
              onSend={(text, attachments) => send(text, attachments, threadRoot.id)}
            />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
