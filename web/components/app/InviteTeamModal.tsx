"use client";

import { Modal } from "@/components/app/ui/Modal";
import React, { useEffect, useRef, useState } from "react";
import { HublyCheckIcon, HublyCloseIcon, HublyCopyIcon, HublyPlusIcon, HublySearchIcon } from "@/components/app/icons/DuotoneIcons";
import {
  alreadyMember,
  canInvite,
  createInviteLink,
  DEFAULT_INVITE_ROLE,
  EMAIL_REGEX,
  INVITE_ROLES,
  inviteByEmail,
  loadKnownPeople,
  type KnownPerson,
} from "@/lib/invitaciones";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";

type Tab = "existente" | "link" | "correo";
type Sent = { email: string; link: string };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "link", label: "Por link" },
  { id: "correo", label: "Por correo" },
  { id: "existente", label: "Usuario existente" },
];

const TAB_INICIAL: Tab = backendEnabled ? "link" : "correo";

/** El enlace ya creado, listo para copiar. El token solo se conoce en este momento. */
export function InviteLinkRow({ link, label }: { link: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="hubly-invite-link">
      <input className="hubly-cal-line" readOnly value={link} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="hbtn hbtn-secondary" onClick={() => void copy()}>
        {copied ? <HublyCheckIcon size={17} /> : <HublyCopyIcon size={17} />}
        <span role="status">{copied ? "Copiado" : "Copiar"}</span>
      </button>
    </div>
  );
}

function RoleField({ value, onChange, options }: { value: string; onChange: (role: string) => void; options: typeof INVITE_ROLES }) {
  return (
    <label className="hubly-invite-rol">
      <span>Rol de quien entra</span>
      <select className="hubly-cal-line" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
    </label>
  );
}

function SentList({ sent }: { sent: Sent[] }) {
  if (sent.length === 0) return null;
  return (
    <div className="hubly-invite-sent" role="status">
      <p>Comparte cada enlace con su persona. Caduca en 7 días y solo se muestra ahora.</p>
      {sent.map((s) => (
        <div key={s.email}>
          <strong title={s.email}>{s.email}</strong>
          <InviteLinkRow link={s.link} label={`Enlace de invitación para ${s.email}`} />
        </div>
      ))}
    </div>
  );
}

