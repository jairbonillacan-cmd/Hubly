"use client";

import { Button } from "@/components/app/ui/Button";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import {
  AGENT_CADENCES,
  AGENT_CATEGORIES,
  AGENT_TEMPLATES,
  answerAgent,
  applyTemplate,
  startFromScratch,
  type AgentCategory,
  type AgentTemplate,
} from "@/lib/agents";
import { askConfirm, askText } from "@/components/app/AppDialogHost";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyBellIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyCheckCircleIcon,
  HublyClipboardIcon,
  HublyClockIcon,
  HublyCopyIcon as Copy,
  HublyDocumentIcon,
  HublyEyeIcon,
  HublyFolderIcon,
  HublyInfoIcon as Info,
  HublyMegaphoneIcon,
  HublyPencilIcon,
  HublyPeopleIcon,
  HublyPulseIcon,
  HublySearchIcon,
  HublySendIcon as Send,
  HublySparkIcon,
  HublyTargetIcon,
  HublyTrashIcon as Trash,
} from "@/components/app/icons/DuotoneIcons";

const TEMPLATE_ICONS: Record<string, typeof HublyBellIcon> = {
  "resumen-anuncios": HublyPulseIcon,
  "alerta-presupuesto": HublyBellIcon,
  "mejores-anuncios": HublyChartIcon,
  "anuncios-agotados": HublyEyeIcon,
  "reporte-anuncios": HublyDocumentIcon,
  "revision-ganchos": HublyTargetIcon,
  "parrilla-semana": HublyCalendarIcon,
  "ideas-posts": HublySparkIcon,
  "guiones-video": HublyPencilIcon,
  "reporte-redes": HublyChartIcon,
  "radar-competencia": HublySearchIcon,
  "copies-anuncios": HublyMegaphoneIcon,
  "carga-equipo": HublyPeopleIcon,
  "tareas-vencidas": HublyClipboardIcon,
  "estado-proyectos": HublyFolderIcon,
  "fechas-cercanas": HublyClockIcon,
  "pendientes-hoy": HublyCheckCircleIcon,
  "resumen-semana": HublyDocumentIcon,
};

