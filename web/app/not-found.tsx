import type { Metadata } from "next";
import Link from "next/link";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";
import "./(app)/hubly-saas.css";
import "./(app)/app-base.css";
import "./(app)/dashboard-polish.css";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <main className="hubly-app-root hb-app-root hubly-not-found">
      <HublyBrandLogo height={32} />
      <h1>No encontramos esta página</h1>
      <p>Error 404. El enlace está mal escrito o la página ya no existe.</p>
      <div className="hubly-not-found-acciones">
        <Link href="/dashboard" className="hbtn hbtn-primary">Ir al dashboard</Link>
        <Link href="/" className="hbtn hbtn-secondary">Ir al sitio</Link>
      </div>
    </main>
  );
}
