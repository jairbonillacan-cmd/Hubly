"use client";

import React, { useCallback, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import type { ChatAttachment } from "@/lib/types";
import {
  HublyChevronLeftIcon,
  HublyClipboardIcon,
  HublyFolderIcon,
  HublyHashIcon,
  HublyLayersIcon,
  HublyNotebookIcon,
  HublySendIcon,
} from "@/components/app/icons/DuotoneIcons";
import { PopMenu } from "./PopMenu";

type PickKind = ChatAttachment["kind"];

const KINDS: { kind: PickKind; label: string; Icon: typeof HublyHashIcon }[] = [
  { kind: "post", label: "Posts", Icon: HublyHashIcon },
  { kind: "task", label: "Tareas", Icon: HublyClipboardIcon },
  { kind: "project", label: "Proyectos", Icon: HublyLayersIcon },
  { kind: "asset", label: "Contenido", Icon: HublyFolderIcon },
];

interface ChatComposerProps {
  placeholder: string;
  onSend: (text: string, attachment?: ChatAttachment) => void;
  autoFocus?: boolean;
  /** Etiqueta accesible del campo. */
  label: string;
}

export function ChatComposer({ placeholder, onSend, autoFocus, label }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState<PickKind | "root" | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const posts = useHublyStore((s) => s.posts);
  const tasks = useHublyStore((s) => s.tasks);
  const projects = useHublyStore((s) => s.projects);
  const assets = useHublyStore((s) => s.assets);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);

  const grow = useCallback(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const submit = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
    requestAnimationFrame(grow);
  };

  const closeMenu = useCallback(() => setMenu(null), []);

  const options: ChatAttachment[] = (() => {
    const own = <T extends { brandId: string }>(list: T[]) => {
      const mine = list.filter((i) => i.brandId === activeBrandId);
      return (mine.length ? mine : list).slice(0, 8);
    };
    if (menu === "post") return own(posts).map((p) => ({ kind: "post", id: p.id, title: p.title, meta: p.scheduledDate, href: "/calendario" }));
    if (menu === "task") return own(tasks).map((t) => ({ kind: "task", id: t.id, title: t.title, meta: t.dueLabel, href: "/tareas" }));
    if (menu === "project") return own(projects).map((p) => ({ kind: "project", id: p.id, title: p.title, meta: p.status, href: "/proyectos" }));
    if (menu === "asset") return own(assets).map((a) => ({ kind: "asset", id: a.id, title: a.name, meta: a.folder, href: "/archivos" }));
    return [];
  })();

  return (
    <div className="hubly-chat-composer">
      <textarea
        ref={area}
        className="hubly-chat-input"
        rows={1}
        value={draft}
        autoFocus={autoFocus}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          grow();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="hubly-chat-composer-bar">
        <div className="hubly-chat-mandar">
          <button
            type="button"
            className="hubly-cal-icon"
            data-pop-trigger
            aria-label="Mandar un elemento"
            title="Mandar un post, una tarea, un proyecto…"
            aria-expanded={menu !== null}
            aria-haspopup="menu"
            onClick={() => setMenu(menu ? null : "root")}
          >
            <HublyNotebookIcon size={18} />
          </button>
          <PopMenu open={menu !== null} onClose={closeMenu} label="Mandar" className="hubly-chat-mandar-pop">
            {menu === "root" || menu === null ? (
              <>
                <div className="hubly-chat-pop-title">Mandar</div>
                <div className="hubly-chat-kinds">
                  {KINDS.map(({ kind, label: text, Icon }) => (
                    <button key={kind} type="button" role="menuitem" className="hubly-chat-kind" onClick={() => setMenu(kind)}>
                      <Icon size={22} />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button type="button" className="hubly-chat-pop-back" onClick={() => setMenu("root")}>
                  <HublyChevronLeftIcon size={14} />
                  <span>{KINDS.find((k) => k.kind === menu)?.label}</span>
                </button>
                {options.length === 0 ? (
                  <p className="hubly-chat-pop-empty">Sin elementos para mandar todavía.</p>
                ) : (
                  <ul className="hubly-chat-options">
                    {options.map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          role="menuitem"
                          className="hubly-chat-option"
                          onClick={() => {
                            onSend("", o);
                            setMenu(null);
                          }}
                        >
                          <span className="hubly-chat-option-title">{o.title}</span>
                          {o.meta ? <span className="hubly-chat-option-meta">{o.meta}</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </PopMenu>
        </div>
        <button type="button" className="hbtn hbtn-sm hbtn-secondary hubly-chat-send" disabled={!draft.trim()} onClick={submit}>
          <HublySendIcon size={15} />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
}
