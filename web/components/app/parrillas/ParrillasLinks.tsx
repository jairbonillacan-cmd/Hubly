"use client";

import Link from "next/link";
import {
  HublyChatIcon as MessageCircle,
  HublyGlobeIcon as Globe,
} from "@/components/app/icons/DuotoneIcons";
import type { ParrillasPageModel } from "./useParrillasPage";

export function ParrillasLinks({ view }: { view: ParrillasPageModel }) {
  const { activeTab, setActiveTab, copiedBio, linksSubTab, setLinksSubTab, siguenosEnabled, setSiguenosEnabled, whatsappEnabled, setWhatsappEnabled, whatsappNumber, setWhatsappNumber, editingWhatsapp, setEditingWhatsapp, activeBrand, brandName, brandHandle, shareToken, handleOpenPortal, handleCopyBioLink } = view;

  return (
    <>
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
                  {activeBrand?.core?.whatTheySell || "Agrega una descripción en Núcleo de marca."}
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
    </>
  );
}
