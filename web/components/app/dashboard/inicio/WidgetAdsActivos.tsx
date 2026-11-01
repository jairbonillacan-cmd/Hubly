"use client";

import Link from "next/link";
import {
  HublyMegaphoneIcon as Megaphone,
} from "@/components/app/icons/DuotoneIcons";
import type { InicioViewModel } from "./useInicioView";

export function WidgetAdsActivos({ view }: { view: InicioViewModel }) {
  const { ads } = view;
  const activeCampaigns = ads.filter((a) => a.status === "Activo");
  return (
    <section
      key="ads_activos"
      className="hb-widget"
    >
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <Megaphone size={18} />
          </span>
          <span>Ads Activos</span>
          <span className="hb-widget-badge">{activeCampaigns.length}</span>
        </div>
        <Link href="/salud" className="hb-widget-link">
          Ver campañas →
        </Link>
      </div>
      <div className="hb-widget-body" style={{ padding: "14px 20px 18px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeCampaigns.map((camp) => (
            <div
              key={camp.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 10,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--ui-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {camp.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--ui-text-4)" }}>
                  {camp.platform} · {camp.results} {camp.resultLabel}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--hubly-success-bg)",
                  color: "var(--tinta-exito)",
                }}
              >
                Click {camp.clickScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
