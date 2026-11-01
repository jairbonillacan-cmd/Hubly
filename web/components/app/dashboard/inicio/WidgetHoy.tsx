"use client";

import Link from "next/link";
import { HublyCalendarIcon, } from "@/components/app/icons/HublyIcons";
import {
  HublyCalendarIcon as DuoCalendarIcon,
} from "@/components/app/icons/DuotoneIcons";
import type { InicioViewModel } from "./useInicioView";

export function WidgetHoy({ view }: { view: InicioViewModel }) {
  const { brands, openComposer, todayAndApprovals } = view;
  return (
    <section
      key="hoy"
      data-widget-id="hoy"
      className="hb-widget"
    >
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <HublyCalendarIcon size={18} />
          </span>
          <span>Hoy</span>
          {todayAndApprovals.todayCount > 0 && (
            <span className="hb-widget-badge">{todayAndApprovals.todayCount}</span>
          )}
        </div>
        <Link href="/calendario" className="hb-widget-link">
          Calendario →
        </Link>
      </div>

      {todayAndApprovals.isEmptyToday ? (
        <div className="hb-widget-body hb-widget-empty">
          <div className="hb-empty-illus">
            <DuoCalendarIcon size={26} />
          </div>
          <div className="hb-empty-title">Sin eventos para hoy</div>
          <p className="hb-empty-desc">Hoy no sale nada programado.</p>
        </div>
      ) : (
        <div className="hb-widget-body" style={{ padding: "14px 20px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayAndApprovals.todayPosts.map((post) => {
              const postBrand = brands.find((b) => b.id === post.brandId);
              return (
                <div
                  key={post.id}
                  onClick={() => openComposer(post.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--ui-muted)",
                    background: "var(--ui-surface-2)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ui-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ui-text-4)", marginTop: 2 }}>
                      {post.scheduledTime} · {post.networks.join(", ")}
                      {postBrand ? ` · ${postBrand.name}` : ""}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "var(--hubly-success-bg)",
                      color: "var(--tinta-exito)",
                      flexShrink: 0,
                    }}
                  >
                    {post.format}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
