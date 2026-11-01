"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { askConfirm } from "@/components/app/AppDialogHost";
import { MORE_REACTIONS, QUICK_REACTIONS, messageSegments, messageTime, reminderChoices } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types";
import {
  HublyBellIcon,
  HublyBoltIcon,
  HublyCalendarIcon,
  HublyClipboardIcon,
  HublyCopyIcon,
  HublyDocumentIcon,
  HublyHashIcon,
  HublyImageIcon,
  HublyLayersIcon,
  HublyLinkIcon,
  HublyMegaphoneIcon,
  HublyMoreIcon,
  HublyPeopleIcon,
  HublyPencilIcon,
  HublyPinIcon,
  HublyPlusIcon,
  HublyReplyIcon,
  HublySmileIcon,
  HublyTrashIcon,
} from "@/components/app/icons/DuotoneIcons";
import { ChatAvatar } from "./ChatAvatar";
import { PopMenu } from "./PopMenu";

const ATTACHMENT_ICON = {
  post: HublyHashIcon,
  grid: HublyCalendarIcon,
  task: HublyClipboardIcon,
  project: HublyLayersIcon,
  asset: HublyImageIcon,
  ad: HublyMegaphoneIcon,
  lead: HublyPeopleIcon,
  automation: HublyBoltIcon,
  file: HublyDocumentIcon,
  voice: HublyDocumentIcon,
} as const;

interface ChatMessageRowProps {
  message: ChatMessage;
  myName: string;
  myPhoto?: string;
  mentionNames: string[];
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
  onRemind: (at: number, label: string) => void;
  onNotice: (text: string) => void;
}

