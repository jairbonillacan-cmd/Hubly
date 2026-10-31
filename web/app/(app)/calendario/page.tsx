"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { selectGreetingAndDate } from "@/lib/domain-selectors";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  HublyBentoIcon as LayoutGrid,
  HublyCalendarIcon as CalendarPlus,
  HublyCameraIcon as Camera,
  HublyCheckIcon as Check,
  HublyChevronLeftIcon as ChevronLeft,
  HublyChevronRightIcon as ChevronRight,
  HublyClipboardIcon as ListChecks,
  HublyCloseIcon as X,
  HublyFilterIcon as Filter,
  HublyHashIcon as Hash,
  HublyPlusIcon as Plus,
  HublyPresentationIcon as Presentation,
  HublyRowsIcon as Rows3,
  HublyTagIcon as Tag,
} from "@/components/app/icons/DuotoneIcons";

type CalendarView = "lista" | "mes" | "marca";
type EntryKind = "post" | "tarea" | "actividad";
type RepeatMode = "none" | "daily" | "weekly" | "biweekly" | "monthly";

interface CalendarActivity {
  id: string;
  brandId: string;
  isoDate: string;
  title: string;
  category: string;
  time: string;
  endTime?: string;
  allDay?: boolean;
  repeat?: RepeatMode;
  color?: string;
  place?: string;
}

interface CalendarEntry {
  id: string;
  sourceId: string;
  kind: EntryKind;
  brandId: string;
  isoDate: string;
  title: string;
  label: string;
  time: string;
  networks: string[];
  format: string;
  color?: string;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NETWORKS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "X", "Threads", "Pinterest"];
const FORMATS = ["Imagen", "Video", "Carrusel", "Reel", "Story", "Solo texto"];

const KIND_STYLE: Record<EntryKind, { color: string; bg: string; Icon: typeof Hash }> = {
  post: { color: "var(--hb-accent-text)", bg: "rgb(var(--hb-accent-rgb) / 0.11)", Icon: Hash },
  tarea: { color: "#6A6A8C", bg: "#F1F1F6", Icon: ListChecks },
  actividad: { color: "#A97FC4", bg: "rgba(201, 166, 224, 0.14)", Icon: Camera },
};

const parseIso = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
};
const mondayOf = (iso: string) => addDays(iso, -((parseIso(iso).getUTCDay() + 6) % 7));
const formatDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...options }).format(parseIso(iso));
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const ACTIVITY_TYPES = [
  { id: "Junta", Icon: ListChecks },
  { id: "Grabación", Icon: Camera },
  { id: "Actividad", Icon: CalendarPlus },
];
const REPEAT_OPTIONS: { id: RepeatMode; label: string }[] = [
  { id: "none", label: "No se repite" },
  { id: "daily", label: "Diario" },
  { id: "weekly", label: "Semanal" },
  { id: "biweekly", label: "Quincenal" },
  { id: "monthly", label: "Mensual" },
];
const ACTIVITY_COLORS = ["#E59A9A", "#F2B37A", "#9BD08F", "#94A3DD", "#C6A2DF", "#7CC4C4"];

const occurrences = (activity: CalendarActivity) => {
  const step = { daily: 1, weekly: 7, biweekly: 14 }[activity.repeat as "daily"];
  if (activity.repeat === "monthly") {
    return Array.from({ length: 24 }, (_, i) => {
      const date = parseIso(activity.isoDate);
      date.setUTCMonth(date.getUTCMonth() + i);
      return toIso(date);
    });
  }
  if (!step) return [activity.isoDate];
  return Array.from({ length: Math.ceil(730 / step) }, (_, i) => addDays(activity.isoDate, i * step));
};

const addMinutes = (time: string, minutes: number) => {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};


