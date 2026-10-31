"use client";

import { useState } from "react";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useHublyStore } from "@/lib/store";
import { HublyLockIcon } from "@/components/app/icons/DuotoneIcons";

/** Solo existe con cuentas reales: en modo demo no hay contraseña que cambiar. Se cambia por correo, igual que al recuperar acceso. */
export function ChangePassword() {
  const email = useHublyStore((s) => s.profile?.email);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!backendEnabled) return <p className="hubly-ajustes-hint">Disponible al iniciar sesión con una cuenta real.</p>;

  const send = async () => {
    if (!email) return;
    setBusy(true);
    setMessage(null);
    const { error } = await createSupabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/nueva-clave")}`,
    });
    setBusy(false);
    if (error) return setMessage({ ok: false, text: "No pudimos enviar el correo. Inténtalo otra vez." });
    setOpen(false);
    setMessage({ ok: true, text: "Te enviamos un correo para cambiar tu contraseña." });
  };

  return (
    <div className="hubly-ajustes-inline">
      {open ? (
        <>
          <button type="button" className="hbtn hbtn-primary" disabled={busy} onClick={() => void send()}>
            {busy ? "Enviando…" : "Enviar correo de restablecimiento"}
          </button>
          <button type="button" className="hbtn hbtn-ghost" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button>
        </>
      ) : (
        <button type="button" className="hbtn hbtn-secondary" onClick={() => { setMessage(null); setOpen(true); }}>
          <HublyLockIcon size={17} /> Cambiar contraseña
        </button>
      )}
      {message && <p role={message.ok ? "status" : "alert"} className="hubly-ajustes-hint">{message.text}</p>}
    </div>
  );
}
