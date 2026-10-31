"use client";

import { useEffect, useRef } from "react";

type Layer = { onEscape: () => void; opener: Element | null; deferTo?: string };
const stack: Layer[] = [];
let listening = false;

function handleKey(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const top = stack[stack.length - 1];
  if (!top || (top.deferTo && document.querySelector(top.deferTo))) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  top.onEscape();
}

/**
 * Registra una ventana en la pila común: Escape cierra solo la superior, y al cerrarla
 * el foco vuelve a quien la abrió. Se escucha en captura para adelantarse a otros atajos.
 */
export function useLayer(open: boolean, onEscape: () => void, options: { returnFocus?: boolean; deferTo?: string } = {}) {
  const callback = useRef(onEscape);
  const returnFocus = options.returnFocus ?? true;
  const deferTo = options.deferTo;
  useEffect(() => {
    callback.current = onEscape;
  });
  useEffect(() => {
    if (!open) return;
    const layer: Layer = { onEscape: () => callback.current(), opener: document.activeElement, deferTo };
    stack.push(layer);
    if (!listening) {
      window.addEventListener("keydown", handleKey, true);
      listening = true;
    }
    return () => {
      stack.splice(stack.indexOf(layer), 1);
      if (stack.length === 0) {
        window.removeEventListener("keydown", handleKey, true);
        listening = false;
      }
      if (returnFocus && layer.opener instanceof HTMLElement && layer.opener.isConnected) layer.opener.focus();
    };
  }, [deferTo, open, returnFocus]);
}
