"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useHublyStore } from "@/lib/store";

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

/** Vista lista para imprimir o guardar como PDF desde el navegador. */
function CotizacionView() {
  const id = useParams<{ id: string }>()?.id;
  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const quote = useHublyStore((s) => s.quotes?.find((q) => q.id === id));
  const lead = useHublyStore((s) => s.leads?.find((l) => l.id === quote?.leadId));
  const agency = useHublyStore((s) => s.agency?.name || s.agencyName);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void syncFromServer().finally(() => setReady(true));
  }, [syncFromServer]);

  if (!ready) return <main style={page}>Cargando…</main>;
  if (!quote) return <main style={page}>No encontramos esta cotización.</main>;

  const total = quote.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return (
    <main style={page}>
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button type="button" onClick={() => window.print()} style={{ border: 0, borderRadius: 9, background: "var(--hb-accent)", color: "#FFFFFF", padding: "9px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Imprimir o guardar PDF
        </button>
      </div>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", borderBottom: "2px solid #0F172A", paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: "#475569" }}>{agency}</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "4px 0 0" }}>{quote.title}</h1>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, color: "#475569" }}>
          <div>Cotización · {quote.status}</div>
          <div>{new Date(quote.createdAt).toLocaleDateString("es-MX", { dateStyle: "long" })}</div>
        </div>
      </header>
      {lead && (
        <section style={{ margin: "20px 0", fontSize: 14 }}>
          <div style={{ fontSize: 12, color: "#475569" }}>Para</div>
          <strong>{lead.company || lead.name}</strong>
          {lead.company && <div>{lead.name}</div>}
          {lead.email && <div>{lead.email}</div>}
        </section>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #CBD5E1", color: "#475569", fontSize: 12.5 }}>
            <th style={cell}>Concepto</th>
            <th style={{ ...cell, textAlign: "right" }}>Cantidad</th>
            <th style={{ ...cell, textAlign: "right" }}>Precio</th>
            <th style={{ ...cell, textAlign: "right" }}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((i) => (
            <tr key={i.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
              <td style={cell}>{i.description}</td>
              <td style={{ ...cell, textAlign: "right" }}>{i.quantity}</td>
              <td style={{ ...cell, textAlign: "right" }}>{money(i.unitPrice)}</td>
              <td style={{ ...cell, textAlign: "right" }}>{money(i.quantity * i.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ ...cell, textAlign: "right", fontWeight: 700 }}>Total (MXN)</td>
            <td style={{ ...cell, textAlign: "right", fontWeight: 700, fontSize: 16 }}>{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}

const page = { maxWidth: 760, margin: "0 auto", padding: "32px 20px", color: "#0F172A", background: "#FFFFFF", minHeight: "100vh" } as const;
const cell = { padding: "10px 6px" } as const;

export default function CotizacionPage() {
  return (
    <Suspense fallback={null}>
      <CotizacionView />
    </Suspense>
  );
}
