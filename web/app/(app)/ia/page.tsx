"use client";

import React, { useState } from "react";
import { useHublyStore } from "@/lib/store";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { LiveUnavailable } from "@/components/app/LiveUnavailable";
import { backendEnabled } from "@/lib/supabase/config";
import {
  HublyArrowUpIcon as ArrowUp,
  HublyCalendarIcon as Calendar,
  HublyCheckIcon as Check,
  HublyChevronRightIcon as ChevronRight,
  HublyDocumentIcon as FileText,
  HublyPaperclipIcon as Paperclip,
  HublyPeopleIcon as Users,
  HublyPinIcon as Pin,
  HublyPlugIcon as Plug,
  HublyPlusCircleIcon as PlusCircle,
  HublyPulseIcon as TrendingUp,
} from "@/components/app/icons/DuotoneIcons";

const SUGGESTION_PILLS = [
  "Dame ideas de contenido para esta semana",
  "Analiza qué tipo de posts funcionan mejor",
  "Ayúdame a armar una estrategia de anuncios",
  "Escribe un copy para Instagram",
];

export default function HublyAIPage() {
  if (backendEnabled) return <LiveUnavailable title="Asistente de Hubly" text="El asistente con IA todavía no está conectado. Estará aquí cuando se integre el modelo." />;
  return <DemoHublyAIPage />;
}

function DemoHublyAIPage() {
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

  const handleAskAssistant = (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;

    const personaName = activeBrand.core.personas[0]?.name || "Fernanda Ríos";
    const item = {
      id: `hb-msg-${Date.now()}`,
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
        color: "var(--ui-text)",
      }}
    >
      {/* Top Header Bar matching 12-hb-ai-1440.png */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 12,
          borderBottom: "1px solid var(--ui-muted)",
          marginBottom: 24,
        }}
      >
        <HublyCatAvatar size={26} />
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text)" }}>Hubi</span>
      </div>

      {/* Centered Vertical Layout matching 12-hb-ai-1440.png & prompt specs */}
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
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-muted)",
            boxShadow: "0 6px 28px rgb(var(--hb-accent-rgb) / 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <HublyCatAvatar size={42} />
        </div>

        <div
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "var(--ui-text)",
            marginBottom: 4,
          }}
        >
          Hubi
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--ui-text)",
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
            color: "var(--ui-text-3)",
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
            color: "var(--ui-text-4)",
            margin: "0 0 20px 0",
            textAlign: "center",
          }}
        >
          Te falta conectar Min. Con eso te armo el reporte y la parrilla.
        </p>

        {/* Action Cards from 12-hb-ai-1440.png */}
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => handleAskAssistant("Conectar las redes de la marca y diagnosticar la cuenta")}
            style={{
              width: "100%",
              height: 52,
              padding: "0 18px",
              borderRadius: 14,
              background: "color-mix(in srgb, #F59E0B 12%, var(--ui-surface))",
              border: "1px solid #BFE2F4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              color: "var(--ui-text)",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Plug size={16} style={{ color: "var(--ui-text)" }} />
              <span>Conectar las redes</span>
            </span>
            <ChevronRight size={15} style={{ color: "var(--ui-text-4)" }} />
          </button>

          <button
            type="button"
            onClick={() => handleAskAssistant("Traer mis diseños y programarlos en la parrilla")}
            style={{
              width: "100%",
              height: 52,
              padding: "0 18px",
              borderRadius: 14,
              background: "var(--ui-accent-soft)",
              border: "1px solid #DCEFF9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              color: "var(--ui-text)",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Calendar size={16} style={{ color: "var(--hb-accent-text)" }} />
              <span>Traer mis diseños y programarlos</span>
            </span>
            <ChevronRight size={15} style={{ color: "var(--ui-text-4)" }} />
          </button>

          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-5)",
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
              onClick={() => handleAskAssistant("Invitar a mi equipo de agencia")}
              style={{
                height: 46,
                padding: "0 14px",
                borderRadius: 14,
                background: "color-mix(in srgb, #10B981 12%, var(--ui-surface))",
                border: "1px solid #CBEAD7",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "var(--ui-text)",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <Users size={15} style={{ color: "var(--hb-accent-text)" }} />
              <span>Invitar a mi equipo</span>
            </button>

            <button
              type="button"
              onClick={() => handleAskAssistant("¿Qué hay pendiente hoy para Min?")}
              style={{
                height: 46,
                padding: "0 14px",
                borderRadius: 14,
                background: "color-mix(in srgb, #EF4444 10%, var(--ui-surface))",
                border: "1px solid #F9DADA",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: "var(--ui-text)",
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
              onClick={() => handleAskAssistant(pill)}
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--ui-text-2)",
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
                  border: "1px solid var(--ui-border)",
                  borderRadius: 16,
                  padding: 16,
                  background: "var(--ui-surface)",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ui-text)", marginBottom: 6 }}>
                  {m.replyTitle}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ui-text-2)",
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
                    background: m.addedToGrid ? "#DCFCE7" : "var(--hb-accent)",
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

      {/* Bottom Prompt Box matching 12-hb-ai-1440.png */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskAssistant(input);
        }}
        style={{
          width: "100%",
          maxWidth: 1080,
          margin: "0 auto",
          border: "1.5px solid #BFE2F4",
          borderRadius: 18,
          background: "var(--ui-surface)",
          padding: "14px 16px 12px",
          boxShadow: "0 4px 20px rgb(var(--hb-accent-rgb) / 0.08)",
        }}
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAskAssistant(input);
            }
          }}
          placeholder="Pregúntale a Hubi... (Mensaje...)"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 14,
            color: "var(--ui-text)",
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
                color: "var(--ui-text-4)",
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
              onClick={() => handleAskAssistant(SUGGESTION_PILLS[0])}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "var(--ui-text-4)",
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
                background: "var(--ui-muted)",
                color: "var(--ui-text-3)",
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
              background: input.trim() ? "var(--hb-accent)" : "var(--ui-border-strong)",
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
