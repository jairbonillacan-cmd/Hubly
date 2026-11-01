"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

const DRAG_THRESHOLD_PX = 5;
const TOUCH_HOLD_MS = 220;
const EDGE_SCROLL_PX = 56;
const EDGE_SCROLL_STEP = 14;

interface KanbanDragState {
  id: string;
  overCol: string | null;
  /** Tarjeta delante de la que caería; null significa al final de la columna. */
  beforeId: string | null;
  height: number;
}

interface Options {
  columns: readonly string[];
  onMove: (id: string, toCol: string, beforeId: string | null) => void;
}

function cardsIn(col: Element, excludeId?: string) {
  return Array.from(col.querySelectorAll<HTMLElement>("[data-kanban-card]")).filter(
    (c) => c.dataset.kanbanCard !== excludeId
  );
}

function scrollableAncestors(el: Element | null) {
  const found: Element[] = [];
  for (let node = el; node; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node);
    if (/(auto|scroll)/.test(overflowX + overflowY)) found.push(node);
  }
  return found;
}

/**
 * Arrastre entre columnas con puntero (ratón y táctil, con pulsación breve en
 * táctil para no bloquear el scroll) y teclado (Alt + flechas). Escape cancela.
 */
export function useKanbanDrag({ columns, onMove }: Options) {
  const [drag, setDrag] = useState<KanbanDragState | null>(null);
  const onMoveRef = useRef(onMove);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const onPointerDown = useCallback((id: string, e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if ((e.target as Element).closest("button, a, input, textarea, select")) return;

    const card = e.currentTarget;
    const isTouch = e.pointerType === "touch";
    const startX = e.clientX;
    const startY = e.clientY;
    let lastTarget: { overCol: string | null; beforeId: string | null } = {
      overCol: null,
      beforeId: null,
    };
    let ghost: HTMLElement | null = null;
    let offsetX = 0;
    let offsetY = 0;
    let holdTimer: number | undefined;

    const placeGhost = (x: number, y: number) => {
      if (ghost) ghost.style.transform = `translate(${x - offsetX}px, ${y - offsetY}px) rotate(1.5deg)`;
    };

    const updateTarget = (x: number, y: number) => {
      const col = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-kanban-col]");
      if (!col) return;
      const before = cardsIn(col, id).find((c) => {
        const r = c.getBoundingClientRect();
        return y < r.top + r.height / 2;
      });
      lastTarget = {
        overCol: col.dataset.kanbanCol ?? null,
        beforeId: before?.dataset.kanbanCard ?? null,
      };
      setDrag((d) => (d ? { ...d, ...lastTarget } : d));
    };

    const edgeScroll = (x: number, y: number) => {
      const dx = x < EDGE_SCROLL_PX ? -1 : x > window.innerWidth - EDGE_SCROLL_PX ? 1 : 0;
      const dy = y < EDGE_SCROLL_PX ? -1 : y > window.innerHeight - EDGE_SCROLL_PX ? 1 : 0;
      if (!dx && !dy) return;
      for (const el of scrollableAncestors(card)) el.scrollBy(dx * EDGE_SCROLL_STEP, dy * EDGE_SCROLL_STEP);
    };

    const begin = (x: number, y: number) => {
      const rect = card.getBoundingClientRect();
      offsetX = startX - rect.left;
      offsetY = startY - rect.top;
      ghost = card.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-kanban-card");
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${rect.width}px`,
        margin: "0",
        opacity: "1",
        zIndex: "9999",
        pointerEvents: "none",
        cursor: "grabbing",
        boxShadow: "0 14px 32px rgba(15,23,42,0.18)",
      } satisfies Partial<CSSStyleDeclaration>);
      document.body.appendChild(ghost);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      placeGhost(x, y);
      setDrag({ id, overCol: null, beforeId: null, height: rect.height });
      updateTarget(x, y);
    };

    const finish = (commit: boolean) => {
      const wasDragging = ghost !== null;
      cleanup();
      setDrag(null);
      if (!wasDragging) return;
      // El navegador emite un click al soltar; no debe contar como click en la tarjeta.
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
      if (commit && lastTarget.overCol) {
        onMoveRef.current(id, lastTarget.overCol, lastTarget.beforeId);
      }
    };

    const onMovePointer = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      if (!ghost) {
        const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY) >= DRAG_THRESHOLD_PX;
        if (!moved) return;
        if (isTouch) {
          // Se movió antes de la pulsación: es scroll, no arrastre.
          finish(false);
          return;
        }
        begin(ev.clientX, ev.clientY);
      }
      placeGhost(ev.clientX, ev.clientY);
      updateTarget(ev.clientX, ev.clientY);
      edgeScroll(ev.clientX, ev.clientY);
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId === e.pointerId) finish(true);
    };
    const onCancel = (ev: PointerEvent) => {
      if (ev.pointerId === e.pointerId) finish(false);
    };
    const onKey = (ev: globalThis.KeyboardEvent) => {
      if (ev.key === "Escape") finish(false);
    };
    const onTouchMove = (ev: TouchEvent) => {
      if (ghost) ev.preventDefault();
    };

    const cleanup = () => {
      window.clearTimeout(holdTimer);
      window.removeEventListener("pointermove", onMovePointer);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchmove", onTouchMove);
      ghost?.remove();
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      cleanupRef.current = null;
    };

    cleanupRef.current?.();
    cleanupRef.current = cleanup;
    window.addEventListener("pointermove", onMovePointer);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    if (isTouch) holdTimer = window.setTimeout(() => begin(startX, startY), TOUCH_HOLD_MS);
  }, []);

  const onKeyDown = useCallback(
    (id: string, e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" && e.target === e.currentTarget) {
        e.currentTarget.click();
        return;
      }
      if (!e.altKey || !e.key.startsWith("Arrow")) return;
      const col = e.currentTarget.closest<HTMLElement>("[data-kanban-col]");
      const colKey = col?.dataset.kanbanCol;
      if (!col || !colKey) return;
      e.preventDefault();

      const siblings = cardsIn(col).map((c) => c.dataset.kanbanCard ?? "");
      const pos = siblings.indexOf(id);
      if (e.key === "ArrowUp" && pos > 0) {
        onMoveRef.current(id, colKey, siblings[pos - 1]);
      } else if (e.key === "ArrowDown" && pos < siblings.length - 1) {
        onMoveRef.current(id, colKey, siblings[pos + 2] ?? null);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const next = columns[columns.indexOf(colKey) + (e.key === "ArrowLeft" ? -1 : 1)];
        if (next) onMoveRef.current(id, next, null);
      } else {
        return;
      }
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-kanban-card="${CSS.escape(id)}"]`)?.focus();
      });
    },
    [columns]
  );

  const getCardProps = (id: string) => ({
    "data-kanban-card": id,
    tabIndex: 0,
    "aria-roledescription": "tarjeta arrastrable",
    "aria-keyshortcuts": "Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown",
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => onPointerDown(id, e),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(id, e),
  });

  const getColumnProps = (key: string) => ({ "data-kanban-col": key });

  return { drag, getCardProps, getColumnProps };
}

/** Reubica un elemento delante de `beforeId` (o al final) aplicándole `patch`. */
export function moveInList<T extends { id: string }>(
  list: T[],
  id: string,
  beforeId: string | null,
  patch: (item: T) => T
): T[] {
  const item = list.find((x) => x.id === id);
  if (!item || id === beforeId) return list;
  const rest = list.filter((x) => x.id !== id);
  const at = beforeId ? rest.findIndex((x) => x.id === beforeId) : -1;
  rest.splice(at === -1 ? rest.length : at, 0, patch(item));
  return rest;
}
