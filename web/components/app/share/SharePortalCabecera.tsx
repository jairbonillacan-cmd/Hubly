"use client";

import Link from "next/link";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyCheckCircleIcon as CheckCircle2,
} from "@/components/app/icons/DuotoneIcons";
import type { ShareCounts } from "@/lib/domain/share";
import type { BrandWorkspace } from "@/lib/types";

interface SharePortalCabeceraProps {
  brand: BrandWorkspace;
  counts: ShareCounts;
  clientName: string;
  onClientNameChange: (value: string) => void;
  onApproveAll: () => void;
}

export function SharePortalCabecera({
  brand,
  counts,
  clientName,
  onClientNameChange,
  onApproveAll,
}: SharePortalCabeceraProps) {
  // El color de la marca es un dato calculado: se pinta en línea (§9.12).
  return (
    <header className="hubly-share-header">
      <div className="hubly-share-header-brand">
        <span className="hubly-share-brand-chip" style={{ background: brand.color }}>
          {brand.initials}
        </span>
        <div>
          <div className="hubly-share-brand-line">
            <span className="hubly-share-brand-name">{brand.name}</span>
            <span className="hubly-share-brand-badge">Portal de Revisión Sin Login</span>
          </div>
          <div className="hubly-share-brand-meta">
            Parrilla Noviembre 2026 · {counts.approved} aprobados · {counts.pending} por revisar
          </div>
        </div>
      </div>

      <div className="hubly-share-header-actions">
        <input
          value={clientName}
          onChange={(e) => onClientNameChange(e.target.value)}
          placeholder="Tu nombre para firmar aprobaciones"
          className="hubly-share-signer"
        />
        {counts.pending > 0 && (
          <button
            type="button"
            onClick={onApproveAll}
            className="hubly-share-btn hubly-share-btn--outline hubly-share-btn--sm"
          >
            <CheckCircle2 size={14} />
            Aprobar todo el mes ({counts.pending})
          </button>
        )}
        <Link href="/parrillas" className="hubly-share-btn hubly-share-btn--ghost hubly-share-btn--sm">
          <ArrowLeft size={13} />
          Volver al estudio
        </Link>
      </div>
    </header>
  );
}