function withQuery(text: string, query: string): React.ReactNode {
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

function MessageText({ text, names, query }: { text: string; names: string[]; query: string }) {
  return (
    <>
      {messageSegments(text, names).map((segment, i) => {
        if (segment.kind === "mention") return <span key={i} className="hubly-chat-mention">{segment.value}</span>;
        // messageSegments solo marca como enlace lo que empieza por http(s).
        if (segment.kind === "link") {
          return (
            <a key={i} className="hubly-chat-link" href={segment.value} target="_blank" rel="noreferrer noopener">
              {segment.value}
            </a>
          );
        }
        return <React.Fragment key={i}>{withQuery(segment.value, query)}</React.Fragment>;
      })}
    </>
  );
}

function Attachment({ attachment: a }: { attachment: NonNullable<ChatMessage["attachment"]> }) {
  if (a.kind === "voice") {
    return (
      <div className="hubly-chat-voice">
        <audio controls preload="metadata" src={a.href} aria-label={a.title} />
        {a.meta ? <span className="hubly-chat-msg-time">{a.meta}</span> : null}
      </div>
    );
  }
  if (a.kind === "file" && a.mime?.startsWith("image/")) {
    return (
      <a className="hubly-chat-media" href={a.href} target="_blank" rel="noreferrer noopener" title={a.title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.href} alt={a.title} loading="lazy" />
      </a>
    );
  }
  if (a.kind === "file" && a.mime?.startsWith("video/")) {
    return (
      <div className="hubly-chat-media">
        <video controls preload="metadata" src={a.href} aria-label={a.title} />
      </div>
    );
  }
  const Icon = ATTACHMENT_ICON[a.kind];
  const body = (
    <>
      <span className="hubly-cal-row-icon hubly-lista-icono"><Icon size={17} /></span>
      <span className="hubly-lista-texto">
        <span className="hubly-cal-row-title">{a.title}</span>
        {a.meta ? <span className="hubly-cal-row-meta">{a.meta}</span> : null}
      </span>
    </>
  );
  if (a.kind === "file") {
    return <a href={a.href} className="hubly-chat-attachment" target="_blank" rel="noreferrer noopener" download={a.title}>{body}</a>;
  }
  return <Link href={a.href} className="hubly-chat-attachment">{body}</Link>;
}

export function ChatMessageRow({
  message: m,
  myName,
  myPhoto,
  mentionNames,
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
  onRemind,
  onNotice,
}: ChatMessageRowProps) {
  const [menu, setMenu] = useState<"react" | "remind" | "more" | null>(null);
  const [allEmoji, setAllEmoji] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const mine = m.sender === myName;
  const closeMenu = useCallback(() => {
    setMenu(null);
    setAllEmoji(false);
  }, []);

  const copy = async (text: string, notice: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotice(notice);
    } catch {
      onNotice("No pudimos copiar. Hazlo a mano.");
    }
    closeMenu();
  };

  const remove = async () => {
    if (await askConfirm("¿Eliminar este mensaje y sus respuestas?")) onDelete();
  };

  const saveEdit = () => {
    if (editing && editing.trim() && editing.trim() !== m.text) onEdit(editing);
    setEditing(null);
  };

  const react = (emoji: string) => {
    onReact(emoji);
    closeMenu();
  };

  const reactions = Object.entries(m.reactions ?? {});
  const time = messageTime(m);

  return (
    <div
      id={`msg-${m.id}`}
      className={`hubly-chat-msg${compact ? " is-compact" : ""}${highlighted ? " is-highlighted" : ""}${menu ? " has-menu" : ""}`}
      data-message-id={m.id}
      tabIndex={-1} // En táctil, tocar el mensaje le da foco y muestra sus acciones.
    >
      {compact ? (
        <span className="hubly-chat-msg-gutter">{time.replace(/ .*/, "")}</span>
      ) : (
        <ChatAvatar initials={m.senderInitials} photo={mine ? myPhoto : undefined} />
      )}
      <div className="hubly-chat-msg-body">
        {compact ? null : (
          <div className="hubly-chat-msg-head">
            <span className="hubly-chat-msg-name">{m.sender}</span>
            <span className="hubly-chat-msg-time">{time}</span>
            {m.pinned ? (
              <span className="hubly-chat-msg-flag">
                <HublyPinIcon size={13} />
                <span>Fijado</span>
              </span>
            ) : null}
          </div>
        )}

        {editing !== null ? (
          <div className="hubly-chat-edit">
            <textarea
              className="hubly-chat-input hubly-chat-input-edit"
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
            <MessageText text={m.text} names={mentionNames} query={query} />
            {m.editedAt ? <span className="hubly-chat-msg-edited"> (editado)</span> : null}
          </p>
        ) : null}

        {m.attachment ? <Attachment attachment={m.attachment} /> : null}

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
            <button type="button" className="hubly-chat-tool" aria-label="Responder en hilo" data-tip="Responder en hilo" onClick={onReply}>
              <HublyReplyIcon size={15} />
            </button>
          ) : null}
          <span className="hubly-chat-tool-wrap">
            <button
              type="button"
              className="hubly-chat-tool"
              data-pop-trigger
              aria-label="Reaccionar"
              data-tip="Reaccionar"
              aria-expanded={menu === "react"}
              onClick={() => (menu === "react" ? closeMenu() : setMenu("react"))}
            >
              <HublySmileIcon size={15} />
            </button>
            <PopMenu open={menu === "react"} onClose={closeMenu} label="Reacciones" className="hubly-chat-reactpop">
              <div className="hubly-chat-emoji-row">
                {QUICK_REACTIONS.map((emoji) => (
                  <button key={emoji} type="button" role="menuitem" className="hubly-chat-emoji" aria-label={`Reaccionar con ${emoji}`} onClick={() => react(emoji)}>
                    {emoji}
                  </button>
                ))}
                {allEmoji ? null : (
                  <button type="button" className="hubly-chat-emoji" aria-label="Ver más emojis" onClick={() => setAllEmoji(true)}>
                    <HublyPlusIcon size={15} />
                  </button>
                )}
              </div>
              {allEmoji ? (
                <div className="hubly-chat-emoji-grid">
                  {MORE_REACTIONS.map((emoji) => (
                    <button key={emoji} type="button" role="menuitem" className="hubly-chat-emoji" aria-label={`Reaccionar con ${emoji}`} onClick={() => react(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
            </PopMenu>
          </span>
          <button type="button" className="hubly-chat-tool" aria-label="Crear tarea" data-tip="Crear tarea" onClick={onCreateTask}>
            <HublyClipboardIcon size={15} />
          </button>
          <span className="hubly-chat-tool-wrap">
            <button
              type="button"
              className="hubly-chat-tool"
              data-pop-trigger
              aria-label="Recordar más tarde"
              data-tip="Recordar más tarde"
              aria-expanded={menu === "remind"}
              onClick={() => (menu === "remind" ? closeMenu() : setMenu("remind"))}
            >
              <HublyBellIcon size={15} />
            </button>
            <PopMenu open={menu === "remind"} onClose={closeMenu} label="Recordar más tarde" className="hubly-chat-morepop">
              {reminderChoices(new Date()).map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  role="menuitem"
                  className="hubly-chat-menuitem"
                  onClick={() => {
                    onRemind(choice.at, choice.label);
                    closeMenu();
                  }}
                >
                  <span>{choice.label}</span>
                </button>
              ))}
            </PopMenu>
          </span>
          {mine && !m.attachment ? (
            <button type="button" className="hubly-chat-tool" aria-label="Editar" data-tip="Editar" onClick={() => setEditing(m.text)}>
              <HublyPencilIcon size={15} />
            </button>
          ) : null}
          {mine ? (
            <button type="button" className="hubly-chat-tool" aria-label="Eliminar" data-tip="Eliminar" onClick={remove}>
              <HublyTrashIcon size={15} />
            </button>
          ) : null}
          <span className="hubly-chat-tool-wrap">
            <button
              type="button"
              className="hubly-chat-tool"
              data-pop-trigger
              aria-label="Más acciones"
              data-tip="Más acciones"
              data-tip-end
              aria-expanded={menu === "more"}
              onClick={() => (menu === "more" ? closeMenu() : setMenu("more"))}
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
                  closeMenu();
                }}
              >
                <HublyPinIcon size={15} />
                <span>{m.pinned ? "Desfijar mensaje" : "Fijar mensaje"}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hubly-chat-menuitem"
                onClick={() =>
                  copy(
                    `${window.location.origin}/chat?c=${encodeURIComponent(m.channelId)}&m=${encodeURIComponent(m.parentId ?? m.id)}`,
                    "Enlace copiado"
                  )
                }
              >
                <HublyLinkIcon size={15} />
                <span>Copiar enlace</span>
              </button>
            </PopMenu>
          </span>
        </div>
      ) : null}
    </div>
  );
}
