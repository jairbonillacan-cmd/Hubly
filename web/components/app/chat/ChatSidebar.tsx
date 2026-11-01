"use client";

import React, { useCallback, useState } from "react";
import {
  HublyBellIcon,
  HublyBellOffIcon,
  HublyCheckIcon,
  HublyChevronDownIcon,
  HublyChevronRightIcon,
  HublyEyeOffIcon,
  HublyHashIcon,
  HublyMoreIcon,
  HublyPinIcon,
  HublyPlusIcon,
  HublySearchIcon,
} from "@/components/app/icons/DuotoneIcons";
import { matchesQuery } from "@/lib/chat";
import { ChatAvatar } from "./ChatAvatar";
import type { ChatMentionOption } from "./ChatComposer";
import { PopMenu } from "./PopMenu";

export interface ChatListItem {
  id: string;
  name: string;
  group: "agencia" | "marcas" | "directos";
  unread: number;
  muted: boolean;
  pinned: boolean;
  hidden: boolean;
  dormant: boolean;
  initials: string;
  photo?: string;
  online?: boolean;
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
  myInitials: string;
  myPhoto?: string;
  people: ChatMentionOption[];
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
  onOpenSelf: () => void;
  onNewChannel: () => void;
  onOpenPerson: (person: ChatMentionOption) => void;
  onTogglePin: (id: string) => void;
  onToggleMute: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export function ChatSidebar({
  items,
  selectedId,
  query,
  myInitials,
  myPhoto,
  people,
  onQuery,
  onSelect,
  onOpenSelf,
  onNewChannel,
  onOpenPerson,
  onTogglePin,
  onToggleMute,
  onToggleHidden,
  onMarkRead,
}: ChatSidebarProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [menuId, setMenuId] = useState<string | null>(null);
  const [showDormant, setShowDormant] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState("");
  const closeMenu = useCallback(() => setMenuId(null), []);
  const closePeople = useCallback(() => {
    setPeopleOpen(false);
    setPeopleQuery("");
  }, []);

  const searching = query.trim().length > 0;
  const visible = items.filter((i) => searching || !i.hidden || i.unread > 0 || i.id === selectedId);
  const active = visible.filter((i) => searching || !i.dormant || i.pinned || i.unread > 0 || i.id === selectedId);
  const dormant = visible.filter((i) => !active.includes(i));
  const shownPeople = people.filter((p) => matchesQuery({ text: p.name, sender: "" }, peopleQuery));

  const renderRow = (row: ChatListItem) => {
    const isActive = row.id === selectedId;
    const open = menuId === row.id;
    return (
      <li key={row.id} className={`hubly-chat-rowwrap${open ? " has-menu" : ""}`}>
        <button
          type="button"
          className={`hubly-chat-item${isActive ? " is-active" : ""}${row.unread > 0 && !row.muted ? " is-unread" : ""}`}
          aria-current={isActive ? "true" : undefined}
          onClick={() => onSelect(row.id)}
        >
          {row.group === "directos" ? (
            <ChatAvatar initials={row.initials} photo={row.photo} size="sm" online={row.online} />
          ) : (
            <span className="hubly-chat-item-hash"><HublyHashIcon size={15} /></span>
          )}
          <span className="hubly-chat-item-name">{row.name}</span>
          {row.muted ? (
            <span className="hubly-chat-item-muted"><HublyBellOffIcon size={14} title="Avisos silenciados" /></span>
          ) : row.unread > 0 ? (
            <span className="hubly-chat-badge" aria-label={`${row.unread} sin leer`}>{row.unread}</span>
          ) : null}
        </button>
        <button
          type="button"
          className="hubly-chat-rowmore"
          data-pop-trigger
          aria-label={`Opciones de ${row.name}`}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setMenuId(open ? null : row.id)}
        >
          <HublyMoreIcon size={15} />
        </button>
        <PopMenu open={open} onClose={closeMenu} label={`Opciones de ${row.name}`} className="hubly-chat-rowpop">
          <button type="button" role="menuitem" className="hubly-chat-menuitem" onClick={() => { onTogglePin(row.id); closeMenu(); }}>
            <HublyPinIcon size={15} />
            <span>{row.pinned ? "Quitar de fijados" : "Fijar en la lista"}</span>
          </button>
          <button type="button" role="menuitem" className="hubly-chat-menuitem" onClick={() => { onToggleMute(row.id); closeMenu(); }}>
            {row.muted ? <HublyBellIcon size={15} /> : <HublyBellOffIcon size={15} />}
            <span>{row.muted ? "Activar avisos" : "Silenciar avisos"}</span>
          </button>
          <button type="button" role="menuitem" className="hubly-chat-menuitem" disabled={row.unread === 0} onClick={() => { onMarkRead(row.id); closeMenu(); }}>
            <HublyCheckIcon size={15} />
            <span>Marcar como leído</span>
          </button>
          <button type="button" role="menuitem" className="hubly-chat-menuitem" onClick={() => { onToggleHidden(row.id); closeMenu(); }}>
            <HublyEyeOffIcon size={15} />
            <span>{row.hidden ? "Mostrar en la lista" : "Ocultar de la lista"}</span>
          </button>
        </PopMenu>
      </li>
    );
  };

