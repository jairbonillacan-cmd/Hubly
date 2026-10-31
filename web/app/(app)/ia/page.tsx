"use client";

import React, { useState } from "react";
import {
  Paperclip,
  FileText,
  TrendingUp,
  ArrowUp,
  ChevronRight,
  Check,
  PlusCircle,
  Plug,
  Calendar,
  Users,
  Pin,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";

const SUGGESTION_PILLS = [
  "Dame ideas de contenido para esta semana",
  "Analiza qué tipo de posts funcionan mejor",
  "Ayúdame a armar una estrategia de anuncios",
  "Escribe un copy para Instagram",
];

function HenryIllustratedAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 44 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hair */}
      <path
        d="M13 13C13 8.5 16.8 5.2 22 5.2C27.2 5.2 31 8.5 31 13.5C31 15 30.5 16.5 30 17.5H14C13.5 16 13 14.5 13 13Z"
        fill="#0F172A"
      />
      {/* Ears */}
      <path
        d="M14 19.5C12.3 19.5 11.4 20.6 11.4 22C11.4 23.4 12.3 24.4 14 24.4"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.6"
      />
      <path
        d="M30 19.5C31.7 19.5 32.6 20.6 32.6 22C32.6 23.4 31.7 24.4 30 24.4"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.6"
      />
      {/* Head */}
      <rect
        x="14"
        y="11.5"
        width="16"
        height="18.5"
        rx="7"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.7"
      />
      {/* Bangs */}
      <path
        d="M14.2 15C16.2 12.6 19.5 11.6 23 11.8C26 12 28.4 13.2 29.8 15"
        stroke="#0F172A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Glasses */}
      <rect
        x="15.8"
        y="17.2"
        width="5.4"
        height="4"
        rx="1"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      <rect
        x="22.8"
        y="17.2"
        width="5.4"
        height="4"
        rx="1"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      <line x1="21.2" y1="19" x2="22.8" y2="19" stroke="#0F172A" strokeWidth="1.5" />
      {/* Smile */}
      <path
        d="M19.2 24.8C20.4 25.8 23.6 25.8 24.8 24.8"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Neck */}
      <path d="M19.5 30V33.5H24.5V30" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
      {/* Shirt & Shoulders */}
      <path
        d="M10.5 44C11.4 37 15.5 33.5 22 33.5C28.5 33.5 32.6 37 33.5 44H10.5Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M18.5 33.5L22 38.5L25.5 33.5" stroke="#0F172A" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M22 38.5V44" stroke="#0F172A" strokeWidth="1.4" />
    </svg>
  );
}

