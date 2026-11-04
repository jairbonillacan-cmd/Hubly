"use client";

import Link from "next/link";
import React, { useState } from "react";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";

const EXTRA_NETWORKS = ["YouTube", "X", "Threads", "Pinterest", "Reddit", "Google Business"] as const;

interface ParrillasConectarRedesProps {
  brandName: string;
  shareToken: string;
  connectingNet: string | null;
  onConnectNetwork: (netName: string) => void;
  onCopyClientLink: (e?: React.MouseEvent) => Promise<boolean> | void;
  onShowDemo: () => void;
}

export function ParrillasConectarRedes({
  brandName,
  shareToken,
  connectingNet,
  onConnectNetwork,
  onCopyClientLink,
  onShowDemo,
}: ParrillasConectarRedesProps) {
  const [moreNetworksOpen, setMoreNetworksOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleClientLinkClick = (e: React.MouseEvent) => {
    void Promise.resolve(onCopyClientLink(e)).then((ok) => {
      if (!ok) return;
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    });
  };

  return (
    <div>
      <h1 className="hubly-parrillas-heading">
        Conecta una red de {brandName}.
      </h1>

      <div className="hubly-parrillas-checklist">
        <div className="hubly-parrillas-checklist-row">
          <span className="hubly-parrillas-checklist-num is-active">1</span>
          <span className="hubly-parrillas-checklist-title">Conecta una red</span>
          <span className="hubly-parrillas-checklist-here">← estás aquí</span>
        </div>

        <div className="hubly-parrillas-checklist-row">
          <span className="hubly-parrillas-checklist-num">2</span>
          <span className="hubly-parrillas-checklist-text">
            Hubi arma su parrilla y su reporte, solos
          </span>
        </div>

        <div className="hubly-parrillas-checklist-row">
          <span className="hubly-parrillas-checklist-num">3</span>
          <span className="hubly-parrillas-checklist-text">
            Los ves, los compartes y lo pruebas
          </span>
        </div>
      </div>

      <div className="hubly-parrillas-net-grid">
        <button
          type="button"
          title="Conectar Instagram"
          onClick={() => onConnectNetwork("Instagram")}
          className="hubly-parrillas-net-btn"
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
          onClick={() => onConnectNetwork("Facebook")}
          className="hubly-parrillas-net-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
          </svg>
          <span>{connectingNet === "Facebook" ? "Conectando..." : "Facebook"}</span>
        </button>

        <button
          type="button"
          title="Conectar TikTok"
          onClick={() => onConnectNetwork("TikTok")}
          className="hubly-parrillas-net-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
          </svg>
          <span>{connectingNet === "TikTok" ? "Conectando..." : "TikTok"}</span>
        </button>

        <button
          type="button"
          title="Conectar LinkedIn"
          onClick={() => onConnectNetwork("LinkedIn")}
          className="hubly-parrillas-net-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
          <span>{connectingNet === "LinkedIn" ? "Conectando..." : "LinkedIn"}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMoreNetworksOpen(!moreNetworksOpen)}
        className="hubly-parrillas-more-toggle"
      >
        Más redes (YouTube, X, Threads, Pinterest, Reddit, Google Business) →
      </button>

      {moreNetworksOpen && (
        <div className="hubly-parrillas-more-grid">
          {EXTRA_NETWORKS.map((net) => (
            <button
              key={net}
              type="button"
              onClick={() => onConnectNetwork(net)}
              className="hubly-parrillas-more-btn"
            >
              {net}
            </button>
          ))}
        </div>
      )}

      <div className="hubly-parrillas-security-box">
        <div className="hubly-parrillas-security-avatar">
          <HublyCatAvatar size={26} />
        </div>
        <div className="hubly-parrillas-security-copy">
          <strong>La conexión directa todavía no está lista.</strong>{" "}
          Por ahora preparas, apruebas y publicas a mano. Cuando llegue, entrarás con el login
          oficial de cada red y tu contraseña nunca pasará por aquí.
        </div>
      </div>

      <div className="hubly-parrillas-divider">
        <div className="hubly-parrillas-divider-line" />
        <span className="hubly-parrillas-divider-text">o</span>
        <div className="hubly-parrillas-divider-line" />
      </div>

      <Link
        href={`/share/${shareToken}`}
        onClick={handleClientLinkClick}
        className="hubly-parrillas-client-link"
      >
        {copiedLink ? "¡Liga copiada! Abriendo portal..." : "Mandarle la liga a mi cliente"}
      </Link>

      <div className="hubly-parrillas-client-hint">
        Él autoriza desde su celular, sin crear cuenta.
      </div>

      <button
        type="button"
        onClick={onShowDemo}
        className="hubly-parrillas-demo-btn"
      >
        <span>Ver con datos de ejemplo →</span>
      </button>
    </div>
  );
}
