"use client";

import { Button } from "@/components/app/ui/Button";
import React, { useState } from "react";
import { askText } from "@/components/app/AppDialogHost";
import type { ChatMessage } from "@/lib/types";
import { HublyCloseIcon, HublyDocumentIcon, HublyPinIcon } from "@/components/app/icons/DuotoneIcons";
import { ChatAvatar } from "./ChatAvatar";
import { ChatBots } from "./ChatBots";
import type { ChatMentionOption } from "./ChatComposer";

interface ChatDetailsProps {
  name: string;
  subtitle: string;
  description?: string;
  /** Solo los canales creados aquí se editan o eliminan. */
  editable: boolean;
  members: ChatMentionOption[];
  pinned: ChatMessage[];
  files: ChatMessage[];
  onClose: () => void;
  onOpenMessage: (id: string) => void;
  onSave: (patch: { name: string; description: string; emoji: string }) => void;
  onArchive: () => void;
  onDelete: () => void;
  emoji?: string;
  /** Solo canales de agencia: elegir quién entra. */
  candidates?: ChatMentionOption[];
  memberIds?: string[];
  myId?: string;
  onSetMembers?: (ids: string[]) => void;
  /** Con tablas de chat activas y en un canal donde caben. */
  botsChannelId?: string;
  onNotice?: (text: string) => void;
}

export function ChatDetails({
  name,
  subtitle,
  description = "",
  editable,
  members,
  pinned,
  files,
  onClose,
  onOpenMessage,
  onSave,
  onArchive,
  onDelete,
  emoji = "",
  candidates,
  memberIds = [],
  myId,
  onSetMembers,
  botsChannelId,
  onNotice,
}: ChatDetailsProps) {
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);
  const [draftEmoji, setDraftEmoji] = useState(emoji);
  const dirty = draftName.trim() !== name || draftDescription.trim() !== description || draftEmoji.trim() !== emoji;

  const confirmDelete = async () => {
    const typed = await askText(`Se borrarán sus mensajes. Escribe «${name}» para eliminar el canal.`, "", "Eliminar canal");
    if (typed?.trim() === name) onDelete();
  };

  return (
    <aside className="hubly-chat-hilo" aria-label="Detalles del chat">
      <header className="hubly-chat-hilo-head">
        <h2>Detalles</h2>
        <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar detalles" onClick={onClose}>
          <HublyCloseIcon size={14} />
        </button>
      </header>
      <div className="hubly-chat-hilo-scroll hubly-chat-details">
        {editable ? (
          <form
            className="hubly-chat-details-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (draftName.trim() && dirty) onSave({ name: draftName.trim(), description: draftDescription.trim(), emoji: draftEmoji.trim() });
            }}
          >
            <label className="hubly-cal-field">
              <span>Nombre</span>
              <input className="hubly-cal-line" required value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            </label>
            <label className="hubly-cal-field">
              <span>Descripción</span>
              <input className="hubly-cal-line" placeholder="Ej. Pendientes de producción" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
            </label>
            <label className="hubly-cal-field">
              <span>Emoji</span>
              <input className="hubly-cal-line" maxLength={8} value={draftEmoji} onChange={(e) => setDraftEmoji(e.target.value)} />
            </label>
            <Button type="submit" variant="secondary" size="sm" disabled={!dirty || !draftName.trim()}>Guardar cambios</Button>
          </form>
        ) : (
          <div>
            <div className="hubly-chat-details-name">{name}</div>
            <p className="hubly-chat-details-sub">{subtitle}</p>
          </div>
        )}

        <section>
          <h3 className="hubly-chat-details-title">Equipo <span>{members.length}</span></h3>
          {candidates && onSetMembers && myId ? (
            <label className="hubly-chat-details-private">
              <input
                type="checkbox"
                checked={memberIds.length > 0}
                onChange={(e) => onSetMembers(e.target.checked ? [myId] : [])}
              />
              <span>Solo personas elegidas</span>
            </label>
          ) : null}
          {candidates && onSetMembers && myId && memberIds.length > 0 ? (
            <ul className="hubly-chat-details-list">
              {candidates.map((person) => {
                const inside = memberIds.includes(person.id);
                return (
                  <li key={person.id} className="hubly-chat-details-person">
                    <ChatAvatar initials={person.initials} size="sm" />
                    <span className="hubly-chat-details-clip">{person.name}</span>
                    {person.id === myId ? null : (
                      <Button
                        variant="ghost" size="xs"
                        aria-pressed={inside}
                        aria-label={`${inside ? "Quitar a" : "Agregar a"} ${person.name}`}
                        onClick={() => onSetMembers(inside ? memberIds.filter((id) => id !== person.id) : [...memberIds, person.id])}
                      >
                        {inside ? "Quitar" : "Agregar"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : members.length === 0 ? (
            <p className="hubly-chat-details-sub">Sin personas asignadas.</p>
          ) : (
            <ul className="hubly-chat-details-list">
              {members.map((member) => (
                <li key={member.id} className="hubly-chat-details-person">
                  <ChatAvatar initials={member.initials} size="sm" />
                  <span>{member.name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="hubly-chat-details-title">Fijados <span>{pinned.length}</span></h3>
          {pinned.length === 0 ? (
            <p className="hubly-chat-details-sub">Fija un mensaje para tenerlo a la mano.</p>
          ) : (
            <ul className="hubly-chat-details-list">
              {pinned.map((m) => (
                <li key={m.id}>
                  <button type="button" className="hubly-chat-menuitem" onClick={() => onOpenMessage(m.id)}>
                    <HublyPinIcon size={15} />
                    <span className="hubly-chat-details-clip">{m.text || m.attachment?.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="hubly-chat-details-title">Archivos <span>{files.length}</span></h3>
          {files.length === 0 ? (
            <p className="hubly-chat-details-sub">Aquí aparecerá lo que se comparta en este chat.</p>
          ) : (
            <ul className="hubly-chat-details-list">
              {files.map((m) => (
                <li key={m.id}>
                  <a className="hubly-chat-menuitem" href={m.attachment?.href} target="_blank" rel="noreferrer noopener">
                    <HublyDocumentIcon size={15} />
                    <span className="hubly-chat-details-clip">{m.attachment?.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {botsChannelId && onNotice ? <ChatBots channelId={botsChannelId} onNotice={onNotice} /> : null}

        {editable ? (
          <div className="hubly-chat-details-danger">
            <Button variant="secondary" size="sm" onClick={onArchive}>Archivar canal</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>Eliminar canal</Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