export function AgentBuilder({ agentId }: { agentId: string }) {
  const router = useRouter();
  const agent = useHublyStore((s) => s.agents?.find((a) => a.id === agentId));
  const hydrated = useHublyStore((s) => s.hydrated);
  const readOnly = useHublyStore((s) => s.role === "viewer");
  const updateAgent = useHublyStore((s) => s.updateAgent);
  const copyAgent = useHublyStore((s) => s.duplicateAgent);
  const deleteAgent = useHublyStore((s) => s.deleteAgent);

  const [category, setCategory] = useState<AgentCategory | "todos">("todos");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messageCount = agent?.messages.length ?? 0;

  useEffect(() => {
    if (messageCount > 0) endRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

  if (!agent) {
    return (
      <div className="hubly-cal hubly-agente">
        <div className="hubly-cal-empty">
          {hydrated ? (
            <>
              <strong>Sin este agente</strong>
              <span>Puede que ya lo hayan eliminado.</span>
              <Link href="/dashboard" className="hb-widget-link">Ir al dashboard →</Link>
            </>
          ) : (
            <span>Cargando…</span>
          )}
        </div>
      </div>
    );
  }

  const send = (text: string) => {
    updateAgent(agent.id, answerAgent(agent, text));
    setInput("");
  };

  const rename = async () => {
    const name = (await askText("Nombre del agente", agent.name))?.trim();
    if (name) updateAgent(agent.id, { name: name.slice(0, 60) });
  };

  const duplicate = () => {
    const copy = copyAgent(agent.id);
    if (copy) router.push(`/agentes/${copy.id}`);
  };

  const remove = async () => {
    if (!(await askConfirm(`¿Eliminar «${agent.name}»?`))) return;
    deleteAgent(agent.id);
    router.push("/dashboard");
  };

  const pickTemplate = (template: AgentTemplate) => updateAgent(agent.id, applyTemplate(agent, template));

  const describe = () => {
    updateAgent(agent.id, startFromScratch(agent));
    inputRef.current?.focus();
  };

  const templates = AGENT_TEMPLATES.filter((t) => category === "todos" || t.category === category);
  const showTemplates = !agent.purpose && agent.messages.length === 0 && !readOnly;
  const askingCadence = Boolean(agent.purpose) && !agent.cadence;

  return (
    <div className="hubly-cal hubly-agente">
      <header className="hubly-cal-header">
        <div className="hubly-cal-title-row hubly-agente-head">
          <div className="hubly-agente-identidad">
            <Link href="/dashboard" className="hubly-cal-icon" aria-label="Volver al dashboard" title="Volver al dashboard">
              <ArrowLeft size={17} />
            </Link>
            <span className="hubly-agente-avatar"><HublyCatAvatar size={32} /></span>
            <h1 className="hubly-cal-title hubly-agente-nombre" title={agent.name}>{agent.name}</h1>
            {!readOnly && (
              <button type="button" className="hubly-cal-icon" aria-label="Cambiar nombre" title="Cambiar nombre" onClick={rename}>
                <HublyPencilIcon size={15} />
              </button>
            )}
            <span className="hubly-agente-estado">Borrador</span>
          </div>
          <div className="hubly-agente-acciones">
            <Button variant="secondary" size="sm" disabled>Probar</Button>
            {!readOnly && (
              <>
                <Button variant="secondary" size="sm" onClick={duplicate}>
                  <Copy size={15} /> Duplicar
                </Button>
                <button type="button" className="hubly-cal-icon" aria-label="Eliminar agente" title="Eliminar agente" onClick={remove}>
                  <Trash size={16} />
                </button>
              </>
            )}
            <Button variant="primary" size="sm" disabled>Activar</Button>
          </div>
        </div>
      </header>

      <div className="hubly-agente-cuerpo">
        <p className="hubly-agente-aviso" role="note">
          <Info size={15} />
          <span>Función prevista: los agentes se guardan como borrador, pero todavía no se ejecutan.</span>
        </p>

        <div className="hubly-agente-chat" role="log" aria-label="Configuración del agente">
          <p className="hubly-agente-msg">
            Voy a ayudarte a configurar <strong>{agent.name}</strong>.{"\n"}Elige una plantilla o describe lo que necesitas.
          </p>
          {agent.messages.map((m) => (
            <p key={m.id} className={`hubly-agente-msg ${m.role === "user" ? "is-user" : ""}`.trim()}>{m.text}</p>
          ))}
        </div>

        {showTemplates && (
          <section className="hubly-agente-galeria" aria-label="Plantillas de agentes">
            <div className="hubly-cal-pills" role="group" aria-label="Filtrar plantillas">
              {AGENT_CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="hubly-cal-pill" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="hubly-agente-plantillas">
              {templates.map((t) => {
                const Icon = TEMPLATE_ICONS[t.id];
                return (
                  <button key={t.id} type="button" className="hubly-agente-plantilla" onClick={() => pickTemplate(t)}>
                    <span className="hubly-agente-plantilla-icono"><Icon size={17} /></span>
                    <span className="hubly-agente-plantilla-texto">
                      <strong>{t.name}</strong>
                      <small>{t.purpose}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" className="hubly-agente-cero" onClick={describe}>
              Describir desde cero
            </Button>
          </section>
        )}

        {!agent.purpose && agent.messages.length > 0 && !readOnly && (
          <Button variant="ghost" size="sm" className="hubly-agente-cero" onClick={() => updateAgent(agent.id, { messages: [] })}>
            Ver plantillas
          </Button>
        )}

        {askingCadence && !readOnly && (
          <div className="hubly-cal-pills hubly-agente-opciones" role="group" aria-label="Frecuencia del agente">
            {AGENT_CADENCES.map((cadence) => (
              <button key={cadence} type="button" className="hubly-cal-pill" onClick={() => send(cadence)}>{cadence}</button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="hubly-agente-pie">
        <form
          className="hubly-agente-form"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            className="hubly-cal-line"
            value={input}
            maxLength={500}
            disabled={readOnly}
            aria-label="Mensaje para Hubi"
            placeholder={readOnly ? "Tu rol es de solo lectura" : "Escríbele a Hubi…"}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" variant="primary" iconOnly aria-label="Enviar a Hubi" title="Enviar a Hubi" disabled={!input.trim() || readOnly}>
            <Send size={17} />
          </Button>
        </form>
      </div>
    </div>
  );
}
