"use client";

import React, { useMemo, useState } from "react";
import {
  UserPlus,
  SlidersHorizontal,
  Pencil,
  TrendingUp,
  Award,
  Users,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  Copy,
  X,
  Mail,
  UserCheck,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { MemberDrawer } from "@/components/app/dashboard/MemberDrawer";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  selectGreetingAndDate,
  selectTeamProductivity,
  type TeamProductivityPeriod,
  type EvaluatedTeamMember,
  type TeamAchievementItem,
} from "@/lib/domain-selectors";

/* ==========================================================================
   ILLUSTRATED SVG STICKERS & ACHIEVEMENT BADGES (Módulos 98919, 22918, 51903)
   ========================================================================== */

export function WeekdayCharacterSticker({
  dayIndex,
}: {
  dayIndex: number;
}) {
  const configs = [
    { bg: "#ECEEF8", accent: "#6C77C1", hat: "#6366F1" }, // Lunes
    { bg: "#E0E7FF", accent: "#6C77C1", hat: "#EC4899" }, // Martes
    { bg: "#DCFCE7", accent: "#10B981", hat: "#6C77C1" }, // Miércoles
    { bg: "#FCE7F3", accent: "#EC4899", hat: "#3B82F6" }, // Jueves
    { bg: "#F3E8FF", accent: "#8B5CF6", hat: "#10B981" }, // Hoy / Viernes
  ];
  const c = configs[dayIndex % configs.length];

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="9"
        fill={c.bg}
        stroke="#1E293B"
        strokeWidth="1.2"
      />
      <circle
        cx="16"
        cy="17"
        r="7.5"
        fill="#D9DCF0"
        stroke="#1E293B"
        strokeWidth="1.3"
      />
      <path
        d="M9.5 14C10.5 10 13 8.5 16 8.5C19 8.5 21.5 10 22.5 14"
        fill={c.hat}
        stroke="#1E293B"
        strokeWidth="1.3"
      />
      <circle cx="13.5" cy="16.5" r="1.1" fill="#1E293B" />
      <circle cx="18.5" cy="16.5" r="1.1" fill="#1E293B" />
      <path
        d="M14 19.8C14.8 20.8 17.2 20.8 18 19.8"
        stroke="#1E293B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="23.5" cy="9" r="2.2" fill={c.accent} />
    </svg>
  );
}

