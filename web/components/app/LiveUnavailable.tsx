"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";

/** Pantallas con cifras de ejemplo: con cuentas reales no deben mostrarse como si fueran datos. */
export function LiveUnavailable({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ maxWidth: 560, margin: "48px auto", padding: 28, textAlign: "center", background: "var(--ui-surface)", border: "1px solid var(--ui-border)", borderRadius: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ui-text)", margin: "0 0 8px" }}>{title}</h1>
      <p style={{ fontSize: 14, color: "var(--ui-text-3)", margin: 0 }}>{text}</p>
    </div>
  );
}

/** Con cuentas reales las invitaciones se gestionan en Ajustes > Equipo. */
export function LiveInviteRedirect({ open }: { open?: boolean }) {
  const router = useRouter();
  const storeOpen = useHublyStore((s) => s.inviteModalOpen);
  const setOpen = useHublyStore((s) => s.setInviteModalOpen);
  const isOpen = open ?? storeOpen;
  useEffect(() => {
    if (!isOpen) return;
    setOpen(false);
    router.push("/ajustes?tab=equipo");
  }, [isOpen, setOpen, router]);
  return null;
}
