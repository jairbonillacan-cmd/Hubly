"use client";

import { Button } from "@/components/app/ui/Button";
import React from "react";
import { CaptionAssistant, ManualResults } from "@/components/app/social/ComposerExtras";
import { ComposerDatePicker, scheduleLabel } from "@/components/app/social/ComposerDatePicker";
import { BestHours, CollaboratorsField, StoryRepeatField, TikTokFitHint, } from "@/components/app/social/ComposerPanels";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { GLYPHS } from "@/components/previews/NetworkMarks";
import { formatBytes, mediaFileUrl, MAX_MEDIA_PER_POST, } from "@/lib/media";
import { NETWORKS, networkFormatLabel, networkSpec } from "@/lib/network-catalog";
import {
  formatFor,
  mediaItemUrl,
} from "@/lib/post-draft";
import { moveInList } from "@/lib/use-kanban-drag";
import { safeLinkHref } from "@/lib/supabase/config";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyArrowRightIcon as ArrowRight,
  HublyCalendarIcon,
  HublyCloseIcon as X,
  HublyDocumentIcon,
  HublyDownloadIcon,
  HublyImageIcon,
  HublyLibraryIcon,
  HublyMusicIcon,
  HublyPeopleIcon,
  HublyUploadIcon,
} from "@/components/app/icons/DuotoneIcons";
import { FORMAT_LABEL, PUBLISH_MODES, networkInk, NetworkSettings } from "./PostComposerModal-shared";
import type { PostComposerModalModel } from "./usePostComposerModal";

