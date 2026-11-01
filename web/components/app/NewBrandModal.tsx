"use client";

import { Button } from "@/components/app/ui/Button";
import { Modal } from "@/components/app/ui/Modal";
import React, { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InviteLinkRow } from "@/components/app/InviteTeamModal";
import { GLYPHS as NETWORK_GLYPHS } from "@/components/app/compositor/PostComposerModal-shared";
import {
  HublyBuildingIcon,
  HublyCheckIcon,
  HublyChevronLeftIcon,
  HublyChevronRightIcon,
  HublyCloseIcon,
  HublyGlobeIcon,
  HublyLinkIcon,
  HublyPeopleIcon,
  HublySparkIcon,
} from "@/components/app/icons/DuotoneIcons";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { alreadyMember, canInvite, DEFAULT_INVITE_ROLE, EMAIL_REGEX, inviteByEmail } from "@/lib/invitaciones";
import { useHublyStore } from "@/lib/store";
import type { SocialNetwork } from "@/lib/types";

const STEPS = [
  { label: "Marca", icon: HublyBuildingIcon },
  { label: "Miembros", icon: HublyPeopleIcon },
  { label: "Redes", icon: HublyLinkIcon },
  { label: "Núcleo", icon: HublySparkIcon },
];

// Color inicial de la marca: se cambia después y solo aparece en su avatar.
const COLOR_SWATCHES = ["#16324F", "#C87A51", "#2E5E4E", "#5B50D6", "#B88D40", "#E11D48", "#0EA5E9", "#10B981", "#7C3AED", "#0F172A"];

