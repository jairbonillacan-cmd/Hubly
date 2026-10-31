/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { HublyBrandLogo } from "@/components/brand/HublyBrandLogo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <main className="auth-main">
        <Link href="/" className="auth-logo" aria-label="Ir a la página de Hubly">
          <HublyBrandLogo on="light" height={44} />
        </Link>
        <div className="auth-form">{children}</div>
        <p className="auth-foot">Código abierto bajo licencia AGPL-3.0</p>
      </main>
      <aside className="auth-aside">
        <div>
          <h2>Todas tus marcas, en un solo lugar.</h2>
          <p>Planea el mes, consigue aprobaciones con un enlace y entrega reportes sin saltar entre diez herramientas.</p>
        </div>
        <img className="auth-hubi" src="/brand/hubly-gato.png?v=marino-celeste" alt="" width={640} height={640} />
      </aside>
    </div>
  );
}
