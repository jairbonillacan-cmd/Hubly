"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { safeNextPath } from "@/lib/supabase/config";

type Mode = "login" | "register" | "recover" | "new-password";

const TITLES: Record<Mode, string> = {
  login: "Entra a tu agencia",
  register: "Crea tu cuenta",
  recover: "Recupera tu contraseña",
  "new-password": "Elige una contraseña nueva",
};
const SUBMIT: Record<Mode, string> = {
  login: "Entrar",
  register: "Crear cuenta",
  recover: "Enviar enlace",
  "new-password": "Guardar contraseña",
};

export function AuthCard({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextPath = () => safeNextPath(new URLSearchParams(window.location.search).get("next"));
  const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createSupabaseBrowser();
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error("Correo o contraseña incorrectos, o correo sin confirmar.");
        window.location.assign(nextPath());
      } else if (mode === "register") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() }, emailRedirectTo: callback("/onboarding") },
        });
        if (err) throw new Error("No se pudo crear la cuenta. Revisa el correo y usa una contraseña más larga.");
        if (data.session) window.location.assign("/onboarding");
        else setNotice("Te enviamos un correo para confirmar tu cuenta.");
      } else if (mode === "recover") {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback("/nueva-clave") });
        setNotice("Si ese correo tiene cuenta, recibirás un enlace para cambiar la contraseña.");
      } else {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw new Error("No se pudo cambiar. El enlace pudo caducar o la contraseña es muy corta.");
        window.location.assign("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const { error: err } = await createSupabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback(mode === "register" ? "/onboarding" : nextPath()) },
    });
    if (err) setError("Google no está disponible en este momento.");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F5F6FB", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24, color: "#0F172A" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/hubly-logo.webp" alt="Hubly" width={110} height={33} style={{ height: "auto", marginBottom: 16 }} />
        <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 16px" }}>{TITLES[mode]}</h1>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          {mode === "register" && (
            <label style={lab}>Tu nombre<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} style={field} /></label>
          )}
          {mode !== "new-password" && (
            <label style={lab}>Correo<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} /></label>
          )}
          {mode !== "recover" && (
            <label style={lab}>
              Contraseña
              <input
                type="password"
                required
                minLength={mode === "login" ? undefined : 8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={field}
              />
            </label>
          )}
          {error && <p role="alert" style={{ color: "#B91C1C", fontSize: 13, margin: 0 }}>{error}</p>}
          {notice && <p role="status" style={{ color: "#15803D", fontSize: 13, margin: 0 }}>{notice}</p>}
          <button type="submit" disabled={busy} style={primary}>{busy ? "Un momento…" : SUBMIT[mode]}</button>
        </form>
        {(mode === "login" || mode === "register") && (
          <button type="button" onClick={google} style={secondary}>Continuar con Google</button>
        )}
        <p style={{ fontSize: 13, color: "#475569", margin: "14px 0 0", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          {mode === "login" && (
            <>
              <Link href="/register">Crear cuenta</Link>
              <Link href="/recuperar">Olvidé mi contraseña</Link>
            </>
          )}
          {mode === "register" && <Link href="/login">Ya tengo cuenta</Link>}
          {mode === "recover" && <Link href="/login">Volver a entrar</Link>}
        </p>
      </div>
    </main>
  );
}

const field = { width: "100%", border: "1px solid #CBD5E1", borderRadius: 9, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: "#FFFFFF", color: "#0F172A" } as const;
const lab = { display: "grid", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#475569" } as const;
const primary = { border: 0, borderRadius: 9, background: "#6C77C1", color: "#FFFFFF", padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" } as const;
const secondary = { width: "100%", marginTop: 10, border: "1px solid #CBD5E1", borderRadius: 9, background: "#FFFFFF", color: "#334155", padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" } as const;
