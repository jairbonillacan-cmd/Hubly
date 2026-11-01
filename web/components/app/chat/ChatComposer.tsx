"use client";

import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { insertMention, matchesQuery, mentionQuery, scheduleChoices } from "@/lib/chat";
import { formatBytes, mediaFileUrl } from "@/lib/media";
import { uploadMedia, type UploadHandle } from "@/lib/media-client";
import { useHublyStore } from "@/lib/store";
import type { ChatAttachment } from "@/lib/types";
import {
  HublyBoltIcon,
  HublyCalendarIcon,
  HublyChevronLeftIcon,
  HublyClipboardIcon,
  HublyClockIcon,
  HublyCloseIcon,
  HublyHashIcon,
  HublyImageIcon,
  HublyLayersIcon,
  HublyMegaphoneIcon,
  HublyMicIcon,
  HublyNotebookIcon,
  HublyPaperclipIcon,
  HublyPeopleIcon,
  HublySendIcon,
  HublyTrashIcon,
} from "@/components/app/icons/DuotoneIcons";
import { ChatAvatar } from "./ChatAvatar";
import { PopMenu } from "./PopMenu";

type PickKind = "post" | "grid" | "task" | "asset" | "ad" | "project" | "lead" | "automation";
type Repeat = "none" | "weekly" | "monthly";

const KINDS: { kind: PickKind; label: string; Icon: typeof HublyHashIcon }[] = [
  { kind: "post", label: "Posts", Icon: HublyHashIcon },
  { kind: "grid", label: "Parrillas", Icon: HublyCalendarIcon },
  { kind: "task", label: "Tareas", Icon: HublyClipboardIcon },
  { kind: "asset", label: "Contenido", Icon: HublyImageIcon },
  { kind: "ad", label: "Anuncios", Icon: HublyMegaphoneIcon },
  { kind: "project", label: "Proyectos", Icon: HublyLayersIcon },
  { kind: "lead", label: "Leads", Icon: HublyPeopleIcon },
  { kind: "automation", label: "Automatizar", Icon: HublyBoltIcon },
];

const MONTH_FORMAT = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

interface PendingFile {
  key: string;
  name: string;
  percent: number;
  handle: UploadHandle;
  attachment?: ChatAttachment;
}

export interface ChatComposerHandle {
  addFiles: (files: File[]) => void;
}

export interface ChatMentionOption {
  id: string;
  name: string;
  initials: string;
}

