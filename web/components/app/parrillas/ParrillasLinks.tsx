"use client";

import Link from "next/link";
import React, { useState } from "react";
import { HublyChatIcon as MessageCircle } from "@/components/app/icons/DuotoneIcons";
import { copyText } from "@/lib/clipboard";
import { formatBrandBioUrl } from "@/lib/domain/posts";
import { ParrillasBioMockup } from "./ParrillasBioMockup";

const LINKS_SUBTABS = [
  { id: "contenido", label: "Contenido" },
  { id: "diseno", label: "Diseño" },
  { id: "numeros", label: "Números" },
] as const;

const BIO_ADD_ACTIONS = ["+ Botón", "+ WhatsApp", "+ Productos", "+ Posts"] as const;

interface ParrillasLinksProps {
  brandName: string;
  brandHandle: string;
  brandDescription?: string;
  shareToken: string;
  onBack: () => void;
  onOpenPortal: (e: React.MouseEvent) => void;
}

export function ParrillasLinks({
  brandName,
  brandHandle,
  brandDescription,
  shareToken,
  onBack,
  onOpenPortal,
}: ParrillasLinksProps) {
  const [copiedBio, setCopiedBio] = useState(false);
  const [linksSubTab, setLinksSubTab] = useState<"contenido" | "diseno" | "numeros">("contenido");
  const [siguenosEnabled, setSiguenosEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);

  const handleCopyBioLink = () => {
    if (typeof window === "undefined") return;
    void copyText(formatBrandBioUrl(brandHandle)).then((ok) => {
      if (!ok) return;
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    });
  };

  return (
    <div>
      <div className="hubly-parrillas-links-topbar">
        <div className="hubly-parrillas-links-bar-left">
          <button
            type="button"
            onClick={onBack}
            className="hubly-parrillas-links-back"
          >
            ‹ Links
          </button>

          <button
            type="button"
            onClick={handleCopyBioLink}
            title="Copiar el link"
            className="hubly-parrillas-links-copy"
          >
            <span className="hubly-parrillas-links-handle">
              hubly.app/@{brandHandle}
            </span>
            <span className="hubly-parrillas-links-copy-label">
              {copiedBio ? "¡Copiado!" : "Copiar"}
            </span>
          </button>

          <Link
            href={`/share/${shareToken}`}
            onClick={onOpenPortal}
            className="hubly-parrillas-links-open"
          >
            Abrir
          </Link>

          <span className="hubly-parrillas-links-pill">
            Hubi ya la armó · pégala en tu perfil
          </span>
        </div>

        <Link href="/ajustes" className="hubly-parrillas-links-settings">
          Ajustes
        </Link>
      </div>

      <div className="hubly-parrillas-builder">
        <div className="hubly-parrillas-links-main">
          <div className="hubly-parrillas-links-subtabs">
            {LINKS_SUBTABS.map((t) => {
              const active = linksSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLinksSubTab(t.id)}
                  className={`hubly-parrillas-links-subtab${active ? " is-active" : ""}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="hubly-parrillas-links-add-row">
            {BIO_ADD_ACTIONS.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  if (lbl === "+ WhatsApp") setEditingWhatsapp(true);
                }}
                className="hubly-parrillas-links-add-btn"
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="hubly-parrillas-links-cards">
            <div className="hubly-parrillas-links-card">
              <div className="hubly-parrillas-links-card-left">
                <span className="hubly-parrillas-links-drag" aria-label="Mover">
                  ⠿
                </span>
                <div>
                  <div className="hubly-parrillas-links-card-title">Síguenos</div>
                  <div className="hubly-parrillas-links-card-meta">Sitio y redes · 1 ícono</div>
                </div>
              </div>

              <div className="hubly-parrillas-links-card-left">
                <button
                  type="button"
                  title={siguenosEnabled ? "Apagar" : "Prender"}
                  onClick={() => setSiguenosEnabled(!siguenosEnabled)}
                  className={`hubly-parrillas-links-toggle${siguenosEnabled ? " is-on" : ""}`}
                >
                  <span className="hubly-parrillas-links-toggle-knob" />
                </button>
              </div>
            </div>

            <div className="hubly-parrillas-links-card">
              <div className="hubly-parrillas-links-card-left">
                <span className="hubly-parrillas-links-drag" aria-label="Mover">
                  ⠿
                </span>

                <div className="hubly-parrillas-links-wa-icon">
                  <MessageCircle size={18} />
                </div>

                <div>
                  <div className="hubly-parrillas-links-card-title is-muted">
                    Escríbenos por WhatsApp
                  </div>
                  {editingWhatsapp ? (
                    <input
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+52 55 0000 0000"
                      onBlur={() => setEditingWhatsapp(false)}
                      autoFocus
                      className="hubly-parrillas-links-wa-input"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingWhatsapp(true)}
                      className="hubly-parrillas-links-wa-trigger"
                    >
                      {whatsappNumber || "Agrega el número de WhatsApp"}
                    </button>
                  )}
                </div>
              </div>

              <div className="hubly-parrillas-links-card-left">
                <button
                  type="button"
                  title={whatsappEnabled ? "Apagar" : "Prender"}
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`hubly-parrillas-links-toggle${whatsappEnabled ? " is-on" : ""}`}
                >
                  <span className="hubly-parrillas-links-toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <ParrillasBioMockup
          brandName={brandName}
          description={brandDescription}
          siguenosEnabled={siguenosEnabled}
          whatsappEnabled={whatsappEnabled}
        />
      </div>
    </div>
  );
}
