"use client";

import React, { useState } from "react";
import { Globe, RefreshCw, Check, Pencil, Zap, Target } from "lucide-react";
import { useHublyStore } from "@/lib/store";

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

function HenryCharacterAvatar({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Hair */}
      <path
        d="M11 14C11 8.5 15 5 20.5 5C26 5 29.5 8.5 29.5 14C29.5 11.5 27 9.5 23.5 9.5C19 9.5 16 11 13 13.5L11 14Z"
        fill="#0F172A"
      />
      <path
        d="M12 11C12 7.5 15.8 4.5 20.5 4.5C25.5 4.5 29 7.2 29 11.5C29 13 28.5 15 28 16H12.5C12 14.5 12 12.5 12 11Z"
        fill="#0F172A"
      />
      {/* Head / Face */}
      <rect
        x="12.5"
        y="10.5"
        width="15"
        height="17"
        rx="6.5"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.6"
      />
      {/* Ears */}
      <path
        d="M12.5 17.5C11 17.5 10.2 18.5 10.2 19.8C10.2 21.1 11 22 12.5 22"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      <path
        d="M27.5 17.5C29 17.5 29.8 18.5 29.8 19.8C29.8 21.1 29 22 27.5 22"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      {/* Hair bangs */}
      <path
        d="M12.5 13.5C14.5 11.5 17.5 10.5 21 10.8C24 11 26.2 12.2 27.5 13.8"
        stroke="#0F172A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Glasses */}
      <rect
        x="14.2"
        y="15.5"
        width="5"
        height="3.8"
        rx="1"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.4"
      />
      <rect
        x="20.8"
        y="15.5"
        width="5"
        height="3.8"
        rx="1"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.4"
      />
      <line x1="19.2" y1="17.2" x2="20.8" y2="17.2" stroke="#0F172A" strokeWidth="1.4" />
      {/* Smile */}
      <path
        d="M17.5 22.5C18.5 23.4 21.5 23.4 22.5 22.5"
        stroke="#0F172A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Neck & Collar */}
      <path d="M17.5 27.5V30.5H22.5V27.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.4" />
      {/* Shoulders / Shirt */}
      <path
        d="M9.5 41C10.2 34.5 14 31 20 31C26 31 29.8 34.5 30.5 41H9.5Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Tie / Lapel detail */}
      <path d="M17 31L20 35.5L23 31" stroke="#0F172A" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M20 35.5V41" stroke="#0F172A" strokeWidth="1.3" />
    </svg>
  );
}

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
    showToast("Señales leídas desde el sitio web de Min");
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
        color: "#0F172A",
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
          <Check size={15} style={{ color: "#6C77C1" }} />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Top Card: ¿Qué vende Min? */}
      <section
        style={{
          border: "1px solid #E2E8F0",
          borderRadius: 18,
          padding: 24,
          background: "#FFFFFF",
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
              background: "#ECEEF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 3L13.2 8.8L19 11L13.2 13.2L11 19L8.8 13.2L3 11L8.8 8.8L11 3Z"
                fill="#5A65AF"
              />
              <path
                d="M18.5 3.5L19.3 5.7L21.5 6.5L19.3 7.3L18.5 9.5L17.7 7.3L15.5 6.5L17.7 5.7L18.5 3.5Z"
                fill="#6C77C1"
              />
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 2px 0",
                lineHeight: 1.3,
              }}
            >
              ¿Qué vende Min?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#64748B",
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
              color: "#64748B",
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
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#1E293B",
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
              color: "#64748B",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            CATEGORÍA{" "}
            <span
              style={{
                fontWeight: 400,
                color: "#94A3B8",
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
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              fontSize: 14,
              color: "#1E293B",
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
              background: "#6C77C1",
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
              background: "#FFFFFF",
              color: "#334155",
              fontSize: 13.5,
              fontWeight: 600,
              height: 40,
              padding: "0 18px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Globe size={15} style={{ color: "#475569" }} />
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
          <HenryCharacterAvatar size={36} />
          <div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#0F172A",
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
                color: "#64748B",
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
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              height: 42,
              padding: "0 18px",
              fontSize: 13.5,
              fontWeight: 600,
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} style={{ color: "#475569" }} />
            <span>Volver a generar</span>
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            style={{
              background: "#6C77C1",
              border: "none",
              borderRadius: 12,
              height: 40,
              padding: "0 20px",
              fontSize: 13.5,
              fontWeight: 700,
              color: "#0F172A",
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
                border: "1px solid #E2E8F0",
                borderRadius: 18,
                padding: 24,
                background: "#FFFFFF",
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
                      background: "#6366F1",
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
                        color: "#0F172A",
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
                            background: "#F1F5F9",
                            color: "#334155",
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
                    background: "#F0F1F9",
                    color: "#6C77C1",
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
                  borderLeft: "3px solid #6C77C1",
                  paddingLeft: 14,
                  margin: "0 0 16px 0",
                }}
              >
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#1E293B",
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
                    border: "1px solid #CBD5E1",
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "#334155",
                    marginBottom: 18,
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "#334155",
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
                    background: "#F5F6FB",
                    border: "1px solid #D9DCF0",
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
                      color: "#5A65AF",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    <Zap size={12} style={{ color: "#5A65AF" }} />
                    <span>DOLOR PRINCIPAL</span>
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#0F172A",
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
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
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
                      color: "#6366F1",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    <Target size={12} style={{ color: "#6366F1" }} />
                    <span>META PRINCIPAL</span>
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#0F172A",
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
            background: "#6C77C1",
            color: "#0F172A",
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
