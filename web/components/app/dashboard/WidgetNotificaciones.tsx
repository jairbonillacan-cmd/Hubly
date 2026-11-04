"use client";

import { useMemo } from "react";
import { useHublyStore } from "@/lib/store";
import { HublyBellIcon } from "@/components/app/icons/HublyIcons";
import { HublyBellIcon as DuoBellIcon } from "@/components/app/icons/DuotoneIcons";

export function WidgetNotificaciones() {
  const notifications = useHublyStore((s) => s.notifications);
  const markNotificationRead = useHublyStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useHublyStore((s) => s.markAllNotificationsRead);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );

  return (
    <section key="notificaciones" data-widget-id="notificaciones" className="hb-widget">
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
            className="hubly-dashboard-text-btn"
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
        <div className="hb-widget-body hubly-dashboard-body-compact">
          <div className="hubly-dashboard-stack-8">
            {unreadNotifications.map((notif) => (
              <div key={notif.id} className="hubly-dashboard-notif-row">
                <div className="hubly-dashboard-item-main">
                  <div className="hubly-dashboard-notif-title">{notif.title}</div>
                  <div className="hubly-dashboard-item-meta">{notif.body}</div>
                </div>
                <button
                  type="button"
                  onClick={() => markNotificationRead(notif.id)}
                  className="hubly-dashboard-notif-done"
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
