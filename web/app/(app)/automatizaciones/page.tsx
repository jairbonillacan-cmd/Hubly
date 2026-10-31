"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import type { AutomationAction, AutomationRule, AutomationTrigger } from "@/lib/types";

const TRIGGERS: Record<AutomationTrigger, string> = {
  post_pending: "Un post se envía a revisión",
  post_changes: "Un post pide cambios",
  post_approved: "Un post queda aprobado",
};
const ACTIONS: Record<AutomationAction, string> = {
  create_task: "Crear una tarea",
  notify: "Enviar una notificación",
};
const TEMPLATES: Pick<AutomationRule, "name" | "trigger" | "action" | "text">[] = [
  { name: "Atender cambios del cliente", trigger: "post_changes", action: "create_task", text: "Aplicar cambios en «{post}»" },
  { name: "Programar lo aprobado", trigger: "post_approved", action: "create_task", text: "Programar «{post}»" },
  { name: "Avisar de aprobaciones", trigger: "post_approved", action: "notify", text: "El cliente aprobó «{post}»" },
  { name: "Dar seguimiento a la revisión", trigger: "post_pending", action: "create_task", text: "Dar seguimiento a la revisión de «{post}»" },
];
const NO_RULES: AutomationRule[] = [];

export default function AutomatizacionesPage() {
  const rules = useHublyStore((s) => s.automations) ?? NO_RULES;
  const addAutomation = useHublyStore((s) => s.addAutomation);
  const toggleAutomation = useHublyStore((s) => s.toggleAutomation);
  const removeAutomation = useHublyStore((s) => s.removeAutomation);

  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger>("post_changes");
  const [action, setAction] = useState<AutomationAction>("create_task");
  const [text, setText] = useState("");

  const available = TEMPLATES.filter((t) => !rules.some((r) => r.name === t.name));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "12px 0 48px", display: "grid", gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>Automatizaciones</h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0" }}>
          Reglas que hacen el trabajo repetitivo. Por ahora se ejecutan cuando el cambio ocurre con la app abierta.
        </p>
      </div>

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={h2}>Tus reglas</h2>
        {rules.length === 0 && <p style={{ ...card, fontSize: 13.5, color: "#64748B", textAlign: "center", margin: 0 }}>Aún no tienes reglas. Empieza con una plantilla.</p>}
        {rules.map((rule) => (
          <article key={rule.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" role="switch" checked={rule.enabled} onChange={() => toggleAutomation(rule.id)} aria-label={`Activar ${rule.name}`} style={{ width: 17, height: 17 }} />
            </label>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{rule.name}</div>
              <div style={{ fontSize: 12.5, color: "#475569" }}>
                {TRIGGERS[rule.trigger]} → {ACTIONS[rule.action].toLowerCase()}: {rule.text}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                {rule.runs === 0
                  ? "Sin ejecuciones"
                  : `${rule.runs} ejecuciones · última ${new Date(rule.lastRunAt || "").toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}`}
              </div>
            </div>
            <button type="button" aria-label={`Eliminar ${rule.name}`} onClick={() => removeAutomation(rule.id)} style={{ border: 0, background: "transparent", color: "#64748B", cursor: "pointer", display: "grid", padding: 4 }}>
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>

      {available.length > 0 && (
        <section style={{ display: "grid", gap: 10 }}>
          <h2 style={h2}>Plantillas</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))", gap: 10 }}>
            {available.map((t) => (
              <article key={t.name} style={{ ...card, display: "flex", flexDirection: "column", gap: 6 }}>
                <strong style={{ fontSize: 13.5 }}>{t.name}</strong>
                <span style={{ fontSize: 12.5, color: "#475569" }}>{TRIGGERS[t.trigger]} → {ACTIONS[t.action].toLowerCase()}</span>
                <button type="button" onClick={() => addAutomation(t)} style={{ ...primary, marginTop: "auto", alignSelf: "flex-start" }}>Activar</button>
              </article>
            ))}
          </div>
        </section>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !text.trim()) return;
          addAutomation({ name: name.trim(), trigger, action, text: text.trim() });
          setName("");
          setText("");
        }}
        style={{ ...card, display: "grid", gap: 10 }}
      >
        <h2 style={h2}>Crear regla</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          <label style={lab}>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} style={field} /></label>
          <label style={lab}>
            Cuando
            <select value={trigger} onChange={(e) => setTrigger(e.target.value as AutomationTrigger)} style={field}>
              {Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label style={lab}>
            Entonces
            <select value={action} onChange={(e) => setAction(e.target.value as AutomationAction)} style={field}>
              {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <label style={lab}>
          Texto (usa {"{post}"} para el título del post)
          <input required value={text} onChange={(e) => setText(e.target.value)} placeholder="Revisar «{post}»" style={field} />
        </label>
        <button type="submit" style={{ ...primary, justifySelf: "start" }}>Crear regla</button>
      </form>
    </div>
  );
}

const card = { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 } as const;
const h2 = { fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 } as const;
const field = { width: "100%", border: "1px solid #CBD5E1", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "#FFFFFF", minWidth: 0 } as const;
const lab = { display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "#475569" } as const;
const primary = { border: 0, borderRadius: 9, background: "#6C77C1", color: "#FFFFFF", padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" } as const;
