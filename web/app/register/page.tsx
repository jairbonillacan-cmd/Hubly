"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Sparkles, User, Mail } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("Estudio Bruma");
  const [name, setName] = useState("Jair Bonilla");
  const [email, setEmail] = useState("hola@estudiobruma.mx");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
         placeItems: "center",
        padding: 24,
        background: "var(--cream)",
      }}
    >
      <div
        className="saas-card"
        style={{
          maxWidth: 500,
          width: "100%",
          padding: 36,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
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
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "var(--forest)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              h
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>
              hubly
            </span>
          </Link>

          <Link href="/login" className="saas-btn saas-btn-sm">
            Ya tengo cuenta
          </Link>
        </div>

        <span className="saas-badge saas-badge-forest" style={{ marginBottom: 12 }}>
          <Sparkles size={12} /> Prueba gratuita de 7 días
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            margin: "0 0 8px",
          }}
        >
          Crea el espacio de tu agencia
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, margin: "0 0 24px" }}>
          Configura tu estudio en 30 segundos y empieza a mandar parrillas aprobables a tus clientes.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
              Nombre de tu agencia o estudio
            </label>
            <div style={{ position: "relative" }}>
              <Building2
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
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="saas-input"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
              Tu nombre
            </label>
            <div style={{ position: "relative" }}>
              <User
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
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="saas-input"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
              Correo electrónico
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

          <button
            type="submit"
            className="saas-btn saas-btn-primary"
            style={{ width: "100%", padding: "12px 18px", fontSize: 14.5, marginTop: 8 }}
          >
            <span>Entrar al workspace ahora</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
