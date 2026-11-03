"use client";

import { BuyerPersonas } from "@/components/app/marca/BuyerPersonas";
import React, { useState, useEffect } from "react";
import { useHublyStore } from "@/lib/store";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyBoltIcon as Zap,
  HublyCheckIcon as Check,
  HublyGlobeIcon as Globe,
  HublyPencilIcon as Pencil,
  HublyRefreshIcon as RefreshCw,
  HublySparkIcon,
  HublyTargetIcon as Target,
} from "@/components/app/icons/DuotoneIcons";
import { selectActiveBrand } from "@/lib/domain-selectors";


export default function MarcaCorePage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const updateBrandCore = useHublyStore((s) => s.updateBrandCore);

  const activeBrand = selectActiveBrand(brands, activeBrandId);

  const [whatTheySell, setWhatTheySell] = useState(activeBrand?.core?.whatTheySell ?? "");
  const [category, setCategory] = useState(activeBrand?.core?.category ?? "");
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Cada marca muestra lo suyo; cambiar de marca nunca arrastra el texto de otra.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setWhatTheySell(activeBrand?.core?.whatTheySell ?? "");
    setCategory(activeBrand?.core?.category ?? "");
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrand?.id]);

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2400);
  };

  const handleSaveBrand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeBrand) {
      updateBrandCore(activeBrand.id, { whatTheySell, category });
    }
    showToast("Guardado");
  };

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "8px 0 48px",
        color: "var(--ui-text)",
      }}
    >
      {savedToast && (
        <div
          role="status"
          className="hubly-pop"
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: "var(--layer-toast)",
            background: "var(--ui-surface)",
            color: "var(--ui-text)",
            border: "1px solid var(--ui-border)",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={15} style={{ color: "var(--hb-accent-text)" }} />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Top Card: ¿Qué vende {activeBrand?.name || "esta marca"}? */}
      <section
        style={{
          border: "1px solid var(--ui-border)",
          borderRadius: 18,
          padding: 24,
          background: "var(--ui-surface)",
          marginBottom: 28,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--ui-sky-soft)",
              color: "var(--hb-accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HublySparkIcon size={20} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: "0 0 2px 0",
                lineHeight: 1.3,
              }}
            >
              ¿Qué vende {activeBrand?.name || "esta marca"}?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--ui-text-4)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Es lo primero que leo antes de proponerte audiencias. Si no lo sé, lo que salga serían inventos — y prefiero preguntarte.
            </p>
          </div>
        </div>

        {/* SOBRE LA MARCA */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            SOBRE LA MARCA
          </label>
          <textarea
            value={whatTheySell}
            onChange={(e) => setWhatTheySell(e.target.value)}
            placeholder="Qué vende, a quién, qué problema le resuelve y qué la hace distinta."
            rows={4}
            style={{
              width: "100%",
              minHeight: 122,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-surface)",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ui-text-1)",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        {/* CATEGORÍA — opcional, la deduzco sola */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            CATEGORÍA{" "}
            <span
              style={{
                fontWeight: 400,
                color: "var(--ui-text-5)",
                letterSpacing: "normal",
                fontSize: 11.5,
              }}
            >
              — opcional, la deduzco sola
            </span>
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="botas y marroquinería de piel"
            style={{
              width: "100%",
              height: 44,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-surface)",
              fontSize: 14,
              color: "var(--ui-text-1)",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Buttons row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => handleSaveBrand()}
            style={{
              background: "var(--hb-accent)",
              color: "var(--on-accent)",
              fontSize: 13.5,
              fontWeight: 700,
              height: 40,
              padding: "0 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Guardar
          </button>
        </div>
      </section>

      {activeBrand && <BuyerPersonas brand={activeBrand} />}
    </div>
  );
}
