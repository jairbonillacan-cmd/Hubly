"use client";

import type { SocialPost } from "@/lib/types";
import { backendEnabled } from "@/lib/supabase/config";

const fmt = (n: number) => n.toLocaleString("es-MX");

export function OrganicAnalytics({ posts }: { posts: SocialPost[] }) {
  const measured = posts.filter((p) => p.metrics);
  if (measured.length === 0) {
    return (
      <p style={{ fontSize: 13.5, color: "var(--ui-text-4)", textAlign: "center", padding: 36, background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14 }}>
        Sin datos todavía. Captura resultados en la pestaña Resultados de cada post publicado.
      </p>
    );
  }

  const sum = (pick: (m: NonNullable<SocialPost["metrics"]>) => number) =>
    measured.reduce((acc, p) => acc + pick(p.metrics!), 0);
  const tiles = [
    { label: "Alcance", value: sum((m) => m.reach) },
    { label: "Interacciones", value: sum((m) => m.likes + m.comments + m.shares) },
    { label: "Guardados", value: sum((m) => m.saves) },
    { label: "Posts medidos", value: measured.length },
  ];

  const byNetwork = new Map<string, number>();
  for (const p of measured) {
    const key = p.network || p.networks[0];
    byNetwork.set(key, (byNetwork.get(key) || 0) + p.metrics!.reach);
  }
  const bars = [...byNetwork.entries()].sort((a, b) => b[1] - a[1]);
  const maxReach = bars[0]?.[1] || 1;
  const top = [...measured].sort((a, b) => b.metrics!.reach - a.metrics!.reach).slice(0, 5);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p role="note" style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--ui-accent-text)", background: "var(--ui-sky-soft)", borderRadius: 10, padding: "8px 12px" }}>
        {backendEnabled ? "Resultados capturados a mano en cada post." : "Datos de ejemplo: todavía no hay cuentas conectadas."}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={card}>
            <div style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{t.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>{fmt(t.value)}</div>
          </div>
        ))}
      </div>

      <section style={card}>
        <h3 style={h3}>Alcance por red</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {bars.map(([name, reach]) => (
            <div key={name} title={`${name}: ${fmt(reach)} de alcance`} style={{ display: "grid", gridTemplateColumns: "84px minmax(0, 1fr) 64px", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ui-text-2)" }}>
              <span>{name}</span>
              <span style={{ height: 10, display: "block", background: "var(--ui-muted)", borderRadius: 6 }}>
                <span style={{ display: "block", height: "100%", width: `${(reach / maxReach) * 100}%`, background: "var(--hb-accent)", borderRadius: "0 6px 6px 0" }} />
              </span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(reach)}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, overflowX: "auto" }}>
        <h3 style={h3}>Mejores publicaciones</h3>
        <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ui-text-4)" }}>
              <th style={cell}>Post</th>
              <th style={{ ...cell, textAlign: "right" }}>Alcance</th>
              <th style={{ ...cell, textAlign: "right" }}>Me gusta</th>
              <th style={{ ...cell, textAlign: "right" }}>Guardados</th>
            </tr>
          </thead>
          <tbody>
            {top.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid var(--ui-muted)" }}>
                <td style={{ ...cell, fontWeight: 600 }}>{p.title}</td>
                <td style={{ ...cell, textAlign: "right" }}>{fmt(p.metrics!.reach)}</td>
                <td style={{ ...cell, textAlign: "right" }}>{fmt(p.metrics!.likes)}</td>
                <td style={{ ...cell, textAlign: "right" }}>{fmt(p.metrics!.saves)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const card = { background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14, padding: 16 } as const;
const h3 = { fontSize: 14, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 12px" } as const;
const cell = { padding: "8px 6px" } as const;
