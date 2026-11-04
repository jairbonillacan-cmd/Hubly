"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { summarizeAdsMetrics } from "@/lib/domain/dashboard";
import { HublyChartIcon as BarChart2 } from "@/components/app/icons/DuotoneIcons";

export function WidgetGraficaAds() {
  const ads = useHublyStore((s) => s.ads);
  const { totalSpend, avgCtr } = useMemo(() => summarizeAdsMetrics(ads), [ads]);

  return (
    <section key="grafica_ads" className="hb-widget">
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
      <div className="hb-widget-body hubly-dashboard-body-pad">
        <div className="hubly-dashboard-ads-grid">
          <div className="hubly-dashboard-ads-stat">
            <div className="hubly-dashboard-ads-stat-label">INVERSIÓN ACUMULADA</div>
            <div className="hubly-dashboard-ads-stat-value">
              {totalSpend.toLocaleString("es-MX")} MXN
            </div>
          </div>
          <div className="hubly-dashboard-ads-stat">
            <div className="hubly-dashboard-ads-stat-label">CTR PROMEDIO</div>
            <div className="hubly-dashboard-ads-stat-value is-success">{avgCtr}%</div>
          </div>
        </div>
      </div>
    </section>
  );
}
