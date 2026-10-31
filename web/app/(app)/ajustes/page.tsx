"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessPanel } from "@/components/app/AccessPanel";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useHublyStore } from "@/lib/store";
import { useHublyTheme } from "@/lib/theme";
import {
  HublyBellIcon as Bell,
  HublyBuildingIcon as Building2,
  HublyCameraIcon as Camera,
  HublyCardIcon as CreditCard,
  HublyChartIcon as BarChart2,
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyGiftIcon as Gift,
  HublyLayersIcon as Puzzle,
  HublyLockIcon as Lock,
  HublyLogOutIcon as LogOut,
  HublyMailIcon as Mail,
  HublyPencilIcon as Pencil,
  HublyPeopleIcon as Users,
  HublyPersonIcon as User,
  HublyPersonIcon as UserCheck,
  HublyRefreshIcon as RotateCcw,
  HublyShieldIcon as Shield,
} from "@/components/app/icons/DuotoneIcons";

type SettingsTabId =
  | "mi-perfil"
  | "mi-cuenta"
  | "notificaciones"
  | "integraciones"
  | "equipo"
  | "roles"
  | "marcas"
  | "suscripcion"
  | "uso"
  | "recomienda";

export default function AjustesPage() {
  const router = useRouter();
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const team = useHublyStore((s) => s.team);
  const profile = useHublyStore((s) => s.profile);
  const updateProfile = useHublyStore((s) => s.updateProfile);
  const resetDemoData = useHublyStore((s) => s.resetDemoData);

  const activeBrand =
    brands.find((b) => b.id === activeBrandId) ||
    brands.find((b) => b.id === "brand-min") ||
    brands[0];

  const [activeTab, setActiveTab] = useState<SettingsTabId>("mi-perfil");
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "equipo") setActiveTab("equipo");
  }, []);
  useEffect(() => {
    if (profile?.name) setFullName(profile.name);
  }, [profile?.name]);
  const [fullName, setFullName] = useState(profile?.name || "");
  const [savedProfile, setSavedProfile] = useState(false);
  const { theme, setTheme } = useHublyTheme();
  const themeMode = theme === "dark" ? "oscuro" : "claro";
  const setThemeMode = (mode: "claro" | "oscuro") => setTheme(mode === "oscuro" ? "dark" : "light");
  const [brandNameInput, setBrandNameInput] = useState(
    activeBrand?.name || ""
  );
  const [brandCategory, setBrandCategory] = useState(
    "minerales y cristales decorativos al mayoreo"
  );
  const [timezone, setTimezone] = useState(profile?.timezone || "America/Mexico_City");
  const [currency, setCurrency] = useState("USD ($)");
  const [resetDone, setResetDone] = useState(false);
  const [descubreOpen, setDescubreOpen] = useState(true);

  const tabs: { id: SettingsTabId; label: string; icon: React.ReactNode }[] = [
    { id: "mi-perfil", label: "Mi Perfil", icon: <User size={15} /> },
    { id: "mi-cuenta", label: "Mi Cuenta", icon: <Shield size={15} /> },
    { id: "notificaciones", label: "Notificaciones", icon: <Bell size={15} /> },
    { id: "integraciones", label: "Integraciones", icon: <Puzzle size={15} /> },
    { id: "equipo", label: "Equipo", icon: <Users size={15} /> },
    { id: "roles", label: "Roles", icon: <UserCheck size={15} /> },
    { id: "marcas", label: "Marcas", icon: <Building2 size={15} /> },
    { id: "suscripcion", label: "Suscripción", icon: <CreditCard size={15} /> },
    { id: "uso", label: "Uso", icon: <BarChart2 size={15} /> },
    { id: "recomienda", label: "Recomienda Hubly", icon: <Gift size={15} /> },
  ];

  const handleSaveProfile = () => {
    if (fullName.trim()) {
      updateProfile({
        name: fullName.trim(),
        timezone: timezone.split(" ")[0] || "America/Mexico_City",
      });
    }
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  return (
    <div
      style={{
        color: "var(--ui-text)",
        minHeight: "calc(100vh - 64px)",
        position: "relative",
        paddingBottom: 60,
      }}
    >
      {/* Page Title matching 13-settings-1440.png */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--ui-text)",
            letterSpacing: "-0.02em",
            margin: "0 0 4px",
          }}
        >
          Configuración
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ui-text-5)", margin: 0 }}>
          Gestiona tu perfil, equipo y configuración de la agencia
        </p>
      </div>

      {/* Main 2-Column Layout matching 13-settings-1440.png */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "196px minmax(0, 1fr)",
          gap: 28,
          alignItems: "start",
        }}
      >
        {/* Left 10-Tab Sidebar */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: isActive ? "1px solid rgb(var(--hb-accent-rgb) / 0.2)" : "1px solid transparent",
                    background: isActive ? "rgb(var(--hb-accent-rgb) / 0.1)" : "transparent",
                    color: isActive ? "var(--ui-accent-text-2)" : "var(--ui-text-3)",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ color: isActive ? "var(--ui-accent-text-2)" : "var(--ui-text-4)", display: "grid" }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              height: 1,
              background: "var(--ui-muted)",
              margin: "12px 0",
            }}
          />

          <button
            type="button"
            onClick={async () => {
              if (backendEnabled) {
                await createSupabaseBrowser().auth.signOut();
                window.location.assign("/");
                return;
              }
              router.push("/");
            }}
            style={{
              width: "100%",
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Right Form Card */}
        <div>
          {/* TAB 1: MI PERFIL (1:1 with 13-settings-1440.png) */}
          {activeTab === "mi-perfil" && (
            <div
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 20,
                padding: "28px 32px",
              }}
            >
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                  margin: "0 0 4px",
                }}
              >
                Mi Perfil
              </h2>
              <p style={{ fontSize: 13, color: "var(--ui-text-5)", margin: "0 0 24px" }}>
                Tu información personal en la plataforma
              </p>

              {/* Avatar & Identity Block */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  paddingBottom: 24,
                  borderBottom: "1px solid var(--ui-muted)",
                }}
              >
                <button
                  disabled
                  data-planned
                  type="button"
                  title="Agregar foto de perfil"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    border: "none",
                    background: "var(--hb-accent)",
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  JA
                </button>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                    {fullName}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ui-text-5)", margin: "2px 0 6px" }}>
                    {profile?.email}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "var(--ui-muted)",
                        color: "var(--ui-text-3)",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 10px",
                        borderRadius: 999,
                      }}
                    >
                      Miembro
                    </span>
                  </div>
                  <button
                    disabled
                    data-planned
                    title="Función prevista"
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      color: "var(--hb-accent-text)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Camera size={13} />
                    <span>Cambiar foto</span>
                  </button>
                </div>
              </div>

              {/* NOMBRE COMPLETO */}
              <div style={{ marginTop: 22 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-text-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  NOMBRE COMPLETO
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      border: "1px solid var(--ui-border)",
                      background: "var(--ui-surface-2)",
                      padding: "0 14px",
                      fontSize: 13.5,
                      color: "var(--ui-text)",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    style={{
                      height: 40,
                      padding: "0 18px",
                      borderRadius: 10,
                      border: "none",
                      background: savedProfile ? "#047857" : "var(--hb-accent)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    {savedProfile ? <Check size={13} /> : <Pencil size={13} />}
                    <span>{savedProfile ? "Guardado" : "Guardar"}</span>
                  </button>
                </div>
              </div>

              {/* CORREO ELECTRÓNICO */}
              <div style={{ marginTop: 22 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-text-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  CORREO ELECTRÓNICO
                </label>
                <div
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13.5,
                    color: "var(--ui-text-4)",
                  }}
                >
                  <Mail size={15} style={{ color: "var(--ui-text-5)" }} />
                  <span>{profile?.email}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ui-text-5)", marginTop: 6 }}>
                  El correo no se puede cambiar desde aquí
                </div>
              </div>

              {/* CONTRASEÑA */}
              <div
                style={{
                  marginTop: 22,
                  paddingBottom: 24,
                  borderBottom: "1px solid var(--ui-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-text-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  CONTRASEÑA
                </span>
                <button
                  disabled
                  data-planned
                  title="Función prevista"
                  type="button"
                  style={{
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    color: "var(--ui-text-2)",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <Lock size={14} style={{ color: "var(--ui-text-4)" }} />
                  <span>Cambiar contraseña</span>
                </button>
              </div>

              {/* Apariencia */}
              <div style={{ marginTop: 22 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ui-text)",
                    margin: "0 0 2px",
                  }}
                >
                  Apariencia
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--ui-text-5)", margin: "0 0 12px" }}>
                  Elige el tema que más te acomode
                </p>

                <div
                  style={{
                    display: "inline-flex",
                    background: "var(--ui-muted)",
                    padding: 4,
                    borderRadius: 12,
                    gap: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setThemeMode("claro")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 9,
                      border: "none",
                      background: themeMode === "claro" ? "var(--ui-surface)" : "transparent",
                      color: themeMode === "claro" ? "var(--ui-text)" : "var(--ui-text-4)",
                      fontSize: 13,
                      fontWeight: themeMode === "claro" ? 700 : 500,
                      cursor: "pointer",
                      boxShadow:
                        themeMode === "claro" ? "0 1px 2px rgba(0, 0, 0, 0.06)" : "none",
                    }}
                  >
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("oscuro")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 9,
                      border: "none",
                      background: themeMode === "oscuro" ? "var(--ui-surface)" : "transparent",
                      color: themeMode === "oscuro" ? "var(--ui-text)" : "var(--ui-text-4)",
                      fontSize: 13,
                      fontWeight: themeMode === "oscuro" ? 700 : 500,
                      cursor: "pointer",
                      boxShadow:
                        themeMode === "oscuro" ? "0 1px 2px rgba(0, 0, 0, 0.06)" : "none",
                    }}
                  >
                    Oscuro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MARCAS (And also rendered below fold when in mi-perfil for full DOM coverage) */}
          {activeTab === "marcas" && (
            <div
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 20,
                padding: "28px 32px",
                marginTop: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 4px" }}>
                    Marca activa · {brandNameInput}
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--ui-text-5)", margin: 0 }}>
                    Configuración general de la marca, logo, categoría, zona horaria y moneda
                  </p>
                </div>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--hb-accent)",
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: 800,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  M
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--ui-text-3)",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Nombre de la marca
                  </label>
                  <input
                    value={brandNameInput}
                    onChange={(e) => setBrandNameInput(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 10,
                      border: "1px solid var(--ui-border)",
                      background: "var(--ui-surface-2)",
                      padding: "0 12px",
                      fontSize: 13.5,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--ui-text-3)",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Categoría
                  </label>
                  <input
                    value={brandCategory}
                    onChange={(e) => setBrandCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 10,
                      border: "1px solid var(--ui-border)",
                      background: "var(--ui-surface-2)",
                      padding: "0 12px",
                      fontSize: 13.5,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--ui-text-3)",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Zona horaria
                  </label>
                  <input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 10,
                      border: "1px solid var(--ui-border)",
                      background: "var(--ui-surface-2)",
                      padding: "0 12px",
                      fontSize: 13.5,
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--ui-text-3)",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Moneda
                  </label>
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 10,
                      border: "1px solid var(--ui-border)",
                      background: "var(--ui-surface-2)",
                      padding: "0 12px",
                      fontSize: 13.5,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  paddingTop: 16,
                  borderTop: "1px solid var(--ui-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 12.5, color: "var(--ui-text-4)" }}>
                  Persistencia local Zero-Config activa (<code>.data/hubly-db.json</code>)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetDemoData();
                    setResetDone(true);
                    setTimeout(() => setResetDone(false), 2200);
                  }}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    color: "var(--ui-text-2)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  {resetDone ? <Check size={14} /> : <RotateCcw size={14} />}
                  <span>
                    {resetDone ? "¡Datos restaurados!" : "Restaurar datos de demostración"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* OTHER TABS */}
          {activeTab !== "mi-perfil" && activeTab !== "marcas" && (
            <div
              style={{
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 20,
                padding: "28px 32px",
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 6px" }}>
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p style={{ fontSize: 13.5, color: "var(--ui-text-4)", marginBottom: 20 }}>
                Configura las preferencias de{" "}
                {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} para tu agencia y el
                workspace de {brandNameInput}.
              </p>

              {activeTab === "equipo" && backendEnabled && <AccessPanel />}
              {activeTab === "equipo" && !backendEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {team.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: 12,
                        border: "1px solid var(--ui-border)",
                        background: "var(--ui-surface-2)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
                          {m.role} · {m.email}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "var(--ui-accent-soft)",
                          color: "var(--hb-accent-text)",
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        Activo
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab !== "equipo" && (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    background: "var(--ui-surface-2)",
                    border: "1px solid var(--ui-border)",
                    fontSize: 13.5,
                    color: "var(--ui-text-2)",
                  }}
                >
                  Plan Agencia Pro activo · Usuarios ilimitados, Uso de IA incluido y sincronización
                  automática con Meta, TikTok, Instagram y LinkedIn.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
