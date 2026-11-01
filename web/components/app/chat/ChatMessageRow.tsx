"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { askConfirm } from "@/components/app/AppDialogHost";
import { QUICK_REACTIONS } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types";
import {
  HublyClipboardIcon,
  HublyCopyIcon,
  HublyFolderIcon,
  HublyHashIcon,
  HublyLayersIcon,
  HublyLinkIcon,
  HublyMoreIcon,
  HublyPencilIcon,
  HublyPinIcon,
  HublyReplyIcon,
  HublySmileIcon,
  HublyTrashIcon,
} from "@/components/app/icons/DuotoneIcons";
import { PopMenu } from "./PopMenu";

const ATTACHMENT_ICON = {
  post: HublyHashIcon,
  task: HublyClipboardIcon,
  project: HublyLayersIcon,
  asset: HublyFolderIcon,
} as const;

interface ChatMessageRowProps {
  message: ChatMessage;
  myName: string;
  /** Sin cabecera: sigue a un mensaje del mismo autor. */
  compact?: boolean;
  replyCount?: number;
  /** En el panel de hilo no se responde a una respuesta. */
  canReply?: boolean;
  query?: string;
  highlighted?: boolean;
  onReply?: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
  onCreateTask: () => void;
  onNotice: (text: string) => void;
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="hubly-chat-mark">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function ChatMessageRow({
  message: m,
  myName,
  compact,
  replyCount = 0,
  canReply = true,
  query = "",
  highlighted,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onCreateTask,
  onNotice,
}: ChatMessageRowProps) {
  const [menu, setMenu] = useState<"react" | "more" | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const mine = m.sender === myName;
  const closeMenu = useCallback(() => setMenu(null), []);

  const copy = async (text: string, notice: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotice(notice);
    } catch {
      onNotice("No pudimos copiar. Hazlo a mano.");
    }
    setMenu(null);
  };

  const remove = async () => {
    if (await askConfirm("¿Eliminar este mensaje y sus respuestas?")) onDelete();
  };

  const saveEdit = () => {
    if (editing && editing.trim() && editing.trim() !== m.text) onEdit(editing);
    setEditing(null);
  };

  const reactions = Object.entries(m.reactions ?? {});
  const AttachmentIcon = m.attachment ? ATTACHMENT_ICON[m.attachment.kind] : null;
  const linkTarget = `${m.channelId}`;

