"use client";

import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import type { WorkspaceNotification } from "@/lib/types";
import {
  HublyBellIcon as Bell,
  HublyCheckIcon as CheckCheck,
} from "@/components/app/icons/DuotoneIcons";

const KIND_LABEL: Record<WorkspaceNotification["kind"], string> = {
  aprobacion: "Aprobación",
  tarea: "Tarea",
  comentario: "Comentario",
  sistema: "Sistema",
  ads: "Anuncios",
};

const when = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
};

export default function NotificacionesPage() {
  const notifications = useHublyStore((s) => s.notifications);
  const brands = useHublyStore((s) => s.brands);
  const markRead = useHublyStore((s) => s.markNotificationRead);
  const markAllRead = useHublyStore((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ui-text)", margin: 0 }}>
            Notificaciones
          </h1>
          <p style={{ fontSize: 13, color: "var(--ui-text-4)", margin: "4px 0 0" }}>
            {unread === 0 ? "Todo leído" : `${unread} sin leer`}
          </p>
        </div>
        <button
          type="button"
          className="saas-btn saas-btn-sm"
          disabled={unread === 0}
          onClick={markAllRead}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <CheckCheck size={14} />
          Marcar todo como leído
        </button>
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--ui-border)",
            borderRadius: 16,
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--ui-text-4)",
            fontSize: 13.5,
          }}
        >
          <Bell size={20} style={{ marginBottom: 8 }} />
          <div>Aún no tienes notificaciones.</div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {notifications.map((n) => {
            const brand = brands.find((b) => b.id === n.brandId);
            return (
              <li
                key={n.id}
                style={{
                  background: n.read ? "var(--ui-surface)" : "var(--ui-accent-soft)",
                  border: "1px solid var(--ui-border)",
                  borderRadius: 14,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: 11.5, color: "var(--ui-text-4)", marginBottom: 4 }}>
                  {[KIND_LABEL[n.kind], brand?.name, when(n.createdAt)].filter(Boolean).join(" · ")}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>{n.title}</div>
                <div style={{ fontSize: 13, color: "var(--ui-text-3)", marginTop: 2 }}>{n.body}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12.5, fontWeight: 600 }}>
                  {n.actionUrl && (
                    <Link href={n.actionUrl} onClick={() => markRead(n.id)} style={{ color: "var(--ui-accent-text-2)" }}>
                      Abrir
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      style={{ border: "none", background: "transparent", padding: "0 2px", borderRadius: 6, font: "inherit", cursor: "pointer", color: "var(--ui-accent-text-2)" }}
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
