"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import type { WorkspaceNotification } from "@/lib/types";

const KIND_LABEL: Record<WorkspaceNotification["kind"], string> = {
  aprobacion: "Aprobación",
  tarea: "Tarea",
  comentario: "Comentario",
  sistema: "Sistema",
  ads: "Anuncios",
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Notificaciones
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
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
            border: "1px dashed #E2E8F0",
            borderRadius: 16,
            padding: "40px 24px",
            textAlign: "center",
            color: "#64748B",
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
                  background: n.read ? "#FFFFFF" : "#F0F1F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>
                  {[KIND_LABEL[n.kind], brand?.name, n.createdAt].filter(Boolean).join(" · ")}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{n.title}</div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{n.body}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12.5, fontWeight: 600 }}>
                  {n.actionUrl && (
                    <Link href={n.actionUrl} onClick={() => markRead(n.id)} style={{ color: "#5A65AF" }}>
                      Abrir
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      style={{ all: "unset", cursor: "pointer", color: "#5A65AF" }}
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
