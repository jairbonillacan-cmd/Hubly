"use client";

import React, { useState } from "react";
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

interface DetailedPersona {
  id: string;
  initials: string;
  name: string;
  agePill: string;
  genderPill: string;
  citiesPill: string;
  quote: string;
  quoteSource: string;
  bio: string;
  painPoint: string;
  painSource: string;
  painUrl?: string;
  goal: string;
  goalSource: string;
  accepted: boolean;
}

const INITIAL_DETAILED_PERSONAS: DetailedPersona[] = [
  {
    id: "bp-min-1",
    initials: "FR",
    name: "Fernanda Ríos",
    agePill: "28-38",
    genderPill: "Mujer",
    citiesPill: "Guadalajara, Monterrey, CDMX",
    quote: "Quiero surtir mi tienda con piezas reales, no con lo que me mandan en la foto",
    quoteSource: "Búsqueda web",
    bio: "Fernanda tiene una tienda física de decoración y wellness en Guadalajara. Lleva dos años comprando minerales y cristales a distintos proveedores para revender, y su principal dolor es que lo que le llega nunca corresponde a lo que vio en pantalla. Busca un mayorista confiable con quien pueda armar una relación de largo plazo, no solo hacer una compra de prueba y llevarse una decepción.",
    painPoint: "small order to evaluate quality",
    painSource: "Búsqueda web",
    goal: "Quiero un proveedor que me mande fotos con escala real y medidas exactas, no ángulos que engañan",
    goalSource: "Búsqueda web",
    accepted: true,
  },
  {
    id: "bp-min-2",
    initials: "RC",
    name: "Rodrigo Castellanos",
    agePill: "32-45",
    genderPill: "Hombre",
    citiesPill: "CDMX, Querétaro, Puebla",
    quote: "Necesito lotes consistentes para proyectos de interiorismo sin que cada envío cambie de calidad",
    quoteSource: "Búsqueda web",
    bio: "Rodrigo dirige un estudio de interiorismo residencial y comercial en CDMX. Especifica cuarzos, geodas y piezas minerales de gran formato para lobbies, hoteles boutique y residencias. Su mayor fricción es tratar con distribuidores informales que no cumplen tiempos de entrega ni ofrecen facturación y catálogo con medidas reales por pieza.",
    painPoint: "wholesale crystals bulk pricing minimum order",
    painSource: "Búsqueda web ↗",
    painUrl: "https://www.reddit.com/r/Crystals/comments/1l0pagw/crystal_inventory_blowout_wholesale_prices_no/",
    goal: "Contar con un socio mayorista que garantice stock continuo, empaque seguro y catálogo actualizado por lote",
    goalSource: "Búsqueda web",
    accepted: true,
  },
  {
    id: "bp-min-3",
    initials: "CV",
    name: "Camila Vega",
    agePill: "25-34",
    genderPill: "Mujer",
    citiesPill: "Monterrey, Guadalajara, Mérida",
    quote: "Busco kits y piezas curadas listas para vender en mi tienda online sin comprar toneladas de un solo mineral",
    quoteSource: "Búsqueda web",
    bio: "Camila fundó una marca nativa digital de bienestar y rituales en casa. Vende sets de regalo con cristales, velas e inciensos a través de Instagram y Shopify. Quiere un proveedor mayorista con mínimos de compra accesibles y piezas estéticamente cuidadas que eleven el valor percibido de sus cajas de regalo.",
    painPoint: "curated crystal wholesale starter packs for boutiques",
    painSource: "Búsqueda web",
    goal: "Surtir colecciones pequeñas con margen atractivo para reventa y reposición rápida de los minerales más vendidos",
    goalSource: "Búsqueda web",
    accepted: true,
  },
];

