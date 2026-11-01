"use client";

import { Button } from "@/components/app/ui/Button";
import { useEffect, useRef, useState } from "react";

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
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.45)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <form
        className="hubly-touch"
        role="alertdialog"
        aria-modal="true"
        aria-label={request.message}
        onSubmit={(e) => {
          e.preventDefault();
          close(true);
        }}
        style={{ width: "100%", maxWidth: 400, background: "var(--ui-surface)", color: "var(--ui-text)", border: "1px solid var(--ui-border)", borderRadius: 16, padding: 20, display: "grid", gap: 14 }}
      >
        <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, lineHeight: 1.45 }}>{request.message}</p>
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
          <Button variant="ghost" onClick={() => close(false)}>
            Cancelar
          </Button>
          <button ref={confirmRef} type="submit" className={`hbtn ${request.kind === "confirm" && request.danger ? "hbtn-danger" : "hbtn-primary"}`}>
            {request.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
