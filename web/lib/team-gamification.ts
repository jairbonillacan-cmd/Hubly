/*
 * Gamificación del equipo: catálogo de logros, niveles de XP y categorías de esfuerzo.
 * Son datos, no interfaz: la pantalla decide cómo pintarlos.
 */

export interface CatalogAchievementItem {
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
  target: number;
  xpReward: number;
}

export const ACHIEVEMENTS_CATALOG: CatalogAchievementItem[] = [
  // 1. Generales (10)
  { id: "first_step", category: "Generales", title: "Primer paso", description: "Tu primera acción registrada", target: 1, xpReward: 25 },
  { id: "streak_3", category: "Generales", title: "Racha de 3", description: "3 días seguidos con actividad", target: 3, xpReward: 50 },
  { id: "streak_7", category: "Generales", title: "Semana completa", description: "7 días consecutivos activo", target: 7, xpReward: 100 },
  { id: "streak_30", category: "Generales", title: "Mes imparable", description: "30 días seguidos de racha", target: 30, xpReward: 300 },
  { id: "centenario", category: "Generales", title: "Centenario", description: "Alcanza tus primeros 100 XP", target: 100, xpReward: 50 },
  { id: "mil", category: "Generales", title: "Club de los mil", description: "Supera los 1,000 XP acumulados", target: 1000, xpReward: 250 },
  { id: "multitasker", category: "Generales", title: "Multitasker", description: "Usa 5+ módulos distintos en la semana", target: 5, xpReward: 80 },
  { id: "early_bird", category: "Generales", title: "Madrugador", description: "Registra actividad antes de las 7am (5x)", target: 5, xpReward: 60 },
  { id: "night_owl", category: "Generales", title: "Búho nocturno", description: "Actividad después de las 10pm (5x)", target: 5, xpReward: 60 },
  { id: "weekend_warrior", category: "Generales", title: "Guerrero de fin de semana", description: "4 fines de semana con entregas", target: 4, xpReward: 90 },
  // 2. Tareas (3)
  { id: "task_starter", category: "Tareas", title: "Organizador", description: "Completa 10 tareas del espacio", target: 10, xpReward: 75 },
  { id: "task_machine", category: "Tareas", title: "Máquina de tareas", description: "Completa 100 tareas cerradas", target: 100, xpReward: 250 },
  { id: "list_master", category: "Tareas", title: "Maestro de listas", description: "Organiza 10 listas o libretas", target: 10, xpReward: 80 },
  // 3. Proyectos (3)
  { id: "project_launcher", category: "Proyectos", title: "Lanzador", description: "Crea tu primer proyecto de marca", target: 1, xpReward: 50 },
  { id: "milestone_hunter", category: "Proyectos", title: "Cazador de milestones", description: "Completa 10 milestones de cliente", target: 10, xpReward: 120 },
  { id: "project_veteran", category: "Proyectos", title: "Veterano de proyectos", description: "Entrega 5 proyectos completos", target: 5, xpReward: 150 },
  // 4. CRM (4)
  { id: "pipeline_pro", category: "CRM", title: "Pipeline pro", description: "Mueve 20 leads en el embudo", target: 20, xpReward: 90 },
  { id: "closer", category: "CRM", title: "Closer", description: "Cierra tu primer deal ganado", target: 1, xpReward: 100 },
  { id: "meeting_master", category: "CRM", title: "Rey de las juntas", description: "Agenda 20 reuniones con clientes", target: 20, xpReward: 100 },
  { id: "crm_detective", category: "CRM", title: "Detective CRM", description: "Documenta 50 notas de seguimiento", target: 50, xpReward: 110 },
  // 5. Contenido (5)
  { id: "content_creator", category: "Contenido", title: "Creador", description: "Crea 10 piezas en Content Manager", target: 10, xpReward: 75 },
  { id: "content_machine", category: "Contenido", title: "Máquina de contenido", description: "Produce 50 piezas creativas", target: 50, xpReward: 200 },
  { id: "scheduler", category: "Contenido", title: "Planificador", description: "Agenda 20 posts en el calendario", target: 20, xpReward: 90 },
  { id: "librarian", category: "Contenido", title: "Bibliotecario", description: "Sube y etiqueta 50 archivos", target: 50, xpReward: 100 },
  { id: "scriptwriter", category: "Contenido", title: "Guionista", description: "Escribe 10 scripts para video/reels", target: 10, xpReward: 85 },
  // 6. Social (2)
  { id: "social_analyst", category: "Social", title: "Analista social", description: "Genera 5 reportes de redes sociales", target: 5, xpReward: 80 },
  { id: "inbox_hero", category: "Social", title: "Héroe del inbox", description: "Responde 50 mensajes de comunidad", target: 50, xpReward: 120 },
  // 7. Analytics (2)
  { id: "data_nerd", category: "Analytics", title: "Data nerd", description: "Exporta 10 tableros o análisis ROAS", target: 10, xpReward: 90 },
  { id: "funnel_builder", category: "Analytics", title: "Arquitecto de funnels", description: "Construye 3 funnels TOF/MOF/BOF", target: 3, xpReward: 100 },
  // 8. Inteligencia (3)
  { id: "ad_curator", category: "Inteligencia", title: "Curador de Ads", description: "Guarda 25 referencias en Ad Library", target: 25, xpReward: 85 },
  { id: "swipe_addict", category: "Inteligencia", title: "Swipe addict", description: "Completa 10 sesiones de swipe file", target: 10, xpReward: 70 },
  { id: "trend_spotter", category: "Inteligencia", title: "Cazador de tendencias", description: "Detecta 10 tendencias para marcas", target: 10, xpReward: 80 },
  // 9. Hubly AI (3)
  { id: "hubly_fan", category: "Hubly AI", title: "Fan de Hubly", description: "50 conversaciones estratégicas con IA", target: 50, xpReward: 110 },
  { id: "agent_builder", category: "Hubly AI", title: "Constructor de agentes", description: "Configura tu primer agente autónomo", target: 1, xpReward: 95 },
  { id: "agent_power_user", category: "Hubly AI", title: "Power user de agentes", description: "25 ejecuciones exitosas de agentes", target: 25, xpReward: 150 },
  // 10. Chat & Marca (4)
  { id: "team_player", category: "Chat & Marca", title: "Team player", description: "Comparte 100 mensajes con el equipo", target: 100, xpReward: 90 },
  { id: "thread_starter", category: "Chat & Marca", title: "Iniciador de hilos", description: "Abre 20 hilos de revisión enfocados", target: 20, xpReward: 70 },
  { id: "persona_creator", category: "Chat & Marca", title: "Creador de personas", description: "Define 3 buyer personas en Brand Core", target: 3, xpReward: 85 },
  { id: "brand_researcher", category: "Chat & Marca", title: "Investigador de marca", description: "Completa 5 auditorías de marca", target: 5, xpReward: 100 },
];

