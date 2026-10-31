"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { currentAgencyId } from "@/lib/live-workspace";
import { Cover } from "@/components/Cover";
import { STATUS_META } from "@/components/app/social/status-meta";
import { PostMonthCalendar } from "@/components/app/social/PostMonthCalendar";
import { SocialCalendar } from "@/components/app/social/SocialCalendar";
import { ImportMonthModal } from "@/components/app/social/CalendarModals";
import { MonthlyReport } from "@/components/app/reports/MonthlyReport";
import { IdeasBoard } from "@/components/app/social/IdeasBoard";
import { ProductionBoard } from "@/components/app/social/ProductionBoard";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { PostInbox } from "@/components/app/social/PostInbox";
import { OrganicAnalytics } from "@/components/app/social/OrganicAnalytics";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyBentoIcon,
  HublyBentoIcon as LayoutGrid,
  HublyCalendarIcon,
  HublyCalendarIcon as Calendar,
  HublyChartIcon,
  HublyChatIcon,
  HublyChatIcon as MessageCircle,
  HublyChatIcon as MessageSquareWarning,
  HublyCheckCircleIcon as CheckCircle2,
  HublyCheckIcon as Check,
  HublyChevronDownIcon as ChevronDown,
  HublyCloseIcon as X,
  HublyCopyIcon as Copy,
  HublyExternalIcon as ExternalLink,
  HublyGlobeIcon as Globe,
  HublyHomeIcon as Home,
  HublyLinkIcon,
  HublyPencilIcon as Edit3,
  HublyPlusIcon as Plus,
  HublyPresentationIcon,
  HublyRowsIcon as List,
  HublySparkIcon,
} from "@/components/app/icons/DuotoneIcons";

type SocialSubTab =
  | "calendario"
  | "ideas"
  | "mensajes"
  | "analytics"
  | "tableros"
  | "reportes"
  | "links";

const REPORT_PEEK = [
  { label: "Instagram", value: 84 },
  { label: "TikTok", value: 62 },
  { label: "Facebook", value: 37 },
  { label: "LinkedIn", value: 21 },
];