function ExistenteTab({ role }: { role: string }) {
  const [people, setPeople] = useState<KnownPerson[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent[]>([]);

  useEffect(() => {
    let active = true;
    loadKnownPeople()
      .then((list) => {
        if (!active) return;
        setPeople(list);
        setFailed(false);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [attempt]);

  const q = query.trim().toLowerCase();
  const visible = (people ?? []).filter((p) => !q || p.name.toLowerCase().includes(q) || p.email.includes(q));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setError(null);
    const result = await inviteByEmail(selected, role);
    setSending(false);
    if ("error" in result) return setError(result.error);
    setSent((cur) => [{ email: selected, link: result.link }, ...cur.filter((s) => s.email !== selected)]);
    setPeople((cur) => cur?.filter((p) => p.email !== selected) ?? null);
    setSelected(null);
  };

  return (
    <form className="hubly-invite-form" onSubmit={submit}>
      <label className="hubly-invite-search">
        <HublySearchIcon size={17} />
        <input className="hubly-cal-line" autoFocus value={query} placeholder="Buscar por nombre o correo" aria-label="Buscar persona" onChange={(e) => setQuery(e.target.value)} />
      </label>
      {failed ? (
        <div className="hubly-ajustes-empty" role="alert">
          <strong>No pudimos cargar tu lista</strong>
          <p>Revisa tu conexión e inténtalo otra vez.</p>
          <button type="button" className="hbtn hbtn-secondary hbtn-sm" onClick={() => setAttempt((n) => n + 1)}>Reintentar</button>
        </div>
      ) : people === null ? (
        <p className="hubly-invite-note">Cargando…</p>
      ) : visible.length === 0 ? (
        <div className="hubly-ajustes-empty">
          <strong>{q ? "Sin resultados" : "Sin personas por agregar"}</strong>
          <p>{q ? "Prueba con otro nombre o correo." : "Aquí verás a quienes trabajan contigo en otras agencias."}</p>
        </div>
      ) : (
        <div className="hubly-ajustes-list hubly-invite-people" role="radiogroup" aria-label="Personas">
          {visible.map((p) => (
            <label key={p.email} className="hubly-ajustes-check">
              <input type="radio" name="persona" checked={selected === p.email} onChange={() => setSelected(p.email)} />
              <span className="hubly-ajustes-row-text">
                <span className="hubly-ajustes-row-title" title={p.name}>{p.name}</span>
                <span className="hubly-ajustes-row-meta">{p.email} · {p.agency}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      {(people?.length ?? 0) > 0 && (
        <>
          {error && <p className="hubly-invite-error" role="alert">{error}</p>}
          <button type="submit" className="hbtn hbtn-primary" disabled={!selected || sending}>
            {sending ? "Creando…" : "Crear invitación"}
          </button>
        </>
      )}
      <SentList sent={sent} />
    </form>
  );
}

function LinkTab({ role }: { role: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!backendEnabled) {
    return (
      <div className="hubly-ajustes-empty">
        <strong>Disponible con cuentas reales</strong>
        <p>En modo demo no hay cuentas que puedan abrir un link.</p>
      </div>
    );
  }

  const generate = async () => {
    setSending(true);
    setError(null);
    const result = await createInviteLink(role);
    setSending(false);
    if ("error" in result) return setError(result.error);
    setLink(result.link);
  };

  return (
    <div className="hubly-invite-form">
      <p className="hubly-invite-note">Cualquier persona con el link y un correo verificado entra a la agencia.</p>
      {error && <p className="hubly-invite-error" role="alert">{error}</p>}
      <button type="button" className="hbtn hbtn-primary" disabled={sending} onClick={() => void generate()}>
        {sending ? "Generando…" : link ? "Generar otro link" : "Generar link"}
      </button>
      {link && (
        <div className="hubly-invite-sent" role="status">
          <InviteLinkRow link={link} label="Link de invitación" />
          <p>Caduca en 7 días y solo se muestra ahora. Puedes revocarlo en Ajustes, Equipo.</p>
        </div>
      )}
    </div>
  );
}

function CorreoTab({ role }: { role: string }) {
  const [emails, setEmails] = useState([""]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent[]>([]);
  const firstRef = useRef<HTMLInputElement | null>(null);

  const setAt = (index: number, value: string) => {
    setEmails((cur) => cur.map((email, i) => (i === index ? value : email)));
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = [...new Set(emails.map((m) => m.trim().toLowerCase()).filter(Boolean))];
    const wrong = clean.find((m) => !EMAIL_REGEX.test(m));
    const member = clean.find(alreadyMember);
    if (clean.length === 0 || wrong) {
      firstRef.current?.focus();
      return setError(wrong ? `Revisa el correo «${wrong}».` : "Escribe al menos un correo.");
    }
    if (member) return setError(`${member} ya forma parte de la agencia.`);

    setSending(true);
    setError(null);
    const results = await Promise.all(clean.map(async (email) => ({ email, result: await inviteByEmail(email, role) })));
    setSending(false);
    const ok = results.flatMap((r) => ("link" in r.result ? [{ email: r.email, link: r.result.link }] : []));
    const failed = results.filter((r) => "error" in r.result);
    setSent((cur) => [...ok, ...cur.filter((s) => !ok.some((o) => o.email === s.email))]);
    setEmails(failed.length > 0 ? failed.map((r) => r.email) : [""]);
    const first = failed[0]?.result;
    if (first && "error" in first) setError(first.error);
  };

  return (
    <form className="hubly-invite-form" onSubmit={submit} noValidate>
      <p className="hubly-invite-note">Hubly aún no envía correos: crea un enlace personal y compártelo tú.</p>
      <div className="hubly-invite-emails">
        {emails.map((email, index) => (
          <div key={index} className="hubly-invite-email">
            <input
              ref={index === 0 ? firstRef : undefined}
              className="hubly-cal-line"
              type="email"
              autoFocus={index === 0}
              value={email}
              placeholder="correo@agencia.com"
              aria-label={`Correo ${index + 1}`}
              aria-invalid={Boolean(error)}
              onChange={(e) => setAt(index, e.target.value)}
            />
            {emails.length > 1 && (
              <button type="button" className="hubly-cal-modal-close" aria-label={`Quitar correo ${index + 1}`} onClick={() => setEmails((cur) => cur.filter((_, i) => i !== index))}>
                <HublyCloseIcon size={14} />
              </button>
            )}
          </div>
        ))}
        <button type="button" className="hbtn hbtn-ghost hbtn-sm hubly-invite-add" onClick={() => setEmails((cur) => [...cur, ""])}>
          <HublyPlusIcon size={15} /> Agregar otro
        </button>
      </div>
      {error && <p className="hubly-invite-error" role="alert">{error}</p>}
      <button type="submit" className="hbtn hbtn-primary" disabled={sending}>
        {sending ? "Creando…" : emails.length > 1 ? "Crear invitaciones" : "Crear invitación"}
      </button>
      <SentList sent={sent} />
    </form>
  );
}

export function InviteTeamModal() {
  const open = useHublyStore((s) => s.inviteModalOpen);
  const setOpen = useHublyStore((s) => s.setInviteModalOpen);
  const [tab, setTab] = useState<Tab>(TAB_INICIAL);
  const [role, setRole] = useState(DEFAULT_INVITE_ROLE);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    setTab(TAB_INICIAL); // eslint-disable-line react-hooks/set-state-in-effect
    setRole(DEFAULT_INVITE_ROLE);
  }, [open]);

  // El link nunca ofreció Administración; ese rol solo se da a personas concretas.
  const roles = tab === "link" ? INVITE_ROLES.slice(1) : INVITE_ROLES;
  const rolActivo = roles.some((r) => r.value === role) ? role : DEFAULT_INVITE_ROLE;

  const moveTab = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const index = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Modal open={open} onClose={close} label="Invitar a la agencia" className="hubly-sheet hubly-cal-modal hubly-touch">
      <div className="hubly-cal-modal-head">
        <h2>Invitar a la agencia</h2>
        <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={close}>
          <HublyCloseIcon size={14} />
        </button>
      </div>
      {canInvite() ? (
        <>
          <RoleField value={rolActivo} onChange={setRole} options={roles} />
          <div className="hubly-invite-tabs" role="tablist" aria-label="Forma de invitar" onKeyDown={moveTab}>
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`invitar-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="invitar-panel"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div id="invitar-panel" className="hubly-cal-modal-scroll" role="tabpanel" aria-labelledby={`invitar-${tab}`}>
            {tab === "existente" && <ExistenteTab role={rolActivo} />}
            {tab === "link" && <LinkTab role={rolActivo} />}
            {tab === "correo" && <CorreoTab role={rolActivo} />}
          </div>
        </>
      ) : (
        <div className="hubly-ajustes-empty">
          <strong>Tu rol no permite invitar</strong>
          <p>Pídeselo a quien administra la agencia.</p>
        </div>
      )}
    </Modal>
  );
}

