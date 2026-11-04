"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import {
  reorderWidgetDragIds,
  selectOrderedVisibleWidgets,
  serializeWidgetsLayout,
  sortDashboardWidgets,
} from "@/lib/domain/dashboard";
import type { DashboardWidgetId, DashboardWidgetSpan } from "@/lib/types";

function startGridPointerResize(
  event: React.PointerEvent,
  grid: HTMLDivElement | null,
  id: DashboardWidgetId,
  startSpan: DashboardWidgetSpan,
  onPreview: (resizing: { id: DashboardWidgetId; span: DashboardWidgetSpan } | null) => void,
  onCommit: (id: DashboardWidgetId, span: DashboardWidgetSpan) => void
) {
  if (!grid) return;
  event.preventDefault();
  event.stopPropagation();
  const styles = getComputedStyle(grid);
  const maxCols = styles.gridTemplateColumns.split(" ").length;
  if (maxCols <= 1) return;
  const gap = parseFloat(styles.columnGap) || 24;
  const colWidth = (grid.clientWidth - gap * (maxCols - 1)) / maxCols;
  const startX = event.clientX;
  let current = startSpan;
  onPreview({ id, span: startSpan });
  const onMove = (e: PointerEvent) => {
    const width = startSpan * colWidth + (startSpan - 1) * gap + (e.clientX - startX);
    current = Math.min(maxCols, Math.max(1, Math.round((width + gap) / (colWidth + gap)))) as DashboardWidgetSpan;
    onPreview({ id, span: current });
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    onCommit(id, current);
    onPreview(null);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

/** Estado de interfaz del tablero de Inicio (edición, arrastre, redimensión y modal de pendientes). */
export function useInicioView() {
  const widgets = useHublyStore((s) => s.widgets);
  const setEditWidgetsMode = useHublyStore((s) => s.setEditWidgetsMode);
  const toggleWidgetVisibility = useHublyStore((s) => s.toggleWidgetVisibility);
  const resetWidgetsLayout = useHublyStore((s) => s.resetWidgetsLayout);
  const reorderWidgets = useHublyStore((s) => s.reorderWidgets);
  const setWidgetSpan = useHublyStore((s) => s.setWidgetSpan);

  const [filterByBrand, setFilterByBrand] = useState<boolean>(true);
  const [pendientesOpen, setPendientesOpen] = useState<boolean>(false);
  const [dragId, setDragId] = useState<DashboardWidgetId | null>(null);
  const [dragOrder, setDragOrder] = useState<DashboardWidgetId[] | null>(null);
  const [resizing, setResizing] = useState<{ id: DashboardWidgetId; span: DashboardWidgetSpan } | null>(null);
  const [hiddenWidget, setHiddenWidget] = useState<{ id: DashboardWidgetId; title: string } | null>(null);
  const [layoutCopied, setLayoutCopied] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const sortedWidgets = useMemo(() => sortDashboardWidgets(widgets), [widgets]);
  const orderedVisibleWidgets = useMemo(
    () => selectOrderedVisibleWidgets(widgets, dragOrder),
    [dragOrder, widgets]
  );

  useEffect(() => {
    if (!hiddenWidget) return;
    const timer = window.setTimeout(() => setHiddenWidget(null), 4000);
    return () => window.clearTimeout(timer);
  }, [hiddenWidget]);

  useEffect(() => () => setEditWidgetsMode(false), [setEditWidgetsMode]);

  const handleDragStartWidget = (id: DashboardWidgetId) => {
    setDragId(id);
    setDragOrder(sortedWidgets.map((w) => w.id));
  };
  const handleDragEnterWidget = (targetId: DashboardWidgetId) => {
    setDragOrder((prev) => reorderWidgetDragIds(prev, dragId, targetId));
  };
  const handleDragEndWidget = () => {
    if (dragOrder) reorderWidgets(dragOrder);
    setDragOrder(null);
    setDragId(null);
  };
  const handleHideWidget = (id: DashboardWidgetId, title: string) => {
    toggleWidgetVisibility(id);
    setHiddenWidget({ id, title });
  };
  const handleUndoHideWidget = () => {
    if (!hiddenWidget) return;
    toggleWidgetVisibility(hiddenWidget.id);
    setHiddenWidget(null);
  };
  const handleResetLayout = () => {
    resetWidgetsLayout();
    setHiddenWidget(null);
  };
  const handleCopyLayout = async () => {
    const layout = serializeWidgetsLayout(widgets);
    try {
      await navigator.clipboard.writeText(JSON.stringify(layout));
      setLayoutCopied(true);
      window.setTimeout(() => setLayoutCopied(false), 1600);
    } catch {
      setLayoutCopied(false);
    }
  };
  const handleCycleSpan = (id: DashboardWidgetId, span: DashboardWidgetSpan) => {
    const grid = gridRef.current;
    if (!grid) return;
    const maxCols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    setWidgetSpan(id, (span >= maxCols ? 1 : span + 1) as DashboardWidgetSpan);
  };
  const handleResizeStart = (
    event: React.PointerEvent,
    id: DashboardWidgetId,
    startSpan: DashboardWidgetSpan
  ) => startGridPointerResize(event, gridRef.current, id, startSpan, setResizing, setWidgetSpan);

  return {
    filterByBrand,
    setFilterByBrand,
    pendientesOpen,
    setPendientesOpen,
    dragId,
    resizing,
    hiddenWidget,
    layoutCopied,
    gridRef,
    orderedVisibleWidgets,
    handleDragStartWidget,
    handleDragEnterWidget,
    handleDragEndWidget,
    handleHideWidget,
    handleUndoHideWidget,
    handleResetLayout,
    handleCopyLayout,
    handleCycleSpan,
    handleResizeStart,
  };
}
