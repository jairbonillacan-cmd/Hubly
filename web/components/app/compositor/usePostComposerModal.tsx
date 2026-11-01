"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { currentAgencyId } from "@/lib/live-workspace";
import { askConfirm, askText } from "@/components/app/AppDialogHost";
import { videoDuration } from "@/components/app/social/ComposerPanels";
import { useModalPresence } from "@/lib/use-modal-presence";
import { useLayer } from "@/lib/use-layer";
import { type PhoneMedia } from "@/components/previews/phone/PhonePreview";
import { mediaFileUrl, MAX_MEDIA_PER_POST, mediaKindFor, type MediaRecord } from "@/lib/media";
import { hevcWarning, uploadMedia, } from "@/lib/media-client";
import { captionLevel, networkIssues, networkSpec } from "@/lib/network-catalog";
import { localIsoDate } from "@/lib/date";
import { availableFormats, isPastSchedule, normalizeFormat, repeatDates, videoLimit } from "@/lib/composer-rules";
import {
  captionFor,
  clearRecovery,
  draftFromPost,
  draftsEqual,
  draftToPost,
  formatFor,
  loadRecovery,
  mediaItemUrl,
  recoveryKey,
  saveRecovery,
  type PostDraft,
} from "@/lib/post-draft";
import { DEFAULT_WORKFLOW } from "@/lib/calendar-views";
import { moveInList } from "@/lib/use-kanban-drag";
import type { CustomFieldDefinition, PlatformSettings, PostMedia, PostStatus, SocialNetwork, WorkflowStatus } from "@/lib/types";
import { PostComposerModalProps, ComposerTab, PublishMode, POST_COLORS, POST_PALETTE, UploadSlot, Popover, } from "./PostComposerModal-shared";

