"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { askConfirm } from "@/components/app/AppDialogHost";
import { useKanbanDrag } from "@/lib/use-kanban-drag";
import { KanbanDropSlot } from "@/components/app/KanbanDropSlot";
import { STATUS_META } from "@/components/app/social/status-meta";
import type { Lead, LeadStage, Quote, QuoteItem, QuoteStatus } from "@/lib/types";
import {
  HublyCloseIcon as X,
  HublyPlusIcon as Plus,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

const STAGES: { key: LeadStage; label: string; dot: string }[] = [
  { key: "nuevo", label: "Nuevo", dot: "var(--hb-accent)" },
  { key: "contactado", label: "Contactado", dot: "var(--ui-sky)" },
  { key: "propuesta", label: "Propuesta", dot: "var(--hb-accent-text)" },
  { key: "ganado", label: "Ganado", dot: "var(--ui-positive-text)" },
  { key: "perdido", label: "Perdido", dot: "var(--ui-text-5)" },
];
const STAGE_KEYS = STAGES.map((s) => s.key);
const QUOTE_STATUSES: QuoteStatus[] = ["Borrador", "Enviada", "Aceptada", "Rechazada"];
const NO_LEADS: Lead[] = [];
const NO_QUOTES: Quote[] = [];
const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const quoteTotal = (q: Pick<Quote, "items">) => q.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

type LeadDraft = Partial<Lead>;

export default function CrmPage() {
  const leads = useHublyStore((s) => s.leads) ?? NO_LEADS;
  const quotes = useHublyStore((s) => s.quotes) ?? NO_QUOTES;
  const moveLead = useHublyStore((s) => s.moveLead);
  const deleteQuote = useHublyStore((s) => s.deleteQuote);

  const [tab, setTab] = useState<"pipeline" | "prospectos" | "cotizaciones">("pipeline");
  const [leadDraft, setLeadDraft] = useState<LeadDraft | null>(null);
  const [quoteDraft, setQuoteDraft] = useState<Partial<Quote> | null>(null);
  const [query, setQuery] = useState("");

  const { drag, getCardProps, getColumnProps } = useKanbanDrag({
    columns: STAGE_KEYS,
    onMove: (id, toCol, beforeId) => moveLead(id, toCol as LeadStage, beforeId),
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? leads.filter((l) => `${l.name} ${l.company} ${l.email}`.toLowerCase().includes(q)) : leads;
  }, [leads, query]);

  const open = leads.filter((l) => l.stage !== "ganado" && l.stage !== "perdido");
  const closed = leads.filter((l) => l.stage === "ganado" || l.stage === "perdido");
  const won = leads.filter((l) => l.stage === "ganado");
  const tiles = [
    { label: "En proceso", value: money(open.reduce((s, l) => s + l.value, 0)), sub: `${open.length} prospectos` },
    { label: "Ganado", value: money(won.reduce((s, l) => s + l.value, 0)), sub: `${won.length} clientes` },
    { label: "Tasa de cierre", value: closed.length ? `${Math.round((won.length / closed.length) * 100)}%` : "—", sub: `${closed.length} cerrados` },
  ];
  const leadName = (id: string) => leads.find((l) => l.id === id)?.company || leads.find((l) => l.id === id)?.name || "Sin prospecto";

  return (
    <div style={{ padding: "12px 0 48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ui-text)", margin: 0 }}>CRM</h1>
          <p style={{ fontSize: 13, color: "var(--ui-text-4)", margin: "2px 0 0" }}>Prospectos y cotizaciones de tu agencia.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={secondary} disabled={leads.length === 0} title={leads.length === 0 ? "Crea primero un prospecto" : undefined} onClick={() => setQuoteDraft({ leadId: leads[0]?.id })}>
            Nueva cotización
          </button>
          <button type="button" style={primary} onClick={() => setLeadDraft({ stage: "nuevo" })}>
            <Plus size={14} /> Nuevo prospecto
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        {tiles.map((t) => (
          <div key={t.label} style={card}>
            <div style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{t.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>{t.value}</div>
            <div style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{t.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div role="group" aria-label="Sección del CRM" style={{ display: "inline-flex", gap: 2, background: "var(--ui-muted)", padding: 3, borderRadius: 10 }}>
          {(["pipeline", "prospectos", "cotizaciones"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              style={{ border: 0, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", background: tab === t ? "var(--ui-surface)" : "transparent", color: tab === t ? "var(--ui-accent-text)" : "var(--ui-text-3)" }}
            >
              {t}
            </button>
          ))}
        </div>
        {tab !== "cotizaciones" && (
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar prospecto" aria-label="Buscar prospecto" style={{ ...field, width: 200 }} />
        )}
      </div>

      {tab === "pipeline" && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(210px, 1fr))", gap: 12 }}>
            {STAGES.map((stage) => {
              const items = visible.filter((l) => l.stage === stage.key);
              const over = drag?.overCol === stage.key;
              return (
                <div key={stage.key} {...getColumnProps(stage.key)} style={{ background: over ? "var(--ui-accent-soft)" : "var(--ui-surface-2)", border: `1px solid ${over ? "var(--hb-accent)" : "var(--ui-border)"}`, borderRadius: 14, padding: 12, minHeight: 280, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: stage.dot }} />
                      {stage.label}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--ui-text-3)", fontWeight: 600 }}>{items.length}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontVariantNumeric: "tabular-nums" }}>{money(items.reduce((s, l) => s + l.value, 0))}</div>
                  {items.map((lead) => (
                    <React.Fragment key={lead.id}>
                      {over && drag?.beforeId === lead.id && <KanbanDropSlot height={drag.height} />}
                      <div {...getCardProps(lead.id)} onClick={() => setLeadDraft(lead)} style={{ background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "10px 12px", cursor: drag?.id === lead.id ? "grabbing" : "grab", opacity: drag?.id === lead.id ? 0.35 : 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 650, color: "var(--ui-text)" }}>{lead.company || lead.name}</div>
                        {lead.company && <div style={{ fontSize: 12, color: "var(--ui-text-3)" }}>{lead.name}</div>}
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-accent-text)", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{money(lead.value)}/mes</div>
                      </div>
                    </React.Fragment>
                  ))}
                  {over && drag?.beforeId === null && <KanbanDropSlot height={drag.height} />}
                  {items.length === 0 && !over && <p style={{ fontSize: 12, color: "var(--ui-text-5)", margin: "auto 0", textAlign: "center" }}>Arrastra aquí</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "prospectos" && (
        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
          {visible.length === 0 ? (
            <p style={empty}>Aún no hay prospectos.</p>
          ) : (
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ui-text-4)", fontSize: 12 }}>
                  {["Empresa", "Contacto", "Origen", "Etapa", "Valor mensual"].map((h) => <th key={h} style={cell}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => (
                  <tr key={l.id} onClick={() => setLeadDraft(l)} style={{ borderTop: "1px solid var(--ui-muted)", cursor: "pointer" }}>
                    <td style={{ ...cell, fontWeight: 650 }}>{l.company || "—"}</td>
                    <td style={cell}>{l.name}<div style={{ fontSize: 12, color: "var(--ui-text-4)" }}>{l.email}</div></td>
                    <td style={cell}>{l.source || "—"}</td>
                    <td style={cell}>{STAGES.find((s) => s.key === l.stage)?.label}</td>
                    <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{money(l.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "cotizaciones" && (
        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
          {quotes.length === 0 ? (
            <p style={empty}>Aún no hay cotizaciones.</p>
          ) : (
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ui-text-4)", fontSize: 12 }}>
                  {["Cotización", "Prospecto", "Estado", "Total", ""].map((h, i) => <th key={i} style={cell}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} onClick={() => setQuoteDraft(q)} style={{ borderTop: "1px solid var(--ui-muted)", cursor: "pointer" }}>
                    <td style={{ ...cell, fontWeight: 650 }}>{q.title}</td>
                    <td style={cell}>{leadName(q.leadId)}</td>
                    <td style={cell}>{q.status}</td>
                    <td style={{ ...cell, fontVariantNumeric: "tabular-nums" }}>{money(quoteTotal(q))}</td>
                    <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                      <a href={`/cotizacion/${q.id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ui-accent-text-2)", marginRight: 10 }}>
                        PDF
                      </a>
                      <button
                        type="button"
                        aria-label={`Eliminar ${q.title}`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (await askConfirm(`¿Eliminar «${q.title}»?`)) deleteQuote(q.id);
                        }}
                        style={{ border: 0, background: "transparent", color: "var(--ui-text-4)", cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {leadDraft && (
        <LeadModal
          key={leadDraft.id || "nuevo"}
          draft={leadDraft}
          onClose={() => setLeadDraft(null)}
          onQuote={(leadId) => {
            setLeadDraft(null);
            setTab("cotizaciones");
            setQuoteDraft({ leadId });
          }}
        />
      )}
      {quoteDraft && <QuoteModal key={quoteDraft.id || "nueva"} draft={quoteDraft} leads={leads} onClose={() => setQuoteDraft(null)} />}
    </div>
  );
}

function ModalShell({ label, onClose, onSubmit, children }: { label: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="hubly-overlay hubly-cal-overlay"
      style={{ position: "fixed", inset: 0, zIndex: "var(--layer-modal)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <form role="dialog" aria-modal="true" aria-label={label} onSubmit={onSubmit} style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", background: "var(--ui-surface)", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{label}</h2>
          <button type="button" aria-label="Cerrar" onClick={onClose} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ui-text-4)", display: "grid" }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </form>
    </div>
  );
}

function LeadModal({ draft, onClose, onQuote }: { draft: LeadDraft; onClose: () => void; onQuote: (leadId: string) => void }) {
  const saveLead = useHublyStore((s) => s.saveLead);
  const deleteLead = useHublyStore((s) => s.deleteLead);
  const [name, setName] = useState(draft.name || "");
  const [company, setCompany] = useState(draft.company || "");
  const [email, setEmail] = useState(draft.email || "");
  const [phone, setPhone] = useState(draft.phone || "");
  const [source, setSource] = useState(draft.source || "");
  const [value, setValue] = useState(String(draft.value ?? ""));
  const [stage, setStage] = useState<LeadStage>(draft.stage || "nuevo");
  const [notes, setNotes] = useState(draft.notes || "");

  return (
    <ModalShell
      label={draft.id ? "Editar prospecto" : "Nuevo prospecto"}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        saveLead({ id: draft.id, name: name.trim(), company: company.trim(), email: email.trim(), phone: phone.trim(), source: source.trim(), value: Math.max(0, Number(value) || 0), stage, notes: notes.trim() });
        onClose();
      }}
    >
      <div style={grid2}>
        <label style={lab}>Contacto *<input required autoFocus value={name} onChange={(e) => setName(e.target.value)} style={field} /></label>
        <label style={lab}>Empresa<input value={company} onChange={(e) => setCompany(e.target.value)} style={field} /></label>
        <label style={lab}>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} /></label>
        <label style={lab}>Teléfono<input value={phone} onChange={(e) => setPhone(e.target.value)} style={field} /></label>
        <label style={lab}>Origen<input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Referido, Instagram…" style={field} /></label>
        <label style={lab}>Valor mensual (MXN)<input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} style={field} /></label>
        <label style={lab}>
          Etapa
          <select value={stage} onChange={(e) => setStage(e.target.value as LeadStage)} style={field}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </div>
      <label style={lab}>Notas<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...field, resize: "vertical" }} /></label>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {draft.id && (
            <>
              <button
                type="button"
                style={danger}
                onClick={async () => {
                  if (await askConfirm("¿Eliminar este prospecto y sus cotizaciones?")) {
                    deleteLead(draft.id!);
                    onClose();
                  }
                }}
              >
                Eliminar
              </button>
              <button type="button" style={secondary} onClick={() => onQuote(draft.id!)}>Cotizar</button>
            </>
          )}
        </div>
        <button type="submit" style={primary}>Guardar</button>
      </div>
    </ModalShell>
  );
}

function QuoteModal({ draft, leads, onClose }: { draft: Partial<Quote>; leads: Lead[]; onClose: () => void }) {
  const saveQuote = useHublyStore((s) => s.saveQuote);
  const [title, setTitle] = useState(draft.title || "");
  const [leadId, setLeadId] = useState(draft.leadId || leads[0]?.id || "");
  const [status, setStatus] = useState<QuoteStatus>(draft.status || "Borrador");
  const [items, setItems] = useState<QuoteItem[]>(
    draft.items?.length ? draft.items : [{ id: "item-1", description: "", quantity: 1, unitPrice: 0 }]
  );
  const patch = (id: string, change: Partial<QuoteItem>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...change } : i)));

  return (
    <ModalShell
      label={draft.id ? "Editar cotización" : "Nueva cotización"}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        saveQuote({ id: draft.id, title: title.trim(), leadId, status, items: items.filter((i) => i.description.trim()) });
        onClose();
      }}
    >
      <label style={lab}>Título *<input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gestión de redes · noviembre" style={field} /></label>
      <div style={grid2}>
        <label style={lab}>
          Prospecto
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} style={field}>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.company || l.name}</option>)}
          </select>
        </label>
        <label style={lab}>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus)} style={field}>
            {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 12.5 }}>Conceptos</strong>
        {items.map((item) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 64px 100px 28px", gap: 6, alignItems: "center" }}>
            <input value={item.description} onChange={(e) => patch(item.id, { description: e.target.value })} placeholder="Concepto" aria-label="Concepto" style={field} />
            <input type="number" min="1" value={item.quantity} onChange={(e) => patch(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label="Cantidad" style={field} />
            <input type="number" min="0" value={item.unitPrice} onChange={(e) => patch(item.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} aria-label="Precio unitario" style={field} />
            <button type="button" aria-label="Quitar concepto" disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} style={{ border: 0, background: "transparent", color: "var(--ui-text-4)", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems((prev) => [...prev, { id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0 }])} style={{ ...secondary, justifySelf: "start" }}>
          <Plus size={13} /> Agregar concepto
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong style={{ fontSize: 15, fontVariantNumeric: "tabular-nums" }}>Total: {money(quoteTotal({ items }))}</strong>
        <button type="submit" style={primary}>Guardar</button>
      </div>
    </ModalShell>
  );
}

const card = { background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 14, padding: 16 } as const;
const field = { width: "100%", border: "1px solid var(--ui-border-strong)", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "var(--ui-surface)", minWidth: 0 } as const;
const lab = { display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--ui-text-3)" } as const;
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 } as const;
const cell = { padding: "10px 14px" } as const;
const empty = { fontSize: 13.5, color: "var(--ui-text-4)", textAlign: "center", padding: 32, margin: 0 } as const;
const primary = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 9, background: "var(--hb-accent)", color: "var(--on-accent)", padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" } as const;
const secondary = { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--ui-border-strong)", borderRadius: 9, background: "var(--ui-surface)", color: "var(--ui-text-2)", padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" } as const;
const danger = { border: `1px solid ${STATUS_META.changes.bg}`, background: STATUS_META.changes.bg, color: STATUS_META.changes.color, borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" } as const;
