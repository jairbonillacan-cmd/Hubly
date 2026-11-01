"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { currentAgencyId } from "@/lib/live-workspace";
import { askConfirm, askText } from "@/components/app/AppDialogHost";
import { CaptionAssistant, ManualResults } from "@/components/app/social/ComposerExtras";
import { ComposerDatePicker, scheduleLabel } from "@/components/app/social/ComposerDatePicker";
import { BestHours, CollaboratorsField, ConfirmPublish, CoverPicker, PeopleMenu, StoryRepeatField, TikTokFitHint, TikTokSettings, videoDuration } from "@/components/app/social/ComposerPanels";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { MediaPickerModal } from "@/components/app/media/MediaPickerModal";
import { useModalPresence } from "@/lib/use-modal-presence";
import { useLayer } from "@/lib/use-layer";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { PhonePreview, type PhoneMedia } from "@/components/previews/phone/PhonePreview";
import { GLYPHS } from "@/components/previews/NetworkMarks";
import { formatBytes, mediaFileUrl, MAX_MEDIA_PER_POST, mediaKindFor, type MediaRecord } from "@/lib/media";
import { hevcWarning, uploadMedia, type UploadHandle } from "@/lib/media-client";
import { captionLevel, NETWORKS, networkFormatLabel, networkIssues, networkSpec } from "@/lib/network-catalog";
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
  postColorText,
  recoveryKey,
  saveRecovery,
  type PostDraft,
} from "@/lib/post-draft";
import { DEFAULT_WORKFLOW } from "@/lib/calendar-views";
import { moveInList } from "@/lib/use-kanban-drag";
import { safeLinkHref } from "@/lib/supabase/config";
import type { CustomFieldDefinition, PlatformSettings, PostFormat, PostMedia, PostStatus, SocialNetwork, WorkflowStatus } from "@/lib/types";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyArrowRightIcon as ArrowRight,
  HublyBellIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyCheckIcon,
  HublyChatIcon,
  HublyClipboardIcon,
  HublyClockIcon,
  HublyCloseIcon as X,
  HublyCopyIcon as Copy,
  HublyDocumentIcon,
  HublyDownloadIcon,
  HublyEyeIcon as Eye,
  HublyImageIcon,
  HublyLibraryIcon,
  HublyMemoIcon,
  HublyMusicIcon,
  HublyPencilIcon as Pencil,
  HublyPeopleIcon,
  HublyPersonIcon,
  HublyPlusIcon as Plus,
  HublyPulseIcon,
  HublySaveIcon,
  HublySendIcon,
  HublyTrashIcon as Trash2,
  HublyUploadIcon,
} from "@/components/app/icons/DuotoneIcons";

interface PostComposerModalProps {
  open?: boolean;
  onClose?: () => void;
  initialPostId?: string | null;
  defaultBrandId?: string;
}

type ComposerTab = "contenido" | "resultados" | "notas" | "todos" | "documentos" | "chat" | "actividad";

const TABS: { id: ComposerTab; label: string; Icon: typeof HublyImageIcon }[] = [
  { id: "contenido", label: "Contenido", Icon: HublyImageIcon },
  { id: "resultados", label: "Resultados", Icon: HublyChartIcon },
  { id: "notas", label: "Notas", Icon: HublyMemoIcon },
  { id: "todos", label: "To-Dos", Icon: HublyClipboardIcon },
  { id: "documentos", label: "Documentos", Icon: HublyDocumentIcon },
  { id: "chat", label: "Chat", Icon: HublyChatIcon },
  { id: "actividad", label: "Actividad", Icon: HublyPulseIcon },
];

export { GLYPHS };

