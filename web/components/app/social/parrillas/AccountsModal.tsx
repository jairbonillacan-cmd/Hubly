"use client";

import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";
import { HublyCloseIcon } from "@/components/app/icons/DuotoneIcons";

const NETWORKS = ["Instagram", "Facebook", "TikTok", "LinkedIn"];

/** Cuentas conectadas de la marca. */
export function AccountsModal({
  open,
  onClose,
  brandName,
  onConnect,
}: {
  open: boolean;
  onClose: () => void;
  brandName: string;
  onConnect: (netName: string) => void;
}) {
  const presence = useModalPresence(open);
  useLayer(open, onClose);
  if (!presence.mounted) return null;

  return (
    <div
      className="hubly-overlay hubly-cal-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="hubly-sheet hubly-cal-modal"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-label={`Cuentas de ${brandName}`}
      >
        <div className="hubly-cal-modal-head">
          <h2>Cuentas de {brandName}</h2>
          <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={onClose}>
            <HublyCloseIcon size={14} />
          </button>
        </div>
        <div className="hubly-cal-modal-scroll">
          <p className="hubly-accounts-hint">Conecta o administra los perfiles oficiales de tu cliente.</p>
          <div className="hubly-accounts-list">
            {NETWORKS.map((net) => (
              <div key={net} className="hubly-accounts-row">
                <span>{net}</span>
                <button
                  type="button"
                  className="hbtn hbtn-secondary hbtn-sm"
                  onClick={() => {
                    onClose();
                    onConnect(net);
                  }}
                >
                  Conectar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
