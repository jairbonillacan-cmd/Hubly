import { Suspense } from "react";
import { SharePortal } from "@/components/app/share/SharePortal";

export default function ClientSharePortalPage() {
  return (
    <Suspense
      fallback={
        <main className="hubly-share hubly-share--center">Cargando portal de cliente...</main>
      }
    >
      <SharePortal />
    </Suspense>
  );
}
