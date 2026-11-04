"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { selectGreetingAndDate } from "@/lib/domain-selectors";
import {
  buildAgendaMonthCells,
  buildAgendaWeekDays,
  buildCalendarEntries,
  formatAgendaPeriodLabel,
  groupEntriesByDay,
  shiftAgendaAnchor,
  type AgendaViewMode,
  type CalendarActivity,
  type CalendarEntry,
} from "@/lib/domain/posts";

export type CalendarFilterGroup = "brand" | "network" | "format" | "posts" | "activities";

export function useCalendarioView() {
  const router = useRouter();
  const profile = useHublyStore((s) => s.profile);
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const workspaceId = useHublyStore((s) => s.workspaceId);
  const posts = useHublyStore((s) => s.posts);
  const tasks = useHublyStore((s) => s.tasks);
  const openComposer = useHublyStore((s) => s.openComposer);
  const sharedActivities = useHublyStore((s) => s.calendarActivities);
  const setSharedActivities = useHublyStore((s) => s.setCalendarActivities);

  const todayIso = useMemo(
    () => selectGreetingAndDate(profile, fixedIsoNow).isoDate,
    [profile, fixedIsoNow]
  );

  const [activeMode, setActiveMode] = useState<AgendaViewMode>("lista");
  const [anchorIso, setAnchorIso] = useState(todayIso);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [networkFilter, setNetworkFilter] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [showPosts, setShowPosts] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const [newActivityDate, setNewActivityDate] = useState<string | null>(null);
  const [lastOpenDate, setLastOpenDate] = useState(todayIso);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const storageKey = `hubly:calendar-activities:${workspaceId}`;

  useEffect(() => {
    setAnchorIso(todayIso); // eslint-disable-line react-hooks/set-state-in-effect -- fecha y datos locales solo tras hidratar
    router.prefetch("/tareas");
    router.prefetch("/parrillas");
  }, [router, todayIso]);

  useEffect(() => {
    if (backendEnabled) {
      setActivities((sharedActivities || []) as CalendarActivity[]); // eslint-disable-line react-hooks/set-state-in-effect -- fecha y datos locales solo tras hidratar
      return;
    }
    try {
      setActivities(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    } catch {
      setActivities([]);
    }
  }, [storageKey, sharedActivities]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNewActivityDate(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const entries = useMemo<CalendarEntry[]>(
    () =>
      buildCalendarEntries(posts, tasks, activities, {
        showPosts,
        showActivities,
        brandFilter,
        networkFilter,
        formatFilter,
      }),
    [posts, tasks, activities, showPosts, showActivities, brandFilter, networkFilter, formatFilter]
  );

  const monthKey = anchorIso.slice(0, 7);
  const weekDays = useMemo(() => buildAgendaWeekDays(anchorIso), [anchorIso]);
  const monthCells = useMemo(() => buildAgendaMonthCells(monthKey), [monthKey]);
  const entriesByDay = useMemo(() => groupEntriesByDay(entries), [entries]);
  const listDays = useMemo(
    () => [...entriesByDay.keys()].filter((iso) => iso.startsWith(monthKey)).sort(),
    [entriesByDay, monthKey]
  );

  const periodLabel = useMemo(
    () => formatAgendaPeriodLabel(anchorIso, weekDays, activeMode),
    [anchorIso, weekDays, activeMode]
  );

  const handleNavigate = (action: "prev" | "next" | "today") => {
    if (action === "today") {
      setAnchorIso(todayIso);
      return;
    }
    setAnchorIso((prev) => shiftAgendaAnchor(prev, activeMode, action === "next" ? 1 : -1));
  };

  const handleOpenEntry = (entry: CalendarEntry) => {
    if (entry.kind === "post") openComposer(entry.sourceId);
    setActiveEntryId(entry.id);
    if (entry.kind === "tarea") router.push("/tareas");
  };

  const handleOpenNewActivity = (isoDate: string) => {
    setLastOpenDate(isoDate);
    setNewActivityDate(isoDate);
  };

  const handleSaveActivity = (draft: Omit<CalendarActivity, "id" | "isoDate">) => {
    if (!newActivityDate) return;
    const next: CalendarActivity[] = [
      ...activities,
      {
        ...draft,
        id: `activity-${Date.now()}`,
        isoDate: newActivityDate,
      },
    ];
    setActivities(next);
    if (backendEnabled) {
      setSharedActivities(next);
    } else {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* La actividad sigue visible durante esta sesión. */
      }
    }
    setNewActivityDate(null);
  };

  const handleToggleFilter = (group: CalendarFilterGroup, value?: string) => {
    if (group === "posts") {
      setShowPosts((v) => !v);
      return;
    }
    if (group === "activities") {
      setShowActivities((v) => !v);
      return;
    }
    if (!value) return;
    const toggle = (prev: string[]) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    if (group === "brand") setBrandFilter(toggle);
    else if (group === "network") setNetworkFilter(toggle);
    else if (group === "format") setFormatFilter(toggle);
  };

  return {
    todayIso,
    activeMode,
    setActiveMode,
    anchorIso,
    brandFilter,
    networkFilter,
    formatFilter,
    showPosts,
    showActivities,
    newActivityDate,
    setNewActivityDate,
    lastOpenDate,
    activeEntryId,
    entries,
    monthKey,
    weekDays,
    monthCells,
    entriesByDay,
    listDays,
    periodLabel,
    handleNavigate,
    handleOpenEntry,
    handleOpenNewActivity,
    handleSaveActivity,
    handleToggleFilter,
  };
}
