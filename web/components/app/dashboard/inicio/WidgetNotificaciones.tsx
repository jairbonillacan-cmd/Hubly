"use client";

import { HublyBellIcon } from "@/components/app/icons/HublyIcons";
import {
  HublyBellIcon as DuoBellIcon,
} from "@/components/app/icons/DuotoneIcons";
import type { InicioViewModel } from "./useInicioView";

export function WidgetNotificaciones({ view }: { view: InicioViewModel }) {
  const { markNotificationRead, markAllNotificationsRead, unreadNotifications } = view;
  return (
    <section
      key="notificaciones"
      data-widget-id="notificaciones"
      className="hb-widget"
    >
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <HublyBellIcon size={18} />
          </span>
          <span>Notificaciones</span>
          {unreadNotifications.length > 0 && (
            <span className="hb-widget-badge">{unreadNotifications.length}</span>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--ui-text-4)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Marcar leídas
          </button>
        )}
      </div>

      {unreadNotifications.length === 0 ? (
        <div className="hb-widget-body hb-widget-empty">
          <div className="hb-empty-illus">
            <DuoBellIcon size={26} />
          </div>
          <div className="hb-empty-title">Sin notificaciones nuevas</div>
          <p className="hb-empty-desc">
            Sin notificaciones — cuando algo necesite tu atención, aparece aquí como en la
            campana.
          </p>
        </div>
      ) : (
        <div className="hb-widget-body" style={{ padding: "14px 20px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unreadNotifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--ui-sky-soft)",
                  border: "1px solid #E6F4FB",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ui-text)" }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ui-text-4)", marginTop: 2 }}>
                    {notif.body}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => markNotificationRead(notif.id)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--ui-accent-text-2)",
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-sky-border)",
                    borderRadius: 999,
                    padding: "2px 8px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Listo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
