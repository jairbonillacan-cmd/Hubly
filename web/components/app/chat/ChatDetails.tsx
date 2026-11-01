"use client";

import React, { useState } from "react";
import { askText } from "@/components/app/AppDialogHost";
import type { ChatMessage } from "@/lib/types";
import { HublyCloseIcon, HublyDocumentIcon, HublyPinIcon } from "@/components/app/icons/DuotoneIcons";
import { ChatAvatar } from "./ChatAvatar";
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
  onSave: (patch: { name: string; description: string }) => void;
  onDelete: () => void;
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
  onDelete,
}: ChatDetailsProps) {
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);
  const dirty = draftName.trim() !== name || draftDescription.trim() !== description;

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
              if (draftName.trim() && dirty) onSave({ name: draftName.trim(), description: draftDescription.trim() });
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
            <button type="submit" className="hbtn hbtn-sm hbtn-secondary" disabled={!dirty || !draftName.trim()}>Guardar cambios</button>
          </form>
        ) : (
          <div>
            <div className="hubly-chat-details-name">{name}</div>
            <p className="hubly-chat-details-sub">{subtitle}</p>
          </div>
        )}

        <section>
          <h3 className="hubly-chat-details-title">Equipo <span>{members.length}</span></h3>
          {members.length === 0 ? (
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

        {editable ? (
          <button type="button" className="hbtn hbtn-sm hbtn-danger" onClick={confirmDelete}>Eliminar canal</button>
        ) : null}
      </div>
    </aside>
  );
}
