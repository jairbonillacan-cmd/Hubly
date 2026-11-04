"use client";

import React from "react";
import { Button } from "@/components/app/ui/Button";
import type { ChatMessage } from "@/lib/types";

interface ChatDaySection {
  day: string;
  label: string;
  messages: ChatMessage[];
}

interface ChatMessageFeedProps {
  hasRoots: boolean;
  emptyText: string;
  channelQuery: string;
  days: ChatDaySection[];
  onClearQuery: () => void;
  onLoadOlder?: () => void;
  renderMessage: (message: ChatMessage, prev: ChatMessage | undefined) => React.ReactNode;
}

export function ChatMessageFeed({
  hasRoots,
  emptyText,
  channelQuery,
  days,
  onClearQuery,
  onLoadOlder,
  renderMessage,
}: ChatMessageFeedProps) {
  if (!hasRoots) {
    return (
      <div className="hubly-chat-vacio">
        <h2 className="hubly-chat-vacio-title">Sin mensajes</h2>
        <p>{emptyText}</p>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="hubly-chat-vacio">
        <h2 className="hubly-chat-vacio-title">Sin resultados</h2>
        <p>Ningún mensaje coincide con «{channelQuery.trim()}».</p>
        <Button variant="secondary" size="sm" onClick={onClearQuery}>
          Limpiar búsqueda
        </Button>
      </div>
    );
  }

  return (
    <>
      {onLoadOlder ? (
        <Button variant="ghost" size="xs" className="hubly-chat-older" onClick={onLoadOlder}>
          Ver mensajes anteriores
        </Button>
      ) : null}
      {days.map((day) => (
        <section key={day.day} aria-label={day.label}>
          <h2 className="hubly-chat-day-label">
            <span>{day.label}</span>
          </h2>
          {day.messages.map((m, i) => renderMessage(m, day.messages[i - 1]))}
        </section>
      ))}
    </>
  );
}
