"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Folder, Plus, Sparkles } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { TaskBoard } from "@/components/app/tasks/TaskBoard";
import { NotebooksSection, useCreateNotebook } from "@/components/app/tasks/NotebooksSection";

export default function TareasPage() {
  const allAssets = useHublyStore((s) => s.assets);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const assets = allAssets.filter((a) => a.brandId === activeBrandId);
  const createNotebook = useCreateNotebook();

  const [topSection, setTopSection] = useState<"listas" | "libretas" | "contenido">("listas");
  const [newListSignal, setNewListSignal] = useState(0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("seccion") === "libretas") {
      setTopSection("libretas");
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 48px)",
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "12px 0 40px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ROW 1: Top Segmented Pill Bar + Right Actions (matching 05-todos-mi-espacio-1440.png) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        {/* Left Pill Group (#F1F5F9): Listas | Libretas | Contenido */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "#F1F5F9",
            padding: 4,
            borderRadius: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setTopSection("listas")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: topSection === "listas" ? "#FFFFFF" : "transparent",
              color: topSection === "listas" ? "#6C77C1" : "#64748B",
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow:
                topSection === "listas" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              cursor: "pointer",
            }}
          >
            {/* Yellow notepad icon matching screenshot */}
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: "#9099D3",
                color: "#4C56A0",
                fontSize: 10,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              ≡
            </span>
            <span>Listas</span>
          </button>

          <button
            type="button"
            onClick={() => setTopSection("libretas")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: topSection === "libretas" ? "#FFFFFF" : "transparent",
              color: topSection === "libretas" ? "#6C77C1" : "#64748B",
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow:
                topSection === "libretas" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              cursor: "pointer",
            }}
          >
            <BookOpen size={14} style={{ color: "#94A3B8" }} />
            <span>Libretas</span>
          </button>

          <button
            type="button"
            onClick={() => setTopSection("contenido")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 9,
              border: "none",
              background: topSection === "contenido" ? "#FFFFFF" : "transparent",
              color: topSection === "contenido" ? "#6C77C1" : "#64748B",
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow:
                topSection === "contenido" ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
              cursor: "pointer",
            }}
          >
            <Folder size={14} style={{ color: "#94A3B8" }} />
            <span>Contenido</span>
          </button>
        </div>

        {/* Right Actions: Search + Nueva Lista buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Exact 36x36 '+' button from 05-todos-mi-espacio-1440.png top-right */}
          <button
            type="button"
            onClick={() => {
              if (topSection === "libretas") createNotebook();
              else {
                setTopSection("listas");
                setNewListSignal((n) => n + 1);
              }
            }}
            aria-label={topSection === "libretas" ? "Nueva libreta" : "Nueva lista"}
            title={topSection === "libretas" ? "Nueva libreta" : "Nueva lista"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#6C77C1",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      {topSection === "listas" && <TaskBoard newListSignal={newListSignal} />}

      {topSection === "libretas" && <NotebooksSection />}

      {/* SECTION 3: CONTENIDO */}
      {topSection === "contenido" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {assets.map((asset) => (
            <div
              key={asset.id}
              style={{
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                padding: 16,
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#F0F1F9",
                    color: "#6C77C1",
                    textTransform: "uppercase",
                  }}
                >
                  {asset.kind}
                </span>
                <span style={{ fontSize: 11.5, color: "#94A3B8" }}>{asset.sizeLabel}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{asset.name}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Carpeta: {asset.folder}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {asset.aiTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10.5,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "#F1F5F9",
                      color: "#475569",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Sparkles size={10} style={{ color: "#6C77C1" }} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
