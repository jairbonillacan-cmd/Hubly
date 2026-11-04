"use client";

import {
  HublyImageIcon,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";
import type { AnunciosViewMode, SampleAdCard } from "@/lib/domain/ads";

interface AnunciosTarjetasProps {
  viewMode: AnunciosViewMode;
  visibleAds: SampleAdCard[];
  onSelectAd: (ad: SampleAdCard) => void;
}

export function AnunciosTarjetas({
  viewMode,
  visibleAds,
  onSelectAd,
}: AnunciosTarjetasProps) {
  return (
    <>
      {viewMode === "cards" && (
        <div className="hubly-anuncios-cards-grid">
          {visibleAds.map((ad) => (
            <div key={ad.id} className="hubly-anuncios-card">
              <div className="hubly-anuncios-cover">
                <div className="hubly-anuncio-portada" aria-hidden>
                  <HublyImageIcon size={28} />
                </div>

                <div className="hubly-anuncios-meta-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.5 6.5C15.8 6.5 14.3 7.6 12.8 9.8C11.7 8.1 10.3 6.5 8.1 6.5C5.2 6.5 3 9 3 12.3C3 15.5 5.1 17.5 7.4 17.5C9.3 17.5 10.9 16.2 12.5 13.7C13.6 15.6 15 17.5 17.2 17.5C19.9 17.5 22 15 22 11.8C22 8.7 20 6.5 17.5 6.5ZM7.5 15.3C6.1 15.3 5.1 14.1 5.1 12.2C5.1 10.1 6.3 8.7 8 8.7C9.4 8.7 10.4 9.8 11.4 11.5C10.1 13.8 8.9 15.3 7.5 15.3ZM17.1 15.3C15.8 15.3 14.7 13.9 13.7 12.1C14.8 10.1 16 8.7 17.4 8.7C18.9 8.7 19.9 10 19.9 11.9C19.9 13.9 18.7 15.3 17.1 15.3Z"
                      fill="#0081FB"
                    />
                  </svg>
                </div>

                <div
                  className="hubly-anuncios-cover-overlay"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.84) 100%)",
                  }}
                >
                  <div className="hubly-anuncios-cover-title">{ad.title}</div>
                </div>
              </div>

              <div className="hubly-anuncios-card-body">
                <div className="hubly-anuncios-card-head">
                  <span className="hubly-anuncios-status-group">
                    <span className="hubly-anuncios-status-pill">{ad.status}</span>
                    <span className="hubly-anuncios-example-tag">Ejemplo</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectAd(ad)}
                    className="hubly-anuncios-example-btn"
                  >
                    <Sparkles size={12} />
                    <span>Ver ejemplo</span>
                  </button>
                </div>

                <div className="hubly-anuncios-score-row">
                  <span className="hubly-anuncios-score-label">Click</span>
                  <div className="hubly-anuncios-score-track">
                    <div
                      className="hubly-anuncios-score-fill"
                      style={{ width: `${ad.clickScore}%` }}
                    />
                  </div>
                  <span className="hubly-anuncios-score-val">{ad.clickScore}</span>
                </div>

                <div className="hubly-anuncios-metrics">
                  <div className="hubly-anuncios-metric-row">
                    <span className="hubly-anuncios-metric-label">Resultados</span>
                    <span
                      className="hubly-anuncios-result-badge"
                      data-color={ad.resultadosBadgeColor}
                    >
                      {ad.resultados}
                    </span>
                  </div>

                  <div className="hubly-anuncios-metric-row">
                    <span className="hubly-anuncios-metric-label">Gasto</span>
                    <span className="hubly-anuncios-metric-val">{ad.gasto}</span>
                  </div>

                  <div className="hubly-anuncios-metric-row">
                    <span className="hubly-anuncios-metric-label">Costo/Resultado</span>
                    <span className="hubly-anuncios-metric-val">{ad.costoResultado}</span>
                  </div>

                  <div className="hubly-anuncios-metric-row">
                    <span className="hubly-anuncios-metric-label">Clicks</span>
                    <span className="hubly-anuncios-metric-val">{ad.clicks}</span>
                  </div>

                  <div className="hubly-anuncios-metric-row">
                    <span className="hubly-anuncios-metric-label">% Campaña</span>
                    <span className="hubly-anuncios-metric-val">{ad.pctCampana}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(viewMode === "table" || viewMode === "funnels") && (
        <div className="hubly-anuncios-table-wrap">
          <table className="hubly-anuncios-table">
            <thead>
              <tr className="hubly-anuncios-table-head-row">
                <th className="hubly-anuncios-th">Anuncio</th>
                <th className="hubly-anuncios-th">Estado</th>
                <th className="hubly-anuncios-th is-right">Click Score</th>
                <th className="hubly-anuncios-th is-right">Resultados</th>
                <th className="hubly-anuncios-th is-right">Gasto</th>
                <th className="hubly-anuncios-th is-right">Costo/Resultado</th>
                <th className="hubly-anuncios-th is-right">Clicks</th>
                <th className="hubly-anuncios-th is-right">% Campaña</th>
              </tr>
            </thead>
            <tbody>
              {visibleAds.map((ad) => (
                <tr key={ad.id} className="hubly-anuncios-tr">
                  <td className="hubly-anuncios-td-title">
                    <span className="hubly-anuncios-td-title-inner">
                      {ad.title}
                      <span className="hubly-anuncios-example-tag">Ejemplo</span>
                    </span>
                  </td>
                  <td className="hubly-anuncios-td">
                    <span className="hubly-anuncios-status-pill is-table">
                      {ad.status}
                    </span>
                  </td>
                  <td className="hubly-anuncios-td-score">{ad.clickScore}</td>
                  <td className="hubly-anuncios-td-num">{ad.resultados}</td>
                  <td className="hubly-anuncios-td-num">{ad.gasto}</td>
                  <td className="hubly-anuncios-td-num">{ad.costoResultado}</td>
                  <td className="hubly-anuncios-td-num">{ad.clicks}</td>
                  <td className="hubly-anuncios-td-num">{ad.pctCampana}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