export default function ParrillasPage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const posts = useHublyStore((s) => s.posts);
  const openComposer = useHublyStore((s) => s.openComposer);
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);
  const approveAllBrandPosts = useHublyStore((s) => s.approveAllBrandPosts);

  const [activeTab, setActiveTab] = useState<SocialSubTab>("calendario");
  const [showDemoData, setShowDemoData] = useState(backendEnabled);
  const profileName = useHublyStore((s) => s.profile?.name) || "Equipo";
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const [moreNetworksOpen, setMoreNetworksOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [linksSubTab, setLinksSubTab] = useState<"contenido" | "diseno" | "numeros">("contenido");
  const [siguenosEnabled, setSiguenosEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [descubreOpen, setDescubreOpen] = useState(true);
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
    brands.find((b) => b.id === activeBrandId) ||
    brands.find((b) => b.id === "brand-min") ||
    brands[0];

  const brandName =
    activeBrand?.name || "";
  const brandHandle =
    activeBrand?.bioLink?.handle || activeBrand?.slug || "";
  const shareToken = activeBrand?.shareToken || "min-nov";
  const brandPosts = posts.filter((p) => p.brandId === activeBrand?.id);

  // Quien acaba de usar el editor debe ver su post en el calendario.
  useEffect(() => {
    if (composerOpen) setShowDemoData(true);
  }, [composerOpen]);

  const liveShareUrl = async () => {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: activeBrand?.id, agencyId: currentAgencyId() }),
    });
    if (!res.ok) return null;
    const { token } = (await res.json()) as { token: string };
    return `${window.location.origin}/share/${token}`;
  };

  // Con cuentas reales cada enlace se genera al pedirlo: solo se guarda su hash.
  const handleOpenPortal = async (e: React.MouseEvent) => {
    if (!backendEnabled) return;
    e.preventDefault();
    const url = await liveShareUrl();
    if (url) window.open(url, "_blank", "noopener");
  };

  const handleCopyClientLink = async (e?: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    if (backendEnabled) e?.preventDefault?.();
    const url = backendEnabled ? await liveShareUrl() : `${window.location.origin}/share/${shareToken}`;
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyBioLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(`https://hubly.app/@${brandHandle}`).catch(() => {});
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
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
                  transition: "all 0.15s ease",
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
      {activeTab === "calendario" && !showDemoData && (
        <div>
          {/* 1 - 2 - 3 Stepper Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-grid",
                  placeItems: "center",
                }}
              >
                1
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ui-text)" }}>
                Conecta una red
              </span>
            </div>

            <div style={{ width: 32, height: 1, background: "var(--ui-border)" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--ui-muted)",
                  color: "var(--ui-text-3)",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-grid",
                  placeItems: "center",
                }}
              >
                2
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ui-text-4)" }}>
                Hubi arma tu reporte
              </span>
            </div>

            <div style={{ width: 32, height: 1, background: "var(--ui-border)" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--ui-muted)",
                  color: "var(--ui-text-3)",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-grid",
                  placeItems: "center",
                }}
              >
                3
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ui-text-4)" }}>
                Tu primer post
              </span>
            </div>
          </div>

          {/* Grey Banner: Traer mi mes */}
          <section
            style={{
              background: "var(--ui-surface-2)",
              borderRadius: 14,
              padding: "16px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: 13.5, color: "var(--ui-text-3)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ui-text)", fontWeight: 700 }}>
                ¿Ya tienes el mes de {brandName} en Excel, Notion o Canva?
              </strong>{" "}
              Tráelo tal cual: Hubi lo acomoda en tu calendario en 30 segundos.
            </div>
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              style={{
                background: "var(--hb-accent)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Traer mi mes
            </button>
          </section>

          {/* 2-Column Main Area */}
          <section className="hubly-parrillas-cols">
            {/* Left Column */}
            <div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--ui-text)",
                  letterSpacing: "-0.02em",
                  margin: "0 0 18px",
                }}
              >
                Conecta una red de {brandName}.
              </h1>

              {/* 1 - 2 - 3 List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 22,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "var(--hb-accent)",
                      color: "#FFFFFF",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    1
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>Conecta una red</span>
                  <span style={{ color: "var(--hb-accent-text)", fontSize: 12.5, fontWeight: 600 }}>
                    ← estás aquí
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "var(--ui-muted)",
                      color: "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <span style={{ color: "var(--ui-text-2)" }}>
                    Hubi arma su parrilla y su reporte, solos
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "var(--ui-muted)",
                      color: "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    3
                  </span>
                  <span style={{ color: "var(--ui-text-2)" }}>
                    Los ves, los compartes y lo pruebas
                  </span>
                </div>
              </div>

              {/* 2x2 Network Buttons Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <button
                  type="button"
                  title="Conectar Instagram"
                  onClick={() => handleConnectNetwork("Instagram")}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      stroke="#E1306C"
                      strokeWidth="2.2"
                    />
                    <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2.2" />
                    <circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" />
                  </svg>
                  <span>{connectingNet === "Instagram" ? "Conectando..." : "Instagram"}</span>
                </button>

                <button
                  type="button"
                  title="Conectar Facebook"
                  onClick={() => handleConnectNetwork("Facebook")}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                  </svg>
                  <span>{connectingNet === "Facebook" ? "Conectando..." : "Facebook"}</span>
                </button>

                <button
                  type="button"
                  title="Conectar TikTok"
                  onClick={() => handleConnectNetwork("TikTok")}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
                  </svg>
                  <span>{connectingNet === "TikTok" ? "Conectando..." : "TikTok"}</span>
                </button>

                <button
                  type="button"
                  title="Conectar LinkedIn"
                  onClick={() => handleConnectNetwork("LinkedIn")}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span>{connectingNet === "LinkedIn" ? "Conectando..." : "LinkedIn"}</span>
                </button>
              </div>

              {/* More Networks Link */}
              <button
                type="button"
                onClick={() => setMoreNetworksOpen(!moreNetworksOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px 0",
                  color: "var(--hb-accent-text)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Más redes (YouTube, X, Threads, Pinterest, Reddit, Google Business) →
              </button>

              {moreNetworksOpen && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 8,
                    marginBottom: 8,
                  }}
                >
                  {["YouTube", "X", "Threads", "Pinterest", "Reddit", "Google Business"].map(
                    (net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => handleConnectNetwork(net)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--ui-border-strong)",
                          background: "var(--ui-surface)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--ui-text)",
                          cursor: "pointer",
                        }}
                      >
                        {net}
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Security Box with Hubi Avatar */}
              <div
                style={{
                  marginTop: 14,
                  background: "var(--ui-surface-2)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Hubi Mascot Line-Art Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <HublyCatAvatar size={26} />
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ui-text-3)" }}>
                  <strong style={{ color: "var(--ui-text)", fontWeight: 700 }}>
                    La conexión directa todavía no está lista.
                  </strong>{" "}
                  Por ahora preparas, apruebas y publicas a mano. Cuando llegue, entrarás con el login
                  oficial de cada red y tu contraseña nunca pasará por aquí.
                </div>
              </div>

              {/* Divider 'o' */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "18px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--ui-border)" }} />
                <span style={{ fontSize: 12.5, color: "var(--ui-text-4)" }}>o</span>
                <div style={{ flex: 1, height: 1, background: "var(--ui-border)" }} />
              </div>

              {/* Mandarle la liga a mi cliente */}
              <Link
                href={`/share/${shareToken}`}
                onClick={handleCopyClientLink}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  border: "1px solid var(--ui-border-strong)",
                  background: "var(--ui-surface)",
                  color: "var(--ui-text)",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                {copiedLink ? "¡Liga copiada! Abriendo portal..." : "Mandarle la liga a mi cliente"}
              </Link>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--ui-text-4)",
                  margin: "8px 0 14px",
                }}
              >
                Él autoriza desde su celular, sin crear cuenta.
              </div>

              {/* Bottom Button: Ver con datos de ejemplo -> */}
              <button
                type="button"
                onClick={() => setShowDemoData(true)}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid var(--ui-border-strong)",
                  background: "var(--ui-surface)",
                  color: "var(--hb-accent-text)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <span>Ver con datos de ejemplo →</span>
              </button>
            </div>

            {/* Right Column: vista previa del reporte + CTA Card */}
            <div>
              <figure className="hubly-report-peek">
                <figcaption>
                  <strong>Tu reporte del mes</strong>
                  <span>Datos de ejemplo</span>
                </figcaption>
                <ul>
                  {REPORT_PEEK.map((row) => (
                    <li key={row.label}>
                      <span>{row.label}</span>
                      <i style={{ width: `${row.value}%` }} />
                      <b>{row.value} mil</b>
                    </li>
                  ))}
                </ul>
                <p>Alcance por red, listo para mandarle al cliente.</p>
              </figure>

              {/* Bottom Card */}
              <div
                style={{
                  background: "var(--ui-surface-2)",
                  border: "1px solid var(--ui-border)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <HublyCatAvatar size={44} />

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "var(--ui-text)",
                      marginBottom: 2,
                    }}
                  >
                    ¿Quieres ver {brandName} armada?
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ui-text-3)",
                      marginBottom: 12,
                    }}
                  >
                    Recorre la parrilla y el reporte con datos de ejemplo, sin conectar nada.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setShowDemoData(true)}
                      style={{
                        background: "var(--hb-accent)",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Probar con datos de ejemplo
                    </button>
                    <a
                      href="/chat"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "var(--ui-surface)",
                        color: "var(--ui-text)",
                        border: "1px solid var(--ui-border-strong)",
                        borderRadius: 10,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Abrir el chat
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* INTERACTIVE PARRILLA & CALENDAR VIEW (Toggled by 'Ver con datos de ejemplo ->') */}
      {activeTab === "calendario" && showDemoData && (
        <div>
          <SocialCalendar brand={activeBrand} posts={brandPosts} onCopyLink={() => void handleCopyClientLink()} />
        </div>
      )}

      {/* TAB 6: REPORTES (10b-social-media-reportes-1440.png) */}
      {activeTab === "reportes" && backendEnabled && <MonthlyReport brand={activeBrand} posts={brandPosts} />}
      {activeTab === "reportes" && !backendEnabled && (
        <div>
          {/* Secondary Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 14,
              borderBottom: "1px solid var(--ui-border)",
              marginBottom: 48,
            }}
          >
            

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              

              <div
                style={{
                  display: "inline-flex",
                  background: "var(--ui-muted)",
                  padding: 3,
                  borderRadius: 10,
                  gap: 2,
                }}
              >
                
                
              </div>

              <Link
                href="/reportes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Plus size={15} />
                <span>Nuevo</span>
              </Link>
            </div>
          </div>

          {/* Center Empty State matching 10b-social-media-reportes-1440.png */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "64px 20px",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: "#DBEAFE",
                color: "var(--hb-accent-text)",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--hb-accent)" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="17" x2="8" y2="13" />
                <line x1="12" y1="17" x2="12" y2="11" />
                <line x1="16" y1="17" x2="16" y2="15" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: "0 0 6px",
              }}
            >
              No hay reportes aún
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--ui-text-4)",
                margin: "0 0 20px",
              }}
            >
              Crea tu primer reporte para empezar
            </p>

            <Link
              href="/reportes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--hb-accent)",
                color: "#FFFFFF",
                borderRadius: 12,
                padding: "11px 22px",
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Plus size={15} />
              <span>Nuevo reporte</span>
            </Link>
          </div>
        </div>
      )}

      {/* TAB 7: LINKS (?tab=liga -> 14-social-media-aprobacion-liga-1440.png) */}
      {activeTab === "links" && (
        <div>
          {/* Top Bar under sub-nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 14,
              borderBottom: "1px solid var(--ui-border)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setActiveTab("calendario")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ui-text-4)",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ‹ Links
              </button>

              <button
                type="button"
                onClick={handleCopyBioLink}
                title="Copiar el link"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                  hubly.app/@{brandHandle}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--hb-accent-text)" }}>
                  {copiedBio ? "¡Copiado!" : "Copiar"}
                </span>
              </button>

              <Link
                href={`/share/${shareToken}`}
                onClick={handleOpenPortal}
                style={{
                  fontSize: 12.5,
                  color: "var(--ui-text-4)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Abrir
              </Link>

              <span
                style={{
                  background: "var(--hb-accent)",
                  color: "var(--on-accent)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 8,
                  transform: "rotate(-1deg)",
                  display: "inline-block",
                }}
              >
                Hubi ya la armó · pégala en tu perfil
              </span>
            </div>

            <Link
              href="/ajustes"
              style={{
                fontSize: 13,
                color: "var(--ui-text-4)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Ajustes
            </Link>
          </div>

          {/* 2-Column Bio-Link Builder Layout */}
          <div className="hubly-parrillas-builder">
            {/* Left Column: Builder */}
            <div style={{ paddingTop: 12 }}>
              {/* Underline Tabs: Contenido | Diseño | Números */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  borderBottom: "1px solid var(--ui-border)",
                  marginBottom: 18,
                }}
              >
                {(
                  [
                    { id: "contenido", label: "Contenido" },
                    { id: "diseno", label: "Diseño" },
                    { id: "numeros", label: "Números" },
                  ] as const
                ).map((t) => {
                  const active = linksSubTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLinksSubTab(t.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: active ? "2px solid var(--hb-accent)" : "2px solid transparent",
                        color: active ? "var(--hb-accent-text)" : "var(--ui-text-4)",
                        fontWeight: active ? 600 : 500,
                        fontSize: 13.5,
                        padding: "8px 0 12px",
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  marginBottom: 22,
                  flexWrap: "wrap",
                }}
              >
                {["+ Botón", "+ WhatsApp", "+ Productos", "+ Posts"].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => {
                      if (lbl === "+ WhatsApp") setEditingWhatsapp(true);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--hb-accent-text)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {lbl}
                  </button>
                ))}
                
              </div>

              {/* Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Card 1: Síguenos */}
                <div
                  style={{
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        fontSize: 15,
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      aria-label="Mover"
                    >
                      ⠿
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                        Síguenos
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ui-text-4)", marginTop: 2 }}>
                        Sitio y redes · 1 ícono
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    

                    {/* Toggle ON */}
                    <button
                      type="button"
                      title={siguenosEnabled ? "Apagar" : "Prender"}
                      onClick={() => setSiguenosEnabled(!siguenosEnabled)}
                      style={{
                        width: 38,
                        height: 22,
                        borderRadius: 999,
                        border: "none",
                        background: siguenosEnabled ? "var(--hb-accent)" : "var(--ui-border-strong)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: siguenosEnabled ? 19 : 3,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          background: "var(--ui-surface)",
                          transition: "left 0.15s ease",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Card 2: Escríbenos por WhatsApp */}
                <div
                  style={{
                    background: "var(--ui-surface)",
                    border: "1px solid var(--ui-border)",
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        fontSize: 15,
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      aria-label="Mover"
                    >
                      ⠿
                    </span>

                    {/* Green WhatsApp Rounded Square */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "#22C55E",
                        color: "#FFFFFF",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MessageCircle size={18} />
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ui-text-4)" }}>
                        Escríbenos por WhatsApp
                      </div>
                      {editingWhatsapp ? (
                        <input
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="+52 55 0000 0000"
                          onBlur={() => setEditingWhatsapp(false)}
                          autoFocus
                          style={{
                            marginTop: 4,
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--ui-border-strong)",
                            fontSize: 12.5,
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingWhatsapp(true)}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            marginTop: 2,
                            color: "var(--hb-accent-text)",
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {whatsappNumber || "Agrega el número de WhatsApp"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    

                    {/* Toggle OFF */}
                    <button
                      type="button"
                      title={whatsappEnabled ? "Apagar" : "Prender"}
                      onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                      style={{
                        width: 38,
                        height: 22,
                        borderRadius: 999,
                        border: "none",
                        background: whatsappEnabled ? "var(--hb-accent)" : "var(--ui-border-strong)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: whatsappEnabled ? 19 : 3,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          background: "var(--ui-surface)",
                          transition: "left 0.15s ease",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: iPhone Bio-Link Mockup Preview */}
            <div
              style={{
                borderLeft: "1px solid var(--ui-border)",
                paddingLeft: 32,
                paddingTop: 24,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 332,
                  minHeight: 620,
                  borderRadius: 32,
                  background: "var(--ui-surface)",
                  border: "1px solid var(--ui-muted)",
                  boxShadow: "0 12px 40px rgba(15, 23, 42, 0.06)",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--ui-text)",
                    margin: "0 0 8px",
                  }}
                >
                  {brandName}
                </h1>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: "var(--ui-text-4)",
                    margin: "0 0 18px",
                  }}
                >
                  {activeBrand?.core?.whatTheySell || "Agrega una descripción en Núcleo de Marca."}
                </p>

                {siguenosEnabled && (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "var(--hb-accent)",
                      color: "#FFFFFF",
                      display: "grid",
                      placeItems: "center",
                      marginBottom: 24,
                    }}
                  >
                    <Globe size={18} />
                  </div>
                )}

                {whatsappEnabled && (
                  <div
                    style={{
                      padding: "11px 14px",
                      borderRadius: 12,
                      background: "#22C55E",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                      marginBottom: 20,
                    }}
                  >
                    Escríbenos por WhatsApp
                  </div>
                )}

                <div
                  style={{
                    marginTop: 20,
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--ui-text-4)",
                  }}
                >
                  hecho con{" "}
                  <strong
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ui-text-4)",
                    }}
                  >
                    hubly
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ideas" && <IdeasBoard brandId={activeBrand?.id || ""} brandName={brandName} />}
      {activeTab === "mensajes" && <PostInbox key={activeBrand?.id} posts={brandPosts} />}
      {activeTab === "analytics" && <OrganicAnalytics posts={brandPosts} />}
      {activeTab === "tableros" && <ProductionBoard posts={brandPosts} />}

      {importModalOpen && activeBrand && (
        <ImportMonthModal brand={activeBrand} posts={posts} onClose={() => setImportModalOpen(false)} />
      )}

      {/* Modal: Cuentas conectadas */}
      {accountsModalOpen && (
        <div
          onClick={() => setAccountsModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "var(--ui-surface)",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 24px 48px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                Cuentas de {brandName}
              </h3>
              <button
                type="button"
                onClick={() => setAccountsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-4)" }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ui-text-4)", marginBottom: 14 }}>
              Conecta o administra los perfiles oficiales de tu cliente.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Instagram", "Facebook", "TikTok", "LinkedIn"].map((net) => (
                <div
                  key={net}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{net}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountsModalOpen(false);
                      handleConnectNetwork(net);
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--hb-accent)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Conectar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
