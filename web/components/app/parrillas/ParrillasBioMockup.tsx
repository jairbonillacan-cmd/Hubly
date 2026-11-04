"use client";

import { HublyGlobeIcon as Globe } from "@/components/app/icons/DuotoneIcons";

interface ParrillasBioMockupProps {
  brandName: string;
  description?: string;
  siguenosEnabled: boolean;
  whatsappEnabled: boolean;
}

export function ParrillasBioMockup({
  brandName,
  description,
  siguenosEnabled,
  whatsappEnabled,
}: ParrillasBioMockupProps) {
  return (
    <div className="hubly-parrillas-mockup-col">
      <div className="hubly-parrillas-mockup-phone">
        <h1 className="hubly-parrillas-mockup-title">{brandName}</h1>
        <p className="hubly-parrillas-mockup-desc">
          {description || "Agrega una descripción en Núcleo de marca."}
        </p>

        {siguenosEnabled && (
          <div className="hubly-parrillas-mockup-globe">
            <Globe size={18} />
          </div>
        )}

        {whatsappEnabled && (
          <div className="hubly-parrillas-mockup-wa">Escríbenos por WhatsApp</div>
        )}

        <div className="hubly-parrillas-mockup-foot">
          hecho con <strong className="hubly-parrillas-mockup-brand">hubly</strong>
        </div>
      </div>
    </div>
  );
}
