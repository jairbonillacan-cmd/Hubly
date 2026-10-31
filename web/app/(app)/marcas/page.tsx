"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import type { BrandWorkspace } from "@/lib/types";
import {
  HublyArchiveIcon as Archive,
  HublyArchiveIcon as ArchiveRestore,
  HublyPlusIcon as Plus,
  HublySearchIcon as Search,
} from "@/components/app/icons/DuotoneIcons";

type View = "cards" | "tabla" | "usuario";

export default function MarcasPage() {
  const router = useRouter();
  const brands = useHublyStore((s) => s.brands);
  const team = useHublyStore((s) => s.team);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("cards");
  const [showArchived, setShowArchived] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = brands.filter(
    (b) =>
      Boolean(b.archived) === showArchived &&
      (!q || b.name.toLowerCase().includes(q) || b.industry.toLowerCase().includes(q))
  );
  const archivedCount = brands.filter((b) => b.archived).length;

  const open = (b: BrandWorkspace) => {
    setActiveBrand(b.id);
    router.push("/marca");
  };
  const badge = (b: BrandWorkspace) => (
    <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: b.color, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>
      {b.initials}
    </span>
  );
  const archiveBtn = (b: BrandWorkspace) => (
    <button
      type="button"
      disabled={!b.archived && b.id === activeBrandId}
      data-planned={!b.archived && b.id === activeBrandId ? "" : undefined}
      title={!b.archived && b.id === activeBrandId ? "Cambia de marca activa para archivarla" : b.archived ? "Restaurar" : "Archivar"}
      aria-label={`${b.archived ? "Restaurar" : "Archivar"} ${b.name}`}
      onClick={(e) => {
        e.stopPropagation();
        updateBrand(b.id, { archived: !b.archived, status: b.archived ? undefined : "archived" });
      }}
      style={{ border: 0, background: "transparent", color: "var(--ui-text-4)", cursor: "pointer", display: "grid", padding: 4 }}
    >
      {b.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
    </button>
  );

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ui-text)", margin: 0 }}>Marcas</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 12px", height: 36, border: "1px solid var(--ui-border)", borderRadius: 10, background: "var(--ui-surface)" }}>
            <Search size={14} color="#64748B" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar marca…" aria-label="Buscar marca" style={{ border: 0, outline: 0, background: "transparent", fontSize: 13, width: 150 }} />
          </label>
          <button type="button" className="saas-btn saas-btn-sm" onClick={() => setNewBrandModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} />
            Nueva marca
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div role="group" aria-label="Vista de marcas" style={{ display: "inline-flex", gap: 2, background: "var(--ui-muted)", padding: 3, borderRadius: 10 }}>
          {([["cards", "Cards"], ["tabla", "Tabla"], ["usuario", "Por usuario"]] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} style={{ border: 0, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: view === id ? "var(--ui-surface)" : "transparent", color: view === id ? "var(--ui-accent-text)" : "var(--ui-text-3)" }}>
              {label}
            </button>
          ))}
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ui-text-3)" }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Ver archivadas ({archivedCount})
        </label>
      </div>

      {visible.length === 0 && (
        <p style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
          {q ? "Ninguna marca coincide con tu búsqueda." : showArchived ? "No hay marcas archivadas." : "Aún no tienes marcas."}
        </p>
      )}

      {view === "cards" && visible.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
          {visible.map((b) => (
            <div key={b.id} role="button" tabIndex={0} onClick={() => open(b)} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(b); }} style={{ cursor: "pointer", background: "var(--ui-surface)", border: `1px solid ${b.id === activeBrandId ? "var(--hb-accent)" : "var(--ui-border)"}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {badge(b)}
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--ui-text)" }}>{b.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--ui-text-4)" }}>{b.handle}</span>
                </span>
                {archiveBtn(b)}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ui-text-3)" }}>{[b.industry, b.city].filter(Boolean).join(" · ")}</div>
              <div style={{ fontSize: 12, color: "var(--ui-text-4)", marginTop: 6 }}>
                {b.connectedNetworks.length} redes conectadas · {b.monthlyPostTarget} posts al mes
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "tabla" && visible.length > 0 && (
        <div style={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--ui-text-4)", fontSize: 12 }}>
                {["Marca", "Giro", "Ciudad", "Redes", "Posts/mes", "Equipo", ""].map((h, i) => <th key={i} style={cell}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id} onClick={() => open(b)} style={{ borderTop: "1px solid var(--ui-muted)", cursor: "pointer" }}>
                  <td style={{ ...cell, fontWeight: 650 }}>{b.name}<div style={{ fontSize: 12, fontWeight: 400, color: "var(--ui-text-4)" }}>{b.handle}</div></td>
                  <td style={cell}>{b.industry || "—"}</td>
                  <td style={cell}>{b.city || "—"}</td>
                  <td style={cell}>{b.connectedNetworks.length}</td>
                  <td style={cell}>{b.monthlyPostTarget}</td>
                  <td style={cell}>{team.filter((m) => m.brandIds?.includes(b.id)).length}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{archiveBtn(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "usuario" && visible.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {team.map((m) => {
            const mine = visible.filter((b) => m.brandIds?.includes(b.id));
            return (
              <section key={m.id} style={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 999, background: m.avatarColor || "var(--hb-accent)", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 11.5, fontWeight: 700 }}>{m.initials}</span>
                  <strong style={{ fontSize: 14 }}>{m.name}</strong>
                  <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{m.role} · {mine.length} marcas</span>
                </div>
                {mine.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: "var(--ui-text-4)", margin: 0 }}>Sin marcas asignadas.</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {mine.map((b) => (
                      <button key={b.id} type="button" onClick={() => open(b)} style={{ border: "1px solid var(--ui-border)", background: "var(--ui-surface-2)", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--ui-text-2)", cursor: "pointer" }}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

const cell = { padding: "10px 14px" } as const;