export function usePostComposerModal({ open: openProp, onClose: onCloseProp, initialPostId, defaultBrandId }: PostComposerModalProps = {}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const editingPostId = useHublyStore((s) => s.editingPostId);
  const closeComposer = useHublyStore((s) => s.closeComposer);
  const posts = useHublyStore((s) => s.posts);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const profile = useHublyStore((s) => s.profile);
  const savePost = useHublyStore((s) => s.savePost);
  const patchPost = useHublyStore((s) => s.patchPost);
  const deletePost = useHublyStore((s) => s.deletePost);
  const duplicatePost = useHublyStore((s) => s.duplicatePost);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const openComposer = useHublyStore((s) => s.openComposer);
  const team = useHublyStore((s) => s.team);
  const composerDefaultDate = useHublyStore((s) => s.composerDefaultDate);
  const composerPending = useHublyStore((s) => s.composerPending);
  const setComposerDirty = useHublyStore((s) => s.setComposerDirty);
  const resolveComposerPending = useHublyStore((s) => s.resolveComposerPending);
  const readOnly = useHublyStore((s) => s.role === "viewer");
  const isOpen = openProp !== undefined ? openProp : composerOpen;
  const presence = useModalPresence(isOpen);
  const targetPostId = initialPostId !== undefined ? initialPostId : editingPostId;
  const editingPost = targetPostId ? posts.find((p) => p.id === targetPostId) || null : null;
  const [tab, setTab] = useState<ComposerTab>("contenido");
  const [mobilePane, setMobilePane] = useState<"editar" | "vista">("editar");
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [baseline, setBaseline] = useState<PostDraft | null>(null);
  const [recoveredAt, setRecoveredAt] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadSlot[]>([]);
  const [pickerFor, setPickerFor] = useState<"media" | "documents" | null>(null);
  const [popover, setPopover] = useState<Popover>(null);
  const [copyNetwork, setCopyNetwork] = useState<SocialNetwork | "General">("General");
  const [previewNet, setPreviewNet] = useState<SocialNetwork | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [todoDraft, setTodoDraft] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docFolder, setDocFolder] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldDefinition["type"]>("text");
  const [dragMedia, setDragMedia] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<PublishMode>("guardar");
  const [confirmIntent, setConfirmIntent] = useState<"programar" | "publicar" | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [docDrop, setDocDrop] = useState(false);
  const [newStatus, setNewStatus] = useState<{ name: string; color: string } | null>(null);
  const owner = `${profile?.id || "local"}:${currentAgencyId() || "demo"}`;
  const key = draft ? recoveryKey(owner, draft.brandId, draft.postId) : null;
  const dirty = Boolean(draft && baseline && !draftsEqual(draft, baseline));
  const activeUploads = uploads.some((u) => !u.error);
  // Marca, agencia y post quedan fijados aquí: cambiar de marca en el sidebar no reasigna el borrador.
  useEffect(() => {
    if (!isOpen) return;
    const initial = draftFromPost(editingPost, {
      brandId: defaultBrandId || activeBrandId,
      assignee: profile?.name || "",
      date: composerDefaultDate,
    });
    if (!editingPost) {
      const catalog = brands.find((b) => b.id === initial.brandId)?.workflowStatuses;
      initial.workflowStatusId = (catalog?.length ? catalog : DEFAULT_WORKFLOW)[0].id;
    }
    const recovered = readOnly ? null : loadRecovery(localStorage, recoveryKey(owner, initial.brandId, initial.postId));
    const useRecovered = recovered && !draftsEqual(recovered.draft, initial);
    /* eslint-disable react-hooks/set-state-in-effect -- abrir otro post reinicia toda la sesión de edición */
    setDraft(useRecovered ? recovered.draft : initial);
    setBaseline(initial);
    setRecoveredAt(useRecovered ? recovered.savedAt : null);
    setTab(editingPost?.status === "published" ? "resultados" : "contenido");
    setMobilePane("editar");
    setUploads([]);
    setPopover(null);
    setCopyNetwork("General");
    setPreviewNet(null);
    setErrorMsg(null);
    setSelectedMedia(null);
    setConfirmIntent(null);
    setCoverOpen(false);
    setNewStatus(null);
    setPublishMode(editingPost?.status === "scheduled" ? "programar" : "guardar");
    /* eslint-enable react-hooks/set-state-in-effect */
    // Solo al abrir o cambiar de post: patchPost actualiza editingPost mientras se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingPost?.id]);
  useEffect(() => {
    if (!isOpen || !draft || !key || readOnly) return;
    setComposerDirty(dirty || activeUploads);
    const timer = setTimeout(() => {
      if (dirty) saveRecovery(localStorage, key, draft);
      else clearRecovery(localStorage, key);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeUploads, dirty, draft, isOpen, key, readOnly, setComposerDirty]);
  useEffect(() => {
    if (!isOpen) return;
    const focusTarget = sheetRef.current?.querySelector<HTMLElement>(".hubly-composer-title");
    focusTarget?.focus({ preventScroll: true });
  }, [isOpen]);
  const handleClose = () => {
    uploads.forEach((u) => u.handle?.cancel());
    setErrorMsg(null);
    setComposerDirty(false);
    if (onCloseProp) onCloseProp();
    else closeComposer();
  };
  const requestClose = async () => {
    if (activeUploads && !(await askConfirm("Hay una subida en curso. Si cierras se pierde el archivo que se está subiendo.", "Cerrar de todos modos"))) return;
    handleClose();
  };
  // Otros modales manejan su propio Escape; el editor solo responde cuando es lo de arriba.
  useLayer(
    isOpen,
    () => {
      if (composerPending) resolveComposerPending("keep");
      else if (popover) setPopover(null);
      else void requestClose();
    },
    { deferTo: '.hubly-overlay:not(.hubly-composer-overlay), [role="dialog"][aria-modal="true"]' }
  );
  // Los archivos mandan: un video no puede quedar como imagen ni varias fotos como una sola.
  useEffect(() => {
    if (!draft) return;
    const next = normalizeFormat(draft.format, draft.media);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- corrige el formato al cambiar los archivos */
    if (next !== draft.format) setDraft((d) => (d ? { ...d, format: next } : d));
  }, [draft]);
  useEffect(() => {
    if (!popover) return;
    const closeOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".hubly-composer-pop, .hubly-composer-when")) setPopover(null);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [popover]);
  const update = (patch: Partial<PostDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updateSettings = (network: SocialNetwork, patch: Partial<PlatformSettings>) =>
    setDraft((d) => {
      if (!d) return d;
      const next = { ...(d.platformSettings[network] ?? {}), ...patch };
      (Object.keys(next) as (keyof PlatformSettings)[]).forEach((k) => next[k] === undefined && delete next[k]);
      return { ...d, platformSettings: { ...d.platformSettings, [network]: next } };
    });
  const brand = brands.find((b) => b.id === draft?.brandId) || brands[0];
  const workflow = brand?.workflowStatuses?.length ? brand.workflowStatuses : DEFAULT_WORKFLOW;
  const fields = brand?.customFieldDefinitions ?? [];
  const media = useMemo(() => draft?.media ?? [], [draft?.media]);
  const previewMedia: PhoneMedia[] = useMemo(
    () => media.map((m) => ({ id: m.id, kind: m.kind, name: m.name, url: mediaItemUrl(m), poster: m.kind === "video" && draft?.coverAssetId ? mediaFileUrl(draft.coverAssetId) : undefined })), // eslint-disable-line react-hooks/preserve-manual-memoization -- la portada es la dependencia que importa
    [media, draft?.coverAssetId]
  );

  return { openProp, onCloseProp, initialPostId, defaultBrandId, fileRef, sheetRef, composerOpen, editingPostId, closeComposer, posts, brands, activeBrandId, profile, savePost, patchPost, deletePost, duplicatePost, updateBrand, openComposer, team, composerDefaultDate, composerPending, setComposerDirty, resolveComposerPending, readOnly, isOpen, presence, targetPostId, editingPost, tab, setTab, mobilePane, setMobilePane, draft, setDraft, baseline, setBaseline, recoveredAt, setRecoveredAt, uploads, setUploads, pickerFor, setPickerFor, popover, setPopover, copyNetwork, setCopyNetwork, previewNet, setPreviewNet, errorMsg, setErrorMsg, todoDraft, setTodoDraft, docName, setDocName, docUrl, setDocUrl, docFolder, setDocFolder, chatDraft, setChatDraft, fieldName, setFieldName, fieldType, setFieldType, dragMedia, setDragMedia, dropActive, setDropActive, selectedMedia, setSelectedMedia, publishMode, setPublishMode, confirmIntent, setConfirmIntent, coverOpen, setCoverOpen, docDrop, setDocDrop, newStatus, setNewStatus, owner, key, dirty, activeUploads, handleClose, requestClose, update, updateSettings, brand, workflow, fields, media, previewMedia };
}

type usePostComposerModalResult = ReturnType<typeof usePostComposerModal>;

/** Lo que se calcula tras comprobar que la ventana está lista. No usa hooks. */
export function buildPostComposerModal(base: Omit<usePostComposerModalResult, "draft" | "brand"> & { draft: NonNullable<usePostComposerModalResult["draft"]>; brand: NonNullable<usePostComposerModalResult["brand"]> }) {
  const { profile, savePost, patchPost, deletePost, updateBrand, team, readOnly, editingPost, setTab, draft, setDraft, baseline, setBaseline, setRecoveredAt, uploads, setUploads, setPopover, copyNetwork, setCopyNetwork, previewNet, setPreviewNet, setErrorMsg, fieldName, setFieldName, fieldType, setFieldType, selectedMedia, publishMode, setConfirmIntent, newStatus, setNewStatus, key, activeUploads, handleClose, update, brand, workflow, fields, media } = base;
  const published = draft.status === "published";
  const locked = readOnly || published;
  const previewNetwork = previewNet && draft.networks.includes(previewNet) ? previewNet : (draft.networks[0] ?? "Instagram");
  const workflowStatus = workflow.find((w) => w.id === draft.workflowStatusId);
  const issues = networkIssues({ networks: draft.networks, caption: draft.caption, media, platformSettings: draft.platformSettings });
  const authorName = profile?.name || "Equipo";
  const copyTarget = copyNetwork !== "General" && draft.networks.includes(copyNetwork) ? copyNetwork : "General";
  const inherits = copyTarget !== "General" && draft.platformSettings[copyTarget]?.caption === undefined;
  const copyValue = copyTarget === "General" ? draft.caption : captionFor(draft, copyTarget);
  const limit = copyTarget === "General"
    ? Math.min(2200, ...draft.networks.map((n) => networkSpec(n).maxChars))
    : networkSpec(copyTarget).maxChars;
  const level = captionLevel(copyValue.length, limit);
  const selectedAssignees = team.filter((m) => draft.assigneeIds.includes(m.id));
  const notifyMembers = team.filter((m) => draft.notifyMemberIds.includes(m.id));
  const photoFor = (member: { email?: string }) => (member.email === profile?.email ? profile?.avatarUrl : undefined);
  const todosDone = draft.todos.filter((t) => t.done).length;
  const selectedPalette = POST_PALETTE.find((p) => p.color === draft.color);
  const toggleNetwork = (network: SocialNetwork) => {
    if (locked) return;
    // Al activar una red, la vista previa pasa a ella para ver cómo queda.
    if (!draft.networks.includes(network)) setPreviewNet(network);
    update({
      networks: draft.networks.includes(network) ? draft.networks.filter((n) => n !== network) : [...draft.networks, network],
    });
  };
  const addFromRecord = (record: MediaRecord) => {
    if (record.kind !== "image" && record.kind !== "video") return;
    const item: PostMedia = { id: `m-${record.id}`, kind: record.kind, name: record.name, assetId: record.id };
    setDraft((d) => {
      if (!d || d.media.some((m) => m.assetId === record.id) || d.media.length >= MAX_MEDIA_PER_POST) return d;
      const next = [...d.media, item];
      return {
        ...d,
        media: next,
        format: d.format === "Imagen" && next.length > 1 ? "Carrusel" : item.kind === "video" && next.length === 1 ? "Reel / Video" : d.format,
      };
    });
  };
  const startUpload = (file: File, existingId?: string) => {
    const id = existingId ?? `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const handle = uploadMedia(file, { brandId: draft.brandId, folder: "" }, (percent) =>
      setUploads((list) => list.map((u) => (u.id === id ? { ...u, percent } : u)))
    );
    setUploads((list) => {
      const slot: UploadSlot = { id, file, percent: 0, handle };
      return existingId ? list.map((u) => (u.id === id ? slot : u)) : [...list, slot];
    });
    void hevcWarning(file).then((warning) => {
      if (warning) setUploads((list) => list.map((u) => (u.id === id ? { ...u, warning } : u)));
    });
    handle.promise
      .then((record) => {
        setUploads((list) => list.filter((u) => u.id !== id));
        addFromRecord(record);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          setUploads((list) => list.filter((u) => u.id !== id));
          return;
        }
        const message = error instanceof Error ? error.message : "No se pudo subir el archivo.";
        setUploads((list) => list.map((u) => (u.id === id ? { ...u, error: message, handle: undefined } : u)));
      });
  };
  const addFiles = (files: FileList | null) => {
    if (!files || locked) return;
    const room = MAX_MEDIA_PER_POST - media.length - uploads.length;
    const chosen = Array.from(files);
    if (chosen.length > room) setErrorMsg(`Un post admite hasta ${MAX_MEDIA_PER_POST} archivos.`);
    chosen.slice(0, Math.max(room, 0)).forEach((file) => {
      const kind = mediaKindFor(file.type);
      if (kind === "image" || kind === "video" || !kind) startUpload(file);
      else setErrorMsg("Aquí solo se aceptan imágenes y videos. Los documentos van en su pestaña.");
    });
  };
  const moveMedia = (id: string, offset: number) => {
    const index = media.findIndex((m) => m.id === id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= media.length) return;
    const beforeId = offset < 0 ? media[target].id : (media[target + 1]?.id ?? null);
    update({ media: moveInList(media, id, beforeId, (m) => m) });
  };
  const save = (finalStatus: PostStatus) => {
    if (finalStatus === "scheduled" && !draft.scheduledDate) {
      setErrorMsg("Selecciona una fecha para programar.");
      return;
    }
    if (finalStatus !== "draft") {
      if (finalStatus === "pending" && !hasCopy) {
        setErrorMsg("Escribe el copy antes de enviar a revisión.");
        return;
      }
      if (issues.length > 0) {
        setErrorMsg(`${issues[0].network}: ${issues[0].message}`);
        setTab("contenido");
        return;
      }
    }
    if (activeUploads) {
      setErrorMsg("Espera a que terminen las subidas o cancélalas.");
      return;
    }
    if (key) clearRecovery(localStorage, key);
    // Registrar una publicación fecha el post hoy si no tenía fecha.
    const scheduledDate = finalStatus === "published" ? draft.scheduledDate || localIsoDate() : draft.scheduledDate;
    savePost({ ...draftToPost({ ...draft, status: finalStatus, scheduledDate }, editingPost, authorName) });
    if (finalStatus === "scheduled" && storyRepeats.length > 0) {
      storyRepeats.forEach((date) => savePost({ ...draftToPost({ ...draft, postId: null, status: "scheduled", scheduledDate: date }, null, authorName) }));
    }
    handleClose();
  };
  /** Revisa lo que impediría salir antes de pedir la confirmación final. */
  const askToPublish = async (intent: "programar" | "publicar") => {
    setErrorMsg(null);
    if (draft.networks.length === 0) return;
    if (intent === "programar" && isPastSchedule(draft.scheduledDate, draft.scheduledTime)) {
      setErrorMsg("Esa hora ya pasó. Elige una fecha futura para programar.");
      return;
    }
    if (issues.length > 0) {
      setErrorMsg(`${issues[0].network}: ${issues[0].message}`);
      return;
    }
    if (activeUploads) {
      setErrorMsg("Espera a que terminen las subidas o cancélalas.");
      return;
    }
    const firstVideo = media.find((m) => m.kind === "video");
    const seconds = firstVideo ? await videoDuration(mediaItemUrl(firstVideo) ?? "") : null;
    if (seconds !== null) {
      const tooLong = draft.networks.map((n) => videoLimit(n, formatFor(draft, n))).filter((l) => l && seconds > l.seconds);
      if (tooLong.length > 0) {
        setErrorMsg(`El video dura de más para ${tooLong.map((l) => l?.label).join(", ")}. Recórtalo o quita esa red.`);
        return;
      }
    }
    setConfirmIntent(intent);
  };
  const downloadAll = () => {
    const base = (draft.title.trim() || "post").replace(/[\\/:*?"<>|]+/g, "").slice(0, 60) || "post";
    media.forEach((item, index) => {
      const url = mediaItemUrl(item);
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = media.length > 1 ? `${base} ${index + 1}` : base;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };
  const uploadDocuments = (files: FileList) => {
    Array.from(files).slice(0, 10).forEach((file) => {
      uploadMedia(file, { brandId: draft.brandId, folder: "" }, () => {}).promise
        .then((record) => setDraft((d) => {
          if (!d) return d;
          const documents = [...d.documents, { id: `doc-${record.id}`, name: record.name, url: mediaFileUrl(record.id) }];
          if (editingPost) patchPost(editingPost.id, { documents });
          return { ...d, documents };
        }))
        .catch(() => setErrorMsg(`No pudimos subir ${file.name}. Revisa tu conexión e inténtalo otra vez.`));
    });
  };
  const useCopyEverywhere = () => {
    if (copyTarget === "General") return;
    const platformSettings = Object.fromEntries(
      Object.entries(draft.platformSettings).map(([network, settings]) => {
        const rest = { ...settings };
        delete rest.caption;
        return [network, rest];
      })
    );
    update({ caption: copyValue, platformSettings });
    setCopyNetwork("General");
  };
  const discardRecovery = () => {
    if (key) clearRecovery(localStorage, key);
    if (baseline) setDraft(baseline);
    setRecoveredAt(null);
  };
  const remove = async () => {
    if (!editingPost) {
      if (key) clearRecovery(localStorage, key);
      handleClose();
      return;
    }
    if (!(await askConfirm(`¿Eliminar «${editingPost.title}»? Esta acción no se puede deshacer.`))) return;
    if (key) clearRecovery(localStorage, key);
    deletePost(editingPost.id);
    handleClose();
  };
  const addWorkflowStatus = () => {
    if (!newStatus?.name.trim()) return;
    const created: WorkflowStatus = { id: `wf-${Date.now()}`, name: newStatus.name.trim(), color: newStatus.color };
    updateBrand(brand.id, { workflowStatuses: [...workflow, created] });
    update({ workflowStatusId: created.id });
    setNewStatus(null);
    setPopover(null);
  };
  const removeWorkflowStatus = async (status: WorkflowStatus) => {
    if (!(await askConfirm(`¿Eliminar el estatus «${status.name}»?`))) return;
    updateBrand(brand.id, { workflowStatuses: workflow.filter((w) => w.id !== status.id) });
    if (draft.workflowStatusId === status.id) update({ workflowStatusId: null });
  };
  const removeField = async (field: CustomFieldDefinition) => {
    if (!(await askConfirm(`¿Eliminar el campo «${field.name}»? Los valores existentes se conservan.`))) return;
    updateBrand(brand.id, { customFieldDefinitions: fields.filter((f) => f.id !== field.id) });
  };
  const addField = () => {
    if (!fieldName.trim()) return;
    const definition: CustomFieldDefinition = {
      id: `cf-${Date.now()}`,
      name: fieldName.trim(),
      type: fieldType,
      ...(fieldType === "select" ? { options: [] } : {}),
    };
    updateBrand(brand.id, { customFieldDefinitions: [...fields, definition] });
    setFieldName("");
    setFieldType("text");
    setPopover(null);
  };
  const addFieldOption = async (field: CustomFieldDefinition) => {
    const label = await askText(`Nueva opción para «${field.name}»`, "", "Agregar");
    if (!label?.trim()) return;
    const option = { id: `op-${Date.now()}`, label: label.trim(), color: POST_COLORS[(field.options?.length ?? 0) % POST_COLORS.length] };  
    updateBrand(brand.id, {
      customFieldDefinitions: fields.map((f) => (f.id === field.id ? { ...f, options: [...(f.options ?? []), option] } : f)),
    });
    update({ customFields: { ...draft.customFields, [field.id]: option.id } });
  };
  const syncExtras = (patch: Partial<Pick<PostDraft, "todos" | "documents" | "chat" | "notes">>) => {
    update(patch);
    // Tareas, documentos y chat de un post existente no esperan a «Guardar».
    if (editingPost) {
      patchPost(editingPost.id, patch);
      setBaseline((b) => (b ? { ...b, ...patch } : b));
    }
  };
  const networkFormats = (network: SocialNetwork) => networkSpec(network).formats;
  const previewFormat = formatFor(draft, previewNetwork);
  const hasCopy = Boolean(draft.caption.trim()) || Object.values(draft.platformSettings).some((s) => s?.caption?.trim());
  const isVideoPost = media.some((m) => m.kind === "video");
  const formatOptions = availableFormats(draft.networks, media);
  const storyRepeats = draft.format === "Story" && draft.repeat && draft.scheduledDate ? repeatDates(draft.repeat, draft.scheduledDate) : [];
  const pastSchedule = publishMode === "programar" && isPastSchedule(draft.scheduledDate, draft.scheduledTime);
  const noNetworks = draft.networks.length === 0;
  const scheduleButton = draft.scheduledDate
    ? `${draft.status === "scheduled" ? "Programado" : "Programar"} ${new Date(`${draft.scheduledDate}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}${draft.scheduledTime ? ` ${draft.scheduledTime}` : ""}`
    : "Selecciona fecha";
  const firstVideoUrl = media.find((m) => m.kind === "video");
  const firstImage = media.find((m) => m.kind === "image");
  const othersWithOwnCopy = draft.networks.filter((n) => {
    const own = draft.platformSettings[n]?.caption?.trim();
    return own && own !== draft.caption.trim();
  });
  const hasOwnCopy = copyTarget !== "General" && !inherits;
  const inheritingOthers = draft.networks.filter((n) => n !== copyTarget && draft.platformSettings[n]?.caption === undefined);
  const activeMedia = media.find((m) => m.id === selectedMedia) ?? media[0];
  const activeMediaIndex = activeMedia ? media.indexOf(activeMedia) : 0;
  const collaborators = draft.platformSettings.Instagram?.collaborators ?? [];

  return { ...base, published, locked, previewNetwork, workflowStatus, issues, authorName, copyTarget: copyTarget as typeof copyNetwork, inherits, copyValue, limit, level, selectedAssignees, notifyMembers, photoFor, todosDone, selectedPalette, toggleNetwork, addFromRecord, startUpload, addFiles, moveMedia, save, askToPublish, downloadAll, uploadDocuments, useCopyEverywhere, discardRecovery, remove, addWorkflowStatus, removeWorkflowStatus, removeField, addField, addFieldOption, syncExtras, networkFormats, previewFormat, hasCopy, isVideoPost, formatOptions, storyRepeats, pastSchedule, noNetworks, scheduleButton, firstVideoUrl, firstImage, othersWithOwnCopy, hasOwnCopy, inheritingOthers, activeMedia, activeMediaIndex, collaborators };
}

export type PostComposerModalModel = ReturnType<typeof buildPostComposerModal>;
