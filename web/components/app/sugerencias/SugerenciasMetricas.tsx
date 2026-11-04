"use client";

import {
  HublyChatIcon as MessageCircle,
  HublyCheckIcon as Check,
  HublyDocumentIcon as FileText,
  HublyGlobeIcon as Globe,
  HublyTargetIcon as MousePointerClick,
} from "@/components/app/icons/DuotoneIcons";
import type { SuggestedMetricItem } from "@/lib/domain/recommendations";

function MetricCardIcon({ type }: { type: SuggestedMetricItem["icon"] }) {
  if (type === "globe") {
    return <Globe size={15} className="hubly-sugerencias-metric-icon" />;
  }
  if (type === "mouse") {
    return <MousePointerClick size={15} className="hubly-sugerencias-metric-icon-muted" />;
  }
  if (type === "form") {
    return <FileText size={15} className="hubly-sugerencias-metric-icon" />;
  }
  if (type === "chat") {
    return <MessageCircle size={15} className="hubly-sugerencias-metric-icon-muted" />;
  }
  if (type === "ig") {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="hubly-sugerencias-metric-icon"
      >
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="3.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="11.4" cy="4.6" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="hubly-sugerencias-metric-icon"
    >
      <circle cx="8" cy="8" r="6" fill="currentColor" />
      <path
        d="M9.6 5.5H8.7C8.2 5.5 8 5.75 8 6.2V7.2H9.5L9.3 8.6H8V12.5H6.5V8.6H5.4V7.2H6.5V6C6.5 4.8 7.2 4.1 8.5 4.1C9.1 4.1 9.6 4.2 9.6 4.2V5.5Z"
        fill="var(--ui-surface)"
      />
    </svg>
  );
}

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
    <div className="hubly-sugerencias-metrics-list">
      {metrics.map((m) => (
        <div
          key={m.id}
          onClick={() => onToggleChecked(m.id)}
          className="hubly-sugerencias-metric-row"
          data-checked={m.checked || undefined}
        >
          <div className="hubly-sugerencias-metric-left">
            <button
              type="button"
              role="checkbox"
              aria-checked={m.checked}
              onClick={(e) => {
                e.stopPropagation();
                onToggleChecked(m.id);
              }}
              className="hubly-sugerencias-checkbox"
            >
              {m.checked && <Check size={12} strokeWidth={3} />}
            </button>

            <MetricCardIcon type={m.icon} />

            <div className="hubly-sugerencias-metric-info">
              <div className="hubly-sugerencias-metric-title">{m.title}</div>
              <div className="hubly-sugerencias-metric-sub">{m.subtitle}</div>
            </div>
          </div>

          {m.checked && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="hubly-sugerencias-metric-right"
            >
              <span className="hubly-sugerencias-metric-target-label">Meta</span>
              <input
                type="text"
                value={m.target}
                onChange={(e) => onUpdateTarget(m.id, e.target.value)}
                aria-label={`Meta para ${m.title}`}
                className="hubly-sugerencias-metric-target-input"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
