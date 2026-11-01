"use client";

import { Button } from "@/components/app/ui/Button";
import React, { } from "react";
import { } from "@/components/app/AppDialogHost";
import { } from "@/components/app/social/ComposerExtras";
import { scheduleLabel } from "@/components/app/social/ComposerDatePicker";
import { ConfirmPublish, CoverPicker, } from "@/components/app/social/ComposerPanels";
import { MediaPickerModal } from "@/components/app/media/MediaPickerModal";
import { } from "@/components/previews/phone/PhonePreview";
import { GLYPHS } from "@/components/previews/NetworkMarks";
import { mediaFileUrl, MAX_MEDIA_PER_POST, } from "@/lib/media";
import { } from "@/lib/media-client";
import { } from "@/lib/network-catalog";
import { } from "@/lib/composer-rules";
import {
  clearRecovery,
  draftToPost,
  mediaItemUrl,
} from "@/lib/post-draft";
import type { } from "@/lib/types";
import {
  HublyEyeIcon as Eye,
  HublyPencilIcon as Pencil,
} from "@/components/app/icons/DuotoneIcons";
import { usePostComposerModal, buildPostComposerModal } from "./compositor/usePostComposerModal";
import { TABS, } from "./compositor/PostComposerModal-shared";
import { ComposerCabecera } from "./compositor/ComposerCabecera";
import { ComposerMeta } from "./compositor/ComposerMeta";
import { ComposerContenido } from "./compositor/ComposerContenido";
import { ComposerVistaPrevia } from "./compositor/ComposerVistaPrevia";
import { ComposerPie } from "./compositor/ComposerPie";

