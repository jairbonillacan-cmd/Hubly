"use client";

import { useHublyStore } from "@/lib/store";
import type { BrandWorkspace, SocialPost } from "@/lib/types";

/** Cuota mensual de la marca: cuántos posts del mes ya están listos frente a lo prometido. */
export function MonthlyQuota({ brand, posts, year, month }: { brand: BrandWorkspace; posts: SocialPost[]; year: number; month: number }) {
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const inMonth = posts.filter((p) => p.scheduledDate.startsWith(prefix));
  const ready = inMonth.filter((p) => ["approved", "scheduled", "published"].includes(p.status)).length;
  const target = brand.monthlyPostTarget || 0;
  const pct = target > 0 ? Math.min(100, Math.round((ready / target) * 100)) : 0;
  const missing = Math.max(0, target - inMonth.length);

  return (
    <div style={{ background: "var(--ui-surface-2)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 12.5, color: "var(--ui-text-3)" }}>
        <span>
          <strong style={{ color: "var(--ui-text)" }}>{ready} de {target}</strong> posts listos este mes · {inMonth.length} en calendario
          {missing > 0 ? ` · faltan ${missing} por crear` : ""}
        </span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          Cuota mensual
          <input
            type="number"
            min={0}
            max={999}
            value={target}
            onChange={(e) => updateBrand(brand.id, { monthlyPostTarget: Math.max(0, Number(e.target.value) || 0) })}
            aria-label={`Cuota mensual de ${brand.name}`}
            style={{ width: 62, border: "1px solid var(--ui-border-strong)", borderRadius: 7, padding: "3px 6px", fontSize: 12.5, background: "var(--ui-surface)" }}
          />
        </label>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance de la cuota"
        title={`${pct}% de la cuota`}
        style={{ height: 8, background: "var(--ui-muted)", borderRadius: 6, marginTop: 8, overflow: "hidden" }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--hb-accent)" }} />
      </div>
    </div>
  );
}
