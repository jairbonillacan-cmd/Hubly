"use client";

import React, { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { backendEnabled } from "@/lib/supabase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HublyArrowRightIcon as ArrowRight,
  HublyBuildingIcon as Building2,
  HublyMailIcon as Mail,
  HublyPersonIcon as User,
} from "@/components/app/icons/DuotoneIcons";

export default function RegisterPage() {
  if (backendEnabled) return <AuthCard mode="register" />;
  return <DemoRegister />;
}

function DemoRegister() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("Estudio Bruma");
  const [name, setName] = useState("Jair Bonilla");
  const [email, setEmail] = useState("hola@estudiobruma.mx");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/onboarding");
  };

  return (
    <AuthShell>
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
          Configura tu estudio y empieza a mandarles parrillas a tus clientes.
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
            <span>Crear mi espacio</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link href="/login" className="auth-link">Entrar</Link>
        </p>
    </AuthShell>
  );
}
