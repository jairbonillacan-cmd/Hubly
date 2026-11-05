import { HublyShieldIcon as ShieldCheck } from "@/components/app/icons/DuotoneIcons";
import type { ShareCounts } from "@/lib/domain/share";

interface SharePortalResumenProps {
  brandName: string;
  counts: ShareCounts;
}

export function SharePortalResumen({ brandName, counts }: SharePortalResumenProps) {
  return (
    <div className="hubly-share-intro">
      <div>
        <div className="hubly-share-intro-kicker">
          <ShieldCheck size={15} />
          Enlace seguro compartido por tu agencia en Hubly
        </div>
        <h1 className="hubly-share-title">
          Revisa y aprueba las publicaciones de{" "}
          <span className="hubly-share-title-brand">{brandName}</span>
        </h1>
        <p className="hubly-share-lede">
          Haz clic en <strong>Aprobar</strong> para programar la salida o en{" "}
          <strong>Pedir cambios</strong> para dejarle indicaciones exactas a tu equipo creativo.
        </p>
      </div>

      <div className="hubly-share-counts">
        <div className="hubly-share-count">
          <div className="hubly-share-count-value">{counts.approved}</div>
          <div className="hubly-share-count-label">Listos</div>
        </div>
        <div className="hubly-share-count">
          <div className="hubly-share-count-value hubly-share-count-value--pending">{counts.pending}</div>
          <div className="hubly-share-count-label">Pendientes</div>
        </div>
      </div>
    </div>
  );
}
