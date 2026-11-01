"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { KanbanDropSlot } from "@/components/app/KanbanDropSlot";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import { MediaLibrary } from "@/components/app/media/MediaLibrary";
import { ProjectEditModal } from "@/components/app/projects/ProjectEditModal";
import { askConfirm } from "@/components/app/AppDialogHost";
import type { BrandProject } from "@/lib/types";
import {
  HublyArchiveIcon as Archive,
  HublyCheckIcon as Check,
  HublyLayersIcon as Layers,
  HublyPinIcon as Pin,
  HublyPlusIcon as Plus,
  HublySearchIcon as Search,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

const PROJECT_COLUMNS = ["En curso", "Revisión", "Completado"] as const;


function ArchivosYProyectosInner({ section }: { section?: "proyectos" }) {
  const searchParams = useSearchParams();
  const tabParam = section ?? searchParams.get("tab");

  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const assets = useHublyStore((s) => s.assets);
  const projects = useHublyStore((s) => s.projects);
  const addProject = useHublyStore((s) => s.addProject);
  const moveProject = useHublyStore((s) => s.moveProject);
  const updateProject = useHublyStore((s) => s.updateProject);
  const deleteProject = useHublyStore((s) => s.deleteProject);
  const readOnly = useHublyStore((s) => s.role === "viewer");
  const projectDrag = useKanbanDrag({
    columns: PROJECT_COLUMNS,
    onMove: (id, toCol, beforeId) => moveProject(id, toCol as BrandProject["status"], beforeId),
  });

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const [mode, setMode] = useState<"content" | "proyectos">(
    tabParam === "proyectos" ? "proyectos" : "content"
  );
  const [projectView, setProjectView] = useState<"filas" | "kanban" | "tabla">("filas");  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [projectFilter, setProjectFilter] = useState<"todos" | BrandProject["status"] | "archivados">("todos");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === "proyectos") {
      setMode("proyectos"); // eslint-disable-line react-hooks/set-state-in-effect -- la pestaña la manda la URL
    } else {
      setMode("content");
    }
  }, [tabParam]);

  if (!activeBrand) return null;

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const brandAssets = assets.filter((a) => a.brandId === activeBrand.id);

  const ownProjects = projects.filter((p) => p.brandId === activeBrand.id);
  const brandProjects = ownProjects
    .filter((p) => {
      if (projectFilter === "archivados" ? !p.archived : p.archived) return false;
      if (projectFilter !== "todos" && projectFilter !== "archivados" && p.status !== projectFilter) return false;
      const q = projectSearchQuery.trim().toLowerCase();
      return !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    })
    .sort((x, y) => Number(Boolean(y.pinned)) - Number(Boolean(x.pinned)));
  const editingProject = ownProjects.find((p) => p.id === editingProjectId);

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
      dueDate: "",
      deliverablesCount: 0,
    });
    setNewProjTitle("");
    setNewProjDesc("");
    setNewProjectModal(false);
    triggerToast("Proyecto creado correctamente");
  };

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", color: "var(--ui-text)" }}>
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
          <Check size={15} style={{ color: "var(--hb-accent-text)" }} />
          <span>{toast}</span>
        </div>
      )}

      {/* ==================== CONTENT MANAGER MODE ==================== */}
      {mode === "content" && (
        <>
          <div className="hubly-media-page-head">
            <div>
              <h1>Content Manager</h1>
              <p>Archivos de {activeBrand.name}. Lo que subas aquí está disponible al crear un post.</p>
            </div>
            <button type="button" className="hubly-media-ghost" onClick={() => setMode("proyectos")}>Ver proyectos</button>
          </div>
          <MediaLibrary brandId={activeBrand.id} />
          {brandAssets.length > 0 && (
            <details className="hubly-media-samples">
              <summary>Archivos de ejemplo ({brandAssets.length})</summary>
              <ul>
                {brandAssets.map((asset) => (
                  <li key={asset.id}>
                    <strong>{asset.name}</strong>
                    <span>{asset.folder} · {asset.sizeLabel}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {mode === "proyectos" && (
        <div>
          {/* Top Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              paddingBottom: 14,
              marginBottom: 22,
              borderBottom: "1px solid var(--ui-muted)",
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
                  color: "var(--ui-text-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Search size={16} />
              </button>

              <select
                aria-label="Filtrar proyectos"
                className="hubly-social-cell"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value as typeof projectFilter)}
              >
                <option value="todos">Todos</option>
                {PROJECT_COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="archivados">Archivados</option>
              </select>

              <span style={{ fontSize: 12.5, color: "var(--ui-text-3)", fontWeight: 500 }}>
                {brandProjects.length} de {ownProjects.filter((p) => !p.archived).length}
              </span>

              {projectSearchOpen && (
                <input
                  type="text"
                  autoFocus
                  aria-label="Buscar proyecto por nombre"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Filtrar proyectos..."
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    fontSize: 12.5,
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Right: View Pills (Filas | Kanban | Tabla) + Search + var(--hb-accent) + Nuevo proyecto */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "var(--ui-muted)",
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
                      aria-pressed={active}
                      style={{
                        background: active ? "var(--ui-surface)" : "transparent",
                        color: active ? "var(--ui-text)" : "var(--ui-text-4)",
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
                  background: "var(--hb-accent)",
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
              {brandProjects.length === 0 && (
                <div className="hubly-media-empty">
                  <p>{projectSearchQuery.trim() || projectFilter !== "todos" ? "Ningún proyecto coincide con el filtro." : "Aún no hay proyectos en esta marca."}</p>
                  {!readOnly && <button type="button" className="hubly-media-primary" onClick={() => setNewProjectModal(true)}>Nuevo proyecto</button>}
                </div>
              )}
              {brandProjects.map((proj) => (
                <article key={proj.id} className="hubly-project-row" data-pinned={proj.pinned || undefined}>
                  <button type="button" className="hubly-project-open" onClick={() => setEditingProjectId(proj.id)}>
                    <span className="hubly-project-mark" aria-hidden>{proj.title.slice(0, 1).toUpperCase()}</span>
                    <span>
                      <strong>{proj.title}</strong>
                      <small>{proj.description}</small>
                    </span>
                  </button>
                  <div className="hubly-project-meta">
                    <span className="hubly-project-bar" aria-hidden><i style={{ width: `${proj.progress}%` }} /></span>
                    <b>{proj.progress}%</b>
                    <span>{proj.dueDate ? new Date(`${proj.dueDate}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "Sin fecha"}</span>
                    <span className="hubly-social-badge" data-tone={proj.status === "Completado" ? "ok" : proj.status === "Revisión" ? "warn" : "info"}>{proj.status}</span>
                  </div>
                  {!readOnly && (
                    <div className="hubly-project-actions">
                      <button type="button" aria-label={`${proj.pinned ? "Soltar" : "Fijar"} ${proj.title}`} aria-pressed={Boolean(proj.pinned)} onClick={() => updateProject(proj.id, { pinned: !proj.pinned })}><Pin size={15} /></button>
                      <button type="button" aria-label={`${proj.archived ? "Restaurar" : "Archivar"} ${proj.title}`} onClick={() => updateProject(proj.id, { archived: !proj.archived, pinned: false })}><Archive size={15} /></button>
                      <button
                        type="button"
                        aria-label={`Eliminar ${proj.title}`}
                        onClick={async () => {
                          if (await askConfirm(`¿Eliminar el proyecto «${proj.title}»?`)) deleteProject(proj.id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </article>
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
                    background: projectDrag.drag?.overCol === col ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    border: `1px solid ${projectDrag.drag?.overCol === col ? "var(--hb-accent)" : "var(--ui-border)"}`,
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
                      color: "var(--ui-text)",
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
                            background: "var(--ui-surface)",
                            border: "1px solid var(--ui-border)",
                            borderRadius: 12,
                            padding: 14,
                            cursor: projectDrag.drag?.id === p.id ? "grabbing" : "grab",
                            opacity: projectDrag.drag?.id === p.id ? 0.35 : 1,
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--ui-text-4)" }}>
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
                border: "1px solid var(--ui-border)",
                borderRadius: 16,
                background: "var(--ui-surface)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "var(--ui-surface-2)", textAlign: "left", color: "var(--ui-text-4)" }}>
                    <th style={{ padding: "12px 16px" }}>Proyecto</th>
                    <th style={{ padding: "12px 16px" }}>Avance</th>
                    <th style={{ padding: "12px 16px" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {brandProjects.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--ui-muted)" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700 }}>{p.title}</td>
                      <td style={{ padding: "14px 16px", color: "var(--ui-accent-text-2)", fontWeight: 700 }}>
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
              border: "1px dashed var(--ui-border)",
              borderRadius: 18,
              padding: "36px 24px",
              background: "var(--ui-surface)",
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
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Layers size={20} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text)", marginBottom: 4 }}>
              Sin proyectos
            </div>
            <p style={{ fontSize: 13, color: "var(--ui-text-4)", margin: "0 0 16px" }}>
              Crea un proyecto para agrupar listas y páginas
            </p>
            <button
              type="button"
              onClick={() => setNewProjectModal(true)}
              style={{
                background: "var(--hb-accent)",
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
          {editingProject && <ProjectEditModal key={editingProject.id} project={editingProject} onClose={() => setEditingProjectId(null)} />}

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
                  background: "var(--ui-surface)",
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
                      color: "var(--ui-text-3)",
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
                      border: "1px solid var(--ui-border-strong)",
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
                      color: "var(--ui-text-3)",
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
                      border: "1px solid var(--ui-border-strong)",
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
                      background: "var(--ui-muted)",
                      color: "var(--ui-text-2)",
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
                      background: "var(--hb-accent)",
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
