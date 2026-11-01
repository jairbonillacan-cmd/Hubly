"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HublyArrowDownIcon as ArrowDown,
  HublyArrowUpIcon as ArrowUp,
  HublyBentoIcon as LayoutGrid,
  HublyCalendarIcon as CalendarDays,
  HublyChartIcon as BarChart3,
  HublyChevronLeftIcon as ChevronLeft,
  HublyChevronRightIcon as ChevronRight,
  HublyCloseIcon as X,
  HublyFilterIcon as Filter,
  HublyImageIcon,
  HublyMoreIcon as MoreHorizontal,
  HublyPlayIcon as Play,
  HublyPlusIcon as Plus,
  HublyUploadIcon as Upload,
} from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { askText } from "@/components/app/AppDialogHost";
import { Cover } from "@/components/Cover";
import { networkSpec, NETWORKS } from "@/lib/network-catalog";
import { hasRecovery, postColorText, postThumbnail } from "@/lib/post-draft";
import { useLayer } from "@/lib/use-layer";
import {
  DEFAULT_WORKFLOW,
  EMPTY_FILTERS,
  filterPosts,
  FORMAT_COLUMNS,
  inPeriod,
  monthGrid,
  periodLabel,
  PUBLICATION_COLUMNS,
  publicationLabel,
  shiftPeriod,
  sortPosts,
  todayInZone,
  weekDays,
  type CalendarFilters,
  type CalendarView,
  type KanbanGroup,
  type SortKey,
} from "@/lib/calendar-views";
import type { BrandWorkspace, PostFormat, PostStatus, SocialPost, WorkflowStatus } from "@/lib/types";
import { CreateGridModal, FeedModal, ImportMonthModal } from "./CalendarModals";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "mes", label: "Mes" },
  { id: "semana", label: "Semana" },
  { id: "tabla", label: "Tabla" },
  { id: "kanban", label: "Kanban" },
];
const STATUS_NAMES: Record<PostStatus, string> = {
  draft: "Borrador",
  pending: "En aprobación",
  changes: "Requiere cambios",
  approved: "Aprobado",
  scheduled: "Planificado",
  published: "Publicado",
};
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NO_VALUE = "__none__";

function Thumb({ post }: { post: SocialPost }) {
  const thumb = postThumbnail(post);
  if (!thumb) return <Cover kind={post.cover} />;
  if (thumb.kind === "video") {
    return (
      <>
        <video src={`${thumb.url}#t=0.1`} preload="metadata" muted playsInline />
        <i aria-hidden className="hubly-social-play"><Play size={12} /></i>
      </>
    );
  }
  // Archivo privado o heredado: next/image no aplica a sus URL.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={thumb.url} alt="" loading="lazy" draggable={false} />;
}

function Dots({ post }: { post: SocialPost }) {
  return (
    <span className="hubly-social-dots" aria-label={`Redes: ${post.networks.join(", ")}`}>
      {post.networks.map((n) => <i key={n} title={n} style={{ background: networkSpec(n).color }} />)}
    </span>
  );
}

function PublicationBadge({ post, today }: { post: SocialPost; today: string }) {
  const { label, tone } = publicationLabel(post, today);
  return <span className="hubly-social-badge" data-tone={tone} title={label}>{label}</span>;
}