  return (
    <div
      id={`msg-${m.id}`}
      className={`hubly-chat-msg${compact ? " is-compact" : ""}${highlighted ? " is-highlighted" : ""}${menu ? " has-menu" : ""}`}
      data-message-id={m.id}
    >
      {compact ? (
        <span className="hubly-chat-msg-gutter" title={m.time}>{m.time}</span>
      ) : (
        <span className="hubly-chat-avatar" aria-hidden="true">{m.senderInitials}</span>
      )}
      <div className="hubly-chat-msg-body">
        {compact ? null : (
          <div className="hubly-chat-msg-head">
            <span className="hubly-chat-msg-name">{m.sender}</span>
            <span className="hubly-chat-msg-time">{m.time}</span>
            {m.pinned ? (
              <span className="hubly-chat-msg-flag" title="Fijado en el chat">
                <HublyPinIcon size={13} />
                <span>Fijado</span>
              </span>
            ) : null}
          </div>
        )}

        {editing !== null ? (
          <div className="hubly-chat-edit">
            <textarea
              className="hubly-chat-input"
              value={editing}
              rows={2}
              autoFocus
              aria-label="Editar mensaje"
              onChange={(e) => setEditing(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditing(null);
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
            />
            <div className="hubly-chat-edit-actions">
              <button type="button" className="hbtn hbtn-xs hbtn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="button" className="hbtn hbtn-xs hbtn-secondary" onClick={saveEdit}>Guardar</button>
            </div>
          </div>
        ) : m.text ? (
          <p className="hubly-chat-msg-text">
            {highlight(m.text, query)}
            {m.editedAt ? <span className="hubly-chat-msg-edited"> (editado)</span> : null}
          </p>
        ) : null}

        {m.attachment && AttachmentIcon ? (
          <Link href={m.attachment.href} className="hubly-chat-attachment">
            <span className="hubly-cal-row-icon hubly-lista-icono"><AttachmentIcon size={17} /></span>
            <span className="hubly-lista-texto">
              <span className="hubly-cal-row-title">{m.attachment.title}</span>
              {m.attachment.meta ? <span className="hubly-cal-row-meta">{m.attachment.meta}</span> : null}
            </span>
          </Link>
        ) : null}

        {reactions.length > 0 ? (
          <div className="hubly-chat-reactions">
            {reactions.map(([emoji, who]) => (
              <button
                key={emoji}
                type="button"
                className="hubly-chat-reaction"
                aria-pressed={who.includes(myName)}
                title={who.join(", ")}
                aria-label={`${emoji} de ${who.join(", ")}`}
                onClick={() => onReact(emoji)}
              >
                <span aria-hidden="true">{emoji}</span>
                <span>{who.length}</span>
              </button>
            ))}
          </div>
        ) : null}

        {canReply && replyCount > 0 ? (
          <button type="button" className="hubly-chat-thread-link" onClick={onReply}>
            {replyCount === 1 ? "1 respuesta" : `${replyCount} respuestas`}
          </button>
        ) : null}
      </div>

      {editing === null ? (
        <div className="hubly-chat-tools" role="toolbar" aria-label="Acciones del mensaje">
          {canReply ? (
            <button type="button" className="hubly-chat-tool" aria-label="Responder en hilo" title="Responder en hilo" onClick={onReply}>
              <HublyReplyIcon size={15} />
            </button>
          ) : null}
          <span className="hubly-chat-tool-wrap">
            <button
              type="button"
              className="hubly-chat-tool"
              data-pop-trigger
              aria-label="Reaccionar"
              title="Reaccionar"
              aria-expanded={menu === "react"}
              onClick={() => setMenu(menu === "react" ? null : "react")}
            >
              <HublySmileIcon size={15} />
            </button>
            <PopMenu open={menu === "react"} onClose={closeMenu} label="Reacciones" className="hubly-chat-reactpop">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  className="hubly-chat-emoji"
                  aria-label={`Reaccionar con ${emoji}`}
                  onClick={() => {
                    onReact(emoji);
                    setMenu(null);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </PopMenu>
          </span>
          <button type="button" className="hubly-chat-tool" aria-label="Crear tarea" title="Crear tarea" onClick={onCreateTask}>
            <HublyClipboardIcon size={15} />
          </button>
          {mine ? (
            <>
              <button type="button" className="hubly-chat-tool" aria-label="Editar" title="Editar" onClick={() => setEditing(m.text)}>
                <HublyPencilIcon size={15} />
              </button>
              <button type="button" className="hubly-chat-tool" aria-label="Eliminar" title="Eliminar" onClick={remove}>
                <HublyTrashIcon size={15} />
              </button>
            </>
          ) : null}
          <span className="hubly-chat-tool-wrap">
            <button
              type="button"
              className="hubly-chat-tool"
              data-pop-trigger
              aria-label="Más acciones"
              title="Más acciones"
              aria-expanded={menu === "more"}
              onClick={() => setMenu(menu === "more" ? null : "more")}
            >
              <HublyMoreIcon size={15} />
            </button>
            <PopMenu open={menu === "more"} onClose={closeMenu} label="Más acciones" className="hubly-chat-morepop">
              <button type="button" role="menuitem" className="hubly-chat-menuitem" disabled={!m.text} onClick={() => copy(m.text, "Texto copiado")}>
                <HublyCopyIcon size={15} />
                <span>Copiar texto</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hubly-chat-menuitem"
                onClick={() => {
                  onPin();
                  setMenu(null);
                }}
              >
                <HublyPinIcon size={15} />
                <span>{m.pinned ? "Quitar de fijados" : "Fijar en el chat"}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hubly-chat-menuitem"
                onClick={() =>
                  copy(
                    `${window.location.origin}/chat?c=${encodeURIComponent(linkTarget)}&m=${encodeURIComponent(m.parentId ?? m.id)}`,
                    "Liga copiada"
                  )
                }
              >
                <HublyLinkIcon size={15} />
                <span>Copiar liga al mensaje</span>
              </button>
            </PopMenu>
          </span>
        </div>
      ) : null}
    </div>
  );
}
