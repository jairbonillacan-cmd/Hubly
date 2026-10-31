"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { safeNextPath } from "@/lib/supabase/config";
import {
  HublyEyeIcon as Eye,
  HublyEyeOffIcon as EyeOff,
} from "@/components/app/icons/DuotoneIcons";

type Mode = "login" | "register" | "recover" | "new-password";

const TITLES: Record<Mode, string> = {
  login: "Entra a tu agencia",
  register: "Crea tu cuenta",
  recover: "Recupera tu contraseña",
  "new-password": "Elige una contraseña nueva",
};
const LEADS: Record<Mode, string> = {
  login: "Qué bueno verte de nuevo.",
  register: "Empieza con tu agencia y tus marcas.",
  recover: "Te mandamos un enlace para cambiarla.",
  "new-password": "Usa al menos 8 caracteres.",
};
const SUBMIT: Record<Mode, string> = {
  login: "Entrar",
  register: "Crear cuenta",
  recover: "Enviar enlace",
  "new-password": "Guardar contraseña",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 7.1-10.3 7.1-17.7Z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.1 2.3-6.3 0-11.6-4.2-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

export function AuthCard({ mode, demo = false }: { mode: Mode; demo?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nextPath = () => safeNextPath(new URLSearchParams(window.location.search).get("next"));
  const afterRegister = () => safeNextPath(new URLSearchParams(window.location.search).get("next"), "/onboarding");
  const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (demo) {
      router.push("/dashboard");
      return;
    }
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
          options: { data: { name: name.trim() }, emailRedirectTo: callback(afterRegister()) },
        });
        if (err) throw new Error("No se pudo crear la cuenta. Revisa el correo y usa una contraseña más larga.");
        if (data.session) window.location.assign(afterRegister());
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
      options: { redirectTo: callback(mode === "register" ? afterRegister() : nextPath()) },
    });
    if (err) setError("Google no está disponible en este momento.");
  };

  const withGoogle = !demo && (mode === "login" || mode === "register");

  return (
    <AuthShell>
      <h1>{demo ? "Entra a la demo" : TITLES[mode]}</h1>
      <p className="auth-lead">{demo ? "Recorre Hubly con datos de ejemplo." : LEADS[mode]}</p>
      {demo && <p className="auth-note">Modo demo: entra con cualquier correo y contraseña. No se crea ninguna cuenta.</p>}

      {withGoogle && (
        <>
          <button type="button" onClick={google} className="auth-google">
            <GoogleMark />
            Continuar con Google
          </button>
          <div className="auth-divider">o con tu correo</div>
        </>
      )}

      <form onSubmit={submit} className="auth-fields">
        {mode === "register" && (
          <label className="auth-field">
            <span className="auth-label">Tu nombre</span>
            <input className="auth-input" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        {mode !== "new-password" && (
          <label className="auth-field">
            <span className="auth-label">Correo</span>
            <input
              className="auth-input"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@agencia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        {mode !== "recover" && (
          <div className="auth-field">
            <div className="auth-field-head">
              <label className="auth-label" htmlFor="auth-password">Contraseña</label>
              {mode === "login" && !demo && (
                <Link href="/recuperar" className="auth-link auth-link--small">Olvidé mi contraseña</Link>
              )}
            </div>
            <div className="auth-input-wrap">
              <input
                id="auth-password"
                className="auth-input auth-input--toggle"
                type={showPassword ? "text" : "password"}
                required
                minLength={mode === "login" ? undefined : 8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="auth-error">{error}</p>}
        {notice && <p role="status" className="auth-notice">{notice}</p>}
        <button type="submit" disabled={busy} className="auth-submit">
          {busy ? "Un momento…" : demo ? "Entrar a la demo" : SUBMIT[mode]}
        </button>
      </form>

      {mode === "login" && (
        <p className="auth-switch">
          ¿Aún no tienes cuenta?{" "}
          <a
            className="auth-link"
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              window.location.assign(`/register${window.location.search}`);
            }}
          >
            Crear cuenta
          </a>
        </p>
      )}
      {mode === "register" && (
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link href="/login" className="auth-link">Entrar</Link>
        </p>
      )}
      {mode === "recover" && (
        <p className="auth-switch">
          <Link href="/login" className="auth-link">Volver a entrar</Link>
        </p>
      )}
    </AuthShell>
  );
}