export function SocialCalendar({ brand, posts, onCopyLink }: { brand: BrandWorkspace; posts: SocialPost[]; onCopyLink: () => void }) {
  const openComposer = useHublyStore((s) => s.openComposer);
  const movePost = useHublyStore((s) => s.movePost);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const updatePostFields = useHublyStore((s) => s.updatePostFields);
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);
  const team = useHublyStore((s) => s.team);
  const authorName = useHublyStore((s) => s.profile?.name) || "Equipo";
  const readOnly = useHublyStore((s) => s.role === "viewer");

  const today = useMemo(() => todayInZone(), []);
  const [view, setView] = useState<CalendarView>("mes");
  const [anchor, setAnchor] = useState(today);
  const [filters, setFilters] = useState<CalendarFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showUndated, setShowUndated] = useState(false);
  const [modal, setModal] = useState<"feed" | "grid" | "import" | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "fecha", direction: "asc" });
  const [group, setGroup] = useState<KanbanGroup>("estatus");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useLayer(filterOpen, () => setFilterOpen(false));
  useLayer(menuOpen, () => setMenuOpen(false));
  useEffect(() => {
    if (!filterOpen && !menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!toolsRef.current?.contains(e.target as Node)) {
        setFilterOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen, menuOpen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hubly:kanban-agrupar:${brand.id}`);
      // La preferencia es por marca y se lee al cambiar de marca.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroup((saved as KanbanGroup | null) ?? "estatus");
    } catch {
      // El almacenamiento del navegador puede estar lleno o bloqueado: seguir sin él no rompe nada.
    }
  }, [brand.id]);
  const chooseGroup = (next: KanbanGroup) => {
    setGroup(next);
    try {
      localStorage.setItem(`hubly:kanban-agrupar:${brand.id}`, next);
    } catch {
      // El almacenamiento del navegador puede estar lleno o bloqueado: seguir sin él no rompe nada.
    }
  };

  const workflow: WorkflowStatus[] = brand.workflowStatuses?.length ? brand.workflowStatuses : DEFAULT_WORKFLOW;
  const workflowName = (id?: string | null) => workflow.find((w) => w.id === id)?.name ?? "";
  const pillars = [...new Set([...(brand.core?.pillars ?? []), ...posts.map((p) => p.pillar || "General")])];
  const hasPillars = (brand.core?.pillars?.length ?? 0) > 0;
  const customSelects = useMemo(
    () => (brand.customFieldDefinitions ?? []).filter((f) => f.type === "select"),
    [brand.customFieldDefinitions]
  );
  const customFields = brand.customFieldDefinitions ?? [];
  const activeGroup: KanbanGroup = useMemo(() => {
    if (group === "pilar" && !hasPillars) return "estatus";
    if (group.startsWith("campo:") && !customSelects.some((f) => `campo:${f.id}` === group)) return "estatus";
    return group;
  }, [customSelects, group, hasPillars]);

  const filtered = useMemo(() => filterPosts(posts, filters), [filters, posts]);
  const inView = filtered.filter((p) => inPeriod(p.scheduledDate, anchor, view));
  const undated = filtered.filter((p) => !p.scheduledDate);
  const activeFilters = filters.statuses.length + filters.networks.length + filters.formats.length;
  const quota = brand.monthlyPostTarget || 0;
  const monthCount = filtered.filter((p) => inPeriod(p.scheduledDate, anchor, "mes")).length;

  const toggleFilter = <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K][number]) =>
    setFilters((f) => {
      const list = f[key] as CalendarFilters[K][number][];
      return { ...f, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const reschedule = (post: SocialPost, date: string) => {
    if (post.status === "published") {
      setNotice("Un post publicado conserva su fecha. Duplícalo para volver a usarlo.");
      return;
    }
    movePost(post.id, date);
  };

  const dayCellProps = (date: string) => ({
    "data-over": dropTarget === date || undefined,
    onDragOver: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      setDropTarget(date);
    },
    onDragLeave: () => setDropTarget((t) => (t === date ? null : t)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const post = posts.find((p) => p.id === dragId);
      if (post && post.scheduledDate !== date) reschedule(post, date);
      setDragId(null);
      setDropTarget(null);
    },
  });

  const cardDrag = (post: SocialPost) =>
    readOnly
      ? {}
      : {
          draggable: true,
          onDragStart: () => setDragId(post.id),
          onDragEnd: () => {
            setDragId(null);
            setDropTarget(null);
          },
        };

  const postCard = (post: SocialPost, variant: "week" | "kanban") => (
    <article key={post.id} className="hubly-social-card" data-variant={variant} data-dragging={dragId === post.id || undefined} {...cardDrag(post)}>
      <button type="button" className="hubly-social-card-open" onClick={() => openComposer(post.id)}>
        <span className="hubly-social-card-media"><Thumb post={post} /></span>
        <strong style={post.color ? { color: postColorText(post.color) } : undefined}>{post.title}</strong>
        <span className="hubly-social-card-meta">
          {post.scheduledDate ? `${post.scheduledDate.slice(8)}/${post.scheduledDate.slice(5, 7)}${post.scheduledTime ? ` · ${post.scheduledTime}` : ""}` : "Sin fecha"}
        </span>
        <span className="hubly-social-card-row">
          <Dots post={post} />
          <PublicationBadge post={post} today={today} />
        </span>
        {workflowName(post.workflowStatusId) && <span className="hubly-social-card-meta">{workflowName(post.workflowStatusId)}</span>}
        {showResults && post.status === "published" && (
          <span className="hubly-social-card-meta"><BarChart3 size={12} aria-hidden /> {post.metrics ? `${post.metrics.reach.toLocaleString("es-MX")} de alcance` : "Sin datos aún"}</span>
        )}
        {hasRecovery(post.id) && <em>Cambios sin guardar en este navegador</em>}
      </button>
    </article>
  );

  const kanbanCard = (post: SocialPost) => (
    <article key={post.id} className="hubly-social-kcard" data-dragging={dragId === post.id || undefined} {...cardDrag(post)}>
      <button type="button" className="hubly-social-kcard-open" onClick={() => openComposer(post.id)}>
        <span className="hubly-social-kcard-top">
          <span className="hubly-social-kcard-thumb">{postThumbnail(post) ? <Thumb post={post} /> : <HublyImageIcon size={18} title="Sin diseño" />}</span>
          <span>
            <strong style={post.color ? { color: postColorText(post.color) } : undefined}>{post.title && post.title !== "Sin título" ? post.title : post.caption.trim() || "Sin copy todavía"}</strong>
            <small>{post.scheduledDate ? `${post.scheduledDate.slice(8)}/${post.scheduledDate.slice(5, 7)}${post.scheduledTime ? ` · ${post.scheduledTime}` : ""}` : "Sin fecha"}</small>
          </span>
        </span>
        <span className="hubly-social-card-row">
          <Dots post={post} />
          <PublicationBadge post={post} today={today} />
        </span>
        {hasRecovery(post.id) && <em>Cambios sin guardar en este navegador</em>}
      </button>
    </article>
  );

  const addWorkflowStatus = async () => {
    const name = await askText("Nombre del nuevo estatus", "", "Crear");
    if (!name?.trim()) return;
    updateBrand(brand.id, { workflowStatuses: [...workflow, { id: `wf-${Date.now()}`, name: name.trim(), color: ["#2A76B0", "#0F766E", "#7C3AED", "#BE185D"][workflow.length % 4] }] });
  };

  const renderUndated = () =>
    undated.length > 0 && showUndated && (
      <section className="hubly-social-undated" aria-label="Posts sin fecha">
        <h3>Sin fecha ({undated.length})</h3>
        <div>{undated.map((post) => postCard(post, "week"))}</div>
      </section>
    );

  const renderMonth = () => (
    <div className="hubly-social-month-scroll">
      <div className="hubly-social-month" role="grid" aria-label={periodLabel(anchor, "mes")}>
        {WEEKDAYS.map((d) => <div key={d} className="hubly-social-weekday" role="columnheader">{d}</div>)}
        {monthGrid(anchor).map((date) => {
          const dayPosts = filtered.filter((p) => p.scheduledDate === date);
          return (
            <div key={date} role="gridcell" className="hubly-social-day" data-outside={date.slice(0, 7) !== anchor.slice(0, 7) || undefined} data-today={date === today || undefined} {...dayCellProps(date)}>
              <div className="hubly-social-day-head">
                <span>{Number(date.slice(8))}</span>
                {!readOnly && (
                  <button type="button" aria-label={`Nuevo post el ${date}`} onClick={() => openComposer(null, date)}><Plus size={13} /></button>
                )}
              </div>
              {dayPosts.map((post) => (
                <button key={post.id} type="button" className="hubly-social-chip" {...cardDrag(post)} onClick={() => openComposer(post.id)} title={post.title} style={post.color ? { borderLeftColor: post.color } : undefined}>
                  <Dots post={post} />
                  <span>{post.scheduledTime && <b>{post.scheduledTime} </b>}{post.title}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeek = () => (
    <div className="hubly-social-week-scroll">
      <div className="hubly-social-week">
        {weekDays(anchor).map((date, index) => {
          const dayPosts = filtered.filter((p) => p.scheduledDate === date);
          return (
            <section key={date} className="hubly-social-week-col" data-today={date === today || undefined} aria-label={date} {...dayCellProps(date)}>
              <header><span>{WEEKDAYS[index]}</span><b>{Number(date.slice(8))}</b></header>
              {dayPosts.map((post) => postCard(post, "week"))}
              {!readOnly && (
                <button type="button" className="hubly-social-add" onClick={() => openComposer(null, date)}>
                  <Plus size={13} aria-hidden /> {dayPosts.length ? "Agregar" : "Nuevo post"}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );

  const SortHeader = ({ id, label }: { id: SortKey; label: string }) => {
    const active = sort.key === id;
    return (
      <th aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
        <button type="button" onClick={() => setSort({ key: id, direction: active && sort.direction === "asc" ? "desc" : "asc" })}>
          {label} {active && (sort.direction === "asc" ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden />)}
        </button>
      </th>
    );
  };

  const renderTable = () => {
    const rows = sortPosts(showUndated ? [...inView, ...undated] : inView, sort.key, sort.direction, workflowName);
    return (
      <div className="hubly-social-table-scroll">
        <table className="hubly-social-table">
          <thead>
            <tr>
              <SortHeader id="post" label="Post" />
              <SortHeader id="fecha" label="Fecha" />
              <SortHeader id="estatus" label="Estatus" />
              <SortHeader id="publicacion" label="Publicación" />
              <SortHeader id="formato" label="Formato" />
              <th>Redes</th>
              <th>Responsables</th>
              {customFields.map((f) => <th key={f.id}>{f.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((post) => {
              const people = team.filter((m) => post.assigneeIds?.includes(m.id));
              return (
                <tr key={post.id} onClick={() => openComposer(post.id)}>
                  <td>
                    <div className="hubly-social-table-post">
                      <span className="hubly-social-card-media is-small"><Thumb post={post} /></span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openComposer(post.id); }}>{post.title}</button>
                      {(post.media?.length ?? 0) > 1 && <small>{post.media?.length} archivos</small>}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      aria-label={`Fecha de ${post.title}`}
                      className="hubly-social-cell"
                      disabled={readOnly || post.status === "published"}
                      value={post.scheduledDate}
                      onChange={(e) => reschedule(post, e.target.value)}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select aria-label={`Estatus de ${post.title}`} className="hubly-social-cell" disabled={readOnly} value={post.workflowStatusId ?? ""} onChange={(e) => updatePostFields(post.id, { workflowStatusId: e.target.value || null })}>
                      <option value="">Sin estatus</option>
                      {workflow.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </td>
                  <td><PublicationBadge post={post} today={today} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select aria-label={`Formato de ${post.title}`} className="hubly-social-cell" disabled={readOnly} value={post.format} onChange={(e) => updatePostFields(post.id, { format: e.target.value as PostFormat })}>
                      {FORMAT_COLUMNS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </td>
                  <td><Dots post={post} /></td>
                  <td>{people.length ? people.map((m) => m.name.split(" ")[0]).join(", ") : post.assignee || "Sin asignar"}</td>
                  {customFields.map((f) => {
                    const value = post.customFields?.[f.id];
                    const shown = f.type === "select" ? f.options?.find((o) => o.id === value)?.label : f.type === "checkbox" ? (value ? "Sí" : "") : value;
                    return <td key={f.id}>{shown ? String(shown) : "—"}</td>;
                  })}
                </tr>
              );
            })}
            {!readOnly && (
              <tr className="hubly-social-table-new" onClick={() => openComposer(null, null)}>
                <td colSpan={7 + customFields.length}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); openComposer(null, null); }}><Plus size={14} aria-hidden /> Nuevo post</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const kanbanColumns = (): { id: string; label: string; color?: string; lockedDrop?: boolean }[] => {
    if (activeGroup === "estatus") {
      const columns = workflow.map((w) => ({ id: w.id, label: w.name, color: w.color }));
      // Solo aparece si hay posts anteriores al catálogo o sin estatus.
      return filtered.some((p) => columnOf(p) === NO_VALUE) ? [{ id: NO_VALUE, label: "Sin estatus" }, ...columns] : columns;
    }
    if (activeGroup === "pilar") return pillars.map((p) => ({ id: p, label: p }));
    if (activeGroup === "formato") return FORMAT_COLUMNS.map((f) => ({ id: f, label: f }));
    if (activeGroup === "responsable") return [{ id: NO_VALUE, label: "Sin asignar" }, ...team.map((m) => ({ id: m.id, label: m.name }))];
    if (activeGroup === "publicacion") return PUBLICATION_COLUMNS.map((s) => ({ id: s, label: STATUS_NAMES[s], lockedDrop: s === "published" }));
    const field = customSelects.find((f) => `campo:${f.id}` === activeGroup);
    return [{ id: NO_VALUE, label: "Sin valor" }, ...(field?.options ?? []).map((o) => ({ id: o.id, label: o.label, color: o.color }))];
  };

  const columnOf = (post: SocialPost): string => {
    if (activeGroup === "estatus") return post.workflowStatusId && workflow.some((w) => w.id === post.workflowStatusId) ? post.workflowStatusId : NO_VALUE;
    if (activeGroup === "formato") return post.format;
    if (activeGroup === "responsable") return post.assigneeIds?.[0] ?? NO_VALUE;
    if (activeGroup === "publicacion") return post.status;
    if (activeGroup === "pilar") return post.pillar || "General";
    return String(post.customFields?.[activeGroup.slice(6)] ?? NO_VALUE);
  };

  const moveToColumn = (post: SocialPost, column: string) => {
    if (columnOf(post) === column) return;
    const value = column === NO_VALUE ? null : column;
    if (activeGroup === "estatus") updatePostFields(post.id, { workflowStatusId: value });
    else if (activeGroup === "formato") updatePostFields(post.id, { format: column as PostFormat });
    else if (activeGroup === "pilar") updatePostFields(post.id, { pillar: column });
    else if (activeGroup === "responsable") updatePostFields(post.id, { assigneeIds: value ? [value] : [], assignee: team.find((m) => m.id === value)?.name ?? "" });
    else if (activeGroup === "publicacion") {
      // Arrastrar nunca marca un post como publicado: eso se registra con enlace y fecha reales.
      if (column === "published") {
        setNotice("Para marcarlo como publicado, ábrelo y registra la publicación en Resultados.");
        return;
      }
      if (post.status === "published") {
        setNotice("Este post ya se publicó: su estado no cambia al arrastrarlo.");
        return;
      }
      updatePostStatus(post.id, column as PostStatus, undefined, authorName, "agency");
    } else updatePostFields(post.id, { customFields: { ...post.customFields, [activeGroup.slice(6)]: value } });
  };

  const renderKanban = () => {
    const columns = kanbanColumns();
    const cards = showUndated ? [...inView, ...undated] : inView;
    return (
      <>
        <div className="hubly-social-kanban-head">
          <label>
            Columnas por
            <select className="hubly-social-cell" value={activeGroup} onChange={(e) => chooseGroup(e.target.value as KanbanGroup)}>
              <option value="estatus">Estatus — el flujo de tu equipo</option>
              <option value="formato">Formato — reel, carrusel, imagen…</option>
              <option value="responsable">Responsable — qué tiene cada quien</option>
              <option value="publicacion">Publicación — borrador, programado, publicado</option>
              {hasPillars && <option value="pilar">Pilar — pilares de tu marca</option>}
              {customSelects.map((f) => <option key={f.id} value={`campo:${f.id}`}>{f.name} — campo de tu marca</option>)}
            </select>
          </label>
        </div>
        <div className="hubly-social-kanban">
          {columns.map((column) => {
            const columnCards = cards.filter((p) => columnOf(p) === column.id);
            return (
              <section
                key={column.id}
                className="hubly-social-column"
                aria-label={column.label}
                data-over={dropTarget === column.id || undefined}
                data-locked={(column.lockedDrop && dragId) || undefined}
                onDragOver={(e) => {
                  if (!dragId) return;
                  if (!column.lockedDrop) e.preventDefault();
                  setDropTarget(column.id);
                }}
                onDragLeave={() => setDropTarget((t) => (t === column.id ? null : t))}
                onDrop={(e) => {
                  e.preventDefault();
                  const post = posts.find((p) => p.id === dragId);
                  if (post) moveToColumn(post, column.id);
                  setDragId(null);
                  setDropTarget(null);
                }}
              >
                <header>
                  <i style={{ background: column.color ?? "var(--ui-border-strong)" }} />
                  <span>{column.label}</span>
                  <b>{columnCards.length}</b>
                </header>
                {!readOnly && group !== "publicacion" && (
                  <button type="button" className="hubly-social-knew" onClick={() => openComposer(null, null)}><Plus size={13} aria-hidden /> Nuevo</button>
                )}
                <div>
                  {columnCards.map((post) => (
                    <div key={post.id} className="hubly-social-kanban-item">
                      {kanbanCard(post)}
                      {!readOnly && (
                        <select
                          className="hubly-social-cell"
                          aria-label={`Mover ${post.title} a otra columna`}
                          value={columnOf(post)}
                          onChange={(e) => moveToColumn(post, e.target.value)}
                        >
                          {columns.map((c) => <option key={c.id} value={c.id} disabled={c.lockedDrop}>{c.label}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          {!readOnly && group === "estatus" && (
            <button type="button" className="hubly-social-knew is-column" onClick={() => void addWorkflowStatus()}><Plus size={14} aria-hidden /> Agregar estatus</button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="hubly-social-calendar">
      <header className="hubly-social-toolbar">
        <div className="hubly-social-period">
          <button type="button" aria-label="Periodo anterior" onClick={() => setAnchor(shiftPeriod(anchor, view, -1))}><ChevronLeft size={17} /></button>
          <button type="button" className="is-today" onClick={() => setAnchor(today)}>Hoy</button>
          <button type="button" aria-label="Periodo siguiente" onClick={() => setAnchor(shiftPeriod(anchor, view, 1))}><ChevronRight size={17} /></button>
          <h2 aria-live="polite">{periodLabel(anchor, view)}</h2>
        </div>
        <div className="hubly-social-tools" ref={toolsRef}>
          <span className="hubly-social-quota" title={quota ? `${monthCount} de ${quota} posts prometidos este mes` : "Posts de este mes"}>
            {monthCount}{quota ? `/${quota}` : ""}
          </span>
          <div className="hubly-social-views" role="tablist" aria-label="Vista del calendario">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}>{v.label}</button>
            ))}
          </div>
          <div className="hubly-social-iconset">
            <button type="button" aria-label={`Filtros${activeFilters ? ` (${activeFilters} activos)` : ""}`} aria-expanded={filterOpen} data-active={activeFilters > 0 || undefined} onClick={() => { setFilterOpen(!filterOpen); setMenuOpen(false); }}>
              <Filter size={20} />
            </button>
            <button type="button" aria-label="Más opciones" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setFilterOpen(false); }}>
              <MoreHorizontal size={17} />
            </button>
          </div>
          {!readOnly && (
            <button type="button" className="hubly-media-primary" onClick={() => openComposer(null, null)}><Plus size={15} aria-hidden /> Post</button>
          )}

          {filterOpen && (
            <div className="hubly-social-pop" role="group" aria-label="Filtros">
              <h4>Publicación</h4>
              <div>{PUBLICATION_COLUMNS.map((s) => <label key={s}><input type="checkbox" checked={filters.statuses.includes(s)} onChange={() => toggleFilter("statuses", s)} /> {STATUS_NAMES[s]}</label>)}</div>
              <h4>Redes</h4>
              <div>{NETWORKS.map((n) => <label key={n.id}><input type="checkbox" checked={filters.networks.includes(n.id)} onChange={() => toggleFilter("networks", n.id)} /> {n.id}</label>)}</div>
              <h4>Formato</h4>
              <div>{FORMAT_COLUMNS.map((f) => <label key={f}><input type="checkbox" checked={filters.formats.includes(f)} onChange={() => toggleFilter("formats", f)} /> {f}</label>)}</div>
              {activeFilters > 0 && <button type="button" className="hubly-media-ghost" onClick={() => setFilters(EMPTY_FILTERS)}><X size={13} aria-hidden /> Limpiar filtros</button>}
            </div>
          )}

          {menuOpen && (
            <div className="hubly-social-pop is-menu" role="menu" aria-label="Más opciones">
              <h4>Ver</h4>
              <label className="hubly-social-menuitem">
                <span className="is-icon"><BarChart3 size={16} aria-hidden /></span>
                <span><b>Resultados</b><small>Alcance de lo ya publicado</small></span>
                <input type="checkbox" role="switch" checked={showResults} onChange={(e) => setShowResults(e.target.checked)} />
              </label>
              <h4>Crear y traer</h4>
              <button type="button" role="menuitem" className="hubly-social-menuitem" onClick={() => { setModal("feed"); setMenuOpen(false); }}>
                <span className="is-icon"><LayoutGrid size={16} aria-hidden /></span>
                <span><b>Ver feed</b><small>Cómo se ve el perfil con lo planificado</small></span>
              </button>
              <button type="button" role="menuitem" className="hubly-social-menuitem" onClick={() => { setModal("grid"); setMenuOpen(false); }}>
                <span className="is-icon"><CalendarDays size={16} aria-hidden /></span>
                <span><b>Crear parrilla</b><small>El mes listo para mandarle al cliente</small></span>
              </button>
              {!readOnly && (
                <button type="button" role="menuitem" className="hubly-social-menuitem" onClick={() => { setModal("import"); setMenuOpen(false); }}>
                  <span className="is-icon"><Upload size={16} aria-hidden /></span>
                  <span><b>Traer mi mes</b><small>Desde CSV, Excel o una tabla pegada</small></span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <p className="hubly-social-summary">
        {inView.length} en {view === "semana" ? "esta semana" : periodLabel(anchor, "mes").split(" ")[0].toLowerCase()}
        {undated.length > 0 && (
          <>
            {" · "}
            <button type="button" onClick={() => setShowUndated(!showUndated)}>{showUndated ? "Ocultar" : "Mostrar"} {undated.length} sin fecha</button>
          </>
        )}
      </p>
      {notice && (
        <p className="hubly-media-notice" role="status">
          {notice}
          <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(null)}><X size={13} /></button>
        </p>
      )}

      {view === "mes" && renderMonth()}
      {view === "semana" && renderWeek()}
      {(view === "mes" || view === "semana") && renderUndated()}
      {view === "tabla" && renderTable()}
      {view === "kanban" && renderKanban()}

      {modal === "feed" && <FeedModal posts={filtered} onClose={() => setModal(null)} />}
      {modal === "grid" && (
        <CreateGridModal brand={brand} anchor={anchor} posts={filtered} onCopyLink={onCopyLink} onClose={() => setModal(null)} />
      )}
      {modal === "import" && <ImportMonthModal brand={brand} posts={posts} onClose={() => setModal(null)} />}
    </div>
  );
}
