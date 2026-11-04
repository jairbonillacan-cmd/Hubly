"use client";

import { HublyCloseIcon as X } from "@/components/app/icons/DuotoneIcons";
import { Button } from "@/components/app/ui/Button";
import { Modal } from "@/components/app/ui/Modal";

const MAIN_NETWORKS = ["Instagram", "Facebook", "TikTok", "LinkedIn"] as const;

interface ParrillasCuentasModalProps {
  open: boolean;
  brandName: string;
  onClose: () => void;
  onConnectNetwork: (netName: string) => void;
}

export function ParrillasCuentasModal({
  open,
  brandName,
  onClose,
  onConnectNetwork,
}: ParrillasCuentasModalProps) {
  return (
    <Modal open={open} onClose={onClose} label={`Cuentas de ${brandName}`}>
      <div className="hubly-cal-modal-head">
        <h2>Cuentas de {brandName}</h2>
        <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      <div className="hubly-cal-modal-scroll">
        <p className="hubly-parrillas-accounts-desc">
          Conecta o administra los perfiles oficiales de tu cliente.
        </p>
        <div className="hubly-parrillas-accounts-list">
          {MAIN_NETWORKS.map((net) => (
            <div key={net} className="hubly-parrillas-accounts-row">
              <span className="hubly-parrillas-accounts-name">{net}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onConnectNetwork(net);
                }}
              >
                Conectar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
