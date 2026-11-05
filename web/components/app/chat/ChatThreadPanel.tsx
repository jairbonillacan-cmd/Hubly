"use client";

import React from "react";
import { HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";
import type { ChatAttachment, ChatMessage } from "@/lib/types";
import { ChatComposer, type ChatMentionOption } from "./ChatComposer";

interface ChatThreadPanelProps {
  threadRoot: ChatMessage;
  replies: ChatMessage[];
  brandId: string;
  people: ChatMentionOption[];
  onClose: () => void;
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  renderMessage: (message: ChatMessage, prev: ChatMessage | undefined) => React.ReactNode;
}

export function ChatThreadPanel({
  threadRoot,
  replies,
  brandId,
  people,
  onClose,
  onSend,
  renderMessage,
}: ChatThreadPanelProps) {
  return (
    <aside className="hubly-chat-hilo" aria-label="Hilo">
      <header className="hubly-chat-hilo-head">
        <h2>Hilo</h2>
        <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar hilo" onClick={onClose}>
          <HublyCloseIcon size={14} />
        </button>
      </header>
      <div className="hubly-chat-hilo-scroll">
        {renderMessage(threadRoot, undefined)}
        {replies.length === 0 ? (
          <p className="hubly-chat-hilo-vacio">Aún no hay respuestas.</p>
        ) : (
          <div className="hubly-chat-hilo-replies">
            {replies.map((m, i) => renderMessage(m, replies[i - 1]))}
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
          onSend={onSend}
        />
      </div>
    </aside>
  );
}
