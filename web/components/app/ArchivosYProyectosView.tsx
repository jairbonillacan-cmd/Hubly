"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  Upload,
  PlusCircle,
  Plus,
  ChevronDown,
  Folder,
  Pin,
  Archive,
  Trash2,
  Check,
  Layers,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { Cover } from "@/components/Cover";
import { KanbanDropSlot } from "@/components/app/KanbanDropSlot";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import type { BrandProject } from "@/lib/types";

const PROJECT_COLUMNS = ["En curso", "Revisión", "Completado"] as const;

function GoldenCloudUploadIllustration() {
  return (
    <svg
      width="68"
      height="64"
      viewBox="0 0 68 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud body with warm gold fill and brown-gold outline matching 08-content-manager-1440.png */}
      <path
        d="M21 49H48.5C54.8513 49 60 43.8513 60 37.5C60 31.6524 55.6317 26.8235 49.9806 26.0942C48.8768 19.2367 42.9317 14 35.75 14C27.781 14 21.3182 20.4318 21.2505 28.3849C15.4793 29.1525 11 34.088 11 40C11 44.9706 15.0294 49 20 49H21Z"
        fill="#D9DCF0"
        stroke="#5360A5"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner shading */}
      <path
        d="M22 46H47.5C52.4706 46 56.5 41.9706 56.5 37C56.5 32.5 53.1 28.8 48.7 28.2"
        stroke="#6C77C1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Upward Arrow */}
      <path
        d="M35.5 39V23M35.5 23L29.5 29M35.5 23L41.5 29"
        stroke="#5360A5"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArchivosYProyectosInner({ section }: { section?: "proyectos" }) {
  const searchParams = useSearchParams();
  const tabParam = section ?? searchParams.get("tab");

  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const assets = useHublyStore((s) => s.assets);
  const projects = useHublyStore((s) => s.projects);
  const addAsset = useHublyStore((s) => s.addAsset);
  const addProject = useHublyStore((s) => s.addProject);
  const moveProject = useHublyStore((s) => s.moveProject);
  const projectDrag = useKanbanDrag({
    columns: PROJECT_COLUMNS,
    onMove: (id, toCol, beforeId) => moveProject(id, toCol as BrandProject["status"], beforeId),
  });

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const [mode, setMode] = useState<"content" | "proyectos">(
    tabParam === "proyectos" ? "proyectos" : "content"
  );
  const [contentSubTab, setContentSubTab] = useState<"archivos" | "carpetas">("archivos");
  const [projectView, setProjectView] = useState<"filas" | "kanban" | "tabla">("filas");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [showDemoAssets, setShowDemoAssets] = useState(false);
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (tabParam === "proyectos") {
      setMode("proyectos");
    } else {
      setMode("content");
    }
  }, [tabParam]);

  if (!activeBrand) return null;

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const brandAssets = assets.filter((a) => {
    if (a.brandId !== activeBrand.id) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.folder.toLowerCase().includes(q) ||
        a.aiTags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const brandProjects = projects.filter((p) => {
    if (p.brandId !== activeBrand.id) return false;
    if (projectSearchQuery.trim()) {
      const q = projectSearchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUploadDemoAsset = () => {
    addAsset({
      brandId: activeBrand.id,
      name: `clip-${activeBrand.slug}-${Date.now().toString().slice(-3)}.mp4`,
      kind: "video",
      cover: "sun",
      sizeLabel: "28.4 MB · 0:34",
      aiTags: ["videos sin usar", "vertical", activeBrand.slug],
      folder: "Subidas recientes",
    });
    setShowDemoAssets(true);
    triggerToast("Archivo subido y etiquetado por Hubi");
  };

  const handleCreateDocument = () => {
    addAsset({
      brandId: activeBrand.id,
      name: `brief-creativo-${activeBrand.slug}.doc`,
      kind: "doc",
      cover: "leaf",
      sizeLabel: "1.2 MB · Documento",
      aiTags: ["brief", "scripts", "estrategia"],
      folder: "Documentos",
    });
    setShowDemoAssets(true);
    triggerToast("Documento creado en la biblioteca de la marca");
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    addProject({
      brandId: activeBrand.id,
      title: newProjTitle.trim(),
      description:
        newProjDesc.trim() ||
        "Proyecto creado para agrupar listas, entregables y páginas de campaña.",
      progress: 0,
      status: "En curso",
      dueDate: "2026-11-30",
      deliverablesCount: 6,
    });
    setNewProjTitle("");
    setNewProjDesc("");
    setNewProjectModal(false);
    triggerToast("Proyecto creado correctamente");
  };

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", color: "#0F172A" }}>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleUploadDemoAsset}
      />

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 90,
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
          <span>{toast}</span>
        </div>
      )}

      {/* ==================== CONTENT MANAGER MODE (08-content-manager-1440.png) ==================== */}
      {mode === "content" && (
        <div>
          {/* Top Search Bar matching 08-content-manager-1440.png */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: 14,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flex: 1,
                minWidth: 220,
              }}
            >
              <Search size={17} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <Sparkles size={15} style={{ color: "#8B5CF6", flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Busca "videos sin usar" o "scripts"'
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: 14,
                  color: "#0F172A",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("videos sin usar");
                  setShowDemoAssets(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Filtros
              </button>

              <button
                type="button"
                onClick={() => setShowDemoAssets(true)}
                style={{
                  background: "#F0F1F9",
                  border: "none",
                  color: "#6C77C1",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Sparkles size={13} />
                <span>Buscar</span>
              </button>

              <button
                type="button"
                onClick={handleCreateDocument}
                aria-label="Crear"
                style={{
                  background: "#6C77C1",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                Crear
              </button>
            </div>
          </div>

          {/* Sub-nav Pill Row: (Archivos active | Carpetas) + right button #6C77C1 Subir contenido */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#F1F5F9",
                padding: 3,
                borderRadius: 999,
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setContentSubTab("archivos");
                  setMode("content");
                }}
                style={{
                  background: contentSubTab === "archivos" ? "#FFFFFF" : "transparent",
                  color: contentSubTab === "archivos" ? "#0F172A" : "#64748B",
                  boxShadow:
                    contentSubTab === "archivos"
                      ? "0 1px 2px rgba(15, 23, 42, 0.08)"
                      : "none",
                  border: "none",
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Archivos
              </button>
              <button
                type="button"
                onClick={() => setContentSubTab("carpetas")}
                style={{
                  background: contentSubTab === "carpetas" ? "#FFFFFF" : "transparent",
                  color: contentSubTab === "carpetas" ? "#0F172A" : "#64748B",
                  boxShadow:
                    contentSubTab === "carpetas"
                      ? "0 1px 2px rgba(15, 23, 42, 0.08)"
                      : "none",
                  border: "none",
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Carpetas
              </button>
              <button
                type="button"
                onClick={() => setMode("proyectos")}
                style={{
                  background: "transparent",
                  color: "#64748B",
                  border: "none",
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Proyectos
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowDemoAssets(!showDemoAssets)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "7px 14px",
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                {showDemoAssets
                  ? "Ver estado vacío"
                  : `Ver archivos demo (${brandAssets.length})`}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#6C77C1",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 9,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <Upload size={14} />
                <span>Subir contenido</span>
              </button>
            </div>
          </div>

          {/* Main Dashed Upload Dropzone matching 08-content-manager-1440.png & prompt specs */}
          {contentSubTab === "archivos" && !showDemoAssets && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "1.5px dashed #CBD5E1",
                borderRadius: 16,
                minHeight: 380,
                background: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <GoldenCloudUploadIllustration />

              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0F172A",
                  margin: "14px 0 4px",
                }}
              >
                La biblioteca de la marca
              </h3>

              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: 6,
                }}
              >
                Sube tu primer archivo
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "#64748B",
                  maxWidth: 440,
                  lineHeight: 1.55,
                  margin: "0 0 6px",
                }}
              >
                Sube fotos, videos, briefs y PDFs. Hubi los ve, los describe y los etiqueta solo, y después los encuentras buscando por lo que sale en ellos, no por cómo se llaman.
              </p>

              <div
                style={{
                  fontSize: 12.5,
                  color: "#94A3B8",
                  marginBottom: 18,
                }}
              >
                Arrastra archivos aquí o haz clic para seleccionar
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  onClick={handleUploadDemoAsset}
                  style={{
                    background: "#6C77C1",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 10,
                    height: 36,
                    padding: "0 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <Upload size={14} />
                  <span>Subir archivos</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateDocument}
                  style={{
                    background: "#FFFFFF",
                    color: "#1E293B",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    height: 36,
                    padding: "0 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <PlusCircle size={14} style={{ color: "#334155" }} />
                  <span>Crear documento</span>
                </button>
              </div>

              <div style={{ fontSize: 12, color: "#94A3B8" }}>
                También puedes arrastrar archivos aquí desde tu computadora.
              </div>
            </div>
          )}

          {/* Carpetas View */}
          {contentSubTab === "carpetas" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {["Reels y Videos", "Fotografía de Producto", "Brand Book & Briefs", "Subidas recientes"].map(
                (folderName, idx) => (
                  <div
                    key={folderName}
                    onClick={() => {
                      setContentSubTab("archivos");
                      setShowDemoAssets(true);
                    }}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: 14,
                      padding: 18,
                      background: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#ECEEF8",
                        color: "#5A65AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Folder size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                        {folderName}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{idx + 1} archivos</div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Uploaded Demo Assets Grid */}
          {contentSubTab === "archivos" && showDemoAssets && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 16,
              }}
            >
              {brandAssets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 16,
                    background: "#FFFFFF",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ height: 150, position: "relative" }}>
                    <Cover kind={asset.cover} />
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        right: 10,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          color: "#334155",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {asset.folder}
                      </span>
                      <span
                        style={{
                          background: asset.usedInPosts === 0 ? "#ECEEF8" : "#DCFCE7",
                          color: asset.usedInPosts === 0 ? "#5360A5" : "#15803D",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {asset.usedInPosts === 0 ? "Sin usar" : `Usado (${asset.usedInPosts})`}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 8 }}>
                      {asset.sizeLabel} · {asset.uploadedAt}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {asset.aiTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 10.5,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#F1F5F9",
                            color: "#475569",
                            fontWeight: 500,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== PROYECTOS MODE (09-projects-1440.png) ==================== */}
      {mode === "proyectos" && (
        <div>
          {/* Top Header Bar matching 09-projects-1440.png */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              paddingBottom: 14,
              marginBottom: 22,
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            {/* Left: Search icon + Todos dropdown + 1 de 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                aria-label="Buscar proyecto"
                onClick={() => setProjectSearchOpen(!projectSearchOpen)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Search size={16} />
              </button>

              <button
                disabled
                data-planned
                title="Función prevista"
                type="button"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#0F172A",
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                <span>Todos</span>
                <ChevronDown size={13} style={{ color: "#64748B" }} />
              </button>

              <span style={{ fontSize: 12.5, color: "#94A3B8", fontWeight: 500 }}>
                1 de 1
              </span>

              {projectSearchOpen && (
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Filtrar proyectos..."
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12.5,
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Right: View Pills (Filas | Kanban | Tabla) + Search + #6C77C1 + Nuevo proyecto */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#F1F5F9",
                  padding: 3,
                  borderRadius: 999,
                  gap: 2,
                }}
              >
                {(
                  [
                    { id: "filas", label: "Filas" },
                    { id: "kanban", label: "Kanban" },
                    { id: "tabla", label: "Tabla" },
                  ] as const
                ).map((v) => {
                  const active = projectView === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setProjectView(v.id)}
                      style={{
                        background: active ? "#FFFFFF" : "transparent",
                        color: active ? "#0F172A" : "#64748B",
                        boxShadow: active ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
                        border: "none",
                        borderRadius: 999,
                        padding: "5px 14px",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Nuevo proyecto"
                title="Nuevo proyecto"
                onClick={() => setNewProjectModal(true)}
                style={{
                  background: "#6C77C1",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 999,
                  height: 36,
                  padding: "0 14px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <Plus size={15} />
                <span>Nuevo proyecto</span>
              </button>
            </div>
          </div>

          {projectView === "filas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Additional Brand Projects from Store */}
              {brandProjects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 18,
                    padding: "18px 22px",
                    background: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 260, flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#F0F1F9",
                        color: "#6C77C1",
                        fontSize: 16,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {proj.title.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0F172A",
                          margin: "0 0 3px 0",
                        }}
                      >
                        {proj.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#64748B",
                          margin: 0,
                          maxWidth: 560,
                        }}
                      >
                        {proj.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 82,
                        height: 6,
                        borderRadius: 999,
                        background: "#F1F5F9",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${proj.progress}%`,
                          height: "100%",
                          background: "#6C77C1",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#5A65AF" }}>
                      {proj.progress}%
                    </span>
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#15803D",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: 999,
                      }}
                    >
                      {proj.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kanban View */}
          {projectView === "kanban" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {PROJECT_COLUMNS.map((col) => (
                <div
                  key={col}
                  {...projectDrag.getColumnProps(col)}
                  style={{
                    background: projectDrag.drag?.overCol === col ? "#F0F1F9" : "#F8FAFC",
                    border: `1px solid ${projectDrag.drag?.overCol === col ? "#6C77C1" : "#E2E8F0"}`,
                    borderRadius: 16,
                    padding: 16,
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    transition: "background 120ms ease, border-color 120ms ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: 2,
                    }}
                  >
                    {col}
                  </div>
                  {brandProjects
                    .filter((p) => p.status === col)
                    .map((p) => (
                      <React.Fragment key={p.id}>
                        {projectDrag.drag?.overCol === col && projectDrag.drag.beforeId === p.id && (
                          <KanbanDropSlot height={projectDrag.drag.height} />
                        )}
                        <div
                          {...projectDrag.getCardProps(p.id)}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: 12,
                            padding: 14,
                            cursor: projectDrag.drag?.id === p.id ? "grabbing" : "grab",
                            opacity: projectDrag.drag?.id === p.id ? 0.35 : 1,
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#64748B" }}>
                            {p.description ? `${p.description} ` : ""}
                            {p.progress}% completado.
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  {projectDrag.drag?.overCol === col && projectDrag.drag.beforeId === null && (
                    <KanbanDropSlot height={projectDrag.drag.height} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tabla View */}
          {projectView === "tabla" && (
            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                background: "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", textAlign: "left", color: "#64748B" }}>
                    <th style={{ padding: "12px 16px" }}>Proyecto</th>
                    <th style={{ padding: "12px 16px" }}>Avance</th>
                    <th style={{ padding: "12px 16px" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {brandProjects.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700 }}>{p.title}</td>
                      <td style={{ padding: "14px 16px", color: "#5A65AF", fontWeight: 700 }}>
                        {p.progress}%
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: "#DCFCE7",
                            color: "#15803D",
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 999,
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Centered Empty State / Quick Create Card matching prompt specs */}
          {brandProjects.length === 0 && (
          <div
            style={{
              marginTop: 28,
              border: "1px dashed #E2E8F0",
              borderRadius: 18,
              padding: "36px 24px",
              background: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#F0F1F9",
                color: "#6C77C1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Layers size={20} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Sin proyectos
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
              Crea un proyecto para agrupar listas y páginas
            </p>
            <button
              type="button"
              onClick={() => setNewProjectModal(true)}
              style={{
                background: "#6C77C1",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                height: 38,
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <span>+ Crear proyecto</span>
            </button>
          </div>
          )}

          {/* Modal to create project */}
          {newProjectModal && (
            <div
              onClick={() => setNewProjectModal(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                padding: 16,
              }}
            >
              <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleCreateProject}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  padding: 24,
                  width: "100%",
                  maxWidth: 440,
                  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 14px" }}>
                  Nuevo proyecto para {activeBrand.name}
                </h3>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#475569",
                      marginBottom: 6,
                    }}
                  >
                    Nombre del proyecto
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="Ej. Campaña Buen Fin · Parrilla y Ads"
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13.5,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#475569",
                      marginBottom: 6,
                    }}
                  >
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Listas, entregables y páginas agrupadas en este proyecto..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #CBD5E1",
                      fontSize: 13.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setNewProjectModal(false)}
                    style={{
                      background: "#F1F5F9",
                      color: "#334155",
                      border: "none",
                      borderRadius: 10,
                      height: 38,
                      padding: "0 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: "#6C77C1",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      height: 38,
                      padding: "0 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Crear proyecto
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ArchivosYProyectosView({ section }: { section?: "proyectos" }) {
  return (
    <Suspense fallback={null}>
      <ArchivosYProyectosInner section={section} />
    </Suspense>
  );
}
