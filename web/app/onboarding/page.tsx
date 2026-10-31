"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { selectLiveAgency } from "@/lib/live-workspace";

const STEPS = ["Tu agencia", "Tu primera marca", "Tu equipo"];

export default function OnboardingPage() {
  const router = useRouter();
  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const updateAgency = useHublyStore((s) => s.updateAgency);
  const updateProfile = useHublyStore((s) => s.updateProfile);
  const addBrand = useHublyStore((s) => s.addBrand);
  const inviteTeamMember = useHublyStore((s) => s.inviteTeamMember);
  const toggleOnboardingStep = useHublyStore((s) => s.toggleOnboardingStep);

  const [step, setStep] = useState(0);
  const [agency, setAgency] = useState("");
  const [userName, setUserName] = useState("");
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [handle, setHandle] = useState("");
  const [invites, setInvites] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const finish = async (withInvites: boolean) => {
    const emails = withInvites ? invites.split(/[\s,;]+/).filter(Boolean) : [];
    const bad = emails.find((m) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m));
    if (bad) {
      setError(`«${bad}» no parece un correo válido.`);
      return;
    }
    if (backendEnabled) {
      const res = await fetch("/api/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agency.trim(), another: new URLSearchParams(window.location.search).has("nueva") }),
      });
      if (!res.ok) {
        setError("No se pudo crear la agencia. Inténtalo de nuevo.");
        return;
      }
      selectLiveAgency(((await res.json()) as { agencyId: string }).agencyId);
      await syncFromServer();
    }
    updateAgency({ name: agency.trim() });
    updateProfile({ name: userName.trim() });
    addBrand({
      name: brand.trim(),
      industry: industry.trim() || undefined,
      handle: handle.trim() ? `@${handle.trim().replace(/^@/, "")}` : undefined,
    });
    toggleOnboardingStep("brandCreatedOrSelected", true);
    if (!backendEnabled) {
      for (const email of emails) inviteTeamMember({ email, role: "Strategist" });
      if (emails.length) toggleOnboardingStep("teamCheckedOrInvited", true);
    }
    // En modo real se espera el guardado antes de salir de esta página.
    if (backendEnabled) {
      await new Promise((r) => setTimeout(r, 1200));
      window.location.assign("/dashboard");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F5F6FB", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/hubly-logo.webp" alt="Hubly" width={110} height={33} style={{ height: "auto", marginBottom: 16 }} />
        <ol aria-label="Pasos" style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, margin: "0 0 20px", padding: 0 }}>
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined} style={{ fontSize: 11.5, fontWeight: 600, color: i <= step ? "#5360A5" : "#64748B" }}>
              <span style={{ display: "block", height: 4, borderRadius: 999, background: i <= step ? "#6C77C1" : "#E2E8F0", marginBottom: 5 }} />
              {s}
            </li>
          ))}
        </ol>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (step < 2) setStep(step + 1);
            else void finish(true);
          }}
          style={{ display: "grid", gap: 12 }}
        >
          {step === 0 && (
            <>
              <h1 style={title}>Cuéntanos de tu agencia</h1>
              <label style={lab}>Nombre de la agencia<input key="a" required autoFocus value={agency} onChange={(e) => setAgency(e.target.value)} style={field} /></label>
              <label style={lab}>Tu nombre<input required value={userName} onChange={(e) => setUserName(e.target.value)} style={field} /></label>
            </>
          )}
          {step === 1 && (
            <>
              <h1 style={title}>Agrega tu primera marca</h1>
              <label style={lab}>Nombre de la marca<input key="b" required autoFocus value={brand} onChange={(e) => setBrand(e.target.value)} style={field} /></label>
              <label style={lab}>Giro<input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Cafetería, clínica…" style={field} /></label>
              <label style={lab}>Usuario en redes<input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@tumarca" style={field} /></label>
            </>
          )}
          {step === 2 && (
            <>
              <h1 style={title}>Invita a tu equipo</h1>
              <label style={lab}>
                Correos, separados por comas
                <textarea key="c" autoFocus rows={3} value={invites} onChange={(e) => setInvites(e.target.value)} style={{ ...field, resize: "vertical" }} />
              </label>
              <p style={{ fontSize: 12.5, color: "#64748B", margin: 0 }}>{backendEnabled ? "Las invitaciones estarán disponibles pronto; este paso se puede omitir." : "Por ahora se crea un enlace de invitación para compartir; todavía no se envía correo."}</p>
            </>
          )}
          {error && <p role="alert" style={{ color: "#B91C1C", fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
            {step > 0 ? <button type="button" onClick={() => setStep(step - 1)} style={secondary}>Atrás</button> : <span />}
            <div style={{ display: "flex", gap: 8 }}>
              {step === 2 && <button type="button" onClick={() => void finish(false)} style={secondary}>Omitir</button>}
              <button type="submit" style={primary}>{step === 2 ? "Entrar a Hubly" : "Continuar"}</button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

const title = { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 } as const;
const field = { width: "100%", border: "1px solid #CBD5E1", borderRadius: 9, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: "#FFFFFF" } as const;
const lab = { display: "grid", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#475569" } as const;
const primary = { border: 0, borderRadius: 9, background: "#6C77C1", color: "#FFFFFF", padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" } as const;
const secondary = { border: "1px solid #CBD5E1", borderRadius: 9, background: "#FFFFFF", color: "#334155", padding: "9px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" } as const;
