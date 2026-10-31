"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, Lock, Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { backendEnabled } from "@/lib/supabase/config";

export default function LoginPage() {
  if (backendEnabled) return <AuthCard mode="login" />;
  return <DemoLogin />;
}

function DemoLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("jair@estudiobruma.mx");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 250);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        background: "var(--cream)",
      }}
    >
      {/* Left Column: Form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px clamp(28px, 6vw, 72px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "var(--forest)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              h
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "-0.02em",
              }}
            >
              hubly
            </span>
          </Link>

          <Link href="/register" className="saas-btn saas-btn-sm">
            Crear cuenta gratis
          </Link>
        </div>

        <div style={{ maxWidth: 420, width: "100%", margin: "48px auto" }}>
          <span className="saas-badge saas-badge-forest" style={{ marginBottom: 14 }}>
            Acceso al Workspace de Agencia
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.2vw, 38px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 10px",
            }}
          >
            Bienvenido de vuelta a{" "}
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>
              tu estudio
            </span>
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: 14.5, margin: "0 0 28px" }}>
            Gestiona todas tus marcas, parrillas, aprobaciones sin login y reportes de un clic desde un mismo lugar.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "var(--ink-2)",
                }}
              >
                Correo de tu agencia
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-muted)",
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>
                  Contraseña
                </label>
                <span style={{ fontSize: 12, color: "var(--forest)", fontWeight: 600 }}>
                  Modo Demo Activo
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-muted)",
                  }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="saas-btn saas-btn-primary"
              style={{ width: "100%", padding: "12px 18px", fontSize: 14.5, marginTop: 6 }}
            >
              <span>{loading ? "Abriendo workspace..." : "Entrar al Dashboard"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              padding: 14,
              borderRadius: 12,
              background: "var(--cream-2)",
              border: "1px solid var(--line)",
              fontSize: 12.5,
              color: "var(--ink-2)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} style={{ color: "var(--forest)" }} />
              Acceso directo de demostración
            </div>
            Incluye 3 marcas precargadas (<strong>Café Bruma</strong>, <strong>Min</strong> y{" "}
            <strong>Clínica Norte</strong>) con persistencia local automática sin necesidad de base de datos externa.
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
          © 2026 Hubly · Diseñado para agencias y community managers en LATAM y España.
        </div>
      </div>

      {/* Right Column: Editorial Showcase */}
      <div
        style={{
          background: "#0F241C",
          color: "#fff",
          padding: "56px clamp(32px, 5vw, 64px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.1)",
              color: "#6ee7b7",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <Sparkles size={13} />
            Hubly · Todas tus marcas en un solo lugar
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: "0 0 18px",
            }}
          >
            Deja de perseguir aprobaciones por WhatsApp y hojas de cálculo.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Cada marca tiene su propio Núcleo de Marca con IA, parrilla mensual con vista previa de feed, link público de aprobación para tu cliente y reportes ejecutivos en un clic.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Aprobación del cliente con 1 link público (sin pedirle usuario ni contraseña)",
              "Núcleo de Marca y Buyer Personas conectados a Hubly AI",
              "Tablero unificado de Meta Ads, Google Ads y TikTok Ads con Click Score",
              "Persistencia instantánea Zero-Config lista para operar",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <CheckCircle2 size={16} style={{ color: "#6ee7b7", flexShrink: 0 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
