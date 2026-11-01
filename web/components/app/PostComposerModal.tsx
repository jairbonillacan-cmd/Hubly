"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { currentAgencyId } from "@/lib/live-workspace";
import { askConfirm, askText } from "@/components/app/AppDialogHost";
import { CaptionAssistant, ManualResults } from "@/components/app/social/ComposerExtras";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { MediaPickerModal } from "@/components/app/media/MediaPickerModal";
import { useModalPresence } from "@/lib/use-modal-presence";
import { useLayer } from "@/lib/use-layer";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { PhonePreview, type PhoneMedia } from "@/components/previews/phone/PhonePreview";
import { FacebookIcon, LinkedInIcon, TikTokIcon } from "@/components/previews/SocialIcons";
import { formatBytes, mediaFileUrl, MAX_MEDIA_PER_POST, mediaKindFor, type MediaRecord } from "@/lib/media";
import { hevcWarning, uploadMedia, type UploadHandle } from "@/lib/media-client";
import { captionLevel, countHashtags, NETWORKS, networkIssues, networkSpec } from "@/lib/network-catalog";
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
import type { CustomFieldDefinition, PlatformSettings, PostFormat, PostMedia, PostStatus, SocialNetwork, WorkflowStatus } from "@/lib/types";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyArrowRightIcon as ArrowRight,
  HublyBellIcon,
  HublyChartIcon,
  HublyChatIcon,
  HublyClipboardIcon,
  HublyCloseIcon as X,
  HublyCloudIcon,
  HublyCopyIcon as Copy,
  HublyDocumentIcon,
  HublyEyeIcon as Eye,
  HublyImageIcon,
  HublyLibraryIcon,
  HublyMemoIcon,
  HublyPaletteIcon,
  HublyPencilIcon as Pencil,
  HublyPersonIcon,
  HublyPlusIcon as Plus,
  HublyPulseIcon,
  HublyTrashIcon as Trash2,
  HublyUploadIcon,
} from "@/components/app/icons/DuotoneIcons";

