"use client";

import { useEffect, useState } from "react";

/**
 * Mantiene montada una superficie durante su animación de salida.
 * `data-state` debe recibir "closing" mientras `closing` sea true.
 */
export function useModalPresence(open: boolean, exitMs = 150) {
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setMounted(false), reduced ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [open, mounted, exitMs]);

  return {
    mounted: open || mounted,
    closing: !open && mounted,
    state: (open ? "open" : "closing") as "open" | "closing",
  };
}
