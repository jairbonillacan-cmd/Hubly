
/* ==========================================================================
   ILLUSTRATED SVG STICKERS & ACHIEVEMENT BADGES
   ========================================================================== */

export function AchievementBadgeSvg({
  variant,
  unlocked = false,
}: {
  variant: number;
  unlocked?: boolean;
}) {
  const palettes = [
    { bg: "#EAF6FC", ring: "#16324F", fill: "#BFE2F4" },
    { bg: "#E6F4FB", ring: "var(--hb-accent)", fill: "#BFE2F4" },
    { bg: "#E6F4FB", ring: "#16324F", fill: "#BFE2F4" },
    { bg: "#EAF6FC", ring: "#7CC8EE", fill: "#DCEFF9" },
    { bg: "#E0F2FE", ring: "#2A76B0", fill: "#BAE6FD" },
    { bg: "#EAF6FC", ring: "#24496E", fill: "#BFE2F4" },
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
          <circle cx="43" cy="13" r="7" fill="#16324F" stroke="#FFFFFF" strokeWidth="1.5" />
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
   MASTER CATALOG OF 39 ACHIEVEMENTS
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

export const FULL_39_ACHIEVEMENTS_CATALOG: CatalogAchievementItem[] = [
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

export const XP_LEVEL_TIERS = [
  { level: 1, name: "Nuevo", minXp: 0, color: "#8FC881" },
  { level: 2, name: "Activo", minXp: 50, color: "var(--hb-accent-text)" },
  { level: 3, name: "Dedicado", minXp: 200, color: "#D87898" },
  { level: 4, name: "Experto", minXp: 500, color: "#8DCBCF" },
  { level: 5, name: "Leyenda", minXp: 1500, color: "var(--hb-accent-text)" },
];

export const EFFORT_CATEGORIES = [
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
