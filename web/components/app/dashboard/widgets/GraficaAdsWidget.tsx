"use client";

import { HublyChartIcon as BarChart2 } from "@/components/app/icons/DuotoneIcons";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";

/** Gráfica de inversión en anuncios. */
export function GraficaAdsWidget() {
  const ads = useHublyStore((s) => s.ads);

    const totalSpend = ads.reduce((acc, a) => acc + (a.spend || 0), 0);
    const avgCtr =
      ads.length > 0
        ? (ads.reduce((acc, a) => acc + a.ctr, 0) / ads.length).toFixed(2)
        : "0.00";
    return (
      <section
        key="grafica_ads"
        className="hb-widget"
      >
        <div className="hb-widget-head">
          <div className="hb-widget-title">
            <span className="hb-widget-icon-box">
              <BarChart2 size={18} />
            </span>
            <span>Gráfica de Ads</span>
          </div>
          <Link href="/salud" className="hb-widget-link">
            Salud y Ads →
          </Link>
        </div>
        <div className="hb-widget-body" style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--ui-text-4)", fontWeight: 600 }}>
                INVERSIÓN ACUMULADA
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ui-text)", marginTop: 4 }}>
                {totalSpend.toLocaleString("es-MX")} MXN
              </div>
            </div>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--ui-text-4)", fontWeight: 600 }}>
                CTR PROMEDIO
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ui-text)", marginTop: 4 }}>
                {avgCtr}%
              </div>
            </div>
          </div>
        </div>
      </section>
    );
}
