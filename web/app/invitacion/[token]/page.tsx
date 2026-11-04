"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { selectLiveAgency } from "@/lib/live-workspace";
import { ROLE_LABEL } from "@/lib/labels";

function InvitacionView() {
  const token = useParams<{ token: string }>()?.token || "";
  const [invite, setInvite] = useState<{ agency: string; email: string | null; role: string } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "mismatch">("loading");

  useEffect(() => {
    fetch(`/api/invitations/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setInvite(await res.json());
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const accept = async () => {
    const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { method: "POST" });
    if (res.ok) {
      const { agencyId } = (await res.json()) as { agencyId?: string };
      if (agencyId) selectLiveAgency(agencyId);
      window.location.assign("/dashboard");
      return;
    }
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    setState(error === "email_mismatch" ? "mismatch" : "invalid");
  };

  const next = encodeURIComponent(`/invitacion/${token}`);
  return (
    <main style={{ minHeight: "100vh", background: "#F1F9FD", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24, color: "#0F172A", display: "grid", gap: 12 }}>
        {state === "loading" && <p style={{ margin: 0 }}>Cargando invitación…</p>}
        {state === "invalid" && (
          <>
            <h1 style={title}>Esta invitación no es válida</h1>
            <p style={text}>Pudo caducar o ya se usó. Pide una nueva a tu agencia.</p>
          </>
        )}
        {state === "mismatch" && (
          <>
            <h1 style={title}>Es para otro correo</h1>
            <p style={text}>
              {invite?.email
                ? `Esta invitación es para ${invite.email}. Entra con ese correo, ya confirmado, para aceptarla.`
                : "Confirma tu correo para aceptar esta invitación."}
            </p>
            <Link href={`/login?next=${next}`}>Cambiar de cuenta</Link>
          </>
        )}
        {state === "ready" && invite && (
          <>
            <h1 style={title}>Te invitaron a {invite.agency}</h1>
            <p style={text}>
              {invite.email ? `Para ${invite.email}, con acceso` : "Con acceso"} de {ROLE_LABEL[invite.role] || invite.role}.
            </p>
            <button type="button" onClick={accept} style={{ border: 0, borderRadius: 9, background: "var(--hb-accent)", color: "#FFFFFF", padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Aceptar invitación
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const title = { fontSize: 20, fontWeight: 700, margin: 0 } as const;
const text = { fontSize: 14, color: "#475569", margin: 0 } as const;

export default function InvitacionPage() {
  return (
    <Suspense fallback={null}>
      <InvitacionView />
    </Suspense>
  );
}
