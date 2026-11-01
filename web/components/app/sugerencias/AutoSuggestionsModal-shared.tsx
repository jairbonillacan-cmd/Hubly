import type {
  AccountCommitment,
  RecommendationMetricKey,
} from "@/lib/types";
import {
  HublyChatIcon as MessageCircle,
  HublyDocumentIcon as FileText,
  HublyGlobeIcon as Globe,
  HublyTargetIcon as MousePointerClick,
} from "@/components/app/icons/DuotoneIcons";

export interface SuggestedMetricItem {
  id: string;
  checked: boolean;
  icon: "globe" | "mouse" | "form" | "chat" | "ig" | "fb";
  title: string;
  subtitle: string;
  target: string;
}

export interface AutoSuggestionsModalProps {
  open?: boolean;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApply?: (payload: any[]) => void;
}

export const DEFAULT_METRICS: SuggestedMetricItem[] = [
  {
    id: "m-lpv",
    checked: true,
    icon: "globe",
    title: "Landing page views / semana",
    subtitle: "Hoy llegan ~5.5 visitas a la página por semana",
    target: "5.5",
  },
  {
    id: "m-clicks",
    checked: true,
    icon: "mouse",
    title: "Clicks / semana",
    subtitle: "Hoy consigue ~330 clics por semana",
    target: "330",
  },
  {
    id: "m-leads",
    checked: false,
    icon: "form",
    title: "Leads (formularios) / semana",
    subtitle: "Cuando pides datos en un formulario dentro del anuncio",
    target: "12",
  },
  {
    id: "m-conv",
    checked: false,
    icon: "chat",
    title: "Conversaciones / semana",
    subtitle: "Mensajes iniciados por WhatsApp, Messenger o Instagram",
    target: "25",
  },
  {
    id: "m-ig",
    checked: false,
    icon: "ig",
    title: "Alcance en Instagram / semana",
    subtitle: "Personas únicas que ven tus publicaciones",
    target: "5,000",
  },
  {
    id: "m-fb",
    checked: false,
    icon: "fb",
    title: "Alcance en Facebook / semana",
    subtitle: "Personas únicas que ven tus publicaciones",
    target: "3,500",
  },
];

export const METRIC_KEY_LABELS: Record<RecommendationMetricKey, string> = {
  posts: "Publicaciones mensuales",
  reels: "Reels mensuales",
  stories: "Stories mensuales",
  ads: "Campañas Ads",
};

export function mapMetricKeyToCommitmentPatch(
  metricKey: RecommendationMetricKey,
  value: number
): Partial<AccountCommitment> {
  if (metricKey === "posts") return { postsCommitted: value };
  if (metricKey === "reels") return { reelsCommitted: value };
  if (metricKey === "stories")
    return { StoriesCommitted: value, storiesCommitted: value };
  return { adCampaignsCommitted: value };
}

export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function MetricCardIcon({ type }: { type: SuggestedMetricItem["icon"] }) {
  if (type === "globe") {
    return <Globe size={15} style={{ color: "#38BDF8" }} />;
  }
  if (type === "mouse") {
    return <MousePointerClick size={15} style={{ color: "var(--ui-text-5)" }} />;
  }
  if (type === "form") {
    return <FileText size={15} style={{ color: "#CB997E" }} />;
  }
  if (type === "chat") {
    return <MessageCircle size={15} style={{ color: "#CBD5E1" }} />;
  }
  if (type === "ig") {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="3.5"
          stroke="#EC4899"
          strokeWidth="1.5"
        />
        <circle cx="8" cy="8" r="2.6" stroke="#EC4899" strokeWidth="1.4" />
        <circle cx="11.4" cy="4.6" r="0.8" fill="#EC4899" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="#3B82F6" />
      <path
        d="M9.6 5.5H8.7C8.2 5.5 8 5.75 8 6.2V7.2H9.5L9.3 8.6H8V12.5H6.5V8.6H5.4V7.2H6.5V6C6.5 4.8 7.2 4.1 8.5 4.1C9.1 4.1 9.6 4.2 9.6 4.2V5.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