  return (
    <aside className="hubly-chat-lista" aria-label="Conversaciones">
      <div className="hubly-chat-lista-head">
        <label className="hubly-chat-search">
          <HublySearchIcon size={15} />
          <input
            type="search"
            value={query}
            placeholder="Buscar conversaciones"
            aria-label="Buscar conversaciones"
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <button type="button" className="hubly-chat-me" aria-label="Abrir tus notas" data-tip="Tus notas" data-tip-below data-tip-end onClick={onOpenSelf}>
          <ChatAvatar initials={myInitials} photo={myPhoto} size="lg" online />
        </button>
      </div>

      <div className="hubly-chat-groups">
        {GROUPS.map((group) => {
          const rows = active.filter((i) => (group.id === "fijados" ? i.pinned : !i.pinned && i.group === group.id));
          if (rows.length === 0 && group.id === "fijados") return null;
          const isClosed = closed[group.id] && !searching;
          const unread = rows.reduce((sum, r) => sum + (r.muted ? 0 : r.unread), 0);
          return (
            <section key={group.id} className="hubly-chat-group">
              <div className="hubly-chat-group-head">
                <button
                  type="button"
                  className="hubly-chat-group-toggle"
                  aria-expanded={!isClosed}
                  onClick={() => setClosed((c) => ({ ...c, [group.id]: !c[group.id] }))}
                >
                  {isClosed ? <HublyChevronRightIcon size={14} /> : <HublyChevronDownIcon size={14} />}
                  <span>{group.label}</span>
                  <span className="hubly-chat-group-count">{rows.length}</span>
                  {isClosed && unread > 0 ? <span className="hubly-chat-badge">{unread}</span> : null}
                </button>
                {group.id === "agencia" ? (
                  <button type="button" className="hubly-chat-group-add" aria-label="Crear canal" data-tip="Crear canal" data-tip-end onClick={onNewChannel}>
                    <HublyPlusIcon size={14} />
                  </button>
                ) : null}
                {group.id === "directos" ? (
                  <span className="hubly-chat-tool-wrap">
                    <button
                      type="button"
                      className="hubly-chat-group-add"
                      data-pop-trigger
                      aria-label="Escribir a alguien del equipo"
                      data-tip="Nuevo mensaje"
                      data-tip-end
                      aria-expanded={peopleOpen}
                      onClick={() => (peopleOpen ? closePeople() : setPeopleOpen(true))}
                    >
                      <HublyPlusIcon size={14} />
                    </button>
                    <PopMenu open={peopleOpen} onClose={closePeople} label="Escribir a alguien" className="hubly-chat-people-pop">
                      {people.length === 0 ? (
                        <p className="hubly-chat-pop-empty">Aún no hay más personas en tu equipo.</p>
                      ) : (
                        <>
                          <input
                            className="hubly-cal-input hubly-chat-pop-search"
                            type="search"
                            autoFocus
                            value={peopleQuery}
                            placeholder="Buscar persona"
                            aria-label="Buscar persona"
                            onChange={(e) => setPeopleQuery(e.target.value)}
                          />
                          {shownPeople.length === 0 ? (
                            <p className="hubly-chat-pop-empty">Nadie con ese nombre.</p>
                          ) : (
                            shownPeople.map((person) => (
                              <button
                                key={person.id}
                                type="button"
                                role="menuitem"
                                className="hubly-chat-menuitem"
                                onClick={() => {
                                  onOpenPerson(person);
                                  closePeople();
                                }}
                              >
                                <ChatAvatar initials={person.initials} size="sm" />
                                <span>{person.name}</span>
                              </button>
                            ))
                          )}
                        </>
                      )}
                    </PopMenu>
                  </span>
                ) : null}
              </div>
              {isClosed ? null : <ul className="hubly-chat-rows">{rows.map(renderRow)}</ul>}
            </section>
          );
        })}

        {dormant.length > 0 ? (
          <section className="hubly-chat-group">
            <button type="button" className="hubly-chat-dormant" aria-expanded={showDormant} onClick={() => setShowDormant((v) => !v)}>
              {showDormant ? "Ver menos" : `Sin actividad en dos semanas (${dormant.length})`}
            </button>
            {showDormant ? <ul className="hubly-chat-rows">{dormant.map(renderRow)}</ul> : null}
          </section>
        ) : null}

        {searching && items.length === 0 ? (
          <p className="hubly-chat-lista-empty">Sin resultados con esta búsqueda.</p>
        ) : null}
      </div>
    </aside>
  );
}