export default function CalendarioPage() {
  const router = useRouter();
  const profile = useHublyStore((s) => s.profile);
  const testClock = useHublyStore((s) => s.testClock);
  const workspaceId = useHublyStore((s) => s.workspaceId);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const posts = useHublyStore((s) => s.posts);
  const tasks = useHublyStore((s) => s.tasks);
  const openComposer = useHublyStore((s) => s.openComposer);

  const todayIso = useMemo(
    () => selectGreetingAndDate(profile, testClock?.fixedIsoNow).isoDate,
    [profile, testClock?.fixedIsoNow]
  );

  const [view, setView] = useState<CalendarView>("lista");
  const [anchorIso, setAnchorIso] = useState(todayIso);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [networkFilter, setNetworkFilter] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [showPosts, setShowPosts] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const [showEmptyBrands, setShowEmptyBrands] = useState(false);
  const [newActivityDate, setNewActivityDate] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState(ACTIVITY_TYPES[0].id);
  const [draftTime, setDraftTime] = useState("09:00");
  const [draftEndTime, setDraftEndTime] = useState("");
  const [draftAllDay, setDraftAllDay] = useState(false);
  const [draftRepeat, setDraftRepeat] = useState<RepeatMode>("none");
  const [draftColor, setDraftColor] = useState<string | null>(null);
  const [draftPlace, setDraftPlace] = useState("");
  const [draftBrandId, setDraftBrandId] = useState(activeBrandId);
  const lastOpenDate = useRef(todayIso);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const filtersPresence = useModalPresence(filtersOpen, 100);
  const modalPresence = useModalPresence(newActivityDate !== null);
  const storageKey = `hubly:calendar-activities:${workspaceId}`;

  useEffect(() => setAnchorIso(todayIso), [todayIso]);

  const sharedActivities = useHublyStore((s) => s.calendarActivities);
  const setSharedActivities = useHublyStore((s) => s.setCalendarActivities);

  useEffect(() => {
    if (backendEnabled) {
      setActivities((sharedActivities || []) as CalendarActivity[]);
      return;
    }
    try {
      setActivities(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    } catch {
      setActivities([]);
    }
  }, [storageKey, sharedActivities]);

  useEffect(() => {
    if (!filtersOpen) return;
    const close = (e: MouseEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filtersOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setNewActivityDate(null);
      setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const entries = useMemo<CalendarEntry[]>(() => {
    const postEntries = posts.map((post) => ({
      id: `post-${post.id}`,
      sourceId: post.id,
      kind: "post" as const,
      brandId: post.brandId,
      isoDate: post.scheduledDate,
      title: post.title,
      label: post.format || "Post",
      time: post.scheduledTime || "",
      networks: (post.networks || []).map(String),
      format: String(post.format || ""),
    }));
    const taskEntries = tasks
      .filter((task) => !task.completed && task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        sourceId: task.id,
        kind: "tarea" as const,
        brandId: task.brandId,
        isoDate: task.dueDate,
        title: task.title,
        label: "Tarea",
        time: "",
        networks: [],
        format: "",
      }));
    const activityEntries = activities.flatMap((activity) =>
      occurrences(activity).map((isoDate, index) => ({
        id: `${activity.id}-${index}`,
        sourceId: activity.id,
        kind: "actividad" as const,
        brandId: activity.brandId,
        isoDate,
        title: activity.title,
        label: activity.category,
        time: activity.allDay ? "" : activity.time,
        networks: [],
        format: "",
        color: activity.color,
      }))
    );
    return [...postEntries, ...taskEntries, ...activityEntries]
      .filter((entry) => {
        if (entry.kind === "post" ? !showPosts : !showActivities) return false;
        if (brandFilter.length > 0 && !brandFilter.includes(entry.brandId)) return false;
        if (networkFilter.length > 0 || formatFilter.length > 0) {
          if (entry.kind !== "post") return false;
          if (
            networkFilter.length > 0 &&
            !entry.networks.some((n) => networkFilter.some((f) => n.toLowerCase().includes(f.toLowerCase())))
          )
            return false;
          if (formatFilter.length > 0 && !formatFilter.some((f) => f.toLowerCase() === entry.format.toLowerCase()))
            return false;
        }
        return true;
      })
      .sort((a, b) => (a.isoDate + a.time).localeCompare(b.isoDate + b.time));
  }, [posts, tasks, activities, showPosts, showActivities, brandFilter, networkFilter, formatFilter]);

  const monthKey = anchorIso.slice(0, 7);
  const weekStart = mondayOf(anchorIso);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthCells = useMemo(() => {
    const first = mondayOf(`${monthKey}-01`);
    const nextMonth = parseIso(`${monthKey}-01`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const last = addDays(toIso(nextMonth), -1);
    const cells: string[] = [];
    for (let day = first; day <= last || cells.length % 7 !== 0; day = addDays(day, 1)) cells.push(day);
    return cells;
  }, [monthKey]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries.forEach((entry) => map.set(entry.isoDate, [...(map.get(entry.isoDate) || []), entry]));
    return map;
  }, [entries]);

  const listDays = [...entriesByDay.keys()].filter((iso) => iso.startsWith(monthKey)).sort();
  const brandsWithContent = brands.filter((brand) =>
    entries.some((e) => e.brandId === brand.id && weekDays.includes(e.isoDate))
  );
  const emptyBrandsCount = brands.length - brandsWithContent.length;
  const visibleBrands = showEmptyBrands ? brands : brandsWithContent;
  const filterCount = brandFilter.length + networkFilter.length + formatFilter.length + (showPosts ? 0 : 1) + (showActivities ? 0 : 1);

  const periodLabel =
    view === "marca"
      ? `${formatDate(weekDays[0], { day: "numeric", month: "short" })} – ${formatDate(weekDays[6], { day: "numeric", month: "short" })} ${weekDays[6].slice(0, 4)}`
      : capitalize(formatDate(anchorIso, { month: "long", year: "numeric" }).replace(" de ", " "));

  const move = (direction: 1 | -1) => {
    if (view === "marca") {
      setAnchorIso(addDays(anchorIso, direction * 7));
      return;
    }
    const date = parseIso(`${monthKey}-01`);
    date.setUTCMonth(date.getUTCMonth() + direction);
    setAnchorIso(toIso(date));
  };

  const openEntry = (entry: CalendarEntry) => {
    if (entry.kind === "post") openComposer(entry.sourceId);
    if (entry.kind === "tarea") router.push("/tareas");
  };

  const openNewActivity = (isoDate: string) => {
    lastOpenDate.current = isoDate;
    setDraftTitle("");
    setDraftBrandId("");
    setDraftEndTime("");
    setDraftAllDay(false);
    setDraftRepeat("none");
    setDraftColor(null);
    setDraftPlace("");
    setDraftCategory(ACTIVITY_TYPES[0].id);
    setNewActivityDate(isoDate);
  };

  const saveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title || !newActivityDate) return;
    const next = [
      ...activities,
      {
        id: `activity-${Date.now()}`,
        brandId: draftBrandId,
        isoDate: newActivityDate,
        title,
        category: draftCategory,
        time: draftTime,
        endTime: draftEndTime,
        allDay: draftAllDay,
        repeat: draftRepeat,
        color: draftColor || undefined,
        place: draftPlace.trim(),
      },
    ];
    setActivities(next);
    if (backendEnabled) setSharedActivities(next);
    else try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* La actividad sigue visible durante esta sesión. */
    }
    setNewActivityDate(null);
  };

  const toggleIn = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const viewTabs: { id: CalendarView; label: string; Icon: typeof Rows3 }[] = [
    { id: "lista", label: "Lista", Icon: Rows3 },
    { id: "mes", label: "Mes", Icon: LayoutGrid },
    { id: "marca", label: "Por marca", Icon: Tag },
  ];

  const renderChip = (entry: CalendarEntry) => {
    const style = KIND_STYLE[entry.kind];
    return (
      <button
        key={entry.id}
        type="button"
        className="hubly-cal-chip"
        title={`${entry.label} · ${entry.title}`}
        style={entry.color ? { background: `${entry.color}2A`, color: entry.color } : { background: style.bg, color: style.color }}
        onClick={(e) => {
          e.stopPropagation();
          openEntry(entry);
        }}
      >
        {entry.time && <span className="hubly-cal-chip-time">{entry.time}</span>}
        <span className="hubly-cal-chip-title">{entry.title}</span>
      </button>
    );
  };

  return (
    <div className="hubly-cal">
      <header className="hubly-cal-header">
        <div className="hubly-cal-title-row">
          <div style={{ minWidth: 0 }}>
            <h1 className="hubly-cal-title">Calendario</h1>
            <p className="hubly-cal-subtitle">Posts y actividades de todas tus marcas, en una sola agenda.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button
              type="button"
              className="hubly-cal-reveal"
              title="Revisar la parrilla como presentación"
              onClick={() => router.push("/parrillas")}
            >
              <Presentation size={18} />
              <span>Revisar</span>
            </button>
            <button
              type="button"
              className="hubly-cal-reveal"
              title="Nueva actividad"
              onClick={() => openNewActivity(todayIso)}
            >
              <CalendarPlus size={18} />
              <span>Actividad</span>
            </button>
          </div>
        </div>

        <div className="hubly-cal-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button type="button" className="hubly-cal-icon" aria-label="Anterior" onClick={() => move(-1)}>
              <ChevronLeft size={15} />
            </button>
            <button type="button" className="hubly-cal-icon" aria-label="Siguiente" onClick={() => move(1)}>
              <ChevronRight size={15} />
            </button>
            <button type="button" className="hubly-cal-today" title="Volver al día de hoy" onClick={() => setAnchorIso(todayIso)}>
              Ir a hoy
            </button>
          </div>
          <span className="hubly-cal-period">{periodLabel}</span>
          <div style={{ flex: 1 }} />
          <div className="hubly-cal-tabs" role="tablist" aria-label="Vista">
            {viewTabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                aria-label={label}
                title={label}
                className="hubly-cal-tab"
                onClick={() => setView(id)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div ref={filtersRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="hubly-cal-icon"
              aria-label="Filtros"
              title="Filtros"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Filter size={15} />
              {filterCount > 0 && <span className="hubly-cal-filter-dot" />}
            </button>
            {filtersPresence.mounted && (
              <div className="hubly-dropdown hubly-cal-filters" data-state={filtersPresence.state}>
                <h3>Filtros</h3>
                <section>
                  <div className="hubly-cal-filter-label">Marcas</div>
                  <input
                    className="hubly-cal-input"
                    placeholder="Buscar marca…"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                  />
                  {brands
                    .filter((b) => b.name.toLowerCase().includes(brandSearch.trim().toLowerCase()))
                    .map((brand) => (
                      <button
                        key={brand.id}
                        type="button"
                        className="hubly-cal-brand-option"
                        aria-pressed={brandFilter.includes(brand.id)}
                        onClick={() => toggleIn(brand.id, setBrandFilter)}
                      >
                        <span className="hubly-cal-checkbox">
                          {brandFilter.includes(brand.id) && <Check size={11} />}
                        </span>
                        <span className="hubly-cal-brand-dot" style={{ background: brand.color || "var(--hb-accent)" }}>
                          {brand.name.charAt(0)}
                        </span>
                        <span>{brand.name}</span>
                      </button>
                    ))}
                </section>
                <section>
                  <div className="hubly-cal-filter-label">Red social</div>
                  <div className="hubly-cal-pills">
                    {NETWORKS.map((network) => (
                      <button
                        key={network}
                        type="button"
                        className="hubly-cal-pill"
                        aria-pressed={networkFilter.includes(network)}
                        onClick={() => toggleIn(network, setNetworkFilter)}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="hubly-cal-filter-label">Tipo de contenido</div>
                  <div className="hubly-cal-pills">
                    {FORMATS.map((format) => (
                      <button
                        key={format}
                        type="button"
                        className="hubly-cal-pill"
                        aria-pressed={formatFilter.includes(format)}
                        onClick={() => toggleIn(format, setFormatFilter)}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="hubly-cal-filter-label">Mostrar</div>
                  <div className="hubly-cal-pills">
                    <button type="button" className="hubly-cal-pill" aria-pressed={showPosts} onClick={() => setShowPosts((v) => !v)}>
                      Posts
                    </button>
                    <button type="button" className="hubly-cal-pill" aria-pressed={showActivities} onClick={() => setShowActivities((v) => !v)}>
                      Actividades
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </header>

      <div key={view} className="hubly-cal-body tablero-aparece">
        {view === "lista" &&
          (listDays.length === 0 ? (
            <div className="hubly-cal-empty">
              <strong>Nada programado este mes</strong>
              <span>Crea una actividad o agenda un post para verlo aquí.</span>
            </div>
          ) : (
            <div className="hubly-cal-agenda">
              {listDays.map((iso) => {
                const dayEntries = entriesByDay.get(iso) || [];
                const isToday = iso === todayIso;
                return (
                  <div key={iso} className="hubly-cal-day">
                    <div className={`hubly-cal-date ${isToday ? "is-today" : ""}`}>
                      <span>{formatDate(iso, { weekday: "short" }).replace(".", "")}</span>
                      <strong>{Number(iso.slice(8))}</strong>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="hubly-cal-day-head">
                        <span className={isToday ? "is-today" : ""}>
                          {capitalize(formatDate(iso, { weekday: "long", day: "numeric", month: "long" }).replace(",", ""))}
                        </span>
                        {isToday && <em>Hoy</em>}
                        <small>
                          {dayEntries.length} {dayEntries.length === 1 ? "actividad" : "actividades"}
                        </small>
                      </div>
                      <div className="hubly-cal-rows">
                        {dayEntries.map((entry) => {
                          const style = KIND_STYLE[entry.kind];
                          const Icon = style.Icon;
                          return (
                            <div
                              key={entry.id}
                              className="hubly-cal-row"
                              title={`${entry.label} · ${entry.title}`}
                              role={entry.kind === "actividad" ? undefined : "button"}
                              tabIndex={entry.kind === "actividad" ? undefined : 0}
                              onClick={() => openEntry(entry)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") openEntry(entry);
                              }}
                            >
                              <span className="hubly-cal-row-icon" style={{ background: style.bg, color: style.color }}>
                                <Icon size={17} />
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="hubly-cal-row-title">{entry.title}</div>
                                <div className="hubly-cal-row-meta">
                                  <span style={{ color: style.color, fontWeight: 500 }}>{entry.label}</span>
                                  {brands.length > 1 && entry.brandId && <span>· {brands.find((b) => b.id === entry.brandId)?.name}</span>}
                                </div>
                              </div>
                              {entry.time && <span className="hubly-cal-row-time">{entry.time}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        {view === "mes" && (
          <div className="hubly-cal-month">
            <div className="hubly-cal-weekdays">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="hubly-cal-grid">
              {monthCells.map((iso) => {
                const dayEntries = entriesByDay.get(iso) || [];
                const outside = !iso.startsWith(monthKey);
                return (
                  <div
                    key={iso}
                    className={`hubly-cal-cell ${outside ? "is-outside" : ""}`}
                    onClick={() => openNewActivity(iso)}
                  >
                    <div className="hubly-cal-cell-head">
                      <span className={`hubly-cal-cell-num ${iso === todayIso ? "is-today" : ""}`}>{Number(iso.slice(8))}</span>
                      <button
                        type="button"
                        className="hubly-cal-cell-add"
                        aria-label="Nueva actividad este día"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNewActivity(iso);
                        }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="hubly-cal-cell-items">
                      {dayEntries.slice(0, 3).map(renderChip)}
                      {dayEntries.length > 3 && <span className="hubly-cal-more">+{dayEntries.length - 3} más</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "marca" && (
          <div className="hubly-cal-month hubly-cal-brands">
            <div className="hubly-cal-brand-grid hubly-cal-brand-head">
              <div>Marca</div>
              {weekDays.map((iso, i) => (
                <div key={iso} className={iso === todayIso ? "is-today" : ""}>
                  {WEEKDAYS[i]} {Number(iso.slice(8))}
                </div>
              ))}
            </div>
            {visibleBrands.map((brand) => (
              <div key={brand.id} className="hubly-cal-brand-grid hubly-cal-brand-row">
                <div className="hubly-cal-brand-name">
                  <span className="hubly-cal-brand-dot" style={{ background: brand.color || "var(--hb-accent)" }}>
                    {brand.name.charAt(0)}
                  </span>
                  <span>{brand.name}</span>
                </div>
                {weekDays.map((iso) => (
                  <div key={iso} className="hubly-cal-brand-cell" onClick={() => openNewActivity(iso)}>
                    {(entriesByDay.get(iso) || []).filter((e) => e.brandId === brand.id).map(renderChip)}
                  </div>
                ))}
              </div>
            ))}
            {visibleBrands.length === 0 && (
              <div className="hubly-cal-empty">
                <strong>Sin contenido esta semana</strong>
              </div>
            )}
            {emptyBrandsCount > 0 && (
              <button type="button" className="hubly-cal-more-brands" onClick={() => setShowEmptyBrands((v) => !v)}>
                {showEmptyBrands
                  ? "Ocultar marcas sin contenido"
                  : `Mostrar ${emptyBrandsCount} ${emptyBrandsCount === 1 ? "marca" : "marcas"} sin contenido esta semana`}
              </button>
            )}
          </div>
        )}
      </div>

      {modalPresence.mounted && (
        <div
          className="hubly-overlay hubly-cal-overlay"
          data-state={modalPresence.state}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNewActivityDate(null);
          }}
        >
          <form
            className="hubly-sheet hubly-cal-modal"
            data-state={modalPresence.state}
            role="dialog"
            aria-modal="true"
            aria-label="Nueva actividad"
            onSubmit={saveActivity}
          >
            <div className="hubly-cal-modal-head">
              <h2>
                <i style={{ background: draftColor || "#94A3DD" }} />
                Nueva actividad
              </h2>
              <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={() => setNewActivityDate(null)}>
                <X size={14} />
              </button>
            </div>

            <div className="hubly-cal-modal-scroll">
              <label className="hubly-cal-field">
                <span>Título</span>
                <input
                  className="hubly-cal-line"
                  autoFocus
                  required
                  placeholder="Ej. Grabación con cliente"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
              </label>

              <div className="hubly-cal-types" role="radiogroup" aria-label="Tipo de actividad">
                {ACTIVITY_TYPES.map(({ id, Icon }) => (
                  <button key={id} type="button" role="radio" aria-checked={draftCategory === id} onClick={() => setDraftCategory(id)}>
                    <Icon size={18} />
                    <span>{id}</span>
                  </button>
                ))}
              </div>

              <div className="hubly-cal-field">
                <span>Cuándo</span>
                <input
                  className="hubly-cal-line"
                  type="date"
                  aria-label="Fecha"
                  value={newActivityDate ?? lastOpenDate.current}
                  onChange={(e) => setNewActivityDate(e.target.value)}
                />
                {!draftAllDay && (
                  <>
                    <input className="hubly-cal-line" type="time" aria-label="Hora de inicio" value={draftTime} onChange={(e) => setDraftTime(e.target.value)} />
                    <small>a</small>
                    <input className="hubly-cal-line" type="time" aria-label="Hora de fin" value={draftEndTime} onChange={(e) => setDraftEndTime(e.target.value)} />
                  </>
                )}
                <div className="hubly-cal-durations">
                  {!draftAllDay &&
                    [
                      { label: "30 min", minutes: 30 },
                      { label: "1 h", minutes: 60 },
                      { label: "2 h", minutes: 120 },
                    ].map(({ label, minutes }) => (
                      <button key={label} type="button" onClick={() => setDraftEndTime(addMinutes(draftTime, minutes))}>
                        {label}
                      </button>
                    ))}
                  <label>
                    <input type="checkbox" checked={draftAllDay} onChange={(e) => setDraftAllDay(e.target.checked)} />
                    Todo el día
                  </label>
                </div>
              </div>

              <div className="hubly-cal-field">
                <span>Repetir</span>
                <div className="hubly-cal-pills">
                  {REPEAT_OPTIONS.map(({ id, label }) => (
                    <button key={id} type="button" className="hubly-cal-pill" aria-pressed={draftRepeat === id} onClick={() => setDraftRepeat(id)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hubly-cal-field">
                <span>Color</span>
                <div className="hubly-cal-colors">
                  <button type="button" className="hubly-cal-pill" aria-pressed={draftColor === null} onClick={() => setDraftColor(null)}>
                    <i />
                    Auto
                  </button>
                  {ACTIVITY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="hubly-cal-color"
                      aria-label={`Color ${color}`}
                      aria-pressed={draftColor === color}
                      style={{ background: color }}
                      onClick={() => setDraftColor(color)}
                    />
                  ))}
                </div>
              </div>

              <label className="hubly-cal-field">
                <span>Marca (opcional)</span>
                <select className="hubly-cal-line" value={draftBrandId} onChange={(e) => setDraftBrandId(e.target.value)}>
                  <option value="">Ninguna — actividad general</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="hubly-cal-field">
                <span>Lugar / link (opcional)</span>
                <input className="hubly-cal-line" placeholder="Oficina, Meet, dirección…" value={draftPlace} onChange={(e) => setDraftPlace(e.target.value)} />
              </label>
            </div>

            <div className="hubly-cal-modal-actions">
              <button type="button" className="hbtn hbtn-ghost hbtn-sm" onClick={() => setNewActivityDate(null)}>
                Cancelar
              </button>
              <button type="submit" className="hbtn hbtn-primary hbtn-sm">
                Crear actividad
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
