"use client";

import React, { useEffect, useRef } from "react";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";

interface PopMenuProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  label: string;
  children: React.ReactNode;
}

/** Menú flotante del chat: Escape y clic fuera lo cierran, con la salida animada de `.hubly-dropdown`. */
export function PopMenu({ open, onClose, className = "", label, children }: PopMenuProps) {
  const presence = useModalPresence(open, 100);
  const ref = useRef<HTMLDivElement>(null);
  useLayer(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el || el.contains(e.target as Node)) return;
      if ((e.target as Element).closest?.("[data-pop-trigger]")) return;
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  if (!presence.mounted) return null;
  return (
    <div ref={ref} className={`hubly-dropdown hubly-chat-pop ${className}`.trim()} data-state={presence.state} role="menu" aria-label={label}>
      {children}
    </div>
  );
}
