"use client";

import { useHublyStore } from "@/lib/store";

/** Centro de notificaciones del sidebar. */
export function NotificationsPopover() {
  const notifications = useHublyStore((s) => s.notifications);
  const markNotificationRead = useHublyStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useHublyStore((s) => s.markAllNotificationsRead);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  return (
    <div
      role="dialog"
      className="hubly-pop"
      aria-label="Centro de notificaciones"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        width: 280,
        background: "var(--ui-surface)",
        border: "1px solid var(--ui-border)",
        borderRadius: 14,
        padding: 10,
      zIndex: "var(--layer-dropdown)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--ui-text)",
          }}
        >
          Notificaciones ({unreadNotificationsCount})
        </span>
        {unreadNotificationsCount > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--hb-accent-text)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Marcar leídas
          </button>
        )}
      </div>

      <div
        className="hubly-scroll"
        style={{
          maxHeight: 220,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: "16px 8px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--ui-text-5)",
            }}
          >
            Todo al día en tu agencia
          </div>
        ) : (
          notifications.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => markNotificationRead(item.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid transparent",
                background: item.read ? "transparent" : "rgb(var(--hb-accent-rgb) / 0.08)",
                cursor: "pointer",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: item.read ? "var(--ui-border-strong)" : "var(--hb-accent)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: item.read ? 500 : 600,
                    color: "var(--ui-text-1)",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--ui-text-4)",
                    marginTop: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {item.body}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
