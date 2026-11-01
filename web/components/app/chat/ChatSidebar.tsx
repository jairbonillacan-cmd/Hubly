"use client";

import React, { useCallback, useState } from "react";
import {
  HublyBellIcon,
  HublyBellOffIcon,
  HublyCheckIcon,
  HublyChevronDownIcon,
  HublyChevronRightIcon,
  HublyHashIcon,
  HublyMoreIcon,
  HublyPinIcon,
  HublySearchIcon,
} from "@/components/app/icons/DuotoneIcons";
import { PopMenu } from "./PopMenu";

export interface ChatListItem {
  id: string;
  name: string;
  group: "agencia" | "marcas" | "directos";
  preview: string;
  unread: number;
  muted: boolean;
  pinned: boolean;
  initials: string;
}

type GroupId = ChatListItem["group"] | "fijados";

const GROUPS: { id: GroupId; label: string }[] = [
  { id: "fijados", label: "Fijados" },
  { id: "agencia", label: "Agencia" },
  { id: "marcas", label: "Marcas" },
  { id: "directos", label: "Mensajes directos" },
];

interface ChatSidebarProps {
  items: ChatListItem[];
  selectedId: string | null;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleMute: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export function ChatSidebar({
  items,
  selectedId,
  query,
  onQuery,
  onSelect,
  onTogglePin,
  onToggleMute,
  onMarkRead,
}: ChatSidebarProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [menuId, setMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setMenuId(null), []);

  return (
    <aside className="hubly-chat-lista" aria-label="Conversaciones">
      <div className="hubly-chat-lista-head">
        <label className="hubly-chat-search">
          <HublySearchIcon size={15} />
          <input
            type="search"
            value={query}
            placeholder="Buscar en el chat"
            aria-label="Buscar en el chat"
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="hubly-chat-groups">
        {GROUPS.map((group) => {
          const rows = items.filter((i) => (group.id === "fijados" ? i.pinned : !i.pinned && i.group === group.id));
          if (rows.length === 0) return null;
          const isClosed = closed[group.id] && !query.trim();
          const unread = rows.reduce((sum, r) => sum + (r.muted ? 0 : r.unread), 0);
          return (
            <section key={group.id} className="hubly-chat-group">
              <button
                type="button"
                className="hubly-chat-group-head"
                aria-expanded={!isClosed}
                onClick={() => setClosed((c) => ({ ...c, [group.id]: !c[group.id] }))}
              >
                {isClosed ? <HublyChevronRightIcon size={14} /> : <HublyChevronDownIcon size={14} />}
                <span>{group.label}</span>
                <span className="hubly-chat-group-count">{rows.length}</span>
                {isClosed && unread > 0 ? <span className="hubly-chat-badge">{unread}</span> : null}
              </button>
              {isClosed ? null : (
                <ul className="hubly-chat-rows">
                  {rows.map((row) => {
                    const active = row.id === selectedId;
                    const open = menuId === row.id;
                    return (
                      <li key={row.id} className={`hubly-chat-rowwrap${open ? " has-menu" : ""}`}>
                        <button
                          type="button"
                          className={`hubly-chat-item${active ? " is-active" : ""}${row.unread > 0 && !row.muted ? " is-unread" : ""}`}
                          aria-current={active ? "true" : undefined}
                          onClick={() => onSelect(row.id)}
                        >
                          <span className="hubly-cal-row-icon hubly-lista-icono">
                            {row.group === "directos" ? row.initials : <HublyHashIcon size={17} />}
                          </span>
                          <span className="hubly-lista-texto">
                            <span className="hubly-chat-item-name">{row.name}</span>
                            <span className="hubly-chat-item-preview">{row.preview}</span>
                          </span>
                          {row.muted ? (
                            <span className="hubly-chat-item-muted" title="Sin avisos en este chat">
                              <HublyBellOffIcon size={14} />
                            </span>
                          ) : row.unread > 0 ? (
                            <span className="hubly-chat-badge" aria-label={`${row.unread} sin leer`}>{row.unread}</span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          className="hubly-chat-rowmore"
                          data-pop-trigger
                          aria-label={`Opciones de ${row.name}`}
                          title="Opciones"
                          aria-expanded={open}
                          aria-haspopup="menu"
                          onClick={() => setMenuId(open ? null : row.id)}
                        >
                          <HublyMoreIcon size={15} />
                        </button>
                        <PopMenu open={open} onClose={closeMenu} label={`Opciones de ${row.name}`} className="hubly-chat-rowpop">
                          <button type="button" role="menuitem" className="hubly-chat-menuitem" onClick={() => { onTogglePin(row.id); closeMenu(); }}>
                            <HublyPinIcon size={15} />
                            <span>{row.pinned ? "Quitar de fijados" : "Fijar arriba"}</span>
                          </button>
                          <button type="button" role="menuitem" className="hubly-chat-menuitem" onClick={() => { onToggleMute(row.id); closeMenu(); }}>
                            {row.muted ? <HublyBellIcon size={15} /> : <HublyBellOffIcon size={15} />}
                            <span>{row.muted ? "Volver a avisarme aquí" : "Silenciar este chat"}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="hubly-chat-menuitem"
                            disabled={row.unread === 0}
                            onClick={() => { onMarkRead(row.id); closeMenu(); }}
                          >
                            <HublyCheckIcon size={15} />
                            <span>Marcar como leído</span>
                          </button>
                        </PopMenu>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
        {items.length === 0 ? (
          <p className="hubly-chat-lista-empty">Sin resultados con esta búsqueda.</p>
        ) : null}
      </div>
    </aside>
  );
}