export function AchievementBadgeSvg({
  variant,
  unlocked = false,
}: {
  variant: number;
  unlocked?: boolean;
}) {
  const palettes = [
    { bg: "#F0F1F9", ring: "#6366F1", fill: "#D9DCF0" },
    { bg: "#ECEEF8", ring: "#6C77C1", fill: "#D9DCF0" },
    { bg: "#DCFCE7", ring: "#10B981", fill: "#A7F3D0" },
    { bg: "#FCE7F3", ring: "#EC4899", fill: "#FBCFE8" },
    { bg: "#E0F2FE", ring: "#0284C7", fill: "#BAE6FD" },
    { bg: "#F3E8FF", ring: "#8B5CF6", fill: "#DDD6FE" },
  ];
  const p = palettes[variant % palettes.length];
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      style={{
        opacity: unlocked ? 1 : 0.72,
        filter: unlocked ? "drop-shadow(0 4px 10px rgba(79,70,229,0.16))" : "none",
        transition: "opacity 180ms ease, transform 180ms ease",
      }}
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="24"
        fill={p.bg}
        stroke={p.ring}
        strokeWidth={unlocked ? "2" : "1.5"}
        strokeDasharray={unlocked ? undefined : "3 2"}
      />
      <circle
        cx="28"
        cy="26"
        r="11"
        fill={p.fill}
        stroke="#1E293B"
        strokeWidth="1.5"
      />
      <circle cx="24.5" cy="24.5" r="1.5" fill="#1E293B" />
      <circle cx="31.5" cy="24.5" r="1.5" fill="#1E293B" />
      <path
        d="M25 28.5C26.2 30 29.8 30 31 28.5"
        stroke="#1E293B"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M19 42C20.5 37.5 23.8 35.5 28 35.5C32.2 35.5 35.5 37.5 37 42"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {unlocked && (
        <g>
          <circle cx="43" cy="13" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          <path
            d="M39.8 13L42 15.2L46.4 10.8"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

/* ==========================================================================
   MASTER CATALOG OF 39 ACHIEVEMENTS (Módulo 22918 en 6614-bf40d3989a3e7090.js)
   ========================================================================== */

interface CatalogAchievementItem {
  id: string;
  category:
    | "Generales"
    | "Tareas"
    | "Proyectos"
    | "CRM"
    | "Contenido"
    | "Social"
    | "Analytics"
    | "Inteligencia"
    | "Hubly AI"
    | "Chat & Marca";
  title: string;
  description: string;
  emoji: string;
  target: number;
  xpReward: number;
}

const FULL_39_ACHIEVEMENTS_CATALOG: CatalogAchievementItem[] = [
  // 1. Generales (10)
  { id: "first_step", category: "Generales", title: "Primer Paso", description: "Tu primera acción registrada", emoji: "👣", target: 1, xpReward: 25 },
  { id: "streak_3", category: "Generales", title: "Racha de 3", description: "3 días seguidos con actividad", emoji: "🔥", target: 3, xpReward: 50 },
  { id: "streak_7", category: "Generales", title: "Semana Completa", description: "7 días consecutivos activo", emoji: "⭐", target: 7, xpReward: 100 },
  { id: "streak_30", category: "Generales", title: "Mes Imparable", description: "30 días seguidos de racha", emoji: "💎", target: 30, xpReward: 300 },
  { id: "centenario", category: "Generales", title: "Centenario", description: "Alcanza tus primeros 100 XP", emoji: "💯", target: 100, xpReward: 50 },
  { id: "mil", category: "Generales", title: "Club de los Mil", description: "Supera los 1,000 XP acumulados", emoji: "🏆", target: 1000, xpReward: 250 },
  { id: "multitasker", category: "Generales", title: "Multitasker", description: "Usa 5+ módulos distintos en la semana", emoji: "🎯", target: 5, xpReward: 80 },
  { id: "early_bird", category: "Generales", title: "Madrugador", description: "Registra actividad antes de las 7am (5x)", emoji: "🌅", target: 5, xpReward: 60 },
  { id: "night_owl", category: "Generales", title: "Búho Nocturno", description: "Actividad después de las 10pm (5x)", emoji: "🦉", target: 5, xpReward: 60 },
  { id: "weekend_warrior", category: "Generales", title: "Guerrero de Fin de Semana", description: "4 fines de semana con entregas", emoji: "⚔️", target: 4, xpReward: 90 },
  // 2. Tareas (3)
  { id: "task_starter", category: "Tareas", title: "Organizador", description: "Completa 10 tareas del espacio", emoji: "✅", target: 10, xpReward: 75 },
  { id: "task_machine", category: "Tareas", title: "Máquina de Tareas", description: "Completa 100 tareas cerradas", emoji: "", target: 100, xpReward: 250 },
  { id: "list_master", category: "Tareas", title: "Maestro de Listas", description: "Organiza 10 listas o libretas", emoji: "📋", target: 10, xpReward: 80 },
  // 3. Proyectos (3)
  { id: "project_launcher", category: "Proyectos", title: "Lanzador", description: "Crea tu primer proyecto de marca", emoji: "🚀", target: 1, xpReward: 50 },
  { id: "milestone_hunter", category: "Proyectos", title: "Cazador de Milestones", description: "Completa 10 milestones de cliente", emoji: "🏔️", target: 10, xpReward: 120 },
  { id: "project_veteran", category: "Proyectos", title: "Veterano de Proyectos", description: "Entrega 5 proyectos completos", emoji: "🎖️", target: 5, xpReward: 150 },
  // 4. CRM (4)
  { id: "pipeline_pro", category: "CRM", title: "Pipeline Pro", description: "Mueve 20 leads en el embudo", emoji: "📊", target: 20, xpReward: 90 },
  { id: "closer", category: "CRM", title: "Closer", description: "Cierra tu primer deal ganado", emoji: "🤝", target: 1, xpReward: 100 },
  { id: "meeting_master", category: "CRM", title: "Rey de las Juntas", description: "Agenda 20 reuniones con clientes", emoji: "📅", target: 20, xpReward: 100 },
  { id: "crm_detective", category: "CRM", title: "Detective CRM", description: "Documenta 50 notas de seguimiento", emoji: "🔍", target: 50, xpReward: 110 },
  // 5. Contenido (5)
  { id: "content_creator", category: "Contenido", title: "Creador", description: "Crea 10 piezas en Content Manager", emoji: "✏️", target: 10, xpReward: 75 },
  { id: "content_machine", category: "Contenido", title: "Máquina de Contenido", description: "Produce 50 piezas creativas", emoji: "🎨", target: 50, xpReward: 200 },
  { id: "scheduler", category: "Contenido", title: "Planificador", description: "Agenda 20 posts en el calendario", emoji: "🗓️", target: 20, xpReward: 90 },
  { id: "librarian", category: "Contenido", title: "Bibliotecario", description: "Sube y etiqueta 50 archivos", emoji: "📚", target: 50, xpReward: 100 },
  { id: "scriptwriter", category: "Contenido", title: "Guionista", description: "Escribe 10 scripts para video/reels", emoji: "📝", target: 10, xpReward: 85 },
  // 6. Social (2)
  { id: "social_analyst", category: "Social", title: "Analista Social", description: "Genera 5 reportes de redes sociales", emoji: "📈", target: 5, xpReward: 80 },
  { id: "inbox_hero", category: "Social", title: "Héroe del Inbox", description: "Responde 50 mensajes de comunidad", emoji: "💌", target: 50, xpReward: 120 },
  // 7. Analytics (2)
  { id: "data_nerd", category: "Analytics", title: "Data Nerd", description: "Exporta 10 tableros o análisis ROAS", emoji: "📉", target: 10, xpReward: 90 },
  { id: "funnel_builder", category: "Analytics", title: "Arquitecto de Funnels", description: "Construye 3 funnels TOF/MOF/BOF", emoji: "🔬", target: 3, xpReward: 100 },
  // 8. Inteligencia (3)
  { id: "ad_curator", category: "Inteligencia", title: "Curador de Ads", description: "Guarda 25 referencias en Ad Library", emoji: "🖼️", target: 25, xpReward: 85 },
  { id: "swipe_addict", category: "Inteligencia", title: "Swipe Addict", description: "Completa 10 sesiones de swipe file", emoji: "👆", target: 10, xpReward: 70 },
  { id: "trend_spotter", category: "Inteligencia", title: "Cazador de Tendencias", description: "Detecta 10 tendencias para marcas", emoji: "🔮", target: 10, xpReward: 80 },
  // 9. Hubly AI (3)
  { id: "hubly_fan", category: "Hubly AI", title: "Fan de Hubly", description: "50 conversaciones estratégicas con IA", emoji: "🤖", target: 50, xpReward: 110 },
  { id: "agent_builder", category: "Hubly AI", title: "Constructor de Agentes", description: "Configura tu primer agente autónomo", emoji: "🧪", target: 1, xpReward: 95 },
  { id: "agent_power_user", category: "Hubly AI", title: "Power User de Agentes", description: "25 ejecuciones exitosas de agentes", emoji: "⚙️", target: 25, xpReward: 150 },
  // 10. Chat & Marca (4)
  { id: "team_player", category: "Chat & Marca", title: "Team Player", description: "Comparte 100 mensajes con el equipo", emoji: "💬", target: 100, xpReward: 90 },
  { id: "thread_starter", category: "Chat & Marca", title: "Iniciador de Hilos", description: "Abre 20 hilos de revisión enfocados", emoji: "🧵", target: 20, xpReward: 70 },
  { id: "persona_creator", category: "Chat & Marca", title: "Creador de Personas", description: "Define 3 buyer personas en Brand Core", emoji: "👥", target: 3, xpReward: 85 },
  { id: "brand_researcher", category: "Chat & Marca", title: "Investigador de Marca", description: "Completa 5 auditorías de marca", emoji: "🧠", target: 5, xpReward: 100 },
];

const XP_LEVEL_TIERS = [
  { level: 1, name: "Nuevo", minXp: 0, color: "#8FC881" },
  { level: 2, name: "Activo", minXp: 50, color: "#6C77C1" },
  { level: 3, name: "Dedicado", minXp: 200, color: "#D87898" },
  { level: 4, name: "Experto", minXp: 500, color: "#8DCBCF" },
  { level: 5, name: "Leyenda", minXp: 1500, color: "#6C77C1" },
];

const EFFORT_CATEGORIES = [
  {
    title: "1. Alto impacto",
    points: "+35 a +60 XP",
    color: "#9384C0",
    bg: "#F5F3FF",
    examples: "Crear proyecto, cerrar deal, completar milestone, crear agente, agendar reunión o crear marca.",
  },
  {
    title: "2. Trabajo creativo",
    points: "+25 a +40 XP",
    color: "#CF9898",
    bg: "#FFF1F2",
    examples: "Publicar contenido, escribir script, crear buyer persona, generar reporte ejecutivo o armar funnel.",
  },
  {
    title: "3. Gestión del día a día",
    points: "+15 a +25 XP",
    color: "#5B78C0",
    bg: "#EFF6FF",
    examples: "Completar tarea, mover lead, agregar nota en libreta, agendar post, responder inbox o subir archivo.",
  },
  {
    title: "4. Interacciones rápidas",
    points: "+5 a +10 XP",
    color: "#0D9488",
    bg: "#F0FDFA",
    examples: "Enviar mensaje al equipo, guardar referencia de anuncio, consultar a Hubly AI o revisar métricas.",
  },
];

const ROLE_OPTIONS: string[] = [
  "Strategist",
  "Community Manager",
  "Paid Media",
  "Content Creator",
  "Designer",
  "Account Manager",
  "Admin",
];

/* ==========================================================================
   INVITE TEAM MODAL COMPONENT (Exported & Integrated with useHublyStore)
   ========================================================================== */

export function InviteTeamModal() {
  const inviteModalOpen = useHublyStore((s) => s.inviteModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const inviteTeamMember = useHublyStore((s) => s.inviteTeamMember);
  const acceptTeamInvitation = useHublyStore((s) => s.acceptTeamInvitation);
  const cancelTeamInvitation = useHublyStore((s) => s.cancelTeamInvitation);
  const invitations = useHublyStore((s) => s.invitations);
  const brands = useHublyStore((s) => s.brands);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("Strategist");
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(["brand-min"]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const presence = useModalPresence(inviteModalOpen);
  if (!presence.mounted) return null;

  const toggleBrandSelection = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Ingresa un correo electrónico válido (ej. nombre@agencia.com).");
      return;
    }

    const created = inviteTeamMember({
      email: trimmedEmail,
      name: trimmedName || trimmedEmail.split("@")[0] || "Nuevo miembro",
      role,
      brandIds: selectedBrandIds.length > 0 ? selectedBrandIds : ["brand-min"],
    });

    if (!created) {
      setErrorMsg("No se pudo crear la invitación. Verifica el correo.");
      return;
    }

    setErrorMsg(null);
    setLastCreatedId(created.id);
    setName("");
    setEmail("");
  };

  const handleCopyInviteLink = (inviteLink: string, id: string) => {
    const url =
      typeof window !== "undefined" && inviteLink.startsWith("/")
        ? `${window.location.origin}${inviteLink}`
        : inviteLink;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  return (
    <div
      role="dialog"
      className="hubly-overlay"
      data-state={presence.state}
      aria-modal="true"
      aria-labelledby="invite-team-modal-title"
      onClick={() => setInviteModalOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="hubly-sheet"
        data-state={presence.state}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--ui-surface)",
          borderRadius: 18,
          border: "1px solid var(--ui-border)",
          boxShadow: "0 24px 48px rgba(15, 23, 42, 0.18)",
          padding: "22px 24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "var(--ui-accent-soft)",
                color: "#6C77C1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <UserPlus size={18} />
            </div>
            <div>
              <h3
                id="invite-team-modal-title"
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                }}
              >
                Invitar miembro al equipo
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12.5,
                  color: "var(--ui-text-4)",
                }}
              >
                Comparte acceso a marcas, tareas y reportes de la agencia
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInviteModalOpen(false)}
            aria-label="Cerrar modal de invitación"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-surface)",
              color: "var(--ui-text-4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleInviteSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label
                htmlFor="invite-member-name"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ui-text-2)",
                  marginBottom: 5,
                }}
              >
                Nombre
              </label>
              <input
                id="invite-member-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Camila Torres"
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid var(--ui-border-strong)",
                  fontSize: 13,
                  color: "var(--ui-text)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="invite-member-email"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ui-text-2)",
                  marginBottom: 5,
                }}
              >
                Correo electrónico *
              </label>
              <input
                id="invite-member-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="camila@agencia.com"
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid var(--ui-border-strong)",
                  fontSize: 13,
                  color: "var(--ui-text)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div>
              <label
                htmlFor="invite-member-role"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ui-text-2)",
                  marginBottom: 5,
                }}
              >
                Rol en la agencia
              </label>
              <select
                id="invite-member-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid var(--ui-border-strong)",
                  fontSize: 13,
                  color: "var(--ui-text)",
                  background: "var(--ui-surface)",
                }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ui-text-2)",
                  marginBottom: 6,
                }}
              >
                Marcas asignadas ({selectedBrandIds.length})
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {brands.map((b) => {
                  const selected = selectedBrandIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBrandSelection(b.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        borderRadius: 8,
                        border: selected
                          ? "1px solid #6C77C1"
                          : "1px solid #E2E8F0",
                        background: selected ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                        color: selected ? "#6C77C1" : "var(--ui-text-3)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: b.id === "brand-min" ? "#6366F1" : b.color,
                          color: "#FFFFFF",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {b.initials.slice(0, 1)}
                      </span>
                      <span>{b.name}</span>
                      {selected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 9,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                fontSize: 12,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="hbtn-outline"
              style={{ height: 36, fontSize: 12.5, padding: "0 14px" }}
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="hbtn-indigo"
              style={{ height: 36, fontSize: 12.5, padding: "0 16px" }}
            >
              <Mail size={13} />
              <span>Enviar invitación</span>
            </button>
          </div>
        </form>

        {/* Active / Pending Invitations List inside Modal */}
        {invitations.length > 0 && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid var(--ui-border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ui-text-3)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Invitaciones generadas ({invitations.length})</span>
              {lastCreatedId && (
                <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>
                  ¡Invitación lista para compartir!
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {invitations.map((inv) => {
                const isPending = inv.status === "Pendiente";
                const isCopied = copiedId === inv.id;
                return (
                  <div
                    key={inv.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 11,
                      border: "1px solid var(--ui-border)",
                      background: isPending ? "var(--ui-surface-2)" : "#F0FDF4",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--ui-text)",
                          }}
                        >
                          {inv.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 9999,
                            background: isPending ? "#ECEEF8" : "#DCFCE7",
                            color: isPending ? "var(--ui-accent-text)" : "#15803D",
                          }}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ui-text-4)",
                          marginTop: 2,
                        }}
                      >
                        {inv.email} · {inv.role}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(inv.inviteLink, inv.id)}
                        style={{
                          height: 28,
                          padding: "0 9px",
                          borderRadius: 7,
                          border: "1px solid var(--ui-border-strong)",
                          background: "var(--ui-surface)",
                          color: "var(--ui-text-2)",
                          fontSize: 11.5,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          cursor: "pointer",
                        }}
                      >
                        {isCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        <span>{isCopied ? "Copiado" : "Copiar enlace"}</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => acceptTeamInvitation(inv.id)}
                            style={{
                              height: 28,
                              padding: "0 10px",
                              borderRadius: 7,
                              border: "none",
                              background: "#6C77C1",
                              color: "#FFFFFF",
                              fontSize: 11.5,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                            }}
                          >
                            <UserCheck size={12} />
                            <span>Aceptar en modo demo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelTeamInvitation(inv.id)}
                            title="Cancelar invitación"
                            style={{
                              height: 28,
                              padding: "0 8px",
                              borderRadius: 7,
                              border: "1px solid #FECACA",
                              background: "#FEF2F2",
                              color: "#DC2626",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN EQUIPO VIEW COMPONENT (/dashboard/equipo & /dashboard?tab=equipo)
   ========================================================================== */

export function EquipoView() {
  const team = useHublyStore((s) => s.team);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activityEvents = useHublyStore((s) => s.activityEvents);
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const invitations = useHublyStore((s) => s.invitations);
  const testClock = useHublyStore((s) => s.testClock);

  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const acceptTeamInvitation = useHublyStore((s) => s.acceptTeamInvitation);
  const cancelTeamInvitation = useHublyStore((s) => s.cancelTeamInvitation);
  const updateTeamMember = useHublyStore((s) => s.updateTeamMember);
  const recordActivityEvent = useHublyStore((s) => s.recordActivityEvent);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);

  // Filter & Period states
  const [teamPeriod, setTeamPeriod] = useState<TeamProductivityPeriod>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityRange, setActivityRange] = useState<"Semana" | "Mes">("Semana");
  const [rankingRange, setRankingRange] = useState<"Hoy" | "Semana" | "Mes">("Semana");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("tm-1");
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);
  const [showAllTeamScope, setShowAllTeamScope] = useState<boolean>(false);

  // Interactive popovers / drawers / accordions
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPresence = useModalPresence(filtersOpen, 100);
  const [brandFilterId, setBrandFilterId] = useState<string>("all");
  const [editingBrandsOpen, setEditingBrandsOpen] = useState(false);
  const [hasCustomizedOwnerBrands, setHasCustomizedOwnerBrands] = useState(false);
  const [showAll39Achievements, setShowAll39Achievements] = useState(false);
  const [achievementCategoryFilter, setAchievementCategoryFilter] = useState<string>("Todos");
  const [pointsAccordionOpen, setPointsAccordionOpen] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // 1. Synchronize primary member (tm-1) with live `profile` from store
  const syncedTeam = useMemo(() => {
    return team.map((m, idx) =>
      m.id === "tm-1" || idx === 0
        ? {
            ...m,
            name: profile.name || m.name,
            avatarInitial: profile.avatarInitial || m.avatarInitial,
            role: profile.role || m.role,
          }
        : m
    );
  }, [team, profile.name, profile.avatarInitial, profile.role]);

  // 2. Filter tasks and posts if a specific brand filter is active
  const filteredTasks = useMemo(() => {
    if (brandFilterId === "all") return tasks;
    return tasks.filter((t) => t.brandId === brandFilterId);
  }, [tasks, brandFilterId]);

  const filteredPosts = useMemo(() => {
    if (brandFilterId === "all") return posts;
    return posts.filter((p) => p.brandId === brandFilterId);
  }, [posts, brandFilterId]);

  // 3. Compute Team Productivity from real store entities via `selectTeamProductivity`
  const productivity = useMemo(
    () =>
      selectTeamProductivity(
        syncedTeam,
        filteredTasks,
        filteredPosts,
        activityEvents,
        teamPeriod,
        searchQuery
      ),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, teamPeriod, searchQuery]
  );

  // 4. Compute Ranking for the selected Ranking tab (Hoy | Semana | Mes)
  const rankingPeriodKey: TeamProductivityPeriod =
    rankingRange === "Hoy" ? "hoy" : rankingRange === "Semana" ? "semana" : "mes";

  const rankingProductivity = useMemo(
    () =>
      selectTeamProductivity(
        syncedTeam,
        filteredTasks,
        filteredPosts,
        activityEvents,
        rankingPeriodKey,
        searchQuery
      ),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, rankingPeriodKey, searchQuery]
  );

  const rankingRows = useMemo(() => {
    return rankingProductivity.ranking.map((m: EvaluatedTeamMember) => ({
      ...m,
      displayPoints: m.xp,
    }));
  }, [rankingProductivity.ranking]);

  const leaderPoints = useMemo(
    () => Math.max(1, ...rankingRows.map((r) => r.displayPoints)),
    [rankingRows]
  );

  // 5. Greeting from `selectGreetingAndDate(profile, testClock?.fixedIsoNow)`
  const greetingData = useMemo(
    () => selectGreetingAndDate(profile, testClock?.fixedIsoNow),
    [profile, testClock?.fixedIsoNow]
  );

  // 6. Selected Member Metrics (defaults to primary operator Jair `tm-1`, or any clicked member)
  const activeMemberMetrics: EvaluatedTeamMember = useMemo(() => {
    const found = productivity.members.find((m) => m.id === selectedMemberId);
    return found ?? productivity.activeMember;
  }, [productivity.members, productivity.activeMember, selectedMemberId]);

  const selectedRawMember = useMemo(
    () =>
      syncedTeam.find((m) => m.id === activeMemberMetrics.id) ??
      syncedTeam[0],
    [syncedTeam, activeMemberMetrics.id]
  );

  const isPrimaryOwner = activeMemberMetrics.id === "tm-1";

  // Assigned brands for the currently inspected member:
  // By default on initial load, Jair displays `1 marca` (`Min`) matching 03-dashboard-equipo-1440.png,
  // and reflects any brand toggles made in `Editar marcas`.
  const assignedBrands = useMemo(() => {
    if (isPrimaryOwner && !hasCustomizedOwnerBrands) {
      const minBrand = brands.find((b) => b.id === "brand-min") ?? brands[0];
      return minBrand ? [minBrand] : [];
    }
    const ids = selectedRawMember?.brandIds ?? ["brand-min"];
    const matched = brands.filter((b) => ids.includes(b.id));
    return matched.length > 0 ? matched : brands.slice(0, 1);
  }, [isPrimaryOwner, hasCustomizedOwnerBrands, selectedRawMember, brands]);

  // Dynamic person count in header:
  // Starts at 1 persona (owner focus matching 03-dashboard-equipo-1440.png),
  // and immediately increments if demo invitations are accepted (`team.length > 4`) or if `showAllTeamScope` is toggled.
  const acceptedExtraMembersCount = Math.max(0, syncedTeam.length - 4);
  const displayedPersonCount = showAllTeamScope
    ? productivity.ranking.length
    : 1 + acceptedExtraMembersCount;

  // Weekly / Monthly activity rows
  const activityRows = useMemo(() => {
    if (activityRange === "Semana") {
      const fiveDays = activeMemberMetrics.weeklyActivity.slice(0, 5);
      return fiveDays.map((d, idx) => {
        const isTodayRow = idx === fiveDays.length - 1;
        const pts = d.eventsCount * 20 + (d.minutes > 1 ? Math.round(d.minutes * 0.8) : 0);
        return {
          key: d.id,
          label: isTodayRow ? "Hoy" : d.label,
          points: pts,
          minutes: d.minutes,
          percent: d.percent,
          statusLabel:
            pts > 0
              ? `${pts} pts · ${d.minutes}m`
              : "Sin actividad",
        };
      });
    }
    // Monthly breakdown (4 weeks)
    const totalPts = activeMemberMetrics.xp;
    const totalMins = activeMemberMetrics.activeMinutes;
    return [
      {
        key: "sem-1",
        label: "Semana 1",
        points: Math.round(totalPts * 0.2),
        minutes: Math.round(totalMins * 0.2),
        percent: 25,
        statusLabel: `${Math.round(totalPts * 0.2)} pts · ${Math.round(totalMins * 0.2)}m`,
      },
      {
        key: "sem-2",
        label: "Semana 2",
        points: Math.round(totalPts * 0.25),
        minutes: Math.round(totalMins * 0.25),
        percent: 35,
        statusLabel: `${Math.round(totalPts * 0.25)} pts · ${Math.round(totalMins * 0.25)}m`,
      },
      {
        key: "sem-3",
        label: "Semana 3",
        points: Math.round(totalPts * 0.25),
        minutes: Math.round(totalMins * 0.25),
        percent: 35,
        statusLabel: `${Math.round(totalPts * 0.25)} pts · ${Math.round(totalMins * 0.25)}m`,
      },
      {
        key: "sem-4",
        label: "Semana actual",
        points: Math.max(0, totalPts - Math.round(totalPts * 0.7)),
        minutes: Math.max(0, totalMins - Math.round(totalMins * 0.7)),
        percent: 50,
        statusLabel: `${Math.max(0, totalPts - Math.round(totalPts * 0.7))} pts · ${Math.max(0, totalMins - Math.round(totalMins * 0.7))}m`,
      },
    ];
  }, [activityRange, activeMemberMetrics.weeklyActivity, activeMemberMetrics.xp, activeMemberMetrics.activeMinutes]);

  const maxActivityRowPoints = useMemo(
    () => Math.max(60, ...activityRows.map((r) => r.points)),
    [activityRows]
  );

  // Full 39 Achievements enriched with live progress
  const fullCatalogWithProgress = useMemo(() => {
    const coreMap = new Map<string, TeamAchievementItem>();
    activeMemberMetrics.achievements.forEach((a: TeamAchievementItem) =>
      coreMap.set(a.id, a)
    );

    return FULL_39_ACHIEVEMENTS_CATALOG.map((item, index) => {
      let progress = 0;
      if (item.id === "first_step") {
        progress = activityEvents.length > 0 ? 1 : 0;
      } else if (item.id.startsWith("streak_")) {
        progress = activeMemberMetrics.streakDays;
      } else if (item.id === "centenario" || item.id === "mil") {
        progress = activeMemberMetrics.xp;
      } else if (item.category === "Tareas") {
        progress = activeMemberMetrics.completedTasksCount;
      } else if (item.category === "Contenido" || item.category === "Social") {
        progress = activeMemberMetrics.publishedPostsCount;
      } else if (item.category === "Proyectos" || item.category === "Chat & Marca") {
        progress = brands.length;
      } else {
        progress = Math.min(
          item.target,
          Math.floor((activeMemberMetrics.xp / (120 + index * 15)) * item.target)
        );
      }
      const clampedProgress = Math.min(item.target, Math.max(0, progress));
      const unlocked = clampedProgress >= item.target;
      return {
        ...item,
        progress: clampedProgress,
        unlocked,
      };
    });
  }, [
    activeMemberMetrics.achievements,
    activityEvents.length,
    activeMemberMetrics.streakDays,
    activeMemberMetrics.xp,
    activeMemberMetrics.completedTasksCount,
    activeMemberMetrics.publishedPostsCount,
    brands.length,
  ]);

  const filteredCatalogAchievements = useMemo(() => {
    if (achievementCategoryFilter === "Todos") return fullCatalogWithProgress;
    return fullCatalogWithProgress.filter(
      (a) => a.category === achievementCategoryFilter
    );
  }, [fullCatalogWithProgress, achievementCategoryFilter]);

  // Handlers for live interactivity
  const handleToggleBrandForMember = (brandId: string) => {
    if (!selectedRawMember) return;
    const baseIds: string[] =
      isPrimaryOwner && !hasCustomizedOwnerBrands
        ? ["brand-min"]
        : selectedRawMember.brandIds ?? ["brand-min"];
    const exists = baseIds.includes(brandId);
    const nextIds = exists
      ? baseIds.filter((id) => id !== brandId)
      : [...baseIds, brandId];
    if (nextIds.length === 0) return;
    if (isPrimaryOwner) {
      setHasCustomizedOwnerBrands(true);
    }
    updateTeamMember(selectedRawMember.id, { brandIds: nextIds });
  };

  const handleQuickRecordActivity = () => {
    recordActivityEvent({
      memberId: activeMemberMetrics.id,
      type: "task_completed",
      brandId: assignedBrands[0]?.id ?? "brand-min",
      durationMinutes: 35,
      metadata: {
        source: "equipo_quick_action",
        points: 25,
      },
    });
  };

  const handleCompleteNextInProgressTask = () => {
    const candidate =
      tasks.find(
        (t) =>
          t.status !== "done" &&
          (t.assigneeId === activeMemberMetrics.id ||
            t.assignee.toLowerCase().includes(activeMemberMetrics.name.toLowerCase()))
      ) ?? tasks.find((t) => t.status !== "done");
    if (candidate) {
      toggleTaskStatus(candidate.id);
    } else {
      handleQuickRecordActivity();
    }
  };

  const handleCopyPendingLink = (inviteLink: string, id: string) => {
    const url =
      typeof window !== "undefined" && inviteLink.startsWith("/")
        ? `${window.location.origin}${inviteLink}`
        : inviteLink;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedInviteId(id);
    setTimeout(() => {
      setCopiedInviteId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const pendingInvitations = useMemo(
    () => invitations.filter((i) => i.status === "Pendiente"),
    [invitations]
  );

  return (
    <div style={{ maxWidth: 1120, width: "100%", paddingBottom: 48 }}>
      {/* ====================================================================
          1. TOP HEADER ROW: Equipo · N persona(s) | 7d/30d/90d | Search | Invitar | Filtros
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ui-text)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Equipo · {displayedPersonCount}{" "}
            {displayedPersonCount === 1 ? "persona" : "personas"}
          </h2>

          {brandFilterId !== "all" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 9999,
                background: "var(--ui-accent-soft)",
                color: "#6C77C1",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <span>
                Marca: {brands.find((b) => b.id === brandFilterId)?.name ?? brandFilterId}
              </span>
              <button
                type="button"
                onClick={() => setBrandFilterId("all")}
                aria-label="Quitar filtro de marca"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#6C77C1",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            position: "relative",
          }}
        >
          {/* Period Pill Selector: 7 días | 30 días | 90 días */}
          <div
            role="group"
            aria-label="Periodo de métricas de equipo"
            style={{
              display: "inline-flex",
              background: "var(--ui-muted)",
              padding: 3,
              borderRadius: 10,
              gap: 2,
            }}
          >
            {(
              [
                { id: "7d", label: "7 días" },
                { id: "30d", label: "30 días" },
                { id: "90d", label: "90 días" },
              ] as const
            ).map((p) => {
              const active = teamPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTeamPeriod(p.id)}
                  className="hubly-seg-pill"
                  style={{
                    border: "none",
                    background: active ? "var(--ui-surface)" : "transparent",
                    color: active ? "var(--ui-text)" : "var(--ui-text-4)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 12,
                    padding: "5px 11px",
                    borderRadius: 7,
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                      : "none",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              flex: "1 1 180px",
              maxWidth: 220,
            }}
          >
            <Search
              size={13.5}
              style={{
                position: "absolute",
                left: 11,
                color: "var(--ui-text-5)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar miembro o marca..."
              aria-label="Buscar miembro o marca"
              style={{
                height: 34,
                width: "100%",
                padding: "0 28px 0 32px",
                borderRadius: 10,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                fontSize: 12.5,
                color: "var(--ui-text)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
                style={{
                  position: "absolute",
                  right: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--ui-text-5)",
                  cursor: "pointer",
                  padding: 2,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Invitar Button */}
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="hbtn-indigo"
            style={{
              height: 34,
              fontSize: 12.5,
              padding: "0 14px",
              borderRadius: 10,
            }}
          >
            <UserPlus size={13.5} />
            <span>Invitar</span>
            {pendingInvitations.length > 0 && (
              <span
                style={{
                  marginLeft: 2,
                  padding: "1px 6px",
                  borderRadius: 9999,
                  background: "rgba(255, 255, 255, 0.22)",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {pendingInvitations.length}
              </span>
            )}
          </button>

          {/* Filtros Button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="hbtn-outline"
            aria-expanded={filtersOpen}
            style={{
              height: 34,
              fontSize: 12.5,
              padding: "0 12px",
              borderRadius: 10,
              color: filtersOpen ? "#6C77C1" : "var(--ui-text-3)",
              borderColor: filtersOpen ? "#D9DCF0" : "var(--ui-border)",
              background: filtersOpen ? "var(--ui-accent-soft)" : "var(--ui-surface)",
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Filtros</span>
          </button>

          {/* Filtros Popover */}
          {filtersPresence.mounted && (
            <div
              className="hubly-dropdown"
              data-state={filtersPresence.state}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 290,
                maxWidth: "calc(100vw - 32px)",
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 14,
                padding: 14,
                zIndex: 50,
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.14)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--ui-text-3)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Alcance del equipo
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllTeamScope(false);
                    setSelectedMemberId("tm-1");
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: !showAllTeamScope
                      ? "1px solid #6C77C1"
                      : "1px solid #E2E8F0",
                    background: !showAllTeamScope ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: !showAllTeamScope ? "#6C77C1" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mi vista (1)
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllTeamScope(true)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: showAllTeamScope
                      ? "1px solid #6C77C1"
                      : "1px solid #E2E8F0",
                    background: showAllTeamScope ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: showAllTeamScope ? "#6C77C1" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Todo el equipo ({syncedTeam.length})
                </button>
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--ui-text-3)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Filtrar por marca
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setBrandFilterId("all")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 7,
                    border:
                      brandFilterId === "all"
                        ? "1px solid #6C77C1"
                        : "1px solid #E2E8F0",
                    background: brandFilterId === "all" ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                    color: brandFilterId === "all" ? "#6C77C1" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Todas
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBrandFilterId(b.id)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 7,
                      border:
                        brandFilterId === b.id
                          ? "1px solid #6C77C1"
                          : "1px solid #E2E8F0",
                      background: brandFilterId === b.id ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                      color: brandFilterId === b.id ? "#6C77C1" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div
                style={{
                  paddingTop: 10,
                  borderTop: "1px solid var(--ui-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteNextInProgressTask();
                    setFiltersOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    color: "var(--ui-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Completar tarea en curso</span>
                  <span style={{ color: "#10B981", fontWeight: 700 }}>+25 XP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRecordActivity();
                    setFiltersOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    color: "var(--ui-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Registrar entrega activa</span>
                  <span style={{ color: "#6C77C1", fontWeight: 700 }}>+30 XP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Member Switcher Bar when viewing All Team or when extra members were invited */}
      {(showAllTeamScope || acceptedExtraMembersCount > 0) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            padding: "8px 12px",
            borderRadius: 12,
            background: "var(--ui-surface-2)",
            border: "1px solid var(--ui-border)",
          }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ui-text-4)" }}>
            Miembros activos:
          </span>
          {productivity.ranking.map((m: EvaluatedTeamMember) => {
            const isSelected = m.id === activeMemberMetrics.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: isSelected
                    ? "1px solid #6C77C1"
                    : "1px solid #E2E8F0",
                  background: isSelected ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                  color: isSelected ? "#6C77C1" : "var(--ui-text-2)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>{m.name}</span>
                {m.id === "tm-1" && (
                  <span style={{ fontSize: 10.5, opacity: 0.75 }}>(tú)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pending Invitations Banner (visible when user has created invitations) */}
      {invitations.length > 0 && (
        <div
          style={{
            marginBottom: 22,
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid #D9DCF0",
            background: "var(--ui-accent-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={15} color="#6C77C1" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1E1B4B" }}>
                Invitaciones del equipo ({invitations.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              style={{
                border: "none",
                background: "transparent",
                color: "#6C77C1",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Nueva invitación
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invitations.map((inv) => {
              const isPending = inv.status === "Pendiente";
              const isCopied = copiedInviteId === inv.id;
              return (
                <div
                  key={inv.id}
                  style={{
                    background: "var(--ui-surface)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    border: "1px solid #E0E7FF",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                        {inv.name}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
                        {inv.email}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: "var(--ui-muted)",
                          color: "var(--ui-text-3)",
                        }}
                      >
                        {inv.role}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: isPending ? "#ECEEF8" : "#DCFCE7",
                          color: isPending ? "var(--ui-accent-text)" : "#15803D",
                        }}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleCopyPendingLink(inv.inviteLink, inv.id)}
                      style={{
                        height: 28,
                        padding: "0 10px",
                        borderRadius: 7,
                        border: "1px solid var(--ui-border-strong)",
                        background: "var(--ui-surface)",
                        color: "var(--ui-text-2)",
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      {isCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{isCopied ? "¡Enlace copiado!" : "Copiar enlace"}</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => acceptTeamInvitation(inv.id)}
                          style={{
                            height: 28,
                            padding: "0 10px",
                            borderRadius: 7,
                            border: "none",
                            background: "#6C77C1",
                            color: "#FFFFFF",
                            fontSize: 11.5,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <UserCheck size={12} />
                          <span>Aceptar en modo demo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelTeamInvitation(inv.id)}
                          style={{
                            height: 28,
                            padding: "0 8px",
                            borderRadius: 7,
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. MEMBER PROFILE BLOCK (80x80 Squircle Avatar + Name + Role + Editar marcas)
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* 80x80 Squircle Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "var(--ui-accent-soft)",
              color: "#6C77C1",
              fontSize: 28,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activeMemberMetrics.avatarInitial.slice(0, 1)}
          </div>

          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: 0,
                lineHeight: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{isPrimaryOwner ? profile.name : activeMemberMetrics.name}</span>
              {isPrimaryOwner && (
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ui-text-4)" }}>(tú)</span>
              )}
            </h3>
            <div
              style={{
                fontSize: 13,
                color: "var(--ui-text-4)",
                marginTop: 2,
              }}
            >
              {isPrimaryOwner ? profile.role : activeMemberMetrics.role}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ui-text-5)",
                marginTop: 2,
              }}
            >
              {assignedBrands.length}{" "}
              {assignedBrands.length === 1 ? "marca" : "marcas"}
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setEditingBrandsOpen((prev) => !prev)}
            className="hbtn-outline"
            aria-expanded={editingBrandsOpen}
            style={{
              fontSize: 12.5,
              padding: "6px 12px",
              borderRadius: 9,
              color: "var(--ui-text-3)",
            }}
          >
            <Pencil size={12.5} />
            <span>Editar marcas</span>
          </button>

          {editingBrandsOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 250,
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 12,
                padding: 12,
                zIndex: 45,
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                  marginBottom: 8,
                }}
              >
                Marcas asignadas a {activeMemberMetrics.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {brands.map((b) => {
                  const isAssigned = assignedBrands.some((ab) => ab.id === b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleToggleBrandForMember(b.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "none",
                        background: isAssigned ? "var(--ui-accent-soft)" : "transparent",
                        color: isAssigned ? "#6C77C1" : "var(--ui-text-2)",
                        fontSize: 12.5,
                        fontWeight: isAssigned ? 600 : 500,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            background: b.id === "brand-min" ? "#6366F1" : b.color,
                            color: "#FFFFFF",
                            fontSize: 9.5,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {b.initials.slice(0, 1)}
                        </span>
                        <span>{b.name}</span>
                      </span>
                      {isAssigned && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          3. PASSIVE METRICS STRIP (TAREAS | POSTS | TIEMPO)
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface-2)",
          borderRadius: 14,
          padding: "18px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 28,
          marginBottom: 18,
        }}
      >
        {/* TAREAS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TAREAS
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 18,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.completedTasksCount > 0
                ? activeMemberMetrics.completedTasksCount
                : "—"}
            </strong>
            terminadas
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 15,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.inProgressTasksCount}
            </strong>
            en curso
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text-4)",
                fontWeight: 700,
                fontSize: 15,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.avgCycleFormatted}
            </strong>
            por tarea
          </span>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--ui-border)",
            flexShrink: 0,
          }}
        />

        {/* POSTS */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            POSTS
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 18,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.publishedPostsCount > 0
                ? activeMemberMetrics.publishedPostsCount
                : "—"}
            </strong>
            publicados
          </span>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--ui-border)",
            flexShrink: 0,
          }}
        />

        {/* TIEMPO */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TIEMPO
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong style={{ color: "var(--ui-text)", fontWeight: 700, fontSize: 14.5 }}>
              {activeMemberMetrics.activeTimeFormatted}
            </strong>{" "}
            activo
          </span>
        </div>
      </div>

      {/* ====================================================================
          4. ASSIGNED BRAND SQUIRCLE BADGES (e.g. "M" / "Min")
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {assignedBrands.map((b) => (
          <div
            key={b.id}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "var(--ui-accent-soft)",
                color: "#6C77C1",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {b.initials.slice(0, 1)}
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ui-text-3)", fontWeight: 500 }}>
              {b.name}
            </span>
          </div>
        ))}
      </div>

      {/* ====================================================================
          5. EXPLANATORY PARAGRAPH (Ciclo típico & Tiempo activo)
          ==================================================================== */}
      <p
        style={{
          fontSize: 12.5,
          color: "var(--ui-text-4)",
          lineHeight: 1.6,
          maxWidth: 680,
          margin: "0 0 28px 0",
        }}
      >
        Los números salen solos del trabajo de cada quien: nadie prende un
        cronómetro. El{" "}
        <strong style={{ color: "var(--ui-text-2)" }}>ciclo típico</strong> es la
        mediana desde que nace la tarea hasta que se cierra, y el{" "}
        <strong style={{ color: "var(--ui-text-2)" }}>tiempo activo</strong> son las
        horas que pasó en curso o en revisión — es tiempo transcurrido, no
        horas trabajadas, y se registra desde el 10 de agosto.
      </p>

      {/* ====================================================================
          6. GAMIFICATION XP, LEVEL & STREAK BANNER
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 16,
          padding: "18px 22px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              background: "var(--ui-accent-soft)",
              color: "#6C77C1",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activeMemberMetrics.avatarInitial.slice(0, 1)}
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ui-text)",
                lineHeight: 1.2,
              }}
            >
              {isPrimaryOwner
                ? greetingData.greeting
                : `Actividad de ${activeMemberMetrics.name}`}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ui-text-4)",
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🌱</span>
              <span>
                {activeMemberMetrics.streakDays}{" "}
                {activeMemberMetrics.streakDays === 1 ? "día" : "días"} racha ·
                Mejor: {activeMemberMetrics.bestStreakDays}d
              </span>
            </div>
          </div>
        </div>

        {/* Right: XP & Level Progress */}
        <div style={{ textAlign: "right", minWidth: 165 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#6C77C1",
              lineHeight: 1.1,
            }}
          >
            {activeMemberMetrics.xp}{" "}
            <span style={{ fontSize: 13, fontWeight: 600 }}>XP</span>
          </div>
          <div
            style={{
              width: 150,
              height: 6,
              borderRadius: 9999,
              background: "var(--ui-accent-soft)",
              marginTop: 6,
              marginLeft: "auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(4, activeMemberMetrics.levelProgressPercent)}%`,
                height: "100%",
                background: "#6C77C1",
                borderRadius: 9999,
                transition: "width 240ms ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10.5,
              color: "var(--ui-text-5)",
              marginTop: 4,
            }}
          >
            <span>Nivel {activeMemberMetrics.level}</span>
            <span>
              {activeMemberMetrics.xpToNextLevel} para Nv.
              {activeMemberMetrics.level + 1}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          7. TU ACTIVIDAD CARD (Weekly / Monthly Breakdown with Stickers)
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 16,
          padding: "18px 22px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={15} style={{ color: "#6C77C1" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
              Tu actividad
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--ui-text-5)", fontWeight: 600 }}>
              {activeMemberMetrics.xp} pts
            </span>
            <div
              style={{
                display: "inline-flex",
                background: "var(--ui-muted)",
                padding: 2,
                borderRadius: 8,
              }}
            >
              {(["Semana", "Mes"] as const).map((r) => {
                const active = activityRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActivityRange(r)}
                    style={{
                      border: "none",
                      background: active ? "#6C77C1" : "transparent",
                      color: active ? "#FFFFFF" : "var(--ui-text-4)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rows with Character Stickers & Live Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activityRows.map((row, idx) => {
            const isToday = row.label === "Hoy" || row.label === "Semana actual";
            const pct = Math.min(
              100,
              Math.round((row.points / maxActivityRowPoints) * 100)
            );
            return (
              <div
                key={row.key}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "36px minmax(72px, 95px) 1fr minmax(84px, auto)",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <WeekdayCharacterSticker dayIndex={idx} />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? "#6C77C1" : "var(--ui-text-3)",
                  }}
                >
                  {row.label}
                </span>
                <div
                  style={{
                    height: 24,
                    borderRadius: 7,
                    background: isToday ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    border: isToday ? "1px solid #E0E7FF" : "none",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {row.points > 0 && (
                    <div
                      style={{
                        width: `${Math.max(8, pct)}%`,
                        height: "100%",
                        background: isToday
                          ? "linear-gradient(90deg, #6366F1 0%, #6C77C1 100%)"
                          : "#CBD5E1",
                        opacity: isToday ? 0.88 : 0.65,
                        borderRadius: 6,
                        transition: "width 240ms ease",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    color: row.points > 0 ? "var(--ui-text-3)" : "#CBD5E1",
                    fontWeight: row.points > 0 ? 600 : 400,
                    textAlign: "right",
                  }}
                >
                  {row.statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          8. TWO-COLUMN BOTTOM GRID: Logros (Left) + Ranking del Equipo (Right)
          ==================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Left Card: Logros */}
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={15} style={{ color: "#6C77C1" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                Logros
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontWeight: 600 }}>
              {activeMemberMetrics.unlockedAchievementsCount}/
              {activeMemberMetrics.achievements.length} activos
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {activeMemberMetrics.achievements.map(
              (ach: TeamAchievementItem, idx: number) => {
                const progressPct = Math.min(
                  100,
                  Math.round((ach.progress / Math.max(1, ach.target)) * 100)
                );
                return (
                  <div
                    key={ach.id}
                    className={`hubly-achievement ${ach.unlocked ? "is-unlocked" : ""}`}
                    style={{
                      background: ach.unlocked ? "#F5F3FF" : "var(--ui-surface-2)",
                      border: ach.unlocked
                        ? "1px solid #D9DCF0"
                        : "1px solid #F1F5F9",
                      borderRadius: 12,
                      padding: "14px 10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <AchievementBadgeSvg variant={idx} unlocked={ach.unlocked} />
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: ach.unlocked ? "#1E1B4B" : "var(--ui-text-3)",
                        marginTop: 8,
                      }}
                    >
                      {ach.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "var(--ui-text-4)",
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {ach.description}
                    </div>

                    {/* Progress Bar & XP Pill */}
                    <div
                      style={{
                        width: "100%",
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: 4,
                          borderRadius: 9999,
                          background: "var(--ui-border)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: "100%",
                            background: ach.unlocked ? "#6C77C1" : "#94A3B8",
                            borderRadius: 9999,
                            transition: "width 220ms ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: "var(--ui-text-4)",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {ach.progress}/{ach.target}
                        </span>
                        <span style={{ color: "#6C77C1" }}>+{ach.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAll39Achievements((prev) => !prev)}
            style={{
              marginTop: "auto",
              width: "100%",
              padding: "8px",
              border: "none",
              background: "transparent",
              color: "var(--ui-text-4)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontFamily: "inherit",
            }}
          >
            <span>
              {showAll39Achievements
                ? `Ocultar catálogo completo (${productivity.totalAchievementsCatalog})`
                : `Ver todos los logros (${productivity.totalAchievementsCatalog})`}
            </span>
            <ChevronRight
              size={13}
              style={{
                transform: showAll39Achievements ? "rotate(90deg)" : "none",
                transition: "transform 160ms ease",
              }}
            />
          </button>
        </div>

        {/* Right Card: Ranking del Equipo */}
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={15} style={{ color: "#6366F1" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                Ranking del Equipo
              </span>
            </div>

            <div
              style={{
                display: "inline-flex",
                background: "var(--ui-muted)",
                padding: 2,
                borderRadius: 8,
              }}
            >
              {(["Hoy", "Semana", "Mes"] as const).map((r) => {
                const active = rankingRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRankingRange(r)}
                    className="hubly-seg-pill"
                    style={{
                      border: "none",
                      background: active ? "#6C77C1" : "transparent",
                      color: active ? "#FFFFFF" : "var(--ui-text-4)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ranking Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rankingRows.map((member, index) => {
              const isCurrentUser = member.id === "tm-1";
              const isSelected = member.id === activeMemberMetrics.id;
              const barWidthPct = Math.max(
                8,
                Math.round((member.displayPoints / leaderPoints) * 100)
              );
              const medal =
                index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : `${index + 1}`;

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedMemberId(member.id);
                    }
                  }}
                  style={{
                    background: isCurrentUser || isSelected ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    border:
                      isCurrentUser || isSelected
                        ? "1px solid #E0E7FF"
                        : "1px solid #F1F5F9",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "background 150ms ease, border-color 150ms ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawerMemberId(member.id);
                    }}
                    style={{ order: 1, alignSelf: "flex-end", border: 0, background: "transparent", color: "var(--ui-accent-text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Ver perfil
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: index < 3 ? 14 : 12,
                          fontWeight: 700,
                          color: "var(--ui-text-5)",
                          width: 18,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {medal}
                      </span>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9999,
                          background: isCurrentUser ? "#D9DCF0" : "var(--ui-border)",
                          color: isCurrentUser ? "#6C77C1" : "var(--ui-text-2)",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {member.avatarInitial.slice(0, 1)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--ui-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {member.name}{" "}
                          {isCurrentUser && (
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 500,
                                color: "#6366F1",
                              }}
                            >
                              (tú)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ui-text-4)" }}>
                          {member.role} · {member.completedTasksCount} tareas ·{" "}
                          {member.publishedPostsCount} posts
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isCurrentUser ? "#6C77C1" : "var(--ui-text)",
                        }}
                      >
                        {member.displayPoints} pts
                      </span>
                      <div style={{ fontSize: 10.5, color: "var(--ui-text-5)" }}>
                        Nv.{member.level} · {member.efficiencyScore} efic.
                      </div>
                    </div>
                  </div>

                  {/* Proportional Leaderboard Bar (Módulo 98919) */}
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      borderRadius: 9999,
                      background: isCurrentUser ? "#E0E7FF" : "var(--ui-border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidthPct}%`,
                        height: "100%",
                        borderRadius: 9999,
                        background: isCurrentUser ? "#6C77C1" : "#64748B",
                        opacity:
                          0.2 + 0.8 * (member.displayPoints / leaderPoints),
                        transition: "width 240ms ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
          8B. EXPANDABLE FULL 39 ACHIEVEMENTS CATALOG (Módulo 22918)
          ==================================================================== */}
      {showAll39Achievements && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "20px 22px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ui-text)" }}>
                Catálogo completo de logros (39)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ui-text-4)" }}>
                Desbloqueados por actividad real en tareas, contenido, proyectos, CRM y Hubly AI
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAll39Achievements(false)}
              className="hbtn-outline"
              style={{ height: 30, fontSize: 12, padding: "0 10px" }}
            >
              Cerrar catálogo
            </button>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {[
              "Todos",
              "Generales",
              "Tareas",
              "Proyectos",
              "CRM",
              "Contenido",
              "Social",
              "Analytics",
              "Inteligencia",
              "Hubly AI",
              "Chat & Marca",
            ].map((cat) => {
              const active = achievementCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAchievementCategoryFilter(cat)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    border: active ? "1px solid #6C77C1" : "1px solid var(--ui-border)",
                    background: active ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: active ? "#6C77C1" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 210px), 1fr))",
              gap: 10,
            }}
          >
            {filteredCatalogAchievements.map((item) => {
              const pct = Math.min(
                100,
                Math.round((item.progress / Math.max(1, item.target)) * 100)
              );
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: item.unlocked
                      ? "1px solid #D9DCF0"
                      : "1px solid #E2E8F0",
                    background: item.unlocked ? "#F5F3FF" : "var(--ui-surface-2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{item.emoji}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 9999,
                        background: item.unlocked ? "#DCFCE7" : "var(--ui-border)",
                        color: item.unlocked ? "#15803D" : "var(--ui-text-3)",
                      }}
                    >
                      +{item.xpReward} XP
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ui-text)" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ui-text-4)", lineHeight: 1.35 }}>
                    {item.description}
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 10.5,
                      color: "var(--ui-text-4)",
                      fontWeight: 600,
                    }}
                  >
                    <span>{item.category}</span>
                    <span>
                      {item.progress}/{item.target} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          9. BOTTOM ACCORDION: Cómo funcionan los puntos
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setPointsAccordionOpen((prev) => !prev)}
          aria-expanded={pointsAccordionOpen}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-2)" }}>
              Cómo funcionan los puntos
            </span>
            <span style={{ fontSize: 12, color: "var(--ui-text-5)" }}>
              · Se miden por esfuerzo, no por clicks
            </span>
          </div>
          <ChevronDown
            size={15}
            style={{
              color: "var(--ui-text-5)",
              transform: pointsAccordionOpen ? "rotate(180deg)" : "none",
              transition: "transform 180ms ease",
              flexShrink: 0,
            }}
          />
        </button>

        {pointsAccordionOpen && (
          <div
            style={{
              padding: "0 20px 20px",
              borderTop: "1px solid var(--ui-muted)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* 4 Effort Categories */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: 10,
                marginTop: 14,
              }}
            >
              {EFFORT_CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: cat.bg,
                    border: "1px solid rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--ui-text)",
                      }}
                    >
                      {cat.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: cat.color,
                      }}
                    >
                      {cat.points}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      color: "var(--ui-text-3)",
                      lineHeight: 1.45,
                    }}
                  >
                    {cat.examples}
                  </p>
                </div>
              ))}
            </div>

            {/* 5 XP Level Tiers */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ui-text-3)" }}>
                Niveles de progresión:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {XP_LEVEL_TIERS.map((tier) => (
                  <span
                    key={tier.level}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: "var(--ui-text-2)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        background: tier.color,
                      }}
                    />
                    <span>
                      Nv.{tier.level} {tier.name} ({tier.minXp} XP)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {drawerMemberId && (<MemberDrawer memberId={drawerMemberId} onClose={() => setDrawerMemberId(null)} />)}
    </div>
  );
}

export default EquipoView;
