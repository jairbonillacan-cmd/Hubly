"use client";

import React, { useState } from "react";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import Link from "next/link";

const REPORT_PEEK = [
  { label: "Instagram", value: 84 },
  { label: "TikTok", value: 62 },
  { label: "Facebook", value: 37 },
  { label: "LinkedIn", value: 21 },
];

/** Calendario sin datos todavía: conectar redes, importar el mes o compartir la parrilla. */
export function ParrillaOnboarding({
  setShowDemoData,
  setImportModalOpen,
  copiedLink,
  connectingNet,
  brandName,
  shareToken,
  handleCopyClientLink,
  handleConnectNetwork,
}: {
  setShowDemoData: React.Dispatch<React.SetStateAction<boolean>>;
  setImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  copiedLink: boolean;
  connectingNet: string | null;
  brandName: string;
  shareToken: string;
  handleCopyClientLink: (e?: React.MouseEvent) => Promise<void>;
  handleConnectNetwork: (netName: string) => void;
}) {
  const [moreNetworksOpen, setMoreNetworksOpen] = useState(false);

  return (
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
              color: "var(--on-accent)",
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
            color: "var(--on-accent)",
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
                  color: "var(--on-accent)",
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
                  stroke="#E1306C" // ui-ok: color de marca de Instagram
                  strokeWidth="2.2"
                />
                <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2.2" /> {/* ui-ok: color de marca de Instagram */}
                <circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C" /> {/* ui-ok: color de marca de Instagram */}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"> {/* ui-ok: color de marca de Facebook */}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"> {/* ui-ok: color de marca de LinkedIn */}
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
            {copiedLink ? "Liga copiada. Abriendo portal…" : "Mandarle la liga a mi cliente"}
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
                  fontSize: 14,
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
                    color: "var(--on-accent)",
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
  );
}
