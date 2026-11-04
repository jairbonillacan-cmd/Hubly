"use client";

import {
  HublyCheckIcon as Check,
} from "@/components/app/icons/DuotoneIcons";
import { MetricCardIcon, type SuggestedMetricItem } from "./AutoSuggestionsModal-shared";

interface SugerenciasMetricasProps {
  metrics: SuggestedMetricItem[];
  onToggleChecked: (id: string) => void;
  onUpdateTarget: (id: string, value: string) => void;
}

export function SugerenciasMetricas({
  metrics,
  onToggleChecked,
  onUpdateTarget,
}: SugerenciasMetricasProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {metrics.map((m) => (
        <div
          key={m.id}
          onClick={() => onToggleChecked(m.id)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "11px 14px",
            borderRadius: 12,
            border: m.checked
              ? "1px solid #BFE2F4"
              : "1px solid #E2E8F0",
            background: m.checked ? "#F5F7FF" : "var(--ui-surface)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={m.checked}
              onClick={(e) => {
                e.stopPropagation();
                onToggleChecked(m.id);
              }}
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: m.checked ? "none" : "1.5px solid var(--ui-border-strong)",
                background: m.checked ? "var(--hb-accent)" : "var(--ui-surface)",
                color: "var(--on-accent)",
                display: "grid",
                placeItems: "center",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {m.checked && <Check size={12} strokeWidth={3} />}
            </button>

            <MetricCardIcon type={m.icon} />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                }}
              >
                {m.title}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>
                {m.subtitle}
              </div>
            </div>
          </div>

          {m.checked && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  color: "var(--ui-text-4)",
                  fontWeight: 600,
                }}
              >
                Meta
              </span>
              <input
                type="text"
                value={m.target}
                onChange={(e) =>
                  onUpdateTarget(m.id, e.target.value)
                }
                aria-label={`Meta para ${m.title}`}
                style={{
                  width: 66,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid var(--ui-border-strong)",
                  background: "var(--ui-surface)",
                  textAlign: "center",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