export interface PostComposerModalProps {
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

function BrandMark({ d }: { d: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const GLYPHS: Record<SocialNetwork, React.ReactNode> = {
  Instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: <FacebookIcon size={17} />,
  TikTok: <TikTokIcon size={17} />,
  LinkedIn: <LinkedInIcon size={17} />,
  YouTube: <BrandMark d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM9.8 15.5v-7l6 3.5-6 3.5Z" />,
  X: <BrandMark d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  Threads: <BrandMark d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />,
  Pinterest: <BrandMark d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />,
  Reddit: <BrandMark d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm6.67 13.4c.03.2.05.41.05.62 0 3.15-3.67 5.7-8.2 5.7s-8.2-2.55-8.2-5.7c0-.21.02-.42.05-.62a1.75 1.75 0 1 1 1.93-2.86 10 10 0 0 1 5.4-1.71l1-4.74a.4.4 0 0 1 .48-.31l3.3.7a1.25 1.25 0 1 1-.14.66l-2.95-.63-.9 4.31a9.9 9.9 0 0 1 5.3 1.71 1.75 1.75 0 1 1 1.88 2.87ZM8.5 13.25a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Zm7 3.3a.33.33 0 0 0-.47-.46c-.72.72-2.32.78-3.03.78s-2.31-.06-3.03-.78a.33.33 0 1 0-.47.47c.92.91 2.66.98 3.5.98s2.58-.07 3.5-.99Zm-.25-2.05a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />,
  "Google Business": <BrandMark d="M22 8.5 20.4 3H3.6L2 8.5a3.2 3.2 0 0 0 1 2.3V21h18V10.8a3.2 3.2 0 0 0 1-2.3ZM12 19H5v-7.2c.9 0 1.8-.4 2.5-1.1a3.4 3.4 0 0 0 4.5 0 3.4 3.4 0 0 0 4.5 0c.7.7 1.6 1.1 2.5 1.1V14h-5v5h-2Zm7 0h-3v-3h3v3Z" />,
};

const POST_FORMATS: PostFormat[] = ["Imagen", "Carrusel", "Reel / Video", "Story", "Texto"];
const POST_COLORS = ["#16324F", "#2A76B0", "#0F766E", "#15803D", "#B45309", "#B91C1C", "#7C3AED", "#BE185D"];
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

type Popover = "assignee" | "color" | "workflow" | "field" | null;

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

  // Otros modales manejan su propio Escape; el editor solo responde cuando es lo de arriba.
  useLayer(
    isOpen,
    () => {
      if (composerPending) resolveComposerPending("keep");
      else if (popover) setPopover(null);
      else handleClose();
    },
    { deferTo: '.hubly-overlay:not(.hubly-composer-overlay), [role="dialog"][aria-modal="true"]' }
  );

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
    () => media.map((m) => ({ id: m.id, kind: m.kind, name: m.name, url: mediaItemUrl(m) })),
    [media]
  );

  if (!presence.mounted || !draft || !brand) return null;

  const published = draft.status === "published";
  const locked = readOnly || published;
  const previewNetwork = previewNet && draft.networks.includes(previewNet) ? previewNet : draft.networks[0];
  const workflowStatus = workflow.find((w) => w.id === draft.workflowStatusId);
  const issues = networkIssues({ networks: draft.networks, caption: draft.caption, media, platformSettings: draft.platformSettings });
  const authorName = profile?.name || "Equipo";
  const copyTarget = copyNetwork !== "General" && draft.networks.includes(copyNetwork) ? copyNetwork : "General";
  const inherits = copyTarget !== "General" && draft.platformSettings[copyTarget]?.caption === undefined;
  const copyValue = copyTarget === "General" ? draft.caption : captionFor(draft, copyTarget);
  const limit = copyTarget === "General"
    ? Math.min(...draft.networks.map((n) => networkSpec(n).maxChars))
    : networkSpec(copyTarget).maxChars;
  const level = captionLevel(copyValue.length, limit);
  const selectedAssignees = team.filter((m) => draft.assigneeIds.includes(m.id));

  const toggleNetwork = (network: SocialNetwork) => {
    if (locked) return;
    // Al activar una red, la vista previa pasa a ella para ver cómo queda.
    if (!draft.networks.includes(network)) setPreviewNet(network);
    update({
      networks: draft.networks.includes(network)
        ? draft.networks.length > 1
          ? draft.networks.filter((n) => n !== network)
          : draft.networks
        : [...draft.networks, network],
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
      setErrorMsg("Selecciona una fecha para planificar.");
      return;
    }
    if (finalStatus !== "draft") {
      if (!draft.caption.trim() && !Object.values(draft.platformSettings).some((s) => s?.caption?.trim())) {
        setErrorMsg(finalStatus === "scheduled" ? "Escribe el copy antes de planificar." : "Escribe el copy antes de enviar a revisión.");
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
    savePost({ ...draftToPost({ ...draft, status: finalStatus }, editingPost, authorName) });
    handleClose();
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

  const addWorkflowStatus = async () => {
    const name = await askText("Nombre del nuevo estatus", "", "Crear");
    if (!name?.trim()) return;
    const created: WorkflowStatus = { id: `wf-${Date.now()}`, name: name.trim(), color: POST_COLORS[workflow.length % POST_COLORS.length] };
    updateBrand(brand.id, { workflowStatuses: [...workflow, created] });
    update({ workflowStatusId: created.id });
    setPopover(null);
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

  return (
    <>
      <div className="hubly-composer-scrim" data-state={presence.state} onMouseDown={handleClose} aria-hidden />
      <div className="hubly-overlay hubly-composer-overlay" data-state={presence.state}>
        <div ref={sheetRef} className="hubly-sheet hubly-composer" data-state={presence.state} role="dialog" aria-modal="false" aria-label="Editor de post">
          <header className="hubly-composer-head">
            <div style={{ minWidth: 0, flex: 1 }}>
              <input
                className="hubly-composer-title"
                value={draft.title}
                disabled={locked}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Sin título"
                aria-label="Título del post"
                style={draft.color ? { color: draft.color } : undefined}
              />
              <div className="hubly-composer-badges">
                <span title="Marca del post">{brand.name}</span>
                <span>{STATUS_TEXT[draft.status]}</span>
                {workflowStatus && <em style={{ color: workflowStatus.color }}>{workflowStatus.name}</em>}
                <span className="hubly-composer-dots" aria-label={`Redes: ${draft.networks.join(", ")}`}>
                  {draft.networks.map((n) => <i key={n} style={{ background: networkSpec(n).color }} />)}
                </span>
              </div>
            </div>
            {editingPost && !readOnly && (
              <button type="button" className="hubly-cal-icon" aria-label="Duplicar post" title="Duplicar post" onClick={() => { const copyId = duplicatePost(editingPost.id); if (copyId) handleClose(); }}>
                <Copy size={17} />
              </button>
            )}
            {!readOnly && (
              <button type="button" className="hubly-cal-icon is-danger" aria-label="Eliminar post" title="Eliminar post" onClick={() => void remove()}>
                <Trash2 size={17} />
              </button>
            )}
            <button type="button" className="hubly-cal-icon" aria-label="Cerrar" title="Cerrar; tus cambios quedan guardados en este navegador" onClick={handleClose}>
              <X size={18} />
            </button>
          </header>

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
                <div className="hubly-composer-menu" role="group" aria-label="Responsables">
                  {team.length === 0 && <small>Aún no hay miembros en el equipo.</small>}
                  {team.map((member) => (
                    <label key={member.id}>
                      <input
                        type="checkbox"
                        checked={draft.assigneeIds.includes(member.id)}
                        onChange={() => {
                          const next = draft.assigneeIds.includes(member.id) ? draft.assigneeIds.filter((id) => id !== member.id) : [...draft.assigneeIds, member.id];
                          update({ assigneeIds: next, assignee: team.find((m) => m.id === next[0])?.name ?? "" });
                        }}
                      />
                      {member.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button type="button" aria-pressed={draft.notifyOnPublish} disabled={locked} onClick={() => update({ notifyOnPublish: !draft.notifyOnPublish })}>
              <HublyBellIcon size={17} />
              <span>Avisar al publicar</span>
            </button>
            <div className="hubly-composer-pop">
              <button type="button" aria-expanded={popover === "color"} disabled={locked} onClick={() => setPopover(popover === "color" ? null : "color")}>
                {draft.color ? <i style={{ background: draft.color }} /> : <HublyPaletteIcon size={17} />}
                <span>Color</span>
              </button>
              {popover === "color" && (
                <div className="hubly-composer-menu is-swatches" role="group" aria-label="Color del post">
                  {POST_COLORS.map((color) => (
                    <button key={color} type="button" aria-label={`Color ${color}`} aria-pressed={draft.color === color} style={{ background: color }} onClick={() => { update({ color }); setPopover(null); }} />
                  ))}
                  <button type="button" className="is-clear" onClick={() => { update({ color: "" }); setPopover(null); }}>Quitar</button>
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
                    <button key={w.id} type="button" aria-pressed={draft.workflowStatusId === w.id} onClick={() => { update({ workflowStatusId: w.id }); setPopover(null); }}>
                      <i style={{ background: w.color }} /> {w.name}
                    </button>
                  ))}
                  <button type="button" className="is-create" onClick={() => void addWorkflowStatus()}><Plus size={13} /> Crear estatus</button>
                </div>
              )}
            </div>
            {fields.map((field) => {
              const value = draft.customFields[field.id];
              const set = (next: string | number | boolean | null) => update({ customFields: { ...draft.customFields, [field.id]: next } });
              return (
                <label key={field.id} className="hubly-composer-field">
                  <small>{field.name}</small>
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
              {TABS.map(({ id, label, Icon }) => (
                <button key={id} type="button" aria-current={tab === id ? "true" : undefined} onClick={() => { setTab(id); setMobilePane("editar"); }}>
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
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
                        style={draft.networks.includes(id) ? { borderColor: color, color, boxShadow: `0 0 0 1px ${color}` } : undefined}
                        onClick={() => toggleNetwork(id)}
                      >
                        {GLYPHS[id]}
                      </button>
                    ))}
                  </div>

                  <div className="hubly-composer-sources">
                    <button
                      type="button"
                      disabled={locked || media.length + uploads.length >= MAX_MEDIA_PER_POST}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        addFiles(e.dataTransfer.files);
                      }}
                    >
                      <HublyUploadIcon size={18} />
                      <strong><b>Agregar</b> · máx {MAX_MEDIA_PER_POST}</strong>
                    </button>
                    <button type="button" disabled={locked} onClick={() => setPickerFor("media")}>
                      <HublyLibraryIcon size={18} />
                      <strong>Elegir del <b>Content Manager</b></strong>
                    </button>
                    <button type="button" disabled title="Disponible cuando se conecte Canva en una entrega posterior">
                      <HublyPaletteIcon size={18} />
                      <strong>Traer de <b>Canva</b> <small>próximamente</small></strong>
                    </button>
                    <button type="button" disabled title="Disponible cuando se conecte Drive en una entrega posterior">
                      <HublyCloudIcon size={18} />
                      <strong>Traer de <b>Drive</b> <small>próximamente</small></strong>
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
                    <ol className="hubly-composer-media" aria-label="Archivos del post, en orden de publicación">
                      {media.map((item, index) => (
                        <li
                          key={item.id}
                          draggable={!locked}
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
                          {item.kind === "video" ? (
                            <video src={`${mediaItemUrl(item)}#t=0.1`} preload="metadata" muted playsInline aria-label={item.name} />
                          ) : (
                            // Archivo privado: next/image no puede optimizar su URL firmada.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaItemUrl(item)} alt={item.name} draggable={false} />
                          )}
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
                  )}

                  <div className="hubly-composer-formats">
                    <div className="hubly-composer-formatrow" role="group" aria-label="Formato del post">
                      <span aria-hidden>Formato</span>
                      {POST_FORMATS.map((f) => (
                        <button key={f} type="button" className="hubly-cal-pill" aria-pressed={draft.format === f} disabled={locked} onClick={() => update({ format: f })}>{f}</button>
                      ))}
                    </div>
                    {draft.networks.length > 1 && (
                      <p className="hubly-composer-hint">{draft.networks.map((n) => `${n}: ${formatFor(draft, n)}`).join(" · ")}</p>
                    )}
                  </div>

                  <div className="hubly-composer-copytabs" role="tablist" aria-label="Copy por red">
                    <button type="button" role="tab" aria-selected={copyTarget === "General"} onClick={() => setCopyNetwork("General")}>General</button>
                    {draft.networks.map((n) => (
                      <button key={n} type="button" role="tab" aria-selected={copyTarget === n} onClick={() => { setCopyNetwork(n); setPreviewNet(n); }}>
                        {n}{draft.platformSettings[n]?.caption !== undefined ? " •" : ""}
                      </button>
                    ))}
                  </div>

                  <CaptionAssistant
                    brand={brand}
                    network={copyTarget === "General" ? previewNetwork : copyTarget}
                    format={draft.format}
                    onUse={(text) => (copyTarget === "General" ? update({ caption: text }) : updateSettings(copyTarget, { caption: text }))}
                  />
                  <textarea
                    className="hubly-composer-caption"
                    value={copyValue}
                    disabled={locked}
                    onChange={(e) => (copyTarget === "General" ? update({ caption: e.target.value }) : updateSettings(copyTarget, { caption: e.target.value }))}
                    placeholder={copyTarget === "General" ? "Escribe el copy para todas las redes…" : `Escribe el copy para ${copyTarget}…`}
                    aria-label={copyTarget === "General" ? "Copy general" : `Copy de ${copyTarget}`}
                  />
                  <div className="hubly-composer-count" data-level={level}>
                    <span>{copyValue.length.toLocaleString("es-MX")} / {limit.toLocaleString("es-MX")} caracteres · {countHashtags(copyValue)} hashtags</span>
                    {copyTarget !== "General" && (
                      inherits ? (
                        <span>Hereda el copy general</span>
                      ) : (
                        <button type="button" disabled={locked} onClick={() => updateSettings(copyTarget, { caption: undefined })}>Volver a heredar</button>
                      )
                    )}
                  </div>

                  {copyTarget !== "General" && (
                    <NetworkSettings network={copyTarget} settings={draft.platformSettings[copyTarget] ?? {}} formats={networkFormats(copyTarget)} generalFormat={draft.format} disabled={locked} onChange={(patch) => updateSettings(copyTarget, patch)} />
                  )}

                  {issues.length > 0 && (
                    <ul className="hubly-composer-issues" aria-label="Pendientes para publicar">
                      {issues.map((issue) => <li key={`${issue.network}-${issue.message}`}><b>{issue.network}:</b> {issue.message}</li>)}
                    </ul>
                  )}

                  <div className="hubly-composer-schedule">
                    <label>
                      Fecha planificada
                      <input className="hubly-cal-input" type="date" value={draft.scheduledDate} disabled={locked} onChange={(e) => update({ scheduledDate: e.target.value })} />
                    </label>
                    <label>
                      Hora
                      <input className="hubly-cal-input" type="time" value={draft.scheduledTime} disabled={locked} onChange={(e) => update({ scheduledTime: e.target.value })} />
                    </label>
                  </div>
                  <small className="hubly-composer-hint">Planificar organiza tu calendario, hora de Ciudad de México. No publica en la red.</small>
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
                <NotebookEditor key={draft.postId ?? "nuevo"} initialContent={draft.notes} ariaLabel="Notas internas del post" onChange={(html) => syncExtras({ notes: html })} />
              )}

              {tab === "todos" && (
                <div className="hubly-composer-todos">
                  {draft.todos.length === 0 && <span className="hubly-composer-hint">Agrega lo que falta para terminar este post.</span>}
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
                  {draft.documents.length === 0 && <span className="hubly-composer-hint">Agrega briefs, guiones o archivos de referencia.</span>}
                  {[...new Set(draft.documents.map((d) => d.folder ?? ""))].sort().map((folder) => (
                    <section key={folder || "sin-carpeta"} aria-label={folder || "Sin carpeta"}>
                      {folder && <h4>{folder}</h4>}
                      {draft.documents.filter((d) => (d.folder ?? "") === folder).map((doc) => (
                        <div key={doc.id} className="hubly-composer-doc">
                          <HublyDocumentIcon size={20} />
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
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
                    style={n === previewNetwork ? { background: networkSpec(n).color, color: "#FFFFFF" } : undefined}
                  >
                    <i style={{ background: n === previewNetwork ? "#FFFFFF" : networkSpec(n).color }} />
                    {n}
                  </button>
                ))}
              </div>
              <PhonePreview
                key={`${previewNetwork}-${previewFormat}`}
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
                }}
              />
              <small>{previewNetwork} · {previewFormat}</small>
            </aside>
          </div>

          <footer className="hubly-composer-foot">
            {errorMsg ? (
              <span role="alert">{errorMsg}</span>
            ) : (
              <small>{editingPost?.activity?.length ? `Creado ${new Date(editingPost.activity[editingPost.activity.length - 1].at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}` : dirty ? "Cambios guardados en este navegador" : ""}</small>
            )}
            <button type="button" className="hbtn hbtn-ghost" onClick={handleClose}>{locked ? "Cerrar" : "Cancelar"}</button>
            {!locked && (
              <>
                <button type="button" className="hbtn hbtn-secondary" onClick={() => save(editingPost ? draft.status : "draft")}>
                  {editingPost ? "Guardar" : "Guardar borrador"}
                </button>
                <button type="button" className="hbtn hbtn-secondary" onClick={() => save("pending")}>Enviar a revisión</button>
                <button type="button" className="hbtn hbtn-primary" disabled={!draft.scheduledDate} onClick={() => save("scheduled")}>
                  {draft.scheduledDate ? "Planificar" : "Selecciona fecha"}
                </button>
              </>
            )}
          </footer>
        </div>

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
  disabled,
  onChange,
}: {
  network: SocialNetwork;
  settings: PlatformSettings;
  formats: PostFormat[];
  generalFormat: PostFormat;
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
      <label>
        Formato en {network}
        <select className="hubly-cal-input" disabled={disabled} value={settings.format ?? ""} onChange={(e) => onChange({ format: (e.target.value || undefined) as PostFormat | undefined })}>
          <option value="">Igual que General ({generalFormat})</option>
          {formats.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      {network === "Instagram" && [text("firstComment", "Primer comentario", "Opcional", 2200), text("location", "Ubicación", "Opcional")]}
      {network === "YouTube" && text("title", "Título del video", "Hasta 100 caracteres", 100)}
      {network === "Pinterest" && [text("boardName", "Tablero", "Nombre del tablero"), text("title", "Título del Pin", "Hasta 100 caracteres", 100), text("link", "Enlace de destino", "https://…")]}
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

export default PostComposerModal;
