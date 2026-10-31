"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  HublyBuildingIcon as Building2,
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyMinusIcon as Minus,
  HublyPlusIcon as Plus,
  HublySparkIcon as Sparkles,
} from "@/components/app/icons/DuotoneIcons";

export interface NewBrandModalProps {
  open?: boolean;
  onClose?: () => void;
  onCreated?: (brandId: string) => void;
}

const COLOR_SWATCHES = [
  "#16324F",
  "#C87A51",
  "#2E5E4E",
  "#5B50D6",
  "#B88D40",
  "#E11D48",
  "#0EA5E9",
  "#10B981",
  "#7C3AED",
  "#0F172A",
];

const INDUSTRY_PRESETS = [
  "Cafetería & Panadería",
  "Hospitalidad & Diseño",
  "Clínica Dermatológica",
  "Restaurante & Gastronomía",
  "E-commerce & Moda",
  "Inmobiliaria & Arquitectura",
  "Tecnología / SaaS",
];

function computeDefaultInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function NewBrandModal({
  open: openProp,
  onClose: onCloseProp,
  onCreated,
}: NewBrandModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const newBrandModalOpen = useHublyStore((s) => s.newBrandModalOpen);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const addBrand = useHublyStore((s) => s.addBrand);
  const updateBrandCore = useHublyStore((s) => s.updateBrandCore);
  const updateBrandCommitments = useHublyStore(
    (s) => s.updateBrandCommitments
  );
  const brands = useHublyStore((s) => s.brands);

  const isOpen = openProp !== undefined ? openProp : newBrandModalOpen;

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [initials, setInitials] = useState("");
  const [initialsTouched, setInitialsTouched] = useState(false);
  const [industry, setIndustry] = useState("Hospitalidad & Diseño");
  const [city, setCity] = useState("Ciudad de México");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [monthlyBudget, setMonthlyBudget] = useState(25000);
  const [toneOfVoice, setToneOfVoice] = useState(
    "Cercano, editorial y enfocado en conversión."
  );

  // Initial monthly commitments
  const [postsCommitted, setPostsCommitted] = useState(12);
  const [storiesCommitted, setStoriesCommitted] = useState(20);
  const [reelsCommitted, setReelsCommitted] = useState(6);
  const [adCampaignsCommitted, setAdCampaignsCommitted] = useState(2);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMsg(null);
    if (onCloseProp) {
      onCloseProp();
    } else {
      setNewBrandModalOpen(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setHandle("");
    setHandleTouched(false);
    setInitials("");
    setInitialsTouched(false);
    setIndustry("Hospitalidad & Diseño");
    setCity("Ciudad de México");
    setColor(COLOR_SWATCHES[brands.length % COLOR_SWATCHES.length]);
    setMonthlyBudget(25000);
    setToneOfVoice("Cercano, editorial y enfocado en conversión.");
    setPostsCommitted(12);
    setStoriesCommitted(20);
    setReelsCommitted(6);
    setAdCampaignsCommitted(2);
    setErrorMsg(null);
  }, [isOpen, brands.length]);

  // Focus trap, Escape key, Initial focus & Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      } else {
        const focusables = getFocusableElements(dialogRef.current);
        focusables[0]?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === "Tab") {
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
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown, true);
      const remainingDialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (remainingDialogs.length <= 1) {
        document.body.style.overflow = prevOverflow || "";
      }
      const prevEl = previousActiveElementRef.current;
      if (prevEl && document.body.contains(prevEl)) {
        window.requestAnimationFrame(() => {
          prevEl.focus();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const presence = useModalPresence(isOpen);
  if (!presence.mounted) return null;

  const effectiveInitials = (
    initialsTouched && initials.trim()
      ? initials.trim().slice(0, 2)
      : computeDefaultInitials(name)
  ).toUpperCase();

  const effectiveHandle =
    handleTouched && handle.trim()
      ? handle.trim().startsWith("@")
        ? handle.trim()
        : `@${handle.trim()}`
      : name.trim()
      ? `@${name
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "")}`
      : "@mimarca";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanIndustry = industry.trim();

    if (!cleanName) {
      setErrorMsg("Ingresa el nombre de la marca o cliente.");
      nameInputRef.current?.focus();
      return;
    }

    const duplicate = brands.some(
      (b) => b.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`Ya existe una marca llamada "${cleanName}" en tu workspace.`);
      nameInputRef.current?.focus();
      return;
    }

    if (!cleanIndustry) {
      setErrorMsg("Indica la industria o categoría de la marca.");
      return;
    }

    addBrand({
      name: cleanName,
      initials: effectiveInitials,
      initial: effectiveInitials.charAt(0) || "H",
      handle: effectiveHandle,
      industry: cleanIndustry,
      city: city.trim() || "Ciudad de México",
      color,
      monthlyPostTarget: Math.max(1, postsCommitted),
      monthlyBudget: Number(monthlyBudget) || 20000,
      adBudget: Number(monthlyBudget) || 20000,
      hasPaidAds: Number(monthlyBudget) > 0,
      whatTheySell: cleanIndustry,
    });

    const newBrandId = useHublyStore.getState().activeBrandId;

    if (newBrandId) {
      updateBrandCore(newBrandId, {
        toneOfVoice:
          toneOfVoice.trim() || "Profesional, claro y orientado a resultados.",
      });

      updateBrandCommitments(newBrandId, {
        hasDeclaredCommitments: true,
        postsCommitted: Math.max(0, postsCommitted),
        StoriesCommitted: Math.max(0, storiesCommitted),
        storiesCommitted: Math.max(0, storiesCommitted),
        reelsCommitted: Math.max(0, reelsCommitted),
        adCampaignsCommitted: Math.max(0, adCampaignsCommitted),
      });

      onCreated?.(newBrandId);
    }

    handleClose();
  };

  return (
    <div
      className="hubly-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        className="hubly-sheet"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "92vh",
          background: "var(--ui-surface)",
          borderRadius: 20,
          border: "1px solid var(--ui-border)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
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
                background: color,
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 13,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {effectiveInitials}
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
                Nueva marca / Cuenta de cliente
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "var(--ui-text-4)",
                }}
              >
                Configura identidad, industria y compromisos mensuales iniciales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal de nueva marca"
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: "20px 22px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {errorMsg && (
              <div
                role="alert"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Nombre + Handle + Iniciales */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 86px",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="new-brand-name"
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
                  Nombre de la marca *
                </label>
                <input
                  ref={nameInputRef}
                  id="new-brand-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ej. Casa Botánica"
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13.5,
                    color: "var(--ui-text)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="new-brand-handle"
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
                  Handle / Usuario
                </label>
                <input
                  id="new-brand-handle"
                  type="text"
                  value={handleTouched ? handle : effectiveHandle}
                  onChange={(e) => {
                    setHandleTouched(true);
                    setHandle(e.target.value);
                  }}
                  placeholder="@casabotanica"
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
                  htmlFor="new-brand-initials"
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
                  Iniciales
                </label>
                <input
                  id="new-brand-initials"
                  type="text"
                  maxLength={2}
                  value={initialsTouched ? initials : effectiveInitials}
                  onChange={(e) => {
                    setInitialsTouched(true);
                    setInitials(e.target.value.toUpperCase());
                  }}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "center",
                    color: "var(--ui-text)",
                  }}
                />
              </div>
            </div>

            {/* Industria / Categoría + Ciudad */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="new-brand-industry"
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
                  Industria / Categoría *
                </label>
                <input
                  id="new-brand-industry"
                  type="text"
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ej. Hospitalidad & Diseño"
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
                  htmlFor="new-brand-city"
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
                  Ciudad / Mercado
                </label>
                <input
                  id="new-brand-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad de México"
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

            {/* Quick Industry Presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {INDUSTRY_PRESETS.map((preset) => {
                const active = industry === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setIndustry(preset)}
                    aria-pressed={active}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 9999,
                      border: active
                        ? "1px solid #BFE2F4"
                        : "1px solid #E2E8F0",
                      background: active ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                      color: active ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Color Picker */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--ui-text-3)",
                  marginBottom: 7,
                }}
              >
                Color distintivo de marca
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {COLOR_SWATCHES.map((swatch) => {
                  const active = color === swatch;
                  return (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setColor(swatch)}
                      aria-pressed={active}
                      aria-label={`Seleccionar color ${swatch}`}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: swatch,
                        border: active
                          ? "2px solid #0F172A"
                          : "2px solid #FFFFFF",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.16)",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        padding: 0,
                      }}
                    >
                      {active && <Check size={13} color="#FFFFFF" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compromisos Mensuales Iniciales */}
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--ui-text-2)",
                  }}
                >
                  Compromisos mensuales iniciales
                </span>
                <span style={{ fontSize: 11, color: "var(--ui-text-4)" }}>
                  Impacta en Salud de Cuentas
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Posts / mes",
                    value: postsCommitted,
                    setter: setPostsCommitted,
                  },
                  {
                    label: "Stories / mes",
                    value: storiesCommitted,
                    setter: setStoriesCommitted,
                  },
                  {
                    label: "Reels / mes",
                    value: reelsCommitted,
                    setter: setReelsCommitted,
                  },
                  {
                    label: "Campañas Ads",
                    value: adCampaignsCommitted,
                    setter: setAdCampaignsCommitted,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "var(--ui-surface)",
                      borderRadius: 10,
                      border: "1px solid var(--ui-border)",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--ui-text-4)",
                      }}
                    >
                      {item.label}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          item.setter((v) => Math.max(0, v - 1))
                        }
                        aria-label={`Disminuir ${item.label}`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: "1px solid var(--ui-border)",
                          background: "var(--ui-surface-2)",
                          color: "var(--ui-text-3)",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--ui-text)",
                        }}
                      >
                        {item.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => item.setter((v) => v + 1)}
                        aria-label={`Aumentar ${item.label}`}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: "1px solid var(--ui-border)",
                          background: "var(--ui-surface-2)",
                          color: "var(--ui-text-3)",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Presupuesto mensual + Tono de voz */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="new-brand-budget"
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
                  Presupuesto Ads (MXN)
                </label>
                <input
                  id="new-brand-budget"
                  type="number"
                  min={0}
                  step={1000}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13,
                    color: "var(--ui-text)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="new-brand-tone"
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
                  Tono de voz (Núcleo de Marca)
                </label>
                <input
                  id="new-brand-tone"
                  type="text"
                  value={toneOfVoice}
                  onChange={(e) => setToneOfVoice(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    fontSize: 13,
                    color: "var(--ui-text)",
                  }}
                />
              </div>
            </div>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--ui-text-4)",
              }}
            >
              <Sparkles size={13} style={{ color: "var(--hb-accent-text)" }} />
              <span>
                Crea automáticamente su libro de marca y enlace compartido
              </span>
            </div>

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
                Cancelar
              </button>

              <button
                type="submit"
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgb(var(--hb-accent-rgb) / 0.28)",
                }}
              >
                <Building2 size={14} />
                <span>Crear marca</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewBrandModal;