export function ComposerContenido({ view }: { view: PostComposerModalModel }) {
  const { fileRef, posts, team, readOnly, editingPost, tab, draft, uploads, setUploads, setPickerFor, popover, setPopover, setCopyNetwork, setPreviewNet, setErrorMsg, todoDraft, setTodoDraft, docName, setDocName, docUrl, setDocUrl, docFolder, setDocFolder, chatDraft, setChatDraft, dragMedia, setDragMedia, dropActive, setDropActive, setSelectedMedia, publishMode, setPublishMode, setCoverOpen, update, updateSettings, brand, media, locked, previewNetwork, issues, authorName, copyTarget, copyValue, limit, level, toggleNetwork, startUpload, addFiles, moveMedia, downloadAll, useCopyEverywhere, syncExtras, networkFormats, isVideoPost, formatOptions, noNetworks, firstVideoUrl, firstImage, othersWithOwnCopy, hasOwnCopy, inheritingOthers, activeMedia, collaborators } = view;

  return (
    <div className="hubly-composer-main">
      {tab === "contenido" && (
        <>
          <div className="hubly-composer-banner">
            <HublyCatAvatar size={36} />
            <div>
              <strong>Hubly planifica; tú publicas</strong>
              <span>La publicación automática aún no está disponible. Publica en la red y regístralo en Resultados.</span>
            </div>
          </div>

          <div className="hubly-composer-networks" role="group" aria-label="Redes">
            {NETWORKS.map(({ id, color }) => (
              <button
                key={id}
                type="button"
                title={id}
                aria-label={id}
                disabled={locked}
                aria-pressed={draft.networks.includes(id)}
                style={{ "--net": networkInk(color) } as React.CSSProperties}
                onClick={() => toggleNetwork(id)}
              >
                {GLYPHS[id]}
              </button>
            ))}
          </div>

          <div className="hubly-composer-sources" data-compact={media.length > 0 || undefined}>
            <button
              type="button"
              data-drop={dropActive || undefined}
              title="Imágenes hasta 20 MB y videos hasta 100 MB"
              disabled={locked || media.length + uploads.length >= MAX_MEDIA_PER_POST}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
              onDragLeave={() => setDropActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropActive(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <i><HublyUploadIcon size={18} /></i>
              {media.length > 0 ? (
                <strong><b>Agregar</b> · máx {MAX_MEDIA_PER_POST}</strong>
              ) : (
                <>
                  <strong>Arrastra archivos aquí o <b>haz clic</b></strong>
                  <small>Imágenes y videos · máx {MAX_MEDIA_PER_POST} archivos</small>
                </>
              )}
            </button>
            <button type="button" disabled={locked} onClick={() => setPickerFor("media")}>
              <i><HublyLibraryIcon size={18} /></i>
              <strong>{media.length === 0 && "Elegir del "}<b>Content Manager</b></strong>
              {media.length === 0 && <small>Archivos ya subidos de la marca</small>}
            </button>
            <button type="button" disabled title="Función prevista: aún no se conecta con Canva">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <i><img src="/logos/redes/canva.svg" width={24} height={24} alt="" /></i>
              <strong>Traer de <b>Canva</b></strong>
              {media.length === 0 && <small>Función prevista</small>}
            </button>
            <button type="button" disabled title="Función prevista: aún no se conecta con Drive">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <i><img src="/logos/redes/google-drive.png" width={24} height={24} alt="" /></i>
              <strong>Traer de <b>Drive</b></strong>
              {media.length === 0 && <small>Función prevista</small>}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              multiple
              hidden
              aria-label="Subir archivos del post"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {uploads.length > 0 && (
            <ul className="hubly-media-queue" aria-label="Subidas del post">
              {uploads.map((u) => (
                <li key={u.id} data-state={u.error ? "failed" : "uploading"}>
                  <div className="hubly-media-queue-row">
                    <strong>{u.error ? "No se subió" : "Subiendo"} · {u.file.name}</strong>
                    <span>{u.error ?? `${u.percent}% de ${formatBytes(u.file.size)}`}</span>
                    {u.error ? (
                      <>
                        <button type="button" onClick={() => startUpload(u.file, u.id)}>Reintentar</button>
                        <button type="button" onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}>Quitar</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => u.handle?.cancel()}>Cancelar</button>
                    )}
                  </div>
                  {!u.error && (
                    <div className="hubly-media-bar" role="progressbar" aria-valuenow={u.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Subiendo ${u.file.name}`}>
                      <span style={{ width: `${u.percent}%` }} />
                    </div>
                  )}
                  {u.warning && <p className="hubly-media-warning">{u.warning}</p>}
                </li>
              ))}
            </ul>
          )}

          {media.length > 0 && (
            <>
              <ol className="hubly-composer-media" aria-label="Archivos del post, en orden de publicación">
                {media.map((item, index) => (
                  <li
                    key={item.id}
                    draggable={!locked}
                    data-selected={activeMedia?.id === item.id || undefined}
                    data-dragging={dragMedia === item.id || undefined}
                    onDragStart={() => setDragMedia(item.id)}
                    onDragEnd={() => setDragMedia(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragMedia && dragMedia !== item.id) update({ media: moveInList(media, dragMedia, item.id, (m) => m) });
                      setDragMedia(null);
                    }}
                  >
                    <button type="button" className="hubly-composer-thumb" aria-label={`Ver ${item.name}`} aria-pressed={activeMedia?.id === item.id} onClick={() => setSelectedMedia(item.id)}>
                      {item.kind === "video" ? (
                        <video src={`${mediaItemUrl(item)}#t=0.1`} preload="metadata" muted playsInline aria-label={item.name} />
                      ) : (
                        // Archivo privado: next/image no puede optimizar su URL firmada.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaItemUrl(item)} alt={item.name} draggable={false} />
                      )}
                    </button>
                    <b>{index + 1}</b>
                    {!locked && (
                      <div>
                        {media.length > 1 && <button type="button" aria-label={`Mover ${item.name} antes`} disabled={index === 0} onClick={() => moveMedia(item.id, -1)}><ArrowLeft size={13} /></button>}
                        {media.length > 1 && <button type="button" aria-label={`Mover ${item.name} después`} disabled={index === media.length - 1} onClick={() => moveMedia(item.id, 1)}><ArrowRight size={13} /></button>}
                        <button type="button" aria-label={`Quitar ${item.name}`} onClick={() => update({ media: media.filter((m) => m.id !== item.id) })}><X size={13} /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              {draft.networks.includes("TikTok") && firstImage && <TikTokFitHint url={mediaItemUrl(firstImage)} />}
              <div className="hubly-composer-mediatools">
                <Button variant="secondary" size="sm" onClick={downloadAll}>
                  <HublyDownloadIcon size={15} /> {media.length === 1 ? "Descargar archivo" : `Descargar ${media.length} archivos`}
                </Button>
                <Button variant="secondary" size="sm" disabled title="Función prevista: aún no hay biblioteca de música">
                  <HublyMusicIcon size={15} /> Agregar música
                </Button>
              </div>
              <div className="hubly-composer-formats">
                {formatOptions.length > 1 && (
                  <div className="hubly-composer-formatrow" role="group" aria-label="Formato del post">
                    <span aria-hidden>Formato</span>
                    {formatOptions.map((f) => (
                      <button key={f} type="button" className="hubly-cal-pill" aria-pressed={draft.format === f} disabled={locked} onClick={() => update({ format: f })}>{FORMAT_LABEL[f]}</button>
                    ))}
                  </div>
                )}
                {draft.networks.length >= 2 && (
                  <ul className="hubly-composer-formatmap" aria-label="Formato en cada red">
                    {draft.networks.map((n) => (
                      <li key={n}><i style={{ background: networkInk(networkSpec(n).color) }} />{n}: {networkFormatLabel(n, formatFor(draft, n))}</li>
                    ))}
                  </ul>
                )}
                {draft.format === "Story" && draft.networks.includes("TikTok") && (
                  <small className="hubly-composer-hint">TikTok no permite publicar Stories por API: esta Story no sale ahí. Si la quieres en su perfil, crea un post aparte.</small>
                )}
              </div>
            </>
          )}

          <div className="hubly-composer-copy">
            <div className="hubly-composer-copytabs" role="tablist" aria-label="Copy por red">
              <button type="button" role="tab" aria-selected={copyTarget === "General"} onClick={() => setCopyNetwork("General")}>General</button>
              {draft.networks.map((n) => (
                <button key={n} type="button" role="tab" aria-selected={copyTarget === n} style={{ "--net": networkInk(networkSpec(n).color), "--net-on": networkSpec(n).color === "#000000" ? "var(--ui-surface)" : "var(--on-accent)" } as React.CSSProperties} onClick={() => { setCopyNetwork(n); setPreviewNet(n); }}>
                  {n}{draft.platformSettings[n]?.caption !== undefined && <i title="Tiene su propio texto" />}
                </button>
              ))}
            </div>
            {copyTarget !== "General" && (
              <NetworkSettings network={copyTarget} settings={draft.platformSettings[copyTarget] ?? {}} formats={networkFormats(copyTarget)} generalFormat={draft.format} isVideo={isVideoPost} disabled={locked} onChange={(patch) => updateSettings(copyTarget, patch)} />
            )}
            <textarea
              className="hubly-composer-caption"
              value={copyValue}
              disabled={locked}
              onChange={(e) => (copyTarget === "General" ? update({ caption: e.target.value }) : updateSettings(copyTarget, { caption: e.target.value }))}
              placeholder={copyTarget === "General" ? "Escribe el copy para todas las redes…" : `Texto para ${copyTarget}…`}
              aria-label={copyTarget === "General" ? "Copy general" : `Copy de ${copyTarget}`}
            />
            {copyTarget !== "General" && draft.caption.trim() && draft.networks.length > 1 && (
              <p className="hubly-composer-copynote">
                <span>
                  {hasOwnCopy
                    ? `Este texto solo sale en ${copyTarget}.${inheritingOthers.length ? ` ${inheritingOthers.join(", ")} salen con el de General.` : ""}`
                    : `Lo que cambies aquí solo sale en ${copyTarget}. Para cambiarlo en todas, usa General.`}
                </span>
                {hasOwnCopy && !locked && <button type="button" onClick={useCopyEverywhere}>Usar en todas las redes</button>}
              </p>
            )}
            <CaptionAssistant
              brand={brand}
              network={copyTarget === "General" ? previewNetwork : copyTarget}
              format={draft.format}
              title={draft.title}
              context={draft.videoContext}
              current={copyValue}
              disabled={locked}
              onUse={(text) => (copyTarget === "General" ? update({ caption: text }) : updateSettings(copyTarget, { caption: text }))}
              counter={
                <div className="hubly-composer-count" data-level={level}>
                  <span>{copyValue.length}/{limit}</span>
                </div>
              }
            />
            {copyTarget === "General" && draft.caption.trim() && othersWithOwnCopy.map((n) => (
              <p key={n} className="hubly-composer-copynote">
                <span>{n} tiene su propio texto y es el que se publica ahí, no este.</span>
                <button type="button" onClick={() => { setCopyNetwork(n); setPreviewNet(n); }}>Ver</button>
                {!locked && <button type="button" onClick={() => updateSettings(n, { caption: undefined })}>Usar este en {n}</button>}
              </p>
            ))}
          </div>

          {draft.networks.includes("Instagram") && draft.format !== "Story" && draft.format !== "Texto" && (
            <CollaboratorsField value={collaborators} disabled={locked} icon={<HublyPeopleIcon size={15} />} onChange={(next) => updateSettings("Instagram", { collaborators: next.length ? next : undefined })} />
          )}

          {draft.networks.includes("TikTok") && media.length > 0 && !media.some((m) => m.kind === "video") && (
            <div className="hubly-composer-netbox">
              <small>TikTok · carrusel de fotos</small>
              <label>
                <input type="checkbox" disabled={locked} checked={draft.platformSettings.TikTok?.autoMusic === true} onChange={(e) => updateSettings("TikTok", { autoMusic: e.target.checked || undefined })} />
                <span>
                  <strong>Que TikTok elija la música</strong>
                  <small>La red pone una canción recomendada de su biblioteca. Es la única forma de ponerle música a un carrusel por API.</small>
                </span>
              </label>
            </div>
          )}

          {firstVideoUrl && (
            <div className="hubly-composer-netbox">
              <small>Portada</small>
              <div className="hubly-composer-coverrow">
                <button type="button" className="hubly-composer-coverbtn" disabled={locked} onClick={() => setCoverOpen(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {draft.coverAssetId ? <img src={mediaFileUrl(draft.coverAssetId)} alt="Portada" /> : <i><HublyImageIcon size={18} /></i>}
                  <span>
                    <strong>{draft.coverAssetId ? "Editar portada" : "Elegir portada"}</strong>
                    <small>Elige un cuadro del video o sube tu propia imagen.</small>
                  </span>
                </button>
                {draft.coverAssetId && !locked && <Button variant="ghost" size="sm" onClick={() => update({ coverAssetId: undefined })}>Quitar</Button>}
              </div>
              {draft.networks.includes("TikTok") && <small className="hubly-composer-hint">En TikTok la portada es un cuadro del video: una imagen externa no se puede fijar por API.</small>}
              <label className="hubly-composer-stack">
                Contexto del video · manda sobre lo demás al generar el caption
                <textarea className="hubly-cal-input" rows={2} disabled={locked} value={draft.videoContext ?? ""} placeholder="De qué trata el video, qué se ve, qué se promociona…" onChange={(e) => update({ videoContext: e.target.value || undefined })} />
              </label>
            </div>
          )}

          <div className="hubly-composer-when">
            <div className="hubly-composer-modes" role="radiogroup" aria-label="Qué hacer con el post">
              {PUBLISH_MODES.map(({ id, label, Icon }) => (
                <button key={id} type="button" role="radio" aria-checked={publishMode === id} disabled={locked || (id !== "guardar" && noNetworks)} onClick={() => { setPublishMode(id); setPopover(null); setErrorMsg(null); }}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            {noNetworks && <small className="hubly-composer-hint">Para programarlo o publicarlo, elige arriba en qué red sale.</small>}
            {publishMode === "publicar" && (
              <small className="hubly-composer-hint">Hubly aún no publica por ti: súbelo a la red y márcalo aquí. Después captura sus cifras en Resultados.</small>
            )}
            {publishMode === "programar" && (
              <small className="hubly-composer-hint">Programar lo ordena en tu calendario, hora de Ciudad de México. No publica en la red.</small>
            )}
            {publishMode !== "publicar" && (
              <div className="hubly-composer-datewrap">
                <button type="button" className="hubly-composer-datefield" disabled={locked} aria-expanded={popover === "date"} data-empty={!draft.scheduledDate || undefined} onClick={() => setPopover(popover === "date" ? null : "date")}>
                  <HublyCalendarIcon size={16} />
                  <span>{scheduleLabel(draft.scheduledDate, draft.scheduledTime) ?? "Elegir fecha y hora"}</span>
                </button>
                {popover === "date" && (
                  <ComposerDatePicker
                    date={draft.scheduledDate}
                    allowPast={publishMode !== "programar"}
                    time={draft.scheduledTime}
                    onChange={(scheduledDate, scheduledTime) => update({ scheduledDate, scheduledTime })}
                    onClose={() => setPopover(null)}
                  />
                )}
              </div>
            )}
            {publishMode !== "publicar" && <BestHours posts={posts.filter((p) => p.brandId === draft.brandId)} date={draft.scheduledDate} onPick={(scheduledDate, scheduledTime) => update({ scheduledDate, scheduledTime })} />}
            {publishMode === "guardar" && draft.scheduledDate && <small className="hubly-composer-hint">Queda apartado ese día y a esa hora, pero no se programa. Para eso, elige «Programar».</small>}
            {publishMode !== "publicar" && draft.format === "Story" && <StoryRepeatField value={draft.repeat} time={draft.scheduledTime} disabled={locked} onChange={(repeat) => update({ repeat })} />}
            {publishMode !== "guardar" && issues.length > 0 && (
              <ul className="hubly-composer-issues" aria-label="Pendientes para publicar">
                {issues.map((issue) => <li key={`${issue.network}-${issue.message}`}><b>{issue.network}:</b> {issue.message}</li>)}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "resultados" && (
        editingPost ? (
          <ManualResults key={editingPost.id} post={editingPost} />
        ) : (
          <div className="hubly-cal-empty">
            <strong>Sin resultados</strong>
            <span>Guarda el post y, cuando lo publiques en la red, registra aquí el enlace y sus cifras.</span>
          </div>
        )
      )}

      {tab === "notas" && (
        <>
        <p className="hubly-composer-hint">Notas internas, briefing o referencias para este post.</p>
        <NotebookEditor key={draft.postId ?? "nuevo"} initialContent={draft.notes} ariaLabel="Notas internas del post" onChange={(html) => syncExtras({ notes: html })} />
        </>
      )}

      {tab === "todos" && (
        <div className="hubly-composer-todos">
          {draft.todos.length === 0 && (
            <div className="hubly-cal-empty">
              <strong>Sin tareas todavía</strong>
              <span>Escribe abajo para agregar lo que falta para terminar este post.</span>
            </div>
          )}
          {draft.todos.map((todo) => (
            <div key={todo.id} className="hubly-composer-todo">
              <input
                type="checkbox"
                aria-label={`Completar ${todo.text}`}
                disabled={readOnly}
                checked={todo.done}
                onChange={() => syncExtras({ todos: draft.todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)) })}
              />
              <input
                className="hubly-cal-input"
                value={todo.text}
                disabled={readOnly}
                aria-label="Texto de la tarea"
                data-done={todo.done || undefined}
                onChange={(e) => syncExtras({ todos: draft.todos.map((t) => (t.id === todo.id ? { ...t, text: e.target.value } : t)) })}
              />
              <select
                className="hubly-cal-input hubly-composer-todoassign"
                value={todo.assigneeId ?? ""}
                disabled={readOnly}
                aria-label={`Asignar ${todo.text}`}
                onChange={(e) => syncExtras({ todos: draft.todos.map((t) => (t.id === todo.id ? { ...t, assigneeId: e.target.value || undefined } : t)) })}
              >
                <option value="">Sin asignar</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {!readOnly && (
                <button type="button" aria-label={`Quitar ${todo.text}`} onClick={() => syncExtras({ todos: draft.todos.filter((t) => t.id !== todo.id) })}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!todoDraft.trim()) return;
                syncExtras({ todos: [...draft.todos, { id: `todo-${Date.now()}`, text: todoDraft.trim(), done: false }] });
                setTodoDraft("");
              }}
            >
              <input className="hubly-cal-input" value={todoDraft} onChange={(e) => setTodoDraft(e.target.value)} placeholder="Agregar tarea…" aria-label="Nueva tarea del post" />
            </form>
          )}
        </div>
      )}

      {tab === "documentos" && (
        <div className="hubly-composer-docs">
          {draft.documents.length === 0 && <span className="hubly-composer-hint">Agrega briefs, guiones o archivos de referencia. También puedes arrastrarlos aquí.</span>}
          {[...new Set(draft.documents.map((d) => d.folder ?? ""))].sort().map((folder) => (
            <section key={folder || "sin-carpeta"} aria-label={folder || "Sin carpeta"}>
              {folder && <h4>{folder}</h4>}
              {draft.documents.filter((d) => (d.folder ?? "") === folder).map((doc) => (
                <div key={doc.id} className="hubly-composer-doc">
                  <HublyDocumentIcon size={20} />
                  <a href={safeLinkHref(doc.url)} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                  {!readOnly && (
                    <button type="button" aria-label={`Quitar ${doc.name}`} onClick={() => syncExtras({ documents: draft.documents.filter((d) => d.id !== doc.id) })}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </section>
          ))}
          {!readOnly && (
            <>
              <form
                className="hubly-composer-docform"
                onSubmit={(e) => {
                  e.preventDefault();
                  const url = docUrl.trim();
                  if (!/^https?:\/\//i.test(url)) {
                    setErrorMsg("El enlace debe empezar con http:// o https://");
                    return;
                  }
                  setErrorMsg(null);
                  syncExtras({ documents: [...draft.documents, { id: `doc-${Date.now()}`, name: docName.trim() || url, url, folder: docFolder.trim() || undefined }] });
                  setDocName("");
                  setDocUrl("");
                }}
              >
                <input className="hubly-cal-input" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Nombre" aria-label="Nombre del documento" />
                <input className="hubly-cal-input" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://…" aria-label="Enlace del documento" />
                <input className="hubly-cal-input" value={docFolder} onChange={(e) => setDocFolder(e.target.value)} placeholder="Carpeta (opcional)" aria-label="Carpeta del documento" />
                <Button type="submit" variant="secondary" size="sm">Agregar enlace</Button>
              </form>
              <Button variant="secondary" size="sm" style={{ justifySelf: "start" }} onClick={() => setPickerFor("documents")}>
                Adjuntar del Content Manager
              </Button>
            </>
          )}
        </div>
      )}

      {tab === "chat" && (
        <div style={{ display: "grid", gap: 8 }}>
          {draft.chat.length === 0 && <span className="hubly-composer-hint">Conversación interna del equipo sobre este post. No la ve el cliente.</span>}
          {draft.chat.map((m) => (
            <div key={m.id} className="hubly-composer-message">
              <strong>{m.author} · <small>{new Date(m.at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</small></strong>
              {m.text}
            </div>
          ))}
          {!readOnly && (
            <form
              style={{ display: "flex", gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatDraft.trim()) return;
                syncExtras({ chat: [...draft.chat, { id: `msg-${Date.now()}`, author: authorName, text: chatDraft.trim(), at: new Date().toISOString() }] });
                setChatDraft("");
              }}
            >
              <input className="hubly-cal-input" style={{ flex: 1, minWidth: 0 }} value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} placeholder="Escribe un mensaje…" aria-label="Mensaje al equipo" />
              <Button type="submit" variant="secondary" size="sm">Enviar</Button>
            </form>
          )}
        </div>
      )}

      {tab === "actividad" && (
        editingPost?.activity?.length ? (
          <ol className="hubly-composer-activity">
            {editingPost.activity.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.author}</strong> {entry.text}
                <small>{new Date(entry.at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</small>
              </li>
            ))}
          </ol>
        ) : (
          <div className="hubly-cal-empty">
            <strong>Aún sin actividad</strong>
            <span>El historial empieza al guardar cambios en este post.</span>
          </div>
        )
      )}
    </div>
  );
}