export default function HublyAIPage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const savePost = useHublyStore((s) => s.savePost);

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    {
      id: string;
      prompt: string;
      replyTitle: string;
      replyBody: string;
      addedToGrid?: boolean;
    }[]
  >([]);

  if (!activeBrand) return null;

  const handleAskHenry = (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;

    const personaName = activeBrand.core.personas[0]?.name || "Fernanda Ríos";
    const item = {
      id: `henry-msg-${Date.now()}`,
      prompt: clean,
      replyTitle: `Propuesta para Min · ${clean}`,
      replyBody: `Basado en el Núcleo de Marca de Min y en el perfil de ${personaName}:\n\n• Gancho visual (primeros 3s): Muestra la pieza mineral con escala real en mano y luz natural sin filtros.\n• Copy sugerido: "Lo que ves en foto es exactamente la pieza que llega a tu tienda. Lotes mayoristas curados con medidas exactas."\n• CTA: Escríbenos por WhatsApp para recibir el catálogo mayorista de esta semana.`,
    };
    setMessages((prev) => [item, ...prev]);
    setInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 110px)",
        justifyContent: "space-between",
        color: "#0F172A",
      }}
    >
      {/* Top Header Bar matching 12-henry-ai-1440.png */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 12,
          borderBottom: "1px solid #F1F5F9",
          marginBottom: 24,
        }}
      >
        <HenryIllustratedAvatar size={26} />
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Hubi</span>
      </div>

      {/* Centered Vertical Layout matching 12-henry-ai-1440.png & prompt specs */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          padding: "12px 16px 28px",
        }}
      >
        {/* 64x64px Circle with Illustrated Hubi Character and warm amber glow */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "1px solid #F1F5F9",
            boxShadow: "0 6px 28px rgba(108, 119, 193, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <HenryIllustratedAvatar size={42} />
        </div>

        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "#0F172A",
            marginBottom: 4,
          }}
        >
          Hubi
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0F172A",
            margin: "0 0 6px 0",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          ¿En qué te ayudo hoy?
        </h1>

        <p
          style={{
            fontSize: 13.5,
            color: "#475569",
            margin: "0 0 4px 0",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Pregúntame sobre marketing, contenido, estrategia o lo que necesites para Min.
        </p>

        <p
          style={{
            fontSize: 13,
            color: "#64748B",
            margin: "0 0 20px 0",
            textAlign: "center",
          }}
        >
          Te falta conectar Min. Con eso te armo el reporte y la parrilla.
        </p>

        {/* Action Cards from 12-henry-ai-1440.png */}
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => handleAskHenry("Conectar las redes de Min y diagnosticar cuenta")}
            style={{
              width: "100%",
              height: 52,
              padding: "0 18px",
              borderRadius: 14,
              background: "#FEF9E7",
              border: "1px solid #D9DCF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              color: "#0F172A",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Plug size={16} style={{ color: "#0F172A" }} />
              <span>Conectar las redes</span>
            </span>
            <ChevronRight size={15} style={{ color: "#64748B" }} />
          </button>

          <button
            type="button"
            onClick={() => handleAskHenry("Traer mis diseños y programarlos en la parrilla")}
            style={{
              width: "100%",
              height: 52,
              padding: "0 18px",
              borderRadius: 14,
              background: "#F0F1F9",
              border: "1px solid #E0E7FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              color: "#0F172A",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Calendar size={16} style={{ color: "#6C77C1" }} />
              <span>Traer mis diseños y programarlos</span>
            </span>
            <ChevronRight size={15} style={{ color: "#64748B" }} />
          </button>

          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "#94A3B8",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginTop: 8,
              marginBottom: 2,
            }}
          >
            TAMBIEN PUEDO
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              onClick={() => handleAskHenry("Invitar a mi equipo de agencia")}
              style={{
                height: 46,
                padding: "0 14px",
                borderRadius: 14,
                background: "#E8F7EE",
                border: "1px solid #CBEAD7",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "#0F172A",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <Users size={15} style={{ color: "#4338CA" }} />
              <span>Invitar a mi equipo</span>
            </button>

            <button
              type="button"
              onClick={() => handleAskHenry("¿Qué hay pendiente hoy para Min?")}
              style={{
                height: 46,
                padding: "0 14px",
                borderRadius: 14,
                background: "#FDF2F2",
                border: "1px solid #F9DADA",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "#0F172A",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <Pin size={15} style={{ color: "#E11D48" }} />
              <span>¿Qué hay pendiente?</span>
            </button>
          </div>
        </div>

        {/* 4 Exact Suggestion Pills */}
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {SUGGESTION_PILLS.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleAskHenry(pill)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
              }}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Generated Responses List */}
        {messages.length > 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 8,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: 16,
                  background: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                  {m.replyTitle}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#334155",
                    whiteSpace: "pre-line",
                    lineHeight: 1.55,
                    margin: "0 0 12px 0",
                  }}
                >
                  {m.replyBody}
                </p>
                <button
                  type="button"
                  disabled={m.addedToGrid}
                  onClick={() => {
                    savePost({
                      brandId: activeBrand.id,
                      title: m.replyTitle,
                      caption: m.replyBody,
                      networks: activeBrand.connectedNetworks.slice(0, 2),
                      format: "Reel / Video",
                      cover: "sun",
                      scheduledDate: "2026-11-22",
                      scheduledTime: "13:00",
                      status: "pending",
                      assignee: "Jair B.",
                      pillar: activeBrand.core.pillars[0] || "Estrategia",
                    });
                    setMessages((prev) =>
                      prev.map((item) =>
                        item.id === m.id ? { ...item, addedToGrid: true } : item
                      )
                    );
                  }}
                  style={{
                    background: m.addedToGrid ? "#DCFCE7" : "#6C77C1",
                    color: m.addedToGrid ? "#15803D" : "#FFFFFF",
                    border: "none",
                    borderRadius: 9,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  {m.addedToGrid ? (
                    <>
                      <Check size={13} />
                      <span>Enviado a Social Media</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={13} />
                      <span>Programar en parrilla</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Prompt Box matching 12-henry-ai-1440.png */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskHenry(input);
        }}
        style={{
          width: "100%",
          maxWidth: 1080,
          margin: "0 auto",
          border: "1.5px solid #D9DCF0",
          borderRadius: 18,
          background: "#FFFFFF",
          padding: "14px 16px 12px",
          boxShadow: "0 4px 20px rgba(108, 119, 193, 0.08)",
        }}
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAskHenry(input);
            }
          }}
          placeholder="Pregúntale a Hubi... (Mensaje...)"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 14,
            color: "#0F172A",
            background: "transparent",
            fontFamily: "inherit",
            marginBottom: 10,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              disabled
              data-planned
              type="button"
              title="Adjuntar"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Paperclip size={15} />
            </button>

            <button
              type="button"
              title="Usar una plantilla"
              onClick={() => handleAskHenry(SUGGESTION_PILLS[0])}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <FileText size={15} />
            </button>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#F1F5F9",
                color: "#475569",
                fontSize: 11.5,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              <TrendingUp size={12} />
              <span>General</span>
            </span>
          </div>

          <button
            type="submit"
            aria-label="Enviar mensaje a Hubi"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: input.trim() ? "#6C77C1" : "#CBD5E1",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
