"use client";

import {
  HublyImageIcon,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";
import { ExampleTag, } from "./demoAnunciosPage-shared";
import type { DemoAnunciosPageModel } from "./useDemoAnunciosPage";

export function AnunciosTarjetas({ view }: { view: DemoAnunciosPageModel }) {
  const { viewMode, setSelectedAd, visibleAds } = view;

  return (
    <>
      {viewMode === "cards" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {visibleAds.map((ad) => (
            <div
              key={ad.id}
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Creative Poster Cover (330px height) */}
              <div style={{ position: "relative", height: 330, overflow: "hidden" }}>
                <div className="hubly-anuncio-portada" aria-hidden><HublyImageIcon size={28} /></div>

                {/* Top-Left Meta Infinity Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "var(--ui-surface)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.16)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.5 6.5C15.8 6.5 14.3 7.6 12.8 9.8C11.7 8.1 10.3 6.5 8.1 6.5C5.2 6.5 3 9 3 12.3C3 15.5 5.1 17.5 7.4 17.5C9.3 17.5 10.9 16.2 12.5 13.7C13.6 15.6 15 17.5 17.2 17.5C19.9 17.5 22 15 22 11.8C22 8.7 20 6.5 17.5 6.5ZM7.5 15.3C6.1 15.3 5.1 14.1 5.1 12.2C5.1 10.1 6.3 8.7 8 8.7C9.4 8.7 10.4 9.8 11.4 11.5C10.1 13.8 8.9 15.3 7.5 15.3ZM17.1 15.3C15.8 15.3 14.7 13.9 13.7 12.1C14.8 10.1 16 8.7 17.4 8.7C18.9 8.7 19.9 10 19.9 11.9C19.9 13.9 18.7 15.3 17.1 15.3Z"
                      fill="#0081FB"
                    />
                  </svg>
                </div>

                {/* Bottom Dark Gradient Overlay + Ad Title */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "32px 14px 12px",
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.84) 100%)",
                  }}
                >
                  <div
                    style={{
                      color: "#FFFFFF",
                      fontSize: 12.5,
                      fontWeight: 700,
                      lineHeight: 1.35,
                    }}
                  >
                    {ad.title}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "12px 14px 16px" }}>
                {/* Activo pill + Analizar button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#15803D",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {ad.status}
                    </span>
                    <ExampleTag />
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedAd(ad)}
                    style={{
                      background: "var(--hb-accent)",
                      color: "var(--on-accent)",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Ver ejemplo</span>
                  </button>
                </div>

                {/* Click 100 Progress Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingBottom: 12,
                    marginBottom: 10,
                    borderBottom: "1px solid var(--ui-muted)",
                  }}
                >
                  <span style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontWeight: 500 }}>
                    Click
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: "var(--ui-border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${ad.clickScore}%`,
                        height: "100%",
                        background: "#10B981",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tinta-exito)" }}>
                    {ad.clickScore}
                  </span>
                </div>

                {/* 5 Metrics Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12.5 }}>
                  {/* Row 1: Resultados */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Resultados
                    </span>
                    <span
                      style={{
                        background:
                          ad.resultadosBadgeColor === "green" ? "#DCFCE7" : "#E6F4FB",
                        color:
                          ad.resultadosBadgeColor === "green" ? "#15803D" : "var(--ui-accent-text)",
                        fontWeight: 700,
                        fontSize: 12,
                        padding: "1px 7px",
                        borderRadius: 6,
                      }}
                    >
                      {ad.resultados}
                    </span>
                  </div>

                  {/* Row 2: Gasto */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Gasto
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>{ad.gasto}</span>
                  </div>

                  {/* Row 3: Costo/Resultado */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Costo/Resultado
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>
                      {ad.costoResultado}
                    </span>
                  </div>

                  {/* Row 4: Clicks */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      Clicks
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>{ad.clicks}</span>
                  </div>

                  {/* Row 5: % Campaña */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--ui-text-4)",
                        borderBottom: "1px dashed var(--ui-border-strong)",
                      }}
                    >
                      % Campaña
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--ui-text)" }}>
                      {ad.pctCampana}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: FULL NUMERICAL COMPARISON TABLE */}
      {(viewMode === "table" || viewMode === "funnels") && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ui-surface-2)", borderBottom: "1px solid var(--ui-border)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Anuncio
                </th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Estado
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Click Score
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Resultados
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Gasto
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Costo/Resultado
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  Clicks
                </th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--ui-text-4)" }}>
                  % Campaña
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleAds.map((ad) => (
                <tr key={ad.id} style={{ borderBottom: "1px solid var(--ui-muted)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ui-text)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {ad.title}
                      <ExampleTag />
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#15803D",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 999,
                      }}
                    >
                      {ad.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--tinta-exito)",
                    }}
                  >
                    {ad.clickScore}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.resultados}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.gasto}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.costoResultado}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.clicks}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                    {ad.pctCampana}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Analizar Creativo con Hubi */}
    </>
  );
}