/** `strength` (0–1) es la intensidad del acento con que se marca el nivel: más alto, más intenso. */
export const XP_LEVEL_TIERS = [
  { level: 1, name: "Nuevo", minXp: 0, strength: 0.25 },
  { level: 2, name: "Activo", minXp: 50, strength: 0.4 },
  { level: 3, name: "Dedicado", minXp: 200, strength: 0.6 },
  { level: 4, name: "Experto", minXp: 500, strength: 0.8 },
  { level: 5, name: "Leyenda", minXp: 1500, strength: 1 },
];

export const EFFORT_CATEGORIES = [
  {
    title: "1. Alto impacto",
    points: "+35 a +60 XP",
    examples: "Crear proyecto, cerrar deal, completar milestone, crear agente, agendar reunión o crear marca.",
  },
  {
    title: "2. Trabajo creativo",
    points: "+25 a +40 XP",
    examples: "Publicar contenido, escribir script, crear buyer persona, generar reporte ejecutivo o armar funnel.",
  },
  {
    title: "3. Gestión del día a día",
    points: "+15 a +25 XP",
    examples: "Completar tarea, mover lead, agregar nota en libreta, agendar post, responder inbox o subir archivo.",
  },
  {
    title: "4. Interacciones rápidas",
    points: "+5 a +10 XP",
    examples: "Enviar mensaje al equipo, guardar referencia de anuncio, consultar a Hubly AI o revisar métricas.",
  },
];