const DEFAULT_ABOUT_TEXT = `Mineralia USA vende minerales, cristales o piezas decorativas de origen natural — probablemente colecciones curadas para retail y mayoreo, aunque el catálogo específico no es visible desde las señales disponibles. El cliente principal parece ser el comprador mayorista: dueños de tiendas de decoración, wellness o regalos que buscan surtir producto con identidad visual fuerte. (El perfil del consumidor final no es claro desde el sitio.)

El problema que resuelve es encontrar proveedores de piezas naturales con estética coherente y oferta de wholesale accesible. Lo que la distingue es su enfoque en selección natural y curaduría visual para comercios independientes.`;

const DEFAULT_CATEGORY = "minerales y cristales decorativos al mayoreo";

export default function MarcaCorePage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const updateBrandCore = useHublyStore((s) => s.updateBrandCore);

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const [whatTheySell, setWhatTheySell] = useState(DEFAULT_ABOUT_TEXT);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [personas, setPersonas] = useState<DetailedPersona[]>(INITIAL_DETAILED_PERSONAS);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2400);
  };

  const handleSaveBrand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeBrand) {
      updateBrandCore(activeBrand.id, { whatTheySell, category });
    }
    showToast("Guardado y audiencias actualizadas");
  };

  const handleReadWebsite = () => {
    setWhatTheySell(DEFAULT_ABOUT_TEXT);
    setCategory(DEFAULT_CATEGORY);
    showToast(`Señales leídas desde el sitio web de ${activeBrand?.name || "la marca"}`);
  };

  const handleRegenerate = () => {
    setPersonas((prev) => [...prev]);
    showToast("3 buyer personas regeneradas con señales web");
  };

  const handleAcceptAll = () => {
    setPersonas((prev) => prev.map((p) => ({ ...p, accepted: true })));
    showToast("3 buyer personas aceptadas en el Núcleo de Marca");
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
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 80,
            background: "#0F172A",
            color: "#FFFFFF",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
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
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
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
              background: "#E6F4FB",
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
              color: "#FFFFFF",
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
            Guardar y proponerme audiencias
          </button>

          <button
            type="button"
            onClick={handleReadWebsite}
            style={{
              background: "var(--ui-surface)",
              color: "var(--ui-text-2)",
              fontSize: 13.5,
              fontWeight: 600,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid var(--ui-border)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Globe size={15} style={{ color: "var(--ui-text-3)" }} />
            <span>Léelo de mi sitio web</span>
          </button>
        </div>
      </section>

      {/* Buyer Personas Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
          padding: "0 4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <HublyCatAvatar size={36} />
          <div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--ui-text)",
                margin: "0 0 2px 0",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              Identifiqué 3 buyer personas
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--ui-text-4)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Revísalas y acéptalas para seguir con el análisis de tu audiencia.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={handleRegenerate}
            style={{
              background: "var(--ui-surface)",
              border: "1px solid var(--ui-border)",
              borderRadius: 12,
              height: 42,
              padding: "0 18px",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--ui-text-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} style={{ color: "var(--ui-text-3)" }} />
            <span>Volver a generar</span>
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            style={{
              background: "var(--hb-accent)",
              border: "none",
              borderRadius: 12,
              height: 40,
              padding: "0 20px",
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--ui-text)",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
            }}
          >
            <Check size={15} strokeWidth={2.5} />
            <span>Aceptar</span>
          </button>
        </div>
      </div>

      {/* Buyer Persona Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {personas.map((persona) => {
          const isEditing = editingId === persona.id;
          return (
            <article
              key={persona.id}
              style={{
                border: "1px solid var(--ui-border)",
                borderRadius: 18,
                padding: 24,
                background: "var(--ui-surface)",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
              }}
            >
              {/* Card Top Row: Avatar + Name + Pills + Editar button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "#16324F",
                      color: "#FFFFFF",
                      fontSize: 17,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <span>{persona.initials}</span>
                    {/* Subtle corner ring accent matching 07-brand-core-1440.png */}
                    <span
                      style={{
                        position: "absolute",
                        right: -4,
                        bottom: -4,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "1.5px solid rgba(255,255,255,0.45)",
                      }}
                    />
                  </div>

                  <div>
                    <h4
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--ui-text)",
                        margin: "0 0 8px 0",
                        lineHeight: 1.25,
                      }}
                    >
                      {persona.name}
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {[persona.agePill, persona.genderPill, persona.citiesPill].map((pill) => (
                        <span
                          key={pill}
                          style={{
                            background: "var(--ui-muted)",
                            color: "var(--ui-text-2)",
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: 999,
                          }}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : persona.id)}
                  style={{
                    background: "var(--ui-accent-soft)",
                    color: "var(--hb-accent-text)",
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={12} />
                  <span>{isEditing ? "Listo" : "Editar"}</span>
                </button>
              </div>

              {/* Blockquote with yellow left border */}
              <blockquote
                style={{
                  borderLeft: "3px solid var(--hb-accent)",
                  paddingLeft: 14,
                  margin: "0 0 16px 0",
                }}
              >
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--ui-text-1)",
                    lineHeight: 1.5,
                    marginBottom: 6,
                  }}
                >
                  {persona.quote}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    background: "#F0FDFA",
                    color: "#0F766E",
                    border: "1px dashed #99F6E4",
                    borderRadius: 999,
                    padding: "2px 9px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {persona.quoteSource}
                </span>
              </blockquote>

              {/* Narrative paragraph */}
              {isEditing ? (
                <textarea
                  value={persona.bio}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPersonas((prev) =>
                      prev.map((p) => (p.id === persona.id ? { ...p, bio: val } : p))
                    );
                  }}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--ui-text-2)",
                    marginBottom: 18,
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "var(--ui-text-2)",
                    margin: "0 0 18px 0",
                  }}
                >
                  {persona.bio}
                </p>
              )}

              {/* 2-Column Bottom Boxes: DOLOR PRINCIPAL & META PRINCIPAL */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {/* Left Box: DOLOR PRINCIPAL */}
                <div
                  style={{
                    background: "#F1F9FD",
                    border: "1px solid #BFE2F4",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--ui-accent-text-2)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    <Zap size={12} style={{ color: "var(--ui-accent-text-2)" }} />
                    <span>DOLOR PRINCIPAL</span>
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--ui-text)",
                      lineHeight: 1.45,
                      marginBottom: 8,
                    }}
                  >
                    {persona.painPoint}
                  </div>
                  {persona.painUrl ? (
                    <a
                      href={persona.painUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        background: "#F0FDFA",
                        color: "#0F766E",
                        border: "1px dashed #99F6E4",
                        borderRadius: 999,
                        padding: "2px 9px",
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {persona.painSource}
                    </a>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        background: "#F0FDFA",
                        color: "#0F766E",
                        border: "1px dashed #99F6E4",
                        borderRadius: 999,
                        padding: "2px 9px",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {persona.painSource}
                    </span>
                  )}
                </div>

                {/* Right Box: META PRINCIPAL */}
                <div
                  style={{
                    background: "var(--ui-surface-2)",
                    border: "1px solid var(--ui-border)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#16324F",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    <Target size={12} style={{ color: "#16324F" }} />
                    <span>META PRINCIPAL</span>
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--ui-text)",
                      lineHeight: 1.45,
                      marginBottom: 8,
                    }}
                  >
                    {persona.goal}
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#F0FDFA",
                      color: "#0F766E",
                      border: "1px dashed #99F6E4",
                      borderRadius: 999,
                      padding: "2px 9px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {persona.goalSource}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Action Button matching 07-brand-core.json */}
      <div style={{ marginTop: 22 }}>
        <button
          type="button"
          onClick={handleAcceptAll}
          style={{
            background: "var(--hb-accent)",
            color: "var(--ui-text)",
            border: "none",
            borderRadius: 12,
            height: 44,
            padding: "0 24px",
            fontSize: 14,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          <span>Aceptar personas</span>
        </button>
      </div>
    </div>
  );
}
