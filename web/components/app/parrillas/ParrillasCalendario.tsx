"use client";

import React from "react";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { ParrillasConectarRedes } from "./ParrillasConectarRedes";

const REPORT_PEEK = [
  { label: "Instagram", value: 84 },
  { label: "TikTok", value: 62 },
  { label: "Facebook", value: 37 },
  { label: "LinkedIn", value: 21 },
];

interface ParrillasCalendarioProps {
  brandName: string;
  shareToken: string;
  connectingNet: string | null;
  onConnectNetwork: (netName: string) => void;
  onCopyClientLink: (e?: React.MouseEvent) => Promise<boolean> | void;
  onShowDemo: () => void;
  onOpenImport: () => void;
}

export function ParrillasCalendario({
  brandName,
  shareToken,
  connectingNet,
  onConnectNetwork,
  onCopyClientLink,
  onShowDemo,
  onOpenImport,
}: ParrillasCalendarioProps) {
  return (
    <div>
      <div className="hubly-parrillas-stepper">
        <div className="hubly-parrillas-step">
          <span className="hubly-parrillas-step-badge is-active">1</span>
          <span className="hubly-parrillas-step-label is-active">Conecta una red</span>
        </div>

        <div className="hubly-parrillas-step-line" />

        <div className="hubly-parrillas-step">
          <span className="hubly-parrillas-step-badge">2</span>
          <span className="hubly-parrillas-step-label">Hubi arma tu reporte</span>
        </div>

        <div className="hubly-parrillas-step-line" />

        <div className="hubly-parrillas-step">
          <span className="hubly-parrillas-step-badge">3</span>
          <span className="hubly-parrillas-step-label">Tu primer post</span>
        </div>
      </div>

      <section className="hubly-parrillas-import-banner">
        <div className="hubly-parrillas-import-copy">
          <strong>¿Ya tienes el mes de {brandName} en Excel, Notion o Canva?</strong>{" "}
          Tráelo tal cual: Hubi lo acomoda en tu calendario en 30 segundos.
        </div>
        <button
          type="button"
          onClick={onOpenImport}
          className="hubly-parrillas-import-btn"
        >
          Traer mi mes
        </button>
      </section>

      <section className="hubly-parrillas-cols">
        <ParrillasConectarRedes
          brandName={brandName}
          shareToken={shareToken}
          connectingNet={connectingNet}
          onConnectNetwork={onConnectNetwork}
          onCopyClientLink={onCopyClientLink}
          onShowDemo={onShowDemo}
        />

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

          <div className="hubly-parrillas-cta-card">
            <HublyCatAvatar size={44} />

            <div className="hubly-parrillas-cta-body">
              <div className="hubly-parrillas-cta-title">
                ¿Quieres ver {brandName} armada?
              </div>
              <div className="hubly-parrillas-cta-desc">
                Recorre la parrilla y el reporte con datos de ejemplo, sin conectar nada.
              </div>
              <div className="hubly-parrillas-cta-actions">
                <button
                  type="button"
                  onClick={onShowDemo}
                  className="hubly-parrillas-cta-primary"
                >
                  Probar con datos de ejemplo
                </button>
                <a
                  href="/chat"
                  target="_blank"
                  rel="noreferrer"
                  className="hubly-parrillas-cta-secondary"
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
