"use client";

import { useState } from "react";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

/** Solo existe con cuentas reales: en modo demo no hay contraseña que cambiar. */
export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!backendEnabled) return <span className="hubly-composer-hint">Disponible al iniciar sesión con una cuenta real.</span>;
  if (!open) {
    return (
      <>
        <button type="button" className="hubly-media-ghost" onClick={() => setOpen(true)}>Cambiar contraseña</button>
        {message && <span role="status" className="hubly-composer-hint">{message.text}</span>}
      </>
    );
  }
  return (
    <form
      className="hubly-composer-docform"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) return setMessage({ ok: false, text: "Usa al menos 8 caracteres." });
        if (password !== confirm) return setMessage({ ok: false, text: "Las contraseñas no coinciden." });
        setBusy(true);
        const { error } = await createSupabaseBrowser().auth.updateUser({ password });
        setBusy(false);
        if (error) return setMessage({ ok: false, text: "No se pudo cambiar. Vuelve a iniciar sesión e inténtalo de nuevo." });
        setPassword("");
        setConfirm("");
        setOpen(false);
        setMessage({ ok: true, text: "Contraseña actualizada." });
      }}
    >
      <input className="hubly-cal-input" type="password" autoComplete="new-password" aria-label="Nueva contraseña" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input className="hubly-cal-input" type="password" autoComplete="new-password" aria-label="Confirmar contraseña" placeholder="Confirmar" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <button type="submit" className="hubly-media-primary" disabled={busy}>Guardar</button>
      <button type="button" className="hubly-media-ghost" onClick={() => setOpen(false)}>Cancelar</button>
      {message && !message.ok && <span role="alert" className="hubly-composer-hint">{message.text}</span>}
    </form>
  );
}
