"use client";

import { Button } from "@/components/app/ui/Button";
import React, { useState } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { LiveUnavailable } from "@/components/app/LiveUnavailable";
import { backendEnabled } from "@/lib/supabase/config";
import {
  HublyArrowUpIcon as ArrowUp,
  HublyDocumentIcon as FileText,
  HublyFolderIcon as Folder,
  HublyInfoIcon as Info,
  HublyPeopleIcon as Users,
  HublyPinIcon as Pin,
  HublyPlugIcon as Plug,
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

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const [input, setInput] = useState("");
  const setAiDrawerOpen = useHublyStore((s) => s.setAiDrawerOpen);
  const setAiDrawerPrompt = useHublyStore((s) => s.setAiDrawerPrompt);

  if (!activeBrand) return null;

  const handleAskAssistant = (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;

    setAiDrawerPrompt(clean);
    setAiDrawerOpen(true);
    setInput("");
  };

  const shortcuts = [
    { href: "/parrillas", label: "Conectar las redes", icon: <Plug size={16} /> },
    { href: "/archivos", label: "Traer mis diseños", icon: <Folder size={16} /> },
    { href: "/ajustes?tab=equipo", label: "Invitar a mi equipo", icon: <Users size={16} /> },
    { href: "/tareas", label: "¿Qué hay pendiente?", icon: <Pin size={16} /> },
  ];

  return (
    <div
      className="hubly-touch"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 110px)",
        justifyContent: "space-between",
        color: "var(--ui-text)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 12,
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 16,
        }}
      >
        <HublyCatAvatar size={26} />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ui-text)" }}>Hubi</span>
      </div>

      <div
        role="note"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          padding: "10px 12px",
          border: "1px solid var(--ui-border)",
          borderRadius: 12,
          background: "var(--ui-surface-2)",
          color: "var(--ui-text-2)",
          fontSize: 12.5,
        }}
      >
        <Info size={16} style={{ flexShrink: 0, color: "var(--hb-accent-text)" }} />
        <span>Hubi todavía no responde con IA. Las respuestas son ejemplos de formato.</span>
      </div>

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
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--ui-text)",
            margin: "0 0 6px 0",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          ¿En qué te ayudo hoy?
        </h1>

        <p style={{ fontSize: 14, color: "var(--ui-text-3)", margin: "0 0 20px 0", textAlign: "center" }}>
          Estás en {activeBrand.name}. Escribe un mensaje o ve directo a una sección.
        </p>

        <nav
          aria-label="Atajos"
          style={{ width: "100%", maxWidth: 480, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 18 }}
        >
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="hbtn hbtn-secondary"
              style={{ justifyContent: "flex-start", gap: 10 }}
            >
              {s.icon}
              <span>{s.label}</span>
            </Link>
          ))}
        </nav>

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
            <Button
              key={pill}
              variant="secondary" size="sm"
              onClick={() => handleAskAssistant(pill)}
            >
              {pill}
            </Button>
          ))}
        </div>

      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskAssistant(input);
        }}
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          border: "1px solid var(--ui-sky-border)",
          borderRadius: 18,
          background: "var(--ui-surface)",
          padding: "14px 16px 12px",
        }}
      >
        <textarea
          rows={1}
          value={input}
          aria-label="Mensaje para Hubi"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAskAssistant(input);
            }
          }}
          placeholder="Pregúntale a Hubi…"
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              title="Usar una plantilla"
              aria-label="Usar una plantilla"
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
            disabled={!input.trim()}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: input.trim() ? "var(--hb-accent)" : "var(--ui-border-strong)",
              color: "var(--on-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
            }}
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
