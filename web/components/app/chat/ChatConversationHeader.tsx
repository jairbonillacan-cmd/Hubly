"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { scheduledLabel } from "@/lib/chat";
import type { ChatAttachment, ChatMessage, ChatScheduledMessage } from "@/lib/types";
import {
  HublyArrowLeftIcon,
  HublyBellIcon,
  HublyBellOffIcon,
  HublyChevronDownIcon,
  HublyChevronRightIcon,
  HublyClipboardIcon,
  HublyClockIcon,
  HublyCloseIcon,
  HublyHashIcon,
  HublyPinIcon,
  HublySearchIcon,
} from "@/components/app/icons/DuotoneIcons";
import { ChatAvatar } from "./ChatAvatar";
import type { ChatListItem } from "./ChatSidebar";
import { PopMenu } from "./PopMenu";

interface ChatConversationHeaderProps {
  active: ChatListItem;
  channelEmoji?: string;
  pending: ChatAttachment[];
  detailsOpen: boolean;
  searchOpen: boolean;
  onBack: () => void;
  onHeaderAction: (action: "details" | "search" | "mute") => void;
}

export function ChatConversationHeader({
  active,
  channelEmoji,
  pending,
  detailsOpen,
  searchOpen,
  onBack,
  onHeaderAction,
}: ChatConversationHeaderProps) {
  const [pendingOpen, setPendingOpen] = useState(false);
  const closePending = useCallback(() => setPendingOpen(false), []);
  const isMuted = active.muted;

  return (
    <header className="hubly-chat-header">
      <button type="button" className="hubly-cal-icon hubly-chat-volver" aria-label="Volver a conversaciones" onClick={onBack}>
        <HublyArrowLeftIcon size={17} />
      </button>
      <button
        type="button"
        className="hubly-chat-pill"
        aria-label={`Ver detalles de ${active.name}`}
        aria-expanded={detailsOpen}
        onClick={() => onHeaderAction("details")}
      >
        {active.group === "directos" ? (
          <ChatAvatar initials={active.initials} photo={active.photo} size="sm" online={active.online} />
        ) : (
          <span className="hubly-chat-item-hash">{channelEmoji || <HublyHashIcon size={15} />}</span>
        )}
        <h1>{active.name}</h1>
      </button>
      {pending.length > 0 ? (
        <span className="hubly-chat-tool-wrap hubly-chat-pending">
          <button
            type="button"
            className="hubly-chat-pending-btn"
            data-pop-trigger
            aria-expanded={pendingOpen}
            onClick={() => setPendingOpen((v) => !v)}
          >
            {pending.length === 1 ? "1 pendiente" : `${pending.length} pendientes`}
          </button>
          <PopMenu open={pendingOpen} onClose={closePending} label="Pendientes de este chat" className="hubly-chat-pending-pop">
            <div className="hubly-chat-pop-title">Sigue abierto</div>
            {pending.map((a) => (
              <Link key={`${a.kind}-${a.id}`} href={a.href} role="menuitem" className="hubly-chat-menuitem" onClick={closePending}>
                {a.kind === "task" ? <HublyClipboardIcon size={15} /> : <HublyHashIcon size={15} />}
                <span className="hubly-chat-details-clip">{a.title}</span>
              </Link>
            ))}
          </PopMenu>
        </span>
      ) : null}
      <div className="hubly-chat-header-actions">
        <button
          type="button"
          className="hubly-chat-pill-btn"
          aria-label="Buscar en este chat"
          data-tip="Buscar en este chat"
          data-tip-below
          data-tip-end
          aria-pressed={searchOpen}
          onClick={() => onHeaderAction("search")}
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
          onClick={() => onHeaderAction("mute")}
        >
          {isMuted ? <HublyBellOffIcon size={16} /> : <HublyBellIcon size={16} />}
        </button>
      </div>
    </header>
  );
}

interface ChatFindAndPinBarProps {
  searchOpen: boolean;
  channelQuery: string;
  pinned: ChatMessage[];
  onQueryChange: (value: string) => void;
  onCloseSearch: () => void;
  onOpenPinned: (messageId: string) => void;
}

export function ChatFindAndPinBar({
  searchOpen,
  channelQuery,
  pinned,
  onQueryChange,
  onCloseSearch,
  onOpenPinned,
}: ChatFindAndPinBarProps) {
  const lastPinned = pinned[pinned.length - 1];

  if (searchOpen) {
    return (
      <div className="hubly-chat-findbar">
        <HublySearchIcon size={15} />
        <input
          type="search"
          autoFocus
          value={channelQuery}
          placeholder="Buscar en este chat"
          aria-label="Buscar en este chat"
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCloseSearch();
          }}
        />
        <button type="button" className="hubly-chat-file-remove" aria-label="Cerrar búsqueda" onClick={onCloseSearch}>
          <HublyCloseIcon size={13} />
        </button>
      </div>
    );
  }

  if (!lastPinned) return null;

  return (
    <button type="button" className="hubly-chat-pinbar" onClick={() => onOpenPinned(lastPinned.id)}>
      <HublyPinIcon size={14} />
      <span className="hubly-chat-pinbar-text">{lastPinned.text || lastPinned.attachment?.title}</span>
      <span className="hubly-chat-pinbar-count">{pinned.length === 1 ? "1 fijado" : `${pinned.length} fijados`}</span>
    </button>
  );
}

interface ChatScheduledQueueProps {
  queue: ChatScheduledMessage[];
  open: boolean;
  onToggle: () => void;
  onCancel: (id: string) => void;
}

export function ChatScheduledQueue({ queue, open, onToggle, onCancel }: ChatScheduledQueueProps) {
  if (queue.length === 0) return null;

  return (
    <div className="hubly-chat-queue">
      <button type="button" className="hubly-chat-queue-head" aria-expanded={open} onClick={onToggle}>
        <HublyClockIcon size={14} />
        <span>Programados ({queue.length})</span>
        {open ? <HublyChevronDownIcon size={14} /> : <HublyChevronRightIcon size={14} />}
      </button>
      {open ? (
        <ul className="hubly-chat-queue-list">
          {queue.map((q) => (
            <li key={q.id}>
              <span className="hubly-chat-queue-when">
                {scheduledLabel(q.sendAt)}
                {q.repeat === "weekly" ? " · cada semana" : q.repeat === "monthly" ? " · cada mes" : ""}
              </span>
              <span className="hubly-chat-queue-text" title={q.text}>{q.text}</span>
              <button type="button" className="hubly-chat-file-remove" aria-label={`Cancelar «${q.text}»`} onClick={() => onCancel(q.id)}>
                <HublyCloseIcon size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
