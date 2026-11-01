import type { HublyAgent, HublyAgentMessage } from "./types";

export type AgentCategory = "anuncios" | "contenido" | "equipo";

export interface AgentTemplate {
  id: string;
  category: AgentCategory;
  name: string;
  purpose: string;
  cadence: string;
}

export const AGENT_CATEGORIES: { id: AgentCategory | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "anuncios", label: "Anuncios" },
  { id: "contenido", label: "Contenido" },
  { id: "equipo", label: "Equipo" },
];

export const AGENT_CADENCES = ["Cada mañana", "Cada lunes", "Cada mes", "Solo cuando lo pida"];

export const AGENT_TEMPLATES: AgentTemplate[] = [
  { id: "resumen-anuncios", category: "anuncios", name: "Resumen de anuncios", purpose: "Cuenta cómo van los anuncios de cada marca.", cadence: "Cada mañana" },
  { id: "alerta-presupuesto", category: "anuncios", name: "Alerta de presupuesto", purpose: "Avisa cuando una marca se pasa del gasto previsto.", cadence: "Cada mañana" },
  { id: "mejores-anuncios", category: "anuncios", name: "Mejores anuncios", purpose: "Señala cuáles rinden y cuáles conviene pausar.", cadence: "Cada lunes" },
  { id: "anuncios-agotados", category: "anuncios", name: "Anuncios agotados", purpose: "Detecta los que dejaron de funcionar.", cadence: "Cada lunes" },
  { id: "reporte-anuncios", category: "anuncios", name: "Reporte de anuncios", purpose: "Prepara el reporte semanal para el cliente.", cadence: "Cada lunes" },
  { id: "revision-ganchos", category: "anuncios", name: "Revisión de ganchos", purpose: "Compara qué inicios retienen mejor.", cadence: "Cada lunes" },
  { id: "parrilla-semana", category: "contenido", name: "Parrilla de la semana", purpose: "Propone los posts de la semana para cada marca.", cadence: "Cada lunes" },
  { id: "ideas-posts", category: "contenido", name: "Ideas de posts", purpose: "Propone ideas según los pilares de la marca.", cadence: "Cada lunes" },
  { id: "guiones-video", category: "contenido", name: "Guiones de video", purpose: "Escribe guiones cortos listos para grabar.", cadence: "Solo cuando lo pida" },
  { id: "reporte-redes", category: "contenido", name: "Reporte de redes", purpose: "Resume los resultados de redes para el cliente.", cadence: "Cada mes" },
  { id: "radar-competencia", category: "contenido", name: "Radar de competencia", purpose: "Revisa qué publican otras marcas de la industria.", cadence: "Cada lunes" },
  { id: "copies-anuncios", category: "contenido", name: "Copies para anuncios", purpose: "Escribe variantes de copy para probar.", cadence: "Solo cuando lo pida" },
  { id: "carga-equipo", category: "equipo", name: "Carga del equipo", purpose: "Muestra quién va al día y quién está saturado.", cadence: "Cada lunes" },
  { id: "tareas-vencidas", category: "equipo", name: "Tareas vencidas", purpose: "Avisa qué tareas se atrasaron.", cadence: "Cada mañana" },
  { id: "estado-proyectos", category: "equipo", name: "Estado de proyectos", purpose: "Reúne en un documento cómo va cada proyecto.", cadence: "Cada lunes" },
  { id: "fechas-cercanas", category: "equipo", name: "Fechas cercanas", purpose: "Avisa antes de que venza una entrega.", cadence: "Cada mañana" },
  { id: "pendientes-hoy", category: "equipo", name: "Pendientes de hoy", purpose: "Lista lo que falta por hacer en el día.", cadence: "Cada mañana" },
  { id: "resumen-semana", category: "equipo", name: "Resumen de la semana", purpose: "Resume en una página lo que pasó en la semana.", cadence: "Cada lunes" },
];

let messageCount = 0;

function message(role: HublyAgentMessage["role"], text: string): HublyAgentMessage {
  messageCount += 1;
  return { id: `agm-${Date.now()}-${messageCount}`, role, text };
}

function summary(purpose: string, cadence: string): string {
  return `Quedó así.\nQué hace: ${purpose}\nCuándo: ${cadence}\n\n¿Quieres ajustar algo? Escríbelo aquí.`;
}

export function createAgent(): HublyAgent {
  return {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "Nuevo agente",
    purpose: "",
    cadence: "",
    notes: [],
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

/** Un borrador sin tocar: crear otro solo llenaría el sidebar de agentes vacíos. */
export function isBlankAgent(agent: HublyAgent): boolean {
  return !agent.purpose && agent.messages.length === 0 && agent.name === "Nuevo agente";
}

export function duplicateAgent(agent: HublyAgent): HublyAgent {
  return { ...createAgent(), ...agent, id: createAgent().id, name: `${agent.name} (copia)`, createdAt: new Date().toISOString() };
}

export function applyTemplate(agent: HublyAgent, template: AgentTemplate): Partial<HublyAgent> {
  return {
    name: template.name,
    templateId: template.id,
    purpose: template.purpose,
    cadence: template.cadence,
    messages: [
      ...agent.messages,
      message("user", `Usar la plantilla «${template.name}»`),
      message("hubi", summary(template.purpose, template.cadence)),
    ],
  };
}

export function startFromScratch(agent: HublyAgent): Partial<HublyAgent> {
  return {
    messages: [
      ...agent.messages,
      message("hubi", "¿Qué quieres que haga este agente? Por ejemplo: avisarme cuando un post lleve dos días sin aprobación."),
    ],
  };
}

/** Sin modelo conectado: Hubi sigue un guion fijo y solo guarda lo que la persona escribe. */
export function answerAgent(agent: HublyAgent, rawText: string): Partial<HublyAgent> {
  const text = rawText.trim();
  if (!text) return {};
  const asked = [...agent.messages, message("user", text)];

  if (!agent.purpose) {
    return {
      purpose: text,
      messages: [...asked, message("hubi", "¿Cada cuándo debe trabajar?")],
    };
  }
  if (!agent.cadence) {
    return {
      cadence: text,
      messages: [...asked, message("hubi", summary(agent.purpose, text))],
    };
  }
  return {
    notes: [...agent.notes, text],
    messages: [...asked, message("hubi", "Anotado. Lo agregué a las instrucciones del agente.")],
  };
}