const NETWORKS = Object.keys(NETWORK_GLYPHS) as SocialNetwork[];

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeWebsite(raw: string): string | null {
  const clean = raw.trim();
  if (!clean) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`);
    return url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="hubly-wizard-stepper" style={{ "--paso": step } as React.CSSProperties}>
      <span className="hubly-wizard-hubi" aria-hidden="true">
        <HublyCatAvatar size={36} alt="" />
      </span>
      <ol aria-label="Pasos">
        {STEPS.map(({ label, icon: Icon }, index) => {
          const state = index < step ? "done" : index === step ? "active" : "pending";
          return (
            <li key={label} data-state={state} aria-current={state === "active" ? "step" : undefined}>
              {state === "done" ? <HublyCheckIcon size={15} /> : <Icon size={15} />}
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MembersStep({ brandId, selected, onToggle }: { brandId: string; selected: string[]; onToggle: (id: string) => void }) {
  const team = useHublyStore((s) => s.team);
  const profile = useHublyStore((s) => s.profile);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Array<{ email: string; link: string }>>([]);
  const others = team.filter((m) => m.email !== profile?.email);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(clean)) return setError("Escribe un correo válido.");
    if (alreadyMember(clean)) return setError("Esa persona ya forma parte de la agencia.");
    setSending(true);
    setError(null);
    const result = await inviteByEmail(clean, DEFAULT_INVITE_ROLE, [brandId]);
    setSending(false);
    if ("error" in result) return setError(result.error);
    setSent((cur) => [{ email: clean, link: result.link }, ...cur]);
    setEmail("");
  };

  return (
    <>
      <section className="hubly-wizard-section">
        <h3>Miembros de la agencia</h3>
        <p>Elige quién puede trabajar en esta marca.</p>
        {others.length === 0 ? (
          <div className="hubly-ajustes-empty">
            <strong>Sin otros miembros</strong>
            <p>Invita a alguien para sumarlo a la marca.</p>
          </div>
        ) : (
          <div className="hubly-ajustes-list hubly-wizard-scroll">
            {others.map((m) => (
              <label key={m.id} className="hubly-ajustes-check">
                <input type="checkbox" checked={selected.includes(m.id)} onChange={() => onToggle(m.id)} />
                <span className="hubly-ajustes-dot" style={{ background: m.avatarColor, color: "var(--on-accent)" }}>{m.initials}</span>
                <span className="hubly-ajustes-row-text">
                  <span className="hubly-ajustes-row-title" title={m.name}>{m.name}</span>
                  <span className="hubly-ajustes-row-meta">{m.role}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>
      {canInvite() && (
        <form className="hubly-wizard-section" onSubmit={invite} noValidate>
          <h3>Invitar por correo</h3>
          <p>Crea un enlace personal para quien aún no está en tu agencia.</p>
          <div className="hubly-invite-email">
            <input
              className="hubly-cal-line"
              type="email"
              value={email}
              placeholder="correo@agencia.com"
              aria-label="Correo a invitar"
              aria-invalid={Boolean(error)}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
            />
            <Button type="submit" variant="secondary" disabled={sending || !email.trim()}>
              {sending ? "Creando…" : "Invitar"}
            </Button>
          </div>
          {error && <p className="hubly-invite-error" role="alert">{error}</p>}
          {sent.map((s) => (
            <div key={s.email} className="hubly-invite-sent" role="status">
              <strong title={s.email}>{s.email}</strong>
              <InviteLinkRow link={s.link} label={`Enlace de invitación para ${s.email}`} />
            </div>
          ))}
        </form>
      )}
    </>
  );
}

function NetworksStep({ networks, onToggle }: { networks: SocialNetwork[]; onToggle: (network: SocialNetwork) => void }) {
  return (
    <section className="hubly-wizard-section">
      <p>Elige las redes que maneja esta marca. Aparecen en sus reportes y al revisar parrillas.</p>
      <div className="hubly-wizard-count">
        <span>Publicar directo desde Hubly: <em className="hubly-ajustes-tag">Función prevista</em></span>
        <span>{networks.length} de {NETWORKS.length}</span>
      </div>
      <div className="hubly-ajustes-list">
        {NETWORKS.map((network) => {
          const active = networks.includes(network);
          return (
            <div key={network} className="hubly-ajustes-row hubly-wizard-network">
              <span className="hubly-ajustes-dot">{NETWORK_GLYPHS[network]}</span>
              <div className="hubly-ajustes-row-text">
                <div className="hubly-ajustes-row-title">{network}</div>
              </div>
              <Button variant="secondary" size="sm" aria-pressed={active} aria-label={`${active ? "Quitar" : "Agregar"} ${network}`} onClick={() => onToggle(network)}>
                {active && <HublyCheckIcon size={15} />}
                {active ? "Agregada" : "Agregar"}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function NewBrandModal() {
  const router = useRouter();
  const open = useHublyStore((s) => s.newBrandModalOpen);
  const setOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const addBrand = useHublyStore((s) => s.addBrand);
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const updateBrandCore = useHublyStore((s) => s.updateBrandCore);
  const updateTeamMember = useHublyStore((s) => s.updateTeamMember);

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [whatTheySell, setWhatTheySell] = useState("");
  const [sellError, setSellError] = useState<string | null>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setStep(0);
    setBrandId(null);
    setName("");
    setWebsite("");
    setNameError(null);
    setWebsiteError(null);
    setMemberIds([]);
    setNetworks([]);
    setWhatTheySell("");
    setSellError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  // Cada paso empieza en su primer control, también con teclado o lector de pantalla.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
  }, [open, step]);

  const createBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const brands = useHublyStore.getState().brands;
    if (brands.some((b) => b.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      return setNameError(`Ya existe una marca llamada «${cleanName}».`);
    }
    const websiteUrl = normalizeWebsite(website);
    if (websiteUrl === null) return setWebsiteError("Revisa la dirección. Ejemplo: cafebruma.mx");

    const initials = computeInitials(cleanName);
    addBrand({ name: cleanName, initials, initial: initials.charAt(0), color: COLOR_SWATCHES[brands.length % COLOR_SWATCHES.length] });
    const created = useHublyStore.getState();
    const id = created.activeBrandId;
    updateBrandCore(id, { websiteUrl });
    setBrandId(id);
    setNetworks(created.brands.find((b) => b.id === id)?.connectedNetworks ?? []);
    setStep(1);
  };

  const saveMembers = () => {
    const { team } = useHublyStore.getState();
    for (const member of team.filter((m) => memberIds.includes(m.id))) {
      updateTeamMember(member.id, { brandIds: [...new Set([...(member.brandIds ?? []), brandId as string])] });
    }
    setStep(2);
  };

  const saveNetworks = () => {
    updateBrand(brandId as string, { connectedNetworks: networks });
    setStep(3);
  };

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = whatTheySell.trim();
    if (!clean) return setSellError("Escribe en un renglón qué vende y a quién.");
    updateBrandCore(brandId as string, { whatTheySell: clean });
    close();
    router.push("/marca");
  };

  const toggleNetwork = (network: SocialNetwork) =>
    setNetworks((cur) => (cur.includes(network) ? cur.filter((n) => n !== network) : [...cur, network]));
  const toggleMember = (id: string) =>
    setMemberIds((cur) => (cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]));

  const back = step > 1 && (
    <Button variant="ghost" className="hubly-wizard-back" onClick={() => setStep(step - 1)}>
      <HublyChevronLeftIcon size={15} /> Atrás
    </Button>
  );
  const skip = (
    <Button variant="ghost" onClick={() => (step === 3 ? close() : setStep(step + 1))}>
      Omitir por ahora
    </Button>
  );

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} className="hubly-sheet hubly-cal-modal hubly-touch hubly-wizard">
      <div className="hubly-cal-modal-head">
        <div className="hubly-wizard-title">
          <h2 id={titleId}>Nueva marca</h2>
          <p title={step > 0 ? name : undefined}>{step > 0 ? name : "Configúrala en 4 pasos"}</p>
        </div>
        <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={close}>
          <HublyCloseIcon size={14} />
        </button>
      </div>

      <Stepper step={step} />

      {step === 0 && (
        <form className="hubly-wizard-form" onSubmit={createBrand} noValidate>
          <div ref={panelRef} className="hubly-cal-modal-scroll">
            <label className="hubly-cal-field">
              <span>Nombre de la marca</span>
              <input
                className="hubly-cal-line"
                value={name}
                placeholder="Ej. Café Bruma"
                aria-required="true"
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? `${titleId}-nombre` : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
              />
              {nameError && <small id={`${titleId}-nombre`} className="hubly-invite-error" role="alert">{nameError}</small>}
            </label>
            <label className="hubly-cal-field">
              <span>Sitio web (opcional)</span>
              <span className="hubly-wizard-input">
                <HublyGlobeIcon size={17} />
                <input
                  className="hubly-cal-line"
                  inputMode="url"
                  value={website}
                  placeholder="cafebruma.mx"
                  aria-invalid={Boolean(websiteError)}
                  aria-describedby={websiteError ? `${titleId}-web` : undefined}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    setWebsiteError(null);
                  }}
                />
              </span>
              {websiteError ? (
                <small id={`${titleId}-web`} className="hubly-invite-error" role="alert">{websiteError}</small>
              ) : (
                <small>Se guarda en el Núcleo de Marca.</small>
              )}
            </label>
          </div>
          <div className="hubly-cal-modal-actions">
            <Button variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={!name.trim()}>
              Crear marca <HublyChevronRightIcon size={15} />
            </Button>
          </div>
        </form>
      )}

      {step === 1 && (
        <>
          <div ref={panelRef} className="hubly-cal-modal-scroll">
            <MembersStep brandId={brandId as string} selected={memberIds} onToggle={toggleMember} />
          </div>
          <div className="hubly-cal-modal-actions">
            {skip}
            <Button variant="primary" onClick={saveMembers}>
              Continuar <HublyChevronRightIcon size={15} />
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div ref={panelRef} className="hubly-cal-modal-scroll">
            <NetworksStep networks={networks} onToggle={toggleNetwork} />
          </div>
          <div className="hubly-cal-modal-actions">
            {back}
            {skip}
            <Button variant="primary" onClick={saveNetworks}>
              Continuar <HublyChevronRightIcon size={15} />
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <form className="hubly-wizard-form" onSubmit={finish} noValidate>
          <div ref={panelRef} className="hubly-cal-modal-scroll">
            <section className="hubly-wizard-section">
              <h3>Completa el Núcleo de Marca</h3>
              <p>Hubi usa este contexto al redactar captions para la marca. Después sigues en su Núcleo con el tono y los compradores.</p>
            </section>
            <label className="hubly-cal-field">
              <span>Qué vende y a quién</span>
              <textarea
                className="hubly-cal-line hubly-wizard-textarea"
                rows={3}
                value={whatTheySell}
                placeholder="Ej. Café de especialidad para oficinas de la colonia Roma"
                aria-invalid={Boolean(sellError)}
                aria-describedby={sellError ? `${titleId}-vende` : undefined}
                onChange={(e) => {
                  setWhatTheySell(e.target.value);
                  setSellError(null);
                }}
              />
              {sellError && <small id={`${titleId}-vende`} className="hubly-invite-error" role="alert">{sellError}</small>}
            </label>
          </div>
          <div className="hubly-cal-modal-actions">
            {back}
            {skip}
            <Button type="submit" variant="primary">
              <HublySparkIcon size={17} /> Abrir Núcleo
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
