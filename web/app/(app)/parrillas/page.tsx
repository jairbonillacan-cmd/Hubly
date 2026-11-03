"use client";

import React, { useEffect, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { clientShareUrl, createLiveShareUrl } from "@/lib/share-links";
import { SocialCalendar } from "@/components/app/social/SocialCalendar";
import { ImportMonthModal } from "@/components/app/social/CalendarModals";
import { MonthlyReport } from "@/components/app/reports/MonthlyReport";
import { IdeasBoard } from "@/components/app/social/IdeasBoard";
import { ProductionBoard } from "@/components/app/social/ProductionBoard";
import { PostInbox } from "@/components/app/social/PostInbox";
import { OrganicAnalytics } from "@/components/app/social/OrganicAnalytics";
import { ParrillaOnboarding } from "@/components/app/social/parrillas/ParrillaOnboarding";
import { ParrillaReportesPreview } from "@/components/app/social/parrillas/ParrillaReportesPreview";
import { ParrillaLinks } from "@/components/app/social/parrillas/ParrillaLinks";
import { AccountsModal } from "@/components/app/social/parrillas/AccountsModal";
import type { SocialSubTab } from "@/components/app/social/parrillas/types";
import {
  HublyBentoIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyChatIcon,
  HublyLinkIcon,
  HublyPresentationIcon,
  HublySparkIcon,
} from "@/components/app/icons/DuotoneIcons";
import { selectActiveBrand } from "@/lib/domain-selectors";

export default function ParrillasPage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const posts = useHublyStore((s) => s.posts);

  const [activeTab, setActiveTab] = useState<SocialSubTab>("calendario");
  const [showDemoData, setShowDemoData] = useState(backendEnabled);
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [connectingNet, setConnectingNet] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "liga" || t === "links") setActiveTab("links");
    else if (t === "reportes") setActiveTab("reportes");
    else if (t === "ideas") setActiveTab("ideas");
    else if (t === "mensajes") setActiveTab("mensajes");
    else if (t === "analytics") setActiveTab("analytics");
    else if (t === "tableros") setActiveTab("tableros");
    else if (t === "calendario") setActiveTab("calendario");
  }, []);

  const activeBrand =
    selectActiveBrand(brands, activeBrandId);

  const brandName =
    activeBrand?.name || "";
  const brandHandle =
    activeBrand?.bioLink?.handle || activeBrand?.slug || "";
  const shareToken = activeBrand?.shareToken || "";
  const brandPosts = posts.filter((p) => p.brandId === activeBrand?.id);

  // Quien acaba de usar el editor debe ver su post en el calendario.
  useEffect(() => {
    if (composerOpen) setShowDemoData(true);
  }, [composerOpen]);

  // Con cuentas reales cada enlace se genera al pedirlo: solo se guarda su hash.
  const handleOpenPortal = async (e: React.MouseEvent) => {
    if (!backendEnabled) return;
    e.preventDefault();
    const url = await createLiveShareUrl(activeBrand?.id);
    if (url) window.open(url, "_blank", "noopener");
  };

  const handleCopyClientLink = async (e?: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    if (backendEnabled) e?.preventDefault?.();
    const url = await clientShareUrl(activeBrand);
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };


  const handleConnectNetwork = (netName: string) => {
    setConnectingNet(netName);
    setTimeout(() => {
      setConnectingNet(null);
      setShowDemoData(true);
    }, 900);
  };

  const navItems: { id: SocialSubTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "calendario",
      label: "Calendario",
      icon: <HublyCalendarIcon size={18} />,
    },
    { id: "ideas", label: "Ideas", icon: <HublySparkIcon size={18} /> },
    { id: "mensajes", label: "Mensajes", icon: <HublyChatIcon size={18} /> },
    { id: "analytics", label: "Analytics", icon: <HublyChartIcon size={18} /> },
    { id: "tableros", label: "Tableros", icon: <HublyBentoIcon size={18} /> },
    { id: "reportes", label: "Reportes", icon: <HublyPresentationIcon size={18} /> },
    { id: "links", label: "Links", icon: <HublyLinkIcon size={18} /> },
  ];

  return (
    <div
      className="hubly-touch"
      style={{
        color: "var(--ui-text)",
        minHeight: "calc(100vh - 64px)",
        position: "relative",
        paddingBottom: 60,
      }}
    >
      {/* Top Hubi Sub-Navigation Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 14,
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            background: "var(--ui-muted)",
            padding: 4,
            borderRadius: 999,
            overflowX: "auto",
          }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: isActive ? "var(--ui-surface)" : "transparent",
                  color: isActive ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: isActive ? "0 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                  whiteSpace: "nowrap",
                  transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAccountsModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "var(--ui-text-2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <HublyLinkIcon size={18} />
          <span>Cuentas</span>
        </button>
      </div>

      {/* TAB 1: CALENDARIO (10-social-media-calendario-1440.png) */}
      {activeTab === "calendario" && !showDemoData && <ParrillaOnboarding setShowDemoData={setShowDemoData} setImportModalOpen={setImportModalOpen} copiedLink={copiedLink} connectingNet={connectingNet} brandName={brandName} shareToken={shareToken} handleCopyClientLink={handleCopyClientLink} handleConnectNetwork={handleConnectNetwork} />}

      {/* INTERACTIVE PARRILLA & CALENDAR VIEW (Toggled by 'Ver con datos de ejemplo ->') */}
      {activeTab === "calendario" && showDemoData && activeBrand && (
        <div>
          <SocialCalendar brand={activeBrand} posts={brandPosts} onCopyLink={() => void handleCopyClientLink()} />
        </div>
      )}

      {/* TAB 6: REPORTES (10b-social-media-reportes-1440.png) */}
      {activeTab === "reportes" && backendEnabled && <MonthlyReport brand={activeBrand} posts={brandPosts} />}
      {activeTab === "reportes" && !backendEnabled && <ParrillaReportesPreview />}

      {/* TAB 7: LINKS (?tab=liga -> 14-social-media-aprobacion-liga-1440.png) */}
      {activeTab === "links" && <ParrillaLinks setActiveTab={setActiveTab} activeBrand={activeBrand} brandName={brandName} brandHandle={brandHandle} shareToken={shareToken} handleOpenPortal={handleOpenPortal} />}

      {activeTab === "ideas" && <IdeasBoard brandId={activeBrand?.id || ""} brandName={brandName} />}
      {activeTab === "mensajes" && <PostInbox key={activeBrand?.id} posts={brandPosts} />}
      {activeTab === "analytics" && <OrganicAnalytics posts={brandPosts} />}
      {activeTab === "tableros" && <ProductionBoard posts={brandPosts} />}

      {importModalOpen && activeBrand && (
        <ImportMonthModal brand={activeBrand} posts={posts} onClose={() => setImportModalOpen(false)} />
      )}

      {/* Modal: Cuentas conectadas */}
      <AccountsModal open={accountsModalOpen} onClose={() => setAccountsModalOpen(false)} brandName={brandName} onConnect={handleConnectNetwork} />
    </div>
  );
}
