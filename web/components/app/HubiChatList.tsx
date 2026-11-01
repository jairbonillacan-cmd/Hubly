"use client";

import { useEffect, useRef, useState } from "react";
import { askConfirm } from "@/components/app/AppDialogHost";
import {
  HublyPlusIcon as Plus,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";
import { chatTimeLabel, sortChats, useHubiChats } from "@/lib/hubi-chats";
import { useHublyStore } from "@/lib/store";

export async function confirmDeleteChat(id: string, title: string) {
  const accepted = await askConfirm(`¿Eliminar «${title}»? Tendrás 10 segundos para restaurarla.`);
  if (accepted) useHubiChats.getState().deleteChat(id);
  return accepted;
}

export function HubiChatList({ onOpen }: { onOpen: () => void }) {
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const aiDrawerOpen = useHublyStore((s) => s.aiDrawerOpen);
  const chats = useHubiChats((s) => s.chats);
  const activeChatId = useHubiChats((s) => s.activeChatId);
  const loaded = useHubiChats((s) => s.scope !== null);
  const startChat = useHubiChats((s) => s.startChat);
  const openChat = useHubiChats((s) => s.openChat);
  const newChatRef = useRef<HTMLButtonElement | null>(null);

  const showPanel = () => {
    setAiDrawerOpen(true);
    onOpen();
  };

  const handleNew = () => {
    startChat();
    showPanel();
  };

  const handleDelete = async (id: string, title: string) => {
    if (await confirmDeleteChat(id, title)) newChatRef.current?.focus();
  };

  return (
    <>
      <div className="hubly-sidebar-panel-head is-chats">
        <span>Chats</span>
        <button ref={newChatRef} type="button" aria-label="Nueva conversación" title="Nueva conversación" onClick={handleNew}>
          <Plus size={14} />
        </button>
      </div>
      {loaded && chats.length === 0 && (
        <button type="button" className="hubly-sidebar-empty is-large" onClick={handleNew}>
          <i><Plus size={16} /></i>
          <strong>Inicia una conversación</strong>
          <small>Pregunta, crea copies, pasa links…</small>
        </button>
      )}
      {chats.length > 0 && (
        <ul className="hubly-chat-list">
          {sortChats(chats).map((chat) => {
            const active = aiDrawerOpen && chat.id === activeChatId;
            return (
              <li key={chat.id} className={`hubly-chat-row ${active ? "is-active" : ""}`.trim()}>
                <button
                  type="button"
                  className="hubly-chat-open"
                  title={chat.title}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    openChat(chat.id);
                    showPanel();
                  }}
                >
                  <span className="hubly-chat-title">{chat.title}</span>
                  <span className="hubly-chat-time">{chatTimeLabel(chat.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  className="hubly-chat-delete"
                  aria-label={`Eliminar «${chat.title}»`}
                  title="Eliminar conversación"
                  onClick={() => void handleDelete(chat.id, chat.title)}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function HubiChatUndoToasts() {
  const deleted = useHubiChats((s) => s.deleted);
  const restoreChat = useHubiChats((s) => s.restoreChat);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (deleted.length === 0) return;
    setNow(Date.now()); // eslint-disable-line react-hooks/set-state-in-effect -- reloj de la cuenta atrás
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [deleted.length]);

  if (deleted.length === 0) return null;

  return (
    <div className="hubly-undo-stack">
      {deleted.map(({ chat, expiresAt }) => (
        <div key={chat.id} className="hubly-undo-toast" role="status">
          <span>Conversación eliminada</span>
          <button type="button" aria-label={`Restaurar «${chat.title}»`} onClick={() => restoreChat(chat.id)}>
            Restaurar
          </button>
          <span className="hubly-undo-seconds" aria-hidden="true">
            {now === null ? 10 : Math.max(1, Math.ceil((expiresAt - now) / 1000))} s
          </span>
        </div>
      ))}
    </div>
  );
}
