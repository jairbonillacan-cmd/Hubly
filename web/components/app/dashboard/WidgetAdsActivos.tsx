"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { summarizeAdsMetrics } from "@/lib/domain/dashboard";
import { HublyMegaphoneIcon as Megaphone } from "@/components/app/icons/DuotoneIcons";

export function WidgetAdsActivos() {
  const ads = useHublyStore((s) => s.ads);
  const { activeCampaigns } = useMemo(() => summarizeAdsMetrics(ads), [ads]);

  return (
    <section key="ads_activos" className="hb-widget">
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
      <div className="hb-widget-body hubly-dashboard-body-compact">
        <div className="hubly-dashboard-stack-8">
          {activeCampaigns.map((camp) => (
            <div key={camp.id} className="hubly-dashboard-ad-row">
              <div className="hubly-dashboard-item-main">
                <div className="hubly-dashboard-item-title-sm">{camp.name}</div>
                <div className="hubly-dashboard-item-meta-xs">
                  {camp.platform} · {camp.results} {camp.resultLabel}
                </div>
              </div>
              <span className="hubly-dashboard-pill-success is-bold">
                Click {camp.clickScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
