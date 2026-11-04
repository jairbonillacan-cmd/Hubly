"use client";

import { LiveUnavailable } from "@/components/app/LiveUnavailable";
import { backendEnabled } from "@/lib/supabase/config";
import { DemoAnunciosPage } from "@/components/app/anuncios/DemoAnunciosPage";

export default function AnunciosPage() {
  if (backendEnabled) return <LiveUnavailable title="Anuncios" text="Las métricas de anuncios aparecerán cuando conectes las cuentas publicitarias de esta marca." />;
  return <DemoAnunciosPage />;
}