export function PostComposerModal(props: Parameters<typeof usePostComposerModal>[0]) {
  const base = usePostComposerModal(props);
  const { presence, draft, brand } = base;
  if (!presence.mounted || !draft || !brand) return null;
  const view = buildPostComposerModal({ ...base, draft, brand });
  const { sheetRef, savePost, composerPending, resolveComposerPending, readOnly, editingPost, tab, setTab, mobilePane, setMobilePane, recoveredAt, uploads, pickerFor, setPickerFor, setErrorMsg, confirmIntent, setConfirmIntent, coverOpen, setCoverOpen, docDrop, setDocDrop, key, activeUploads, requestClose, update, media, published, authorName, todosDone, addFromRecord, save, uploadDocuments, discardRecovery, syncExtras, hasCopy, storyRepeats, firstVideoUrl } = view;

  return (
    <>
      <div className="hubly-composer-scrim" data-state={presence.state} onMouseDown={() => void requestClose()} aria-hidden />
      <div className="hubly-overlay hubly-composer-overlay" data-state={presence.state}>
        <div
          ref={sheetRef}
          className="hubly-sheet hubly-composer"
          data-state={presence.state}
          data-docdrop={docDrop || undefined}
          role="dialog"
          aria-modal="false"
          aria-label="Editor de post"
          onDragOver={(e) => {
            if (tab !== "documentos" || readOnly || !e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDocDrop(true);
          }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setDocDrop(false); }}
          onDrop={(e) => {
            if (tab !== "documentos" || readOnly || e.dataTransfer.files.length === 0) return;
            e.preventDefault();
            setDocDrop(false);
            uploadDocuments(e.dataTransfer.files);
          }}
        >
          <ComposerCabecera view={view} />
          {draft.color && <div className="hubly-composer-colorbar" style={{ background: draft.color }} aria-hidden />}

          {recoveredAt && (
            <div className="hubly-composer-recovered" role="status">
              <span>Recuperamos cambios sin guardar de {new Date(recoveredAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}. Solo existen en este navegador hasta que guardes.</span>
              <button type="button" onClick={discardRecovery}>Descartarlos</button>
            </div>
          )}
          {readOnly && <div className="hubly-composer-recovered" role="status"><span>Tienes acceso de solo lectura a este post.</span></div>}
          {published && !readOnly && <div className="hubly-composer-recovered" role="status"><span>Este post ya se publicó: su contenido es de solo lectura. Puedes duplicarlo para reutilizarlo.</span></div>}

          <ComposerMeta view={view} />

          <nav className="hubly-composer-tabs" aria-label="Secciones del post">
            <div className="hubly-composer-tabs-scroll">
              {TABS.filter(({ id }) => id !== "resultados" || published).map(({ id, label, Icon }) => {
                const badge = id === "todos" && draft.todos.length > 0 ? `${todosDone}/${draft.todos.length}` : id === "chat" && draft.chat.length > 0 ? String(draft.chat.length) : null;
                return (
                  <button key={id} type="button" aria-current={tab === id ? "true" : undefined} onClick={() => { setTab(id); setMobilePane("editar"); }}>
                    <Icon size={18} />
                    <span>{label}</span>
                    {badge && <em>{badge}</em>}
                  </button>
                );
              })}
            </div>
            <button type="button" className="hubly-composer-mobile-preview" aria-pressed={mobilePane === "vista"} onClick={() => setMobilePane(mobilePane === "vista" ? "editar" : "vista")}>
              {mobilePane === "vista" ? <Pencil size={17} /> : <Eye size={17} />}
              <span>{mobilePane === "vista" ? "Editar" : "Vista previa"}</span>
            </button>
          </nav>

          <div className="hubly-composer-body" data-pane={mobilePane}>
            <ComposerContenido view={view} />

            <ComposerVistaPrevia view={view} />
          </div>

          <ComposerPie view={view} />
        </div>

        {confirmIntent && (
          <ConfirmPublish
            intent={confirmIntent}
            when={scheduleLabel(draft.scheduledDate, draft.scheduledTime)}
            networks={draft.networks.filter((n) => !(draft.format === "Story" && n === "TikTok"))}
            noCopy={draft.format !== "Story" && !hasCopy}
            repeats={storyRepeats.length}
            renderIcon={(n) => GLYPHS[n]}
            onCancel={() => setConfirmIntent(null)}
            onConfirm={() => { setConfirmIntent(null); save(confirmIntent === "programar" ? "scheduled" : "published"); }}
          />
        )}
        {coverOpen && firstVideoUrl && (
          <CoverPicker
            videoUrl={mediaItemUrl(firstVideoUrl) ?? ""}
            brandId={draft.brandId}
            onCancel={() => setCoverOpen(false)}
            onSaved={(coverAssetId) => { update({ coverAssetId }); setCoverOpen(false); }}
          />
        )}
        {composerPending && (
          <div className="hubly-picker-scrim">
            <div className="hubly-composer-pending" role="alertdialog" aria-modal="true" aria-labelledby="hubly-pending-title">
              <h2 id="hubly-pending-title">Tienes cambios sin guardar</h2>
              <p>«{draft.title || "Sin título"}» sigue abierto. ¿Qué quieres hacer antes de abrir otro post?</p>
              <div>
                <Button autoFocus variant="ghost" onClick={() => resolveComposerPending("keep")}>Seguir editando</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (key) clearRecovery(localStorage, key);
                    uploads.forEach((u) => u.handle?.cancel());
                    resolveComposerPending("open");
                  }}
                >
                  Descartar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (activeUploads) {
                      setErrorMsg("Espera a que terminen las subidas o cancélalas.");
                      resolveComposerPending("keep");
                      return;
                    }
                    if (key) clearRecovery(localStorage, key);
                    savePost({ ...draftToPost(draft, editingPost, authorName) });
                    resolveComposerPending("open");
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}

        <MediaPickerModal
          open={pickerFor !== null}
          brandId={draft.brandId}
          accept={pickerFor === "media" ? ["image", "video"] : ["pdf", "doc", "image", "video"]}
          subtitle={pickerFor === "media" ? "Selecciona imágenes o videos" : "Selecciona documentos"}
          maxSelection={pickerFor === "media" ? Math.max(MAX_MEDIA_PER_POST - media.length, 1) : 10}
          onCancel={() => setPickerFor(null)}
          onConfirm={(records) => {
            if (pickerFor === "media") records.forEach(addFromRecord);
            else {
              syncExtras({
                documents: [
                  ...draft.documents,
                  ...records.map((r) => ({ id: `doc-${r.id}`, name: r.name, url: mediaFileUrl(r.id), folder: r.folder || undefined })),
                ],
              });
            }
            setPickerFor(null);
          }}
        />
      </div>
    </>
  );
}