const FORMAT_LABEL: Record<PostFormat, string> = { Imagen: "Imagen", Carrusel: "Carrusel", "Reel / Video": "Video", Story: "Story", Texto: "Solo texto" };
type PublishMode = "guardar" | "programar" | "publicar";
const PUBLISH_MODES: { id: PublishMode; label: string; Icon: typeof HublyImageIcon }[] = [
  { id: "guardar", label: "Solo guardar", Icon: HublySaveIcon },
  { id: "programar", label: "Programar", Icon: HublyClockIcon },
  { id: "publicar", label: "Publicar ya", Icon: HublySendIcon },
];
/** Las redes con marca negra se confundirían con el fondo en modo oscuro. */
const networkInk = (color: string) => (color === "#000000" ? "var(--ui-text)" : color);
const POST_COLORS = ["#16324F", "#2A76B0", "#0F766E", "#15803D", "#B45309", "#B91C1C", "#7C3AED", "#BE185D"];
const POST_PALETTE = [
  { name: "Rosa", color: "#E98B8B" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Durazno", color: "#F4B26A" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Verde", color: "#7FD38C" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Azul", color: "#8FA8E0" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Lila", color: "#C9A0DC" }, // ui-ok: dato guardado en el post, igual en ambos temas
  { name: "Aqua", color: "#6CC5BF" }, // ui-ok: dato guardado en el post, igual en ambos temas
];
const FIELD_TYPES: { id: CustomFieldDefinition["type"]; label: string }[] = [
  { id: "text", label: "Texto" },
  { id: "number", label: "Número" },
  { id: "date", label: "Fecha" },
  { id: "url", label: "Enlace" },
  { id: "checkbox", label: "Casilla" },
  { id: "select", label: "Opciones" },
];
const STATUS_TEXT: Record<PostStatus, string> = {
  draft: "Borrador",
  pending: "En aprobación",
  changes: "Requiere cambios",
  approved: "Aprobado",
  scheduled: "Programado",
  published: "Publicado",
};

interface UploadSlot {
  id: string;
  file: File;
  percent: number;
  error?: string;
  warning?: string;
  handle?: UploadHandle;
}

type Popover = "assignee" | "notify" | "color" | "workflow" | "field" | "date" | null;

export function PostComposerModal({ open: openProp, onClose: onCloseProp, initialPostId, defaultBrandId }: PostComposerModalProps = {}) {
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

  if (!presence.mounted || !draft || !brand) return null;

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
    const option = { id: `op-${Date.now()}`, label: label.trim(), color: POST_COLORS[(field.options?.length ?? 0) % POST_COLORS.length] }; // eslint-disable-line react-hooks/purity -- corre en un manejador, no al renderizar
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
          <header className="hubly-composer-head">
            <div style={{ minWidth: 0, flex: 1 }}>
              <input
                className="hubly-composer-title"
                value={draft.title}
                disabled={locked}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Sin título"
                aria-label="Título del post"
                style={draft.color ? { color: postColorText(draft.color) } : undefined}
              />
              <div className="hubly-composer-badges">
                <span title="Marca del post">{brand.name}</span>
                <span>{STATUS_TEXT[draft.status]}</span>
                {workflowStatus && <em style={{ color: workflowStatus.color }}>{workflowStatus.name}</em>}
                <span className="hubly-composer-dots" aria-label={`Redes: ${draft.networks.join(", ")}`}>
                  {draft.networks.map((n) => <i key={n} style={{ background: networkInk(networkSpec(n).color) }} />)}
                </span>
              </div>
            </div>
            {editingPost && !readOnly && (
              <button type="button" className="hubly-cal-icon" aria-label="Duplicar post" title="Duplicar post" onClick={() => { const copyId = duplicatePost(editingPost.id); if (copyId) { setComposerDirty(false); openComposer(copyId); } }}>
                <Copy size={17} />
              </button>
            )}
            {!readOnly && (editingPost || dirty) && (
              <button type="button" className="hubly-cal-icon is-danger" aria-label="Eliminar post" title="Eliminar post" onClick={() => void remove()}>
                <Trash2 size={17} />
              </button>
            )}
            <button type="button" className="hubly-cal-icon" aria-label="Cerrar" title="Cerrar; tus cambios quedan guardados en este navegador" onClick={() => void requestClose()}>
              <X size={18} />
            </button>
          </header>
          {draft.color && <div className="hubly-composer-colorbar" style={{ background: draft.color }} aria-hidden />}

          {recoveredAt && (
            <div className="hubly-composer-recovered" role="status">
              <span>Recuperamos cambios sin guardar de {new Date(recoveredAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}. Solo existen en este navegador hasta que guardes.</span>
              <button type="button" onClick={discardRecovery}>Descartarlos</button>
            </div>
          )}
          {readOnly && <div className="hubly-composer-recovered" role="status"><span>Tienes acceso de solo lectura a este post.</span></div>}
          {published && !readOnly && <div className="hubly-composer-recovered" role="status"><span>Este post ya se publicó: su contenido es de solo lectura. Puedes duplicarlo para reutilizarlo.</span></div>}

          <div className="hubly-composer-meta">
            <div className="hubly-composer-pop">
              <button type="button" aria-expanded={popover === "assignee"} disabled={locked} onClick={() => setPopover(popover === "assignee" ? null : "assignee")}>
                <HublyPersonIcon size={17} />
                <span>{selectedAssignees.length ? selectedAssignees.map((m) => m.name.split(" ")[0]).join(", ") : draft.assignee || "Sin asignar"}</span>
              </button>
              {popover === "assignee" && (
                <PeopleMenu
                  label="Responsables"
                  team={team}
                  selected={draft.assigneeIds}
                  photoFor={photoFor}
                  onToggle={(id) => {
                    const next = draft.assigneeIds.includes(id) ? draft.assigneeIds.filter((x) => x !== id) : [...draft.assigneeIds, id];
                    update({ assigneeIds: next, assignee: team.find((m) => m.id === next[0])?.name ?? "" });
                  }}
                />
              )}
            </div>
            <div className="hubly-composer-pop">
              <button type="button" className={draft.notifyOnPublish ? "is-on" : undefined} title="Se guarda en el post como referencia; aún no envía avisos automáticos" aria-expanded={popover === "notify"} disabled={locked} onClick={() => setPopover(popover === "notify" ? null : "notify")}>
                <HublyBellIcon size={17} />
                <span>{notifyMembers.length ? `Avisar a ${notifyMembers.map((m) => m.name.split(" ")[0]).join(", ")}` : "Avisar al publicar"}</span>
              </button>
              {popover === "notify" && (
                <PeopleMenu
                  label="Avisar al publicar"
                  note="Se guarda en el post como referencia; aún no envía avisos automáticos."
                  team={team}
                  selected={draft.notifyMemberIds}
                  photoFor={photoFor}
                  onToggle={(id) => {
                    const next = draft.notifyMemberIds.includes(id) ? draft.notifyMemberIds.filter((x) => x !== id) : [...draft.notifyMemberIds, id];
                    update({ notifyMemberIds: next, notifyOnPublish: next.length > 0 });
                  }}
                  clearLabel="Quitar aviso"
                  onClear={() => {
                    update({ notifyMemberIds: [], notifyOnPublish: false });
                    setPopover(null);
                  }}
                />
              )}
            </div>
            <div className="hubly-composer-pop">
              <button type="button" aria-label="Color del post" aria-expanded={popover === "color"} disabled={locked} onClick={() => setPopover(popover === "color" ? null : "color")}>
                {draft.color ? <i style={{ background: draft.color }} /> : <i className="is-none" />}
                <span>{selectedPalette ? selectedPalette.name : "Color"}</span>
              </button>
              {popover === "color" && (
                <div className="hubly-composer-menu is-colors" role="group" aria-label="Color del post">
                  <button type="button" aria-pressed={!draft.color} onClick={() => { update({ color: "" }); setPopover(null); }}>
                    <i className="is-none" /> Sin color
                    {!draft.color && <HublyCheckIcon size={14} />}
                  </button>
                  {POST_PALETTE.map(({ name, color }) => (
                    <button key={color} type="button" aria-pressed={draft.color === color} onClick={() => { update({ color }); setPopover(null); }}>
                      <i style={{ background: color }} /> {name}
                      {draft.color === color && <HublyCheckIcon size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hubly-composer-pop">
              <button type="button" aria-expanded={popover === "workflow"} disabled={locked} onClick={() => setPopover(popover === "workflow" ? null : "workflow")}>
                <i style={{ background: workflowStatus?.color ?? "var(--ui-border-strong)" }} />
                <span>{workflowStatus?.name ?? "Sin estatus"}</span>
              </button>
              {popover === "workflow" && (
                <div className="hubly-composer-menu" role="group" aria-label="Estatus editorial">
                  <button type="button" onClick={() => { update({ workflowStatusId: null }); setPopover(null); }}>Sin estatus</button>
                  {workflow.map((w) => (
                    <div key={w.id} className="hubly-composer-menurow">
                      <button type="button" aria-pressed={draft.workflowStatusId === w.id} onClick={() => { update({ workflowStatusId: w.id }); setPopover(null); }}>
                        <i style={{ background: w.color }} /> {w.name}
                      </button>
                      <button type="button" aria-label={`Eliminar el estatus ${w.name}`} title="Eliminar" onClick={() => void removeWorkflowStatus(w)}><X size={12} /></button>
                    </div>
                  ))}
                  {newStatus ? (
                    <form className="hubly-composer-newstatus" onSubmit={(e) => { e.preventDefault(); addWorkflowStatus(); }}>
                      <input className="hubly-cal-input" autoFocus value={newStatus.name} onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })} placeholder="Nombre del estatus" aria-label="Nombre del estatus" />
                      <div role="group" aria-label="Color del estatus">
                        {POST_PALETTE.map(({ name, color }) => (
                          <button key={color} type="button" title={name} aria-label={name} aria-pressed={newStatus.color === color} style={{ background: color }} onClick={() => setNewStatus({ ...newStatus, color })} />
                        ))}
                      </div>
                      <button type="submit" className="is-create" disabled={!newStatus.name.trim()}>Crear</button>
                    </form>
                  ) : (
                    <button type="button" className="is-create" onClick={() => setNewStatus({ name: "", color: POST_PALETTE[0].color })}><Plus size={13} /> Agregar estatus</button>
                  )}
                </div>
              )}
            </div>
            {fields.map((field) => {
              const value = draft.customFields[field.id];
              const set = (next: string | number | boolean | null) => update({ customFields: { ...draft.customFields, [field.id]: next } });
              return (
                <label key={field.id} className="hubly-composer-field">
                  <small>{field.name}</small>
                  {!locked && <button type="button" className="hubly-composer-fielddel" aria-label={`Eliminar el campo ${field.name}`} title="Eliminar campo" onClick={(e) => { e.preventDefault(); void removeField(field); }}><X size={11} /></button>}
                  {field.type === "checkbox" ? (
                    <input type="checkbox" disabled={locked} checked={value === true} onChange={(e) => set(e.target.checked)} />
                  ) : field.type === "select" ? (
                    <select
                      disabled={locked}
                      value={String(value ?? "")}
                      onChange={(e) => {
                        if (e.target.value === "__nueva") void addFieldOption(field);
                        else set(e.target.value || null);
                      }}
                    >
                      <option value="">Vacío</option>
                      {field.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      <option value="__nueva">+ Nueva opción</option>
                    </select>
                  ) : (
                    <input
                      disabled={locked}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
                      value={String(value ?? "")}
                      onChange={(e) => set(field.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
                    />
                  )}
                </label>
              );
            })}
            <div className="hubly-composer-pop">
              <button type="button" aria-label="Agregar campo" title="Agregar campo" aria-expanded={popover === "field"} disabled={locked} onClick={() => setPopover(popover === "field" ? null : "field")}>
                <Plus size={14} />
              </button>
              {popover === "field" && (
                <form className="hubly-composer-menu" onSubmit={(e) => { e.preventDefault(); addField(); }}>
                  <input className="hubly-cal-input" autoFocus value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Nombre del campo" aria-label="Nombre del campo" />
                  <select className="hubly-cal-input" value={fieldType} aria-label="Tipo de campo" onChange={(e) => setFieldType(e.target.value as CustomFieldDefinition["type"])}>
                    {FIELD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <button type="submit" className="is-create">Agregar campo</button>
                </form>
              )}
            </div>
          </div>

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
                        <button type="button" className="hbtn hbtn-secondary hbtn-sm" onClick={downloadAll}>
                          <HublyDownloadIcon size={15} /> {media.length === 1 ? "Descargar archivo" : `Descargar ${media.length} archivos`}
                        </button>
                        <button type="button" className="hbtn hbtn-secondary hbtn-sm" disabled title="Función prevista: aún no hay biblioteca de música">
                          <HublyMusicIcon size={15} /> Agregar música
                        </button>
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
                        {draft.coverAssetId && !locked && <button type="button" className="hbtn hbtn-ghost hbtn-sm" onClick={() => update({ coverAssetId: undefined })}>Quitar</button>}
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
                        <button type="submit" className="hbtn hbtn-secondary hbtn-sm">Agregar enlace</button>
                      </form>
                      <button type="button" className="hbtn hbtn-secondary hbtn-sm" style={{ justifySelf: "start" }} onClick={() => setPickerFor("documents")}>
                        Adjuntar del Content Manager
                      </button>
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
                      <button type="submit" className="hbtn hbtn-secondary hbtn-sm">Enviar</button>
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

            <aside className="hubly-composer-preview" aria-label="Vista previa">
              <div className="hubly-composer-netpills">
                {draft.networks.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={n === previewNetwork}
                    onClick={() => setPreviewNet(n)}
                    style={{ "--net": networkInk(networkSpec(n).color), "--net-on": networkSpec(n).color === "#000000" ? "var(--ui-surface)" : "var(--on-accent)" } as React.CSSProperties}
                  >
                    <i />
                    {n}
                  </button>
                ))}
              </div>
              <PhonePreview
                key={`${previewNetwork}-${previewFormat}-${activeMediaIndex}`}
                post={{
                  network: previewNetwork,
                  format: previewFormat,
                  brandName: brand.name,
                  handle: (brand.handle || "tu_marca").replace("@", ""),
                  initials: brand.initials || brand.name.slice(0, 2).toUpperCase(),
                  color: brand.color || "#16324F",
                  caption: captionFor(draft, previewNetwork),
                  media: previewMedia,
                  cover: draft.cover,
                  settings: draft.platformSettings[previewNetwork],
                  activeIndex: activeMediaIndex,
                }}
              />
              <small>{previewNetwork} · {networkFormatLabel(previewNetwork, previewFormat)}</small>
            </aside>
          </div>

          <footer className="hubly-composer-foot">
            {errorMsg ? (
              <span role="alert">{errorMsg}</span>
            ) : (
              <small>{editingPost?.activity?.length ? `Creado ${new Date(editingPost.activity[editingPost.activity.length - 1].at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}` : dirty ? "Cambios guardados en este navegador" : ""}</small>
            )}
            <button type="button" className="hbtn hbtn-ghost" onClick={() => void requestClose()}>{locked ? "Cerrar" : "Cancelar"}</button>
            {!locked && publishMode === "guardar" && (
              <>
                <button type="button" className="hbtn hbtn-secondary" onClick={() => save("pending")}>Enviar a revisión</button>
                <button type="button" className="hbtn hbtn-primary" onClick={() => save(editingPost ? draft.status : "draft")}>
                  {editingPost ? "Guardar" : "Guardar borrador"}
                </button>
              </>
            )}
            {!locked && publishMode !== "guardar" && (
              <>
                <button type="button" className="hbtn hbtn-secondary" title="Guarda el post sin programarlo" onClick={() => save(editingPost ? draft.status : "draft")}>
                  <HublySaveIcon size={15} /> Guardar
                </button>
                {publishMode === "programar" ? (
                  <button
                    type="button"
                    className="hbtn hbtn-primary"
                    disabled={!draft.scheduledDate || pastSchedule || noNetworks}
                    title={pastSchedule ? "Esa hora ya pasó: elige una fecha futura para programar" : noNetworks ? "Selecciona al menos una red" : undefined}
                    onClick={() => void askToPublish("programar")}
                  >
                    {scheduleButton}
                  </button>
                ) : (
                  <button type="button" className="hbtn hbtn-primary" disabled={noNetworks} onClick={() => void askToPublish("publicar")}>Marcar como publicado</button>
                )}
              </>
            )}
          </footer>
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
                <button type="button" autoFocus className="hbtn hbtn-ghost" onClick={() => resolveComposerPending("keep")}>Seguir editando</button>
                <button
                  type="button"
                  className="hbtn hbtn-secondary"
                  onClick={() => {
                    if (key) clearRecovery(localStorage, key);
                    uploads.forEach((u) => u.handle?.cancel());
                    resolveComposerPending("open");
                  }}
                >
                  Descartar
                </button>
                <button
                  type="button"
                  className="hbtn hbtn-primary"
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
                </button>
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

function NetworkSettings({
  network,
  settings,
  formats,
  generalFormat,
  isVideo,
  disabled,
  onChange,
}: {
  network: SocialNetwork;
  settings: PlatformSettings;
  formats: PostFormat[];
  generalFormat: PostFormat;
  isVideo: boolean;
  disabled: boolean;
  onChange: (patch: Partial<PlatformSettings>) => void;
}) {
  const text = (key: keyof PlatformSettings, label: string, placeholder: string, maxLength?: number) => (
    <label key={key}>
      {label}
      <input className="hubly-cal-input" disabled={disabled} value={String(settings[key] ?? "")} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange({ [key]: e.target.value || undefined })} />
    </label>
  );
  return (
    <div className="hubly-composer-netsettings">
      <strong className="hubly-composer-nethead">Ajustes de {network}</strong>
      <label>
        Formato en {network}
        <select className="hubly-cal-input" disabled={disabled} value={settings.format ?? ""} onChange={(e) => onChange({ format: (e.target.value || undefined) as PostFormat | undefined })}>
          <option value="">Igual que General ({generalFormat})</option>
          {formats.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      {network === "Instagram" && [text("firstComment", "Primer comentario", "Opcional", 2200), text("location", "Ubicación", "Opcional")]}
      {network === "YouTube" && text("title", "Título del video", "Hasta 100 caracteres", 100)}
      {network === "Pinterest" && [text("title", `Título del Pin · ${(settings.title ?? "").length}/100`, "Cuéntales de qué se trata tu Pin", 100), text("boardName", "Tablero", "Nombre del tablero"), text("link", "Enlace", "https://…")]}
      {network === "Pinterest" && settings.link && !/^https:\/\//i.test(settings.link) && <small className="hubly-composer-fielderror">Pinterest pide un enlace que empiece con https://</small>}
      {network === "TikTok" && <div className="hubly-composer-fullrow"><TikTokSettings settings={settings} isVideo={isVideo} disabled={disabled} onChange={onChange} /></div>}
      {network === "Reddit" && [text("subreddit", "Comunidad", "r/marketing"), text("title", "Título del hilo", "Hasta 300 caracteres", 300), text("flair", "Etiqueta", "Opcional")]}
      {network === "Google Business" && (
        <>
          <label>
            Tipo de publicación
            <select className="hubly-cal-input" disabled={disabled} value={settings.topicType ?? "STANDARD"} onChange={(e) => onChange({ topicType: e.target.value as PlatformSettings["topicType"] })}>
              <option value="STANDARD">Novedad</option>
              <option value="EVENT">Evento</option>
              <option value="OFFER">Oferta</option>
            </select>
          </label>
          {settings.topicType && settings.topicType !== "STANDARD" && text("title", "Título", "Título del evento u oferta")}
          {settings.topicType === "OFFER" && text("couponCode", "Código de cupón", "Opcional")}
          <label>
            Botón
            <select className="hubly-cal-input" disabled={disabled} value={settings.callToAction ?? "Más información"} onChange={(e) => onChange({ callToAction: e.target.value })}>
              {["Más información", "Reservar", "Pedir", "Comprar", "Registrarse", "Llamar"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </>
      )}
      <small className="hubly-composer-hint">Estos ajustes se guardan para tu referencia al publicar.</small>
    </div>
  );
}

