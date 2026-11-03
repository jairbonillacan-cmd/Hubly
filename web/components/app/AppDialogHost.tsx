"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_META } from "@/components/app/social/status-meta";

type Request =
  | { kind: "confirm"; message: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void }
  | { kind: "text"; message: string; initial: string; confirmLabel: string; resolve: (value: string | null) => void };

let show: ((request: Request) => void) | null = null;

export function askConfirm(message: string, confirmLabel = "Eliminar"): Promise<boolean> {
  return new Promise((resolve) => {
    if (!show) return resolve(false);
    show({ kind: "confirm", message, confirmLabel, danger: true, resolve });
  });
}

export function askText(message: string, initial = "", confirmLabel = "Guardar"): Promise<string | null> {
  return new Promise((resolve) => {
    if (!show) return resolve(null);
    show({ kind: "text", message, initial, confirmLabel, resolve });
  });
}

export function AppDialogHost() {
  const [request, setRequest] = useState<Request | null>(null);
  const [value, setValue] = useState("");
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    show = (next) => {
      previousFocus.current = document.activeElement as HTMLElement | null;
      setValue(next.kind === "text" ? next.initial : "");
      setRequest(next);
    };
    return () => {
      show = null;
    };
  }, []);

  useEffect(() => {
    if (request?.kind === "confirm") confirmRef.current?.focus();
  }, [request]);

  if (!request) return null;

  const close = (accepted: boolean) => {
    if (request.kind === "confirm") request.resolve(accepted);
    else request.resolve(accepted ? value.trim() || null : null);
    setRequest(null);
    previousFocus.current?.focus?.();
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close(false);
        }
      }}
      style={{ position: "fixed", inset: 0, zIndex: "var(--layer-dialog)", background: "rgb(var(--hb-accent-rgb) / 0.45)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <form
        role="alertdialog"
        aria-modal="true"
        aria-label={request.message}
        onSubmit={(e) => {
          e.preventDefault();
          close(true);
        }}
        style={{ width: "100%", maxWidth: 400, background: "var(--ui-surface)", color: "var(--ui-text)", borderRadius: 16, padding: 20, display: "grid", gap: 14 }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.45 }}>{request.message}</p>
        {request.kind === "text" && (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={request.message}
            style={{ width: "100%", border: "1px solid var(--ui-border-strong)", borderRadius: 9, padding: "9px 11px", fontSize: 14, background: "var(--ui-surface)", color: "var(--ui-text)" }}
          />
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={() => close(false)} style={{ border: "1px solid var(--ui-border-strong)", background: "var(--ui-surface)", color: "var(--ui-text)", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="submit"
            style={{ border: 0, background: request.kind === "confirm" && request.danger ? STATUS_META.changes.color : "var(--hb-accent)", color: "var(--on-accent)", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {request.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
