"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  MessageCircle,
  BarChart2,
  LayoutGrid,
  Presentation,
  Link2,
  Play,
  Volume2,
  VolumeX,
  CheckCircle2,
  MessageSquareWarning,
  Edit3,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Home,
  List,
  Globe,
  ChevronDown,
  X,
  ArrowLeft,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { Cover } from "@/components/Cover";
import { STATUS_META } from "@/components/app/social/status-meta";
import { PostMonthCalendar } from "@/components/app/social/PostMonthCalendar";
import { IdeasBoard } from "@/components/app/social/IdeasBoard";
import { ProductionBoard } from "@/components/app/social/ProductionBoard";
import { PostInbox } from "@/components/app/social/PostInbox";
import { OrganicAnalytics } from "@/components/app/social/OrganicAnalytics";

type SocialSubTab =
  | "calendario"
  | "ideas"
  | "mensajes"
  | "analytics"
  | "tableros"
  | "reportes"
  | "links";

export default function ParrillasPage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const posts = useHublyStore((s) => s.posts);
  const openComposer = useHublyStore((s) => s.openComposer);
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);
  const approveAllBrandPosts = useHublyStore((s) => s.approveAllBrandPosts);

  const [activeTab, setActiveTab] = useState<SocialSubTab>("calendario");
  const [showDemoData, setShowDemoData] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"mes" | "tarjetas">("mes");
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const [moreNetworksOpen, setMoreNetworksOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
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
    activeBrand?.name && activeBrand.name !== "Café Bruma" ? activeBrand.name : "Min";
  const brandHandle =
    activeBrand?.bioLink?.handle && activeBrand.bioLink.handle !== "cafebruma"
      ? activeBrand.bioLink.handle
      : "min";
  const shareToken = activeBrand?.shareToken || "min-nov";
  const brandPosts = posts.filter((p) => p.brandId === activeBrand?.id);

  // Quien acaba de usar el editor debe ver su post en el calendario.
  useEffect(() => {
    if (composerOpen) setShowDemoData(true);
  }, [composerOpen]);

  const handleCopyClientLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/share/${shareToken}`;
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
      icon: (
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "#6C77C1",
            color: "#fff",
            display: "inline-grid",
            placeItems: "center",
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          17
        </span>
      ),
    },
    { id: "ideas", label: "Ideas", icon: <Sparkles size={14} /> },
    { id: "mensajes", label: "Mensajes", icon: <MessageCircle size={14} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={14} /> },
    { id: "tableros", label: "Tableros", icon: <LayoutGrid size={14} /> },
    { id: "reportes", label: "Reportes", icon: <Presentation size={14} /> },
    { id: "links", label: "Links", icon: <Link2 size={14} /> },
  ];

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#0F172A",
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
          borderBottom: "1px solid #E2E8F0",
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
            background: "#F1F5F9",
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
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: isActive ? "#FFFFFF" : "transparent",
                  color: isActive ? "#6C77C1" : "#475569",
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
            color: "#334155",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Link2 size={14} style={{ color: "#64748B" }} />
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
                  background: "#6C77C1",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-grid",
                  placeItems: "center",
                }}
              >
                1
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                Conecta una red
              </span>
            </div>

            <div style={{ width: 32, height: 1, background: "#E2E8F0" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "#F1F5F9",
                  color: "#94A3B8",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-grid",
                  placeItems: "center",
                }}
              >
                2
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "#94A3B8" }}>
                Hubi arma tu reporte
              </span>
            </div>

            <div style={{ width: 32, height: 1, background: "#E2E8F0" }} />

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "#F1F5F9",
                  color: "#94A3B8",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-grid",
                  placeItems: "center",
                }}
              >
                3
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: "#94A3B8" }}>
                Tu primer post
              </span>
            </div>
          </div>

          {/* Grey Banner: Traer mi mes */}
          <section
            style={{
              background: "#F4F5F8",
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
            <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>
              <strong style={{ color: "#0F172A", fontWeight: 700 }}>
                ¿Ya tienes el mes de {brandName} en Excel, Notion o Canva?
              </strong>{" "}
              Tráelo tal cual: Hubi lo acomoda en tu calendario en 30 segundos.
            </div>
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              style={{
                background: "#6C77C1",
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
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 480px) minmax(0, 560px)",
              gap: 48,
              alignItems: "start",
              justifyContent: "space-between",
            }}
          >
            {/* Left Column */}
            <div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0F172A",
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
                      background: "#6C77C1",
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
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>Conecta una red</span>
                  <span style={{ color: "#6C77C1", fontSize: 12.5, fontWeight: 600 }}>
                    ← estás aquí
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "#ECEEF8",
                      color: "#5A65AF",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <span style={{ color: "#334155" }}>
                    Hubi arma su parrilla y su reporte, solos
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "#EDE9FE",
                      color: "#7C3AED",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    3
                  </span>
                  <span style={{ color: "#334155" }}>
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
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
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
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
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
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A">
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
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
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
                  color: "#6C77C1",
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
                          border: "1px solid #CBD5E1",
                          background: "#FFFFFF",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#0F172A",
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
                  background: "#F8FAFC",
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
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M9 12c0-4.5 3-7 7-7s7 2.5 7 7v2H9v-2z"
                      fill="#0F172A"
                    />
                    <rect
                      x="10"
                      y="11"
                      width="12"
                      height="13"
                      rx="6"
                      fill="#FFFFFF"
                      stroke="#0F172A"
                      strokeWidth="1.8"
                    />
                    <rect
                      x="11.5"
                      y="14"
                      width="3.8"
                      height="2.8"
                      rx="0.8"
                      stroke="#0F172A"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="16.7"
                      y="14"
                      width="3.8"
                      height="2.8"
                      rx="0.8"
                      stroke="#0F172A"
                      strokeWidth="1.4"
                    />
                    <line x1="15.3" y1="15.2" x2="16.7" y2="15.2" stroke="#0F172A" strokeWidth="1.4" />
                    <path d="M14 20c1.2.8 2.8.8 4 0" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#475569" }}>
                  <strong style={{ color: "#0F172A", fontWeight: 700 }}>
                    Conectar es 100% seguro.
                  </strong>{" "}
                  Hubly es una app aprobada por cada plataforma: entras con su login oficial, tu
                  contraseña nunca pasa por aquí y desconectas en un clic cuando quieras.
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
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                <span style={{ fontSize: 12.5, color: "#64748B" }}>o</span>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              </div>

              {/* Mandarle la liga a mi cliente */}
              <Link
                href={`/share/${shareToken}`}
                onClick={handleCopyClientLink}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#0F172A",
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
                  color: "#64748B",
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
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#6C77C1",
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

            {/* Right Column: MARIANA · 13 S Video Card + CTA Card */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "#64748B",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                MARIANA · 13 S
              </div>

              {/* 16:9 Video Preview Card */}
              <div
                onClick={() => setVideoPlaying(!videoPlaying)}
                aria-label="Ver el video"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setVideoPlaying(!videoPlaying);
                }}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#B57C2A",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
                }}
              >
                {/* Studio Background & Mariana Illustration matching 10-social-media-calendario-1440.png */}
                <svg
                  viewBox="0 0 550 310"
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                  style={{ display: "block" }}
                >
                  {/* Warm mustard studio wall */}
                  <rect width="550" height="310" fill="#B87D24" />
                  <rect x="440" y="0" width="110" height="310" fill="#9E681A" />
                  {/* White board edge on far left */}
                  <rect x="0" y="0" width="58" height="310" fill="#E2E8F0" />
                  <rect x="0" y="75" width="44" height="100" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />

                  {/* Wooden Bookshelf Frame */}
                  <rect x="60" y="0" width="12" height="310" fill="#4A3219" />
                  <rect x="255" y="0" width="10" height="310" fill="#4A3219" />
                  <rect x="425" y="0" width="12" height="310" fill="#4A3219" />
                  <rect x="520" y="0" width="10" height="310" fill="#3B2611" />

                  {/* Shelf 1 (Top) */}
                  <rect x="60" y="58" width="375" height="10" fill="#3E2813" />
                  {/* Soccer balls & basketball on top shelf */}
                  <circle cx="102" cy="36" r="20" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
                  <circle cx="102" cy="36" r="7" fill="#EF4444" />
                  <circle cx="225" cy="34" r="22" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
                  <path d="M212 24 L225 34 L238 24" stroke="#16A34A" strokeWidth="4" fill="none" />
                  <circle cx="305" cy="38" r="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                  <circle cx="385" cy="36" r="20" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" />
                  <rect x="398" y="42" width="45" height="14" fill="#FACC15" />

                  {/* Shelf 2 (Middle) */}
                  <rect x="60" y="165" width="375" height="10" fill="#3E2813" />
                  {/* Stack of books + Blue Vintage Model Car on left */}
                  <rect x="92" y="148" width="115" height="8" fill="#1E293B" />
                  <rect x="96" y="139" width="108" height="9" fill="#EAB308" />
                  <rect x="100" y="130" width="100" height="9" fill="#F8FAFC" />
                  {/* Blue classic toy car */}
                  <path
                    d="M110 130 L122 114 L162 114 L176 130 Z"
                    fill="#38BDF8"
                  />
                  <rect x="102" y="123" width="84" height="9" rx="4" fill="#0284C7" />
                  <circle cx="120" cy="131" r="6" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2" />
                  <circle cx="168" cy="131" r="6" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2" />

                  {/* Stack of books on right shelf */}
                  <rect x="335" y="150" width="82" height="14" fill="#7F1D1D" />
                  <rect x="340" y="138" width="74" height="12" fill="#F8FAFC" />
                  <rect x="344" y="126" width="68" height="12" fill="#1E3A8A" />

                  {/* Shelf 3 (Bottom) */}
                  <rect x="60" y="275" width="375" height="10" fill="#3E2813" />
                  {/* Vintage brown leather chest */}
                  <rect x="85" y="218" width="96" height="57" rx="4" fill="#5C3A21" stroke="#3B2313" strokeWidth="2" />
                  <rect x="125" y="238" width="16" height="12" rx="2" fill="#5A65AF" />

                  {/* Mariana (Center Presenter) */}
                  {/* Long dark brown hair back */}
                  <path
                    d="M225 92 C215 150 212 220 218 280 L345 280 C348 220 345 150 335 92 Z"
                    fill="#2A1B12"
                  />
                  {/* Light grey t-shirt shoulders & torso */}
                  <path
                    d="M175 310 C182 238 215 212 280 212 C345 212 378 238 385 310 Z"
                    fill="#CBD5E1"
                  />
                  {/* Neck */}
                  <rect x="262" y="168" width="36" height="52" rx="14" fill="#E5B899" />
                  {/* Face */}
                  <ellipse cx="280" cy="122" rx="42" ry="52" fill="#ECC3A5" />
                  {/* Hair front parting */}
                  <path
                    d="M238 115 C242 75 268 66 282 68 C302 66 322 80 324 125 C318 98 302 82 282 82 C260 82 245 96 238 115 Z"
                    fill="#23150E"
                  />
                  {/* Eyebrows & Eyes */}
                  <path d="M254 106 Q264 101 272 105" stroke="#2A1B12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M288 105 Q296 101 306 106" stroke="#2A1B12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <ellipse cx="263" cy="115" rx="5" ry="3.5" fill="#1E1B18" />
                  <ellipse cx="297" cy="115" rx="5" ry="3.5" fill="#1E1B18" />
                  {/* Warm smile */}
                  <path
                    d="M266 146 Q280 156 294 146"
                    stroke="#B95846"
                    strokeWidth="3"
                    fill="#FFFFFF"
                    strokeLinecap="round"
                  />
                  {/* Black wireless lapel mic on collar */}
                  <rect
                    x="232"
                    y="216"
                    width="22"
                    height="24"
                    rx="5"
                    transform="rotate(-18 232 216)"
                    fill="#1E293B"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  {/* Presenter gesturing hands */}
                  <ellipse cx="285" cy="282" rx="26" ry="20" fill="#E5B899" />
                </svg>

                {/* Top-left 13 s pill */}
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    background: "rgba(255, 255, 255, 0.94)",
                    color: "#0F172A",
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  }}
                >
                  {videoPlaying ? "Reproduciendo · 13 s" : "13 s"}
                </span>

                {/* Center Yellow Play Button (56x56px, #6C77C1) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 999,
                      background: "#6C77C1",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                      transform: videoPlaying ? "scale(0.92)" : "scale(1)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <Play size={22} fill="#0F172A" color="#0F172A" style={{ marginLeft: 2 }} />
                  </div>
                </div>

                {/* Bottom-right Mute Button */}
                <button
                  type="button"
                  aria-label="Silenciar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoMuted(!videoMuted);
                  }}
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: "rgba(255, 255, 255, 0.92)",
                    border: "none",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    color: "#0F172A",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  {videoMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
              </div>

              {/* Caption below video */}
              <div
                style={{
                  fontSize: 12.5,
                  color: "#475569",
                  margin: "10px 0 18px",
                }}
              >
                Tu reporte, listo para presentar.
              </div>

              {/* Bottom Card: ¿Te dejo lista Min? */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                {/* Mariana circular avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "#B87D24",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 2px 6px rgba(15,23,42,0.1)",
                  }}
                >
                  <svg viewBox="0 0 44 44" width="44" height="44">
                    <rect width="44" height="44" fill="#B87D24" />
                    <path d="M10 44 C12 32 16 28 22 28 C28 28 32 32 34 44 Z" fill="#CBD5E1" />
                    <circle cx="22" cy="18" r="9" fill="#ECC3A5" />
                    <path d="M13 18 C13 10 18 8 22 8 C26 8 31 10 31 18 C29 13 26 11 22 11 C18 11 15 13 13 18 Z" fill="#23150E" />
                  </svg>
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: 2,
                    }}
                  >
                    ¿Te dejo lista {brandName}?
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      marginBottom: 12,
                    }}
                  >
                    En 15 minutos sales con tu reporte armado.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setShowDemoData(true)}
                      style={{
                        background: "#6C77C1",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Que me lo deje listo
                    </button>
                    <a
                      href="/chat"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#FFFFFF",
                        color: "#0F172A",
                        border: "1px solid #CBD5E1",
                        borderRadius: 10,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      Escribirle por WhatsApp
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
              padding: "14px 18px",
              background: "#F8FAFC",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowDemoData(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={14} />
                <span>Volver a Conectar red</span>
              </button>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                  Parrilla mensual de {brandName} ({brandPosts.length} publicaciones)
                </div>
                <div style={{ fontSize: 12.5, color: "#64748B" }}>
                  Datos de ejemplo interactivos · Aprueba, solicita cambios o programa nuevos posts
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => approveAllBrandPosts(activeBrand?.id || "brand-min", "Jair (Agencia)")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#15803D",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <CheckCircle2 size={14} />
                <span>Aprobar pendientes</span>
              </button>

              <Link
                href={`/share/${shareToken}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={14} />
                <span>Portal de cliente</span>
              </Link>

              <button
                type="button"
                onClick={() => openComposer(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#6C77C1",
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} />
                <span>Nuevo post</span>
              </button>
            </div>
          </div>

          <div role="group" aria-label="Vista de la parrilla" style={{ display: "inline-flex", gap: 2, background: "#F1F5F9", padding: 3, borderRadius: 10, marginBottom: 14 }}>
            {(["mes", "tarjetas"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={calendarMode === m}
                onClick={() => setCalendarMode(m)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: calendarMode === m ? "#FFFFFF" : "transparent",
                  color: calendarMode === m ? "#5360A5" : "#475569",
                }}
              >
                {m === "mes" ? "Mes" : "Tarjetas"}
              </button>
            ))}
          </div>

          {calendarMode === "mes" && <PostMonthCalendar posts={brandPosts} />}

          {calendarMode === "tarjetas" && <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: 16,
            }}
          >
            {brandPosts.map((post) => {
              const st = STATUS_META[post.status];
              return (
                <div
                  key={post.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ position: "relative", height: 195 }}>
                    <Cover kind={post.cover} />
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        right: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: st.bg,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {st.label}
                      </span>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "rgba(15, 23, 42, 0.78)",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {post.format}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11.5,
                        color: "#64748B",
                        marginBottom: 6,
                      }}
                    >
                      <span>
                        {post.scheduledDate} · {post.scheduledTime}
                      </span>
                      <span>{post.networks.join(" · ")}</span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
                      {post.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 12.5,
                        color: "#475569",
                        lineHeight: 1.5,
                        margin: "0 0 14px",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.caption}
                    </p>

                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: 12,
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updatePostStatus(post.id, "approved", "Aprobado en parrilla.", "Jair", "agency")
                        }
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "#6C77C1",
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Aprobar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updatePostStatus(post.id, "changes", undefined, "Jair", "agency")
                        }
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          background: "#FFFFFF",
                          color: "#334155",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <MessageSquareWarning size={13} />
                        <span>Cambios</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openComposer(post.id)}
                        style={{
                          padding: "7px 9px",
                          borderRadius: 8,
                          border: "1px solid #CBD5E1",
                          background: "#FFFFFF",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                        title="Editar"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      )}

      {/* TAB 6: REPORTES (10b-social-media-reportes-1440.png) */}
      {activeTab === "reportes" && (
        <div>
          {/* Secondary Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 14,
              borderBottom: "1px solid #E2E8F0",
              marginBottom: 48,
            }}
          >
            <button
              type="button"
              style={{
                width: 38,
                height: 32,
                borderRadius: 10,
                border: "none",
                background: "#F0F1F9",
                color: "#6C77C1",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <Home size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <MessageCircle size={15} />
                <span>Comentarios</span>
              </button>

              <div
                style={{
                  display: "inline-flex",
                  background: "#F1F5F9",
                  padding: 3,
                  borderRadius: 10,
                  gap: 2,
                }}
              >
                <button
                  type="button"
                  style={{
                    width: 28,
                    height: 26,
                    borderRadius: 7,
                    border: "none",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  style={{
                    width: 28,
                    height: 26,
                    borderRadius: 7,
                    border: "none",
                    background: "transparent",
                    color: "#64748B",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <List size={14} />
                </button>
              </div>

              <Link
                href="/reportes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#6C77C1",
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
                color: "#6C77C1",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6C77C1" strokeWidth="1.8">
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
                color: "#0F172A",
                margin: "0 0 6px",
              }}
            >
              No hay reportes aún
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "#64748B",
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
                background: "#6C77C1",
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
              borderBottom: "1px solid #E2E8F0",
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
                  color: "#64748B",
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
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  hubly.app/@{brandHandle}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#6C77C1" }}>
                  {copiedBio ? "¡Copiado!" : "Copiar"}
                </span>
              </button>

              <Link
                href={`/share/${shareToken}`}
                style={{
                  fontSize: 12.5,
                  color: "#64748B",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Abrir
              </Link>

              <span
                style={{
                  background: "#6C77C1",
                  color: "#0F172A",
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
                color: "#64748B",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Ajustes
            </Link>
          </div>

          {/* 2-Column Bio-Link Builder Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 390px",
              gap: 32,
              minHeight: 680,
            }}
          >
            {/* Left Column: Builder */}
            <div style={{ paddingTop: 12 }}>
              {/* Underline Tabs: Contenido | Diseño | Números */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  borderBottom: "1px solid #E2E8F0",
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
                        borderBottom: active ? "2px solid #6C77C1" : "2px solid transparent",
                        color: active ? "#6C77C1" : "#64748B",
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
                      color: "#6C77C1",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {lbl}
                  </button>
                ))}
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Más ▾
                </button>
              </div>

              {/* Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Card 1: Síguenos */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
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
                        color: "#94A3B8",
                        fontSize: 15,
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      aria-label="Mover"
                    >
                      ⠿
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        Síguenos
                      </div>
                      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                        Sitio y redes · 1 ícono
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button
                      type="button"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748B",
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Editar
                    </button>

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
                        background: siguenosEnabled ? "#6C77C1" : "#CBD5E1",
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
                          background: "#FFFFFF",
                          transition: "left 0.15s ease",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Card 2: Escríbenos por WhatsApp */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
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
                        color: "#94A3B8",
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
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#94A3B8" }}>
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
                            border: "1px solid #CBD5E1",
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
                            color: "#6C77C1",
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
                    <button
                      type="button"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748B",
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Más
                    </button>

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
                        background: whatsappEnabled ? "#6C77C1" : "#CBD5E1",
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
                          background: "#FFFFFF",
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
                borderLeft: "1px solid #E2E8F0",
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
                  background: "#FFFFFF",
                  border: "1px solid #F1F5F9",
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
                    color: "#0F172A",
                    margin: "0 0 8px",
                  }}
                >
                  {brandName}
                </h1>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: "#64748B",
                    margin: "0 0 18px",
                  }}
                >
                  Mineralia USA vende minerales, cristales o piezas decorativas de origen natural —
                  probablemente colecciones curadas para...
                </p>

                {siguenosEnabled && (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#6C77C1",
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
                    color: "#94A3B8",
                  }}
                >
                  hecho con{" "}
                  <strong
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#94A3B8",
                    }}
                  >
                    henry
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

      {/* Modal: Traer mi mes */}
      {importModalOpen && (
        <div
          onClick={() => setImportModalOpen(false)}
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
              maxWidth: 460,
              background: "#FFFFFF",
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
                Traer el mes de {brandName}
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>
              Pega tu tabla de Excel, enlace de Notion o presentación de Canva y Hubi acomoda cada
              publicación en el calendario automáticamente.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setShowDemoData(true);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#6C77C1",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Importar parrilla de ejemplo
              </button>
            </div>
          </div>
        </div>
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
              background: "#FFFFFF",
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
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>
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
                    border: "1px solid #E2E8F0",
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
                      background: "#6C77C1",
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
