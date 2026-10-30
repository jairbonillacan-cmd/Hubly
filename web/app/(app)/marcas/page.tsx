"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useHublyStore } from "@/lib/store";

export default function MarcasPage() {
  const router = useRouter();
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = brands.filter(
    (b) =>
      !b.archived &&
      (!q || b.name.toLowerCase().includes(q) || b.industry.toLowerCase().includes(q))
  );

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>Marcas</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 12px",
              height: 36,
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              background: "#FFFFFF",
            }}
          >
            <Search size={14} color="#64748B" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar marca…"
              aria-label="Buscar marca"
              style={{ border: 0, outline: 0, background: "transparent", fontSize: 13, width: 150 }}
            />
          </label>
          <button
            type="button"
            className="saas-btn saas-btn-sm"
            onClick={() => setNewBrandModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={14} />
            Nueva marca
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#64748B" }}>
          {q ? "Ninguna marca coincide con tu búsqueda." : "Aún no tienes marcas."}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: 14,
          }}
        >
          {visible.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setActiveBrand(b.id);
                router.push("/marca");
              }}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: "#FFFFFF",
                border: `1px solid ${b.id === activeBrandId ? "#6C77C1" : "#E2E8F0"}`,
                borderRadius: 14,
                padding: 16,
                font: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 10,
                    background: b.color,
                    color: "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {b.initials}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "#0F172A" }}>
                    {b.name}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color: "#64748B" }}>{b.handle}</span>
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "#475569" }}>
                {[b.industry, b.city].filter(Boolean).join(" · ")}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                {b.connectedNetworks.length} redes conectadas · {b.monthlyPostTarget} posts al mes
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