interface ChatComposerProps {
  ref?: React.Ref<ChatComposerHandle>;
  /** Etiqueta accesible del campo. */
  label: string;
  placeholder: string;
  brandId: string;
  mentions: ChatMentionOption[];
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  /** Sin esta función no se ofrece programar, como en un hilo. */
  onSchedule?: (text: string, at: number, repeat: Repeat) => void;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function ChatComposer({ ref, label, placeholder, brandId, mentions, onSend, onSchedule }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState<PickKind | "root" | null>(null);
  const [pickQuery, setPickQuery] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mention, setMention] = useState<{ query: string; caret: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [customAt, setCustomAt] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [recording, setRecording] = useState<number | null>(null);

  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<{ media: MediaRecorder; stream: MediaStream; timer: number; send: boolean } | null>(null);

  const posts = useHublyStore((s) => s.posts);
  const tasks = useHublyStore((s) => s.tasks);
  const projects = useHublyStore((s) => s.projects);
  const assets = useHublyStore((s) => s.assets);
  const ads = useHublyStore((s) => s.ads);
  const leads = useHublyStore((s) => s.leads);
  const automations = useHublyStore((s) => s.automations);

  const grow = useCallback(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const addFiles = useCallback(
    (list: File[]) => {
      setError(null);
      for (const file of list) {
        const key = `${file.name}-${file.size}-${Math.random()}`;
        const handle = uploadMedia(file, { brandId, folder: "Chat" }, (percent) =>
          setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, percent } : f)))
        );
        setFiles((prev) => [...prev, { key, name: file.name, percent: 0, handle }]);
        handle.promise.then(
          (record) =>
            setFiles((prev) =>
              prev.map((f) =>
                f.key === key
                  ? {
                      ...f,
                      percent: 100,
                      attachment: {
                        kind: "file",
                        id: record.id,
                        mediaId: record.id,
                        mime: record.mime,
                        title: record.name,
                        meta: formatBytes(record.sizeBytes),
                        href: mediaFileUrl(record.id),
                      },
                    }
                  : f
              )
            ),
          (reason: unknown) => {
            setFiles((prev) => prev.filter((f) => f.key !== key));
            if (reason instanceof DOMException && reason.name === "AbortError") return;
            setError(reason instanceof Error ? `${file.name}: ${reason.message}` : `No pudimos subir ${file.name}.`);
          }
        );
      }
    },
    [brandId]
  );

  useImperativeHandle(ref, () => ({ addFiles }), [addFiles]);

  const uploading = files.some((f) => !f.attachment);
  const ready = files.flatMap((f) => (f.attachment ? [f.attachment] : []));
  const hasContent = draft.trim().length > 0 || ready.length > 0;

  const reset = () => {
    setDraft("");
    setFiles([]);
    setMention(null);
    setError(null);
    requestAnimationFrame(grow);
  };

  const submit = () => {
    if (!hasContent || uploading) return;
    onSend(draft, ready);
    reset();
  };

  const schedule = (at: number) => {
    if (!onSchedule || !draft.trim()) return;
    if (at <= Date.now()) {
      setError("Elige una hora que todavía no pase.");
      return;
    }
    onSchedule(draft, at, repeat);
    setScheduleOpen(false);
    setCustomAt("");
    setRepeat("none");
    reset();
  };

  const stopTracks = () => {
    const current = recorder.current;
    if (!current) return;
    window.clearInterval(current.timer);
    current.stream.getTracks().forEach((t) => t.stop());
  };

  // Al salir del chat se suelta el micrófono aunque se esté grabando.
  useEffect(
    () => () => {
      const current = recorder.current;
      if (!current) return;
      current.send = false;
      window.clearInterval(current.timer);
      current.stream.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar notas de voz.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      let seconds = 0;
      const timer = window.setInterval(() => {
        seconds += 1;
        setRecording(seconds);
      }, 1000);
      media.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      media.onstop = () => {
        const shouldSend = recorder.current?.send;
        stopTracks();
        recorder.current = null;
        setRecording(null);
        if (!shouldSend || chunks.length === 0) return;
        // La biblioteca admite estos contenedores como video; el audio se reproduce igual.
        const isMp4 = media.mimeType.includes("mp4");
        const type = isMp4 ? "video/mp4" : "video/webm";
        const file = new File(chunks, `Nota de voz.${isMp4 ? "mp4" : "webm"}`, { type });
        const length = clock(seconds);
        uploadMedia(file, { brandId, folder: "Chat" }, () => {}).promise.then(
          (record) =>
            onSend("", [
              {
                kind: "voice",
                id: record.id,
                mediaId: record.id,
                mime: type,
                title: "Nota de voz",
                meta: length,
                href: mediaFileUrl(record.id),
              },
            ]),
          () => setError("No pudimos enviar la nota de voz. Inténtalo otra vez.")
        );
      };
      recorder.current = { media, stream, timer, send: false };
      media.start();
      setRecording(0);
    } catch {
      setError("Hubly necesita permiso del micrófono para grabar.");
    }
  };

  const finishRecording = (send: boolean) => {
    const current = recorder.current;
    if (!current) return;
    current.send = send;
    current.media.stop();
  };

  const closeMenu = useCallback(() => {
    setMenu(null);
    setPickQuery("");
  }, []);
  const closeSchedule = useCallback(() => setScheduleOpen(false), []);

  const options = useMemo<ChatAttachment[]>(() => {
    const own = <T extends { brandId: string }>(list: T[]) => {
      const mine = list.filter((i) => i.brandId === brandId);
      return mine.length ? mine : list;
    };
    if (menu === "post") return own(posts).map((p) => ({ kind: "post", id: p.id, title: p.title, meta: p.scheduledDate, href: "/calendario" }));
    if (menu === "grid") {
      const months = new Map<string, number>();
      for (const p of own(posts)) {
        const month = p.scheduledDate?.slice(0, 7);
        if (month) months.set(month, (months.get(month) ?? 0) + 1);
      }
      return [...months.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, count]) => ({
          kind: "grid",
          id: month,
          title: `Parrilla de ${MONTH_FORMAT.format(new Date(`${month}-15T12:00:00`))}`,
          meta: count === 1 ? "1 post" : `${count} posts`,
          href: "/parrillas",
        }));
    }
    if (menu === "task") return own(tasks).map((t) => ({ kind: "task", id: t.id, title: t.title, meta: t.dueLabel, href: "/tareas" }));
    if (menu === "project") return own(projects).map((p) => ({ kind: "project", id: p.id, title: p.title, meta: p.status, href: "/proyectos" }));
    if (menu === "asset") return own(assets).map((a) => ({ kind: "asset", id: a.id, title: a.name, meta: a.folder, href: "/archivos" }));
    if (menu === "ad") return own(ads).map((a) => ({ kind: "ad", id: a.id, title: a.name, meta: a.status, href: "/anuncios" }));
    if (menu === "lead") return (leads ?? []).map((l) => ({ kind: "lead", id: l.id, title: l.name, meta: l.company, href: "/crm" }));
    if (menu === "automation") return (automations ?? []).map((a) => ({ kind: "automation", id: a.id, title: a.name, href: "/automatizaciones" }));
    return [];
  }, [menu, brandId, posts, tasks, projects, assets, ads, leads, automations]);

  const shownOptions = options.filter((o) => matchesQuery({ text: o.title, sender: "" }, pickQuery)).slice(0, 30);

  const mentionOptions = mention
    ? mentions.filter((m) => matchesQuery({ text: m.name, sender: "" }, mention.query)).slice(0, 6)
    : [];

  const syncMention = (value: string, caret: number) => {
    const query = mentionQuery(value, caret);
    setMention(query === null ? null : { query, caret });
    setMentionIndex(0);
  };

  const pickMention = (name: string) => {
    if (!mention) return;
    const next = insertMention(draft, mention.caret, name);
    setDraft(next.text);
    setMention(null);
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(next.caret, next.caret);
      grow();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOptions.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setMentionIndex((i) => (i + step + mentionOptions.length) % mentionOptions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(mentionOptions[mentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  if (recording !== null) {
    return (
      <div className="hubly-chat-composer is-recording">
        <div className="hubly-chat-recording" role="status">
          <HublyMicIcon size={18} />
          <span>Grabando nota de voz</span>
          <span className="hubly-chat-recording-time">{clock(recording)}</span>
        </div>
        <div className="hubly-chat-composer-bar">
          <button type="button" className="hubly-chat-round" aria-label="Descartar la grabación" data-tip="Descartar" onClick={() => finishRecording(false)}>
            <HublyTrashIcon size={17} />
          </button>
          <button type="button" className="hbtn hbtn-sm hbtn-secondary" onClick={() => finishRecording(true)}>
            <HublySendIcon size={15} />
            <span>Enviar nota</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hubly-chat-composer"
      onPaste={(e) => {
        const pasted = Array.from(e.clipboardData.files);
        if (pasted.length > 0) {
          e.preventDefault();
          addFiles(pasted);
        }
      }}
    >
      {mentionOptions.length > 0 ? (
        <ul className="hubly-chat-pop hubly-chat-mentions" role="listbox" aria-label="Mencionar a alguien">
          {mentionOptions.map((option, i) => (
            <li key={option.id} role="option" aria-selected={i === mentionIndex}>
              <button
                type="button"
                className="hubly-chat-menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickMention(option.name)}
              >
                <ChatAvatar initials={option.initials} size="sm" />
                <span>{option.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="hubly-chat-files">
          {files.map((f) => (
            <li key={f.key} className="hubly-chat-file">
              <span className="hubly-chat-file-name" title={f.name}>{f.name}</span>
              <span className="hubly-chat-file-state">{f.attachment ? f.attachment.meta : `${f.percent}%`}</span>
              <button
                type="button"
                className="hubly-chat-file-remove"
                aria-label={`Quitar ${f.name}`}
                onClick={() => {
                  if (!f.attachment) f.handle.cancel();
                  setFiles((prev) => prev.filter((p) => p.key !== f.key));
                }}
              >
                <HublyCloseIcon size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <textarea
        ref={area}
        className="hubly-chat-input"
        rows={1}
        value={draft}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          syncMention(e.target.value, e.target.selectionStart);
          grow();
        }}
        onKeyDown={onKeyDown}
      />

      <div className="hubly-chat-composer-bar">
        <div className="hubly-chat-composer-tools">
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <button type="button" className="hubly-chat-round" aria-label="Adjuntar archivo" data-tip="Adjuntar archivo" onClick={() => fileInput.current?.click()}>
            <HublyPaperclipIcon size={18} />
          </button>
          <div className="hubly-chat-anchor">
            <button
              type="button"
              className="hubly-chat-round"
              data-pop-trigger
              aria-label="Mandar un elemento de Hubly"
              data-tip="Mandar un post, una tarea…"
              aria-expanded={menu !== null}
              aria-haspopup="menu"
              onClick={() => (menu ? closeMenu() : setMenu("root"))}
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
                  <button type="button" className="hubly-chat-pop-back" onClick={() => { setMenu("root"); setPickQuery(""); }}>
                    <HublyChevronLeftIcon size={14} />
                    <span>{KINDS.find((k) => k.kind === menu)?.label}</span>
                  </button>
                  {options.length > 8 ? (
                    <input
                      className="hubly-cal-input hubly-chat-pop-search"
                      type="search"
                      autoFocus
                      value={pickQuery}
                      placeholder="Buscar"
                      aria-label="Buscar elemento"
                      onChange={(e) => setPickQuery(e.target.value)}
                    />
                  ) : null}
                  {shownOptions.length === 0 ? (
                    <p className="hubly-chat-pop-empty">{options.length === 0 ? "Aún no hay nada que mandar aquí." : "Sin resultados con esta búsqueda."}</p>
                  ) : (
                    <ul className="hubly-chat-options">
                      {shownOptions.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            role="menuitem"
                            className="hubly-chat-option"
                            onClick={() => {
                              onSend("", [o]);
                              closeMenu();
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
        </div>

        <div className="hubly-chat-composer-tools">
          {hasContent || uploading ? (
            <>
              {onSchedule ? (
                <div className="hubly-chat-anchor">
                  <button
                    type="button"
                    className="hubly-chat-round"
                    data-pop-trigger
                    aria-label="Programar el mensaje"
                    data-tip="Programar"
                    aria-expanded={scheduleOpen}
                    aria-haspopup="menu"
                    disabled={!draft.trim() || files.length > 0}
                    onClick={() => setScheduleOpen((v) => !v)}
                  >
                    <HublyClockIcon size={18} />
                  </button>
                  <PopMenu open={scheduleOpen} onClose={closeSchedule} label="Programar el mensaje" className="hubly-chat-schedule-pop">
                    <div className="hubly-chat-pop-title">Programar</div>
                    {scheduleChoices(new Date()).map((choice) => (
                      <button key={choice.label} type="button" role="menuitem" className="hubly-chat-menuitem" onClick={() => schedule(choice.at)}>
                        <span>{choice.label}</span>
                      </button>
                    ))}
                    <label className="hubly-cal-field hubly-chat-schedule-field">
                      <span>Otra fecha y hora</span>
                      <input className="hubly-cal-line" type="datetime-local" value={customAt} onChange={(e) => setCustomAt(e.target.value)} />
                    </label>
                    <label className="hubly-cal-field hubly-chat-schedule-field">
                      <span>Repetir</span>
                      <select className="hubly-cal-line" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
                        <option value="none">Una sola vez</option>
                        <option value="weekly">Cada semana</option>
                        <option value="monthly">Cada mes</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="hbtn hbtn-sm hbtn-secondary hubly-chat-schedule-go"
                      disabled={!customAt}
                      onClick={() => schedule(new Date(customAt).getTime())}
                    >
                      Programar mensaje
                    </button>
                  </PopMenu>
                </div>
              ) : null}
              <button type="button" className="hbtn hbtn-sm hbtn-secondary hubly-chat-send" disabled={!hasContent || uploading} onClick={submit}>
                <HublySendIcon size={15} />
                <span>{uploading ? "Subiendo…" : "Enviar"}</span>
              </button>
            </>
          ) : (
            <button type="button" className="hubly-chat-round" aria-label="Grabar una nota de voz" data-tip="Nota de voz" data-tip-end onClick={startRecording}>
              <HublyMicIcon size={18} />
            </button>
          )}
        </div>
      </div>

      {error ? <p className="hubly-chat-composer-error" role="alert">{error}</p> : null}
    </div>
  );
}
