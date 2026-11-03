"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { LiveInviteRedirect } from "@/components/app/LiveUnavailable";
import { backendEnabled } from "@/lib/supabase/config";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";
import { STATUS_META } from "@/components/app/social/status-meta";
import type { TeamInvitation } from "@/lib/types";
import {
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyCopyIcon as Copy,
  HublyInfoIcon as Info,
  HublyLinkIcon as Link2,
  HublyPersonIcon as UserPlus,
  HublyShieldIcon as Shield,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

export type TeamMemberRole =
  | "Admin"
  | "Content Manager"
  | "Diseñador"
  | "Copywriter"
  | "Trafficker"
  | "Cliente"
  | string;

export interface InviteTeamModalProps {
  open?: boolean;
  onClose?: () => void;
  defaultRole?: TeamMemberRole;
  isFallbackMount?: boolean;
}

const ROLE_OPTIONS: Array<{
  value: TeamMemberRole;
  label: string;
  description: string;
}> = [
  {
    value: "Admin",
    label: "Admin / Dueño",
    description: "Acceso total a marcas, equipo, métricas y configuración.",
  },
  {
    value: "Content Manager",
    label: "Content Manager (Miembro)",
    description: "Gestiona parrillas, calendario, tareas y libretas.",
  },
  {
    value: "Diseñador",
    label: "Diseñador (Miembro)",
    description: "Sube creativos, edita piezas visuales y cierra entregables.",
  },
  {
    value: "Copywriter",
    label: "Copywriter (Miembro)",
    description: "Redacta copies, guiones de Reels y notas de marca.",
  },
  {
    value: "Trafficker",
    label: "Trafficker / Media Buyer",
    description: "Administra campañas de Ads, presupuestos y ROAS.",
  },
  {
    value: "Cliente",
    label: "Cliente / Invitado",
    description: "Revisa y aprueba entregables en las marcas asignadas.",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let primaryInviteModalMounts = 0;

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function InviteTeamModal(props: InviteTeamModalProps = {}) {
  return backendEnabled ? <LiveInviteRedirect open={props.open} /> : <DemoInviteTeamModal {...props} />;
}

function DemoInviteTeamModal({
  open: openProp,
  onClose: onCloseProp,
  defaultRole = "Content Manager",
  isFallbackMount = false,
}: InviteTeamModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const [suppressedAsFallback, setSuppressedAsFallback] = useState(false);

  useEffect(() => {
    if (!isFallbackMount) {
      primaryInviteModalMounts += 1;
      return () => {
        primaryInviteModalMounts = Math.max(0, primaryInviteModalMounts - 1);
      };
    } else {
      setSuppressedAsFallback(primaryInviteModalMounts > 0);
    }
  }, [isFallbackMount]);

  const inviteModalOpen = useHublyStore((s) => s.inviteModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const inviteTeamMember = useHublyStore((s) => s.inviteTeamMember);
  const cancelTeamInvitation = useHublyStore((s) => s.cancelTeamInvitation);
  const teamInvitations = useHublyStore((s) => s.invitations);
  const teamMembers = useHublyStore((s) => s.team);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);

  const isOpen =
    !suppressedAsFallback &&
    (openProp !== undefined ? openProp : inviteModalOpen);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamMemberRole>(defaultRole);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] =
    useState<TeamInvitation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMsg(null);
    setCreatedInvitation(null);
    if (onCloseProp) {
      onCloseProp();
    } else {
      setInviteModalOpen(false);
    }
  };

  useLayer(isOpen, handleClose);

  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setName("");
    setRole(defaultRole);
    setSelectedBrandIds(
      activeBrandId
        ? [activeBrandId]
        : brands[0]?.id
        ? [brands[0].id]
        : []
    );
    setErrorMsg(null);
    setCreatedInvitation(null);
  }, [isOpen, defaultRole, activeBrandId, brands]);

  // Initial focus & Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      } else {
        const focusables = getFocusableElements(dialogRef.current);
        focusables[0]?.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      const remainingDialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (remainingDialogs.length <= 1) {
        document.body.style.overflow = prevOverflow || "";
      }
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusables = getFocusableElements(dialogRef.current);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (!active || active === first || !dialogRef.current?.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (!active || active === last || !dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const presence = useModalPresence(isOpen);
  if (!presence.mounted) return null;

  const toggleBrandSelection = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
    if (errorMsg) setErrorMsg(null);
  };

  const toggleSelectAllBrands = () => {
    if (selectedBrandIds.length === brands.length) {
      setSelectedBrandIds([]);
    } else {
      setSelectedBrandIds(brands.map((b) => b.id));
    }
    if (errorMsg) setErrorMsg(null);
  };

  const buildDemoInviteUrl = (inv: TeamInvitation) => {
    if (inv.inviteLink) return inv.inviteLink;
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3001";
    return `${origin}/dashboard/equipo?invite=${inv.id}`;
  };

  const handleCopyInviteLink = async (inv: TeamInvitation) => {
    const link = buildDemoInviteUrl(inv);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback if clipboard permission is restricted
    }
    setCopiedId(inv.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === inv.id ? null : prev));
    }, 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg("Ingresa el correo electrónico de la persona a invitar.");
      emailInputRef.current?.focus();
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg(
        "Ingresa un correo electrónico válido (ejemplo: nombre@agencia.mx)."
      );
      emailInputRef.current?.focus();
      return;
    }

    const alreadyMember = teamMembers.some(
      (m) => m.email.trim().toLowerCase() === cleanEmail
    );
    if (alreadyMember) {
      setErrorMsg("Este correo ya forma parte activa del equipo en Hubly.");
      emailInputRef.current?.focus();
      return;
    }

    if (selectedBrandIds.length === 0) {
      setErrorMsg("Asigna al menos una marca para esta invitación.");
      return;
    }

    const derivedName =
      name.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const invitation = inviteTeamMember({
      email: cleanEmail,
      name: derivedName,
      role,
      brandIds: selectedBrandIds,
    });

    setCreatedInvitation(invitation);
    setEmail("");
    setName("");
    setErrorMsg(null);
  };

  const pendingInvitations = teamInvitations.filter(
    (inv) => inv.status === "Pendiente"
  );

  return (
    <div
      className="hubly-overlay hubly-cal-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        className="hubly-sheet hubly-cal-modal"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "92vh",
          padding: 0,
          gap: 0,
          background: "var(--ui-surface)",
          borderRadius: 24,
          border: "1px solid var(--ui-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--ui-text)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--ui-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <UserPlus size={18} />
            </div>
            <div>
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                }}
              >
                Invitar miembro al equipo
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "var(--ui-text-4)",
                }}
              >
                Asigna rol operativo y acceso por marca dentro de Hubly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal de invitación"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-surface-2)",
              color: "var(--ui-text-4)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px 22px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Honest Local Demo Banner */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "var(--ui-sky-soft)",
              border: "1px solid var(--ui-sky-border)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--ui-sky-text)",
            }}
          >
            <Info
              size={15}
              style={{ color: "var(--hb-accent-text)", flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <strong style={{ fontWeight: 700 }}>
                Invitación local demo:
              </strong>{" "}
              Al crear la invitación se registra localmente en tu workspace con
              estado <strong>Pendiente</strong> y se genera un enlace local
              copiable. No se envía ningún correo electrónico externo.
            </div>
          </div>

          {/* Newly Created Local Invitation Card */}
          {createdInvitation && (
            <div
              role="status"
              style={{
                padding: 14,
                borderRadius: 14,
                background: "var(--ui-accent-soft)",
                border: "1px solid var(--ui-sky-border)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 9999,
                      background: "var(--hb-accent)",
                      color: "var(--on-accent)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Check size={13} />
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--ui-text)",
                      }}
                    >
                      Invitación local creada para {createdInvitation.name} (
                      {createdInvitation.email})
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--hb-accent-text)" }}>
                      Rol: <strong>{createdInvitation.role}</strong> · Estado:{" "}
                      <strong>Pendiente</strong> (guardada en este navegador)
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 9999,
                    background: "var(--ui-sky-soft)",
                    color: "var(--ui-sky-text)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Pendiente
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--ui-surface)",
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--ui-sky-border)",
                }}
              >
                <Link2 size={14} style={{ color: "var(--hb-accent-text)", flexShrink: 0 }} />
                <input
                  type="text"
                  readOnly
                  value={buildDemoInviteUrl(createdInvitation)}
                  aria-label="Enlace local de invitación demo"
                  onFocus={(e) => e.currentTarget.select()}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: "var(--ui-text-2)",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(createdInvitation)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      copiedId === createdInvitation.id
                        ? STATUS_META.approved.color
                        : "var(--hb-accent)",
                    color: "var(--on-accent)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  {copiedId === createdInvitation.id ? (
                    <>
                      <Check size={12} />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copiar enlace demo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            id="invite-team-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {errorMsg && (
              <div
                role="alert"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: STATUS_META.changes.bg,
                  border: `1px solid ${STATUS_META.changes.color}`,
                  color: STATUS_META.changes.color,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="invite-email"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--ui-text-3)",
                    marginBottom: 5,
                  }}
                >
                  Correo electrónico *
                </label>
                <input
                  ref={emailInputRef}
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="ej. camila@hubly.agency"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13,
                    color: "var(--ui-text)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="invite-name"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--ui-text-3)",
                    marginBottom: 5,
                  }}
                >
                  Nombre (opcional)
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Camila Ortega"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13,
                    color: "var(--ui-text)",
                  }}
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label
                htmlFor="invite-role"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--ui-text-3)",
                  marginBottom: 5,
                }}
              >
                <Shield size={12} />
                <span>Rol en el workspace</span>
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid var(--ui-border-strong)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ui-text)",
                  background: "var(--ui-surface)",
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Assignment Checklist */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--ui-text-3)",
                  }}
                >
                  Marcas asignadas ({selectedBrandIds.length} de {brands.length}
                  ) *
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAllBrands}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--hb-accent-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {selectedBrandIds.length === brands.length
                    ? "Deseleccionar todas"
                    : "Seleccionar todas"}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: 8,
                }}
              >
                {brands.map((b) => {
                  const checked = selectedBrandIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBrandSelection(b.id)}
                      aria-pressed={checked}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: checked
                          ? "1px solid var(--hb-accent)"
                          : "1px solid var(--ui-border)",
                        background: checked ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: b.color,
                            color: "var(--on-accent)",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {b.initials}
                        </span>
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "var(--ui-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.name}
                        </span>
                      </span>

                      <span
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: 5,
                          border: checked
                            ? "none"
                            : "1.5px solid var(--ui-border-strong)",
                          background: checked ? "var(--hb-accent)" : "var(--ui-surface)",
                          color: "var(--on-accent)",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {checked && <Check size={11} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Pending Invitations List */}
          {pendingInvitations.length > 0 && (
            <div
              style={{
                borderTop: "1px solid var(--ui-muted)",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--ui-text-4)",
                }}
              >
                Invitaciones locales pendientes ({pendingInvitations.length})
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--ui-surface-2)",
                      border: "1px solid var(--ui-border)",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--ui-text)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>{inv.name}</span>
                        <span style={{ color: "var(--ui-text-4)", fontWeight: 400 }}>
                          ({inv.email})
                        </span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: 9999,
                            background: "var(--ui-sky-soft)",
                            color: "var(--ui-sky-text)",
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ui-text-4)" }}>
                        {inv.role} · {inv.brandIds.length} marca(s)
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(inv)}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 7,
                          border: "1px solid var(--ui-border-strong)",
                          background: "var(--ui-surface)",
                          color: "var(--ui-text-2)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Copy size={11} />
                        <span>
                          {copiedId === inv.id ? "Copiado" : "Copiar link"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelTeamInvitation(inv.id)}
                        aria-label={`Revocar invitación de ${inv.email}`}
                        title="Revocar invitación"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: `1px solid ${STATUS_META.changes.color}`,
                          background: STATUS_META.changes.bg,
                          color: STATUS_META.changes.color,
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--ui-muted)",
            background: "var(--ui-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
            Se reflejará de inmediato en{" "}
            <strong style={{ color: "var(--ui-text-2)" }}>Dashboard · Equipo</strong>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid var(--ui-border-strong)",
                background: "var(--ui-surface)",
                color: "var(--ui-text-3)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>

            <button
              type="submit"
              form="invite-team-form"
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: "var(--hb-accent)",
                color: "var(--on-accent)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 6px rgb(var(--hb-accent-rgb) / 0.28)",
              }}
            >
              <UserPlus size={14} />
              <span>Generar invitación local</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InviteTeamModal;
