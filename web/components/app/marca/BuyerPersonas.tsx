"use client";

import { HublyCheckIcon, HublyPlusIcon, HublyTrashIcon } from "@/components/app/icons/DuotoneIcons";
import { useHublyStore } from "@/lib/store";
import { askConfirm } from "@/components/app/AppDialogHost";
import type { BrandWorkspace, BuyerPersona } from "@/lib/types";

const FIELDS: { key: keyof Pick<BuyerPersona, "ageRange" | "occupation" | "painPoints" | "motivation">; label: string; long?: boolean }[] = [
  { key: "ageRange", label: "Edad" },
  { key: "occupation", label: "Ocupación" },
  { key: "painPoints", label: "Dolor principal", long: true },
  { key: "motivation", label: "Meta principal", long: true },
];

/** Las audiencias se guardan en la marca: nada aquí se presenta como investigado por IA. */
export function BuyerPersonas({ brand }: { brand: BrandWorkspace }) {
  const updateBrandCore = useHublyStore((s) => s.updateBrandCore);
  const readOnly = useHublyStore((s) => s.role === "viewer");
  const personas = brand.core?.personas ?? [];
  const save = (next: BuyerPersona[]) => updateBrandCore(brand.id, { personas: next });
  const patch = (id: string, change: Partial<BuyerPersona>) => save(personas.map((p) => (p.id === id ? { ...p, ...change } : p)));

  const pending = personas.filter((p) => !p.accepted);

  return (
    <section className="hubly-personas" aria-labelledby="hubly-personas-title">
      <header>
        <div>
          <h3 id="hubly-personas-title">Buyer personas</h3>
          <p>{personas.length === 0 ? "Describe a quién le habla esta marca." : `${personas.length} en ${brand.name} · ${pending.length} sin aceptar`}</p>
        </div>
        {!readOnly && (
          <div>
            {pending.length > 0 && (
              <button type="button" className="hubly-media-ghost" onClick={() => save(personas.map((p) => ({ ...p, accepted: true })))}>
                <HublyCheckIcon size={15} aria-hidden /> Aceptar todas
              </button>
            )}
            <button
              type="button"
              className="hubly-media-primary"
              onClick={() => save([...personas, { id: `bp-${Date.now()}`, name: "Nueva persona", ageRange: "", occupation: "", painPoints: "", motivation: "", accepted: false }])}
            >
              <HublyPlusIcon size={15} aria-hidden /> Agregar persona
            </button>
          </div>
        )}
      </header>

      {personas.length === 0 && <p className="hubly-media-hint">Aún no hay personas. Agrega la primera para usarla al redactar con IA.</p>}

      <div className="hubly-personas-list">
        {personas.map((persona) => (
          <article key={persona.id} data-accepted={persona.accepted || undefined}>
            <div className="hubly-personas-head">
              <span aria-hidden>{persona.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
              <input aria-label="Nombre de la persona" value={persona.name} disabled={readOnly} onChange={(e) => patch(persona.id, { name: e.target.value })} />
              {!readOnly && (
                <>
                  <button type="button" aria-pressed={persona.accepted} onClick={() => patch(persona.id, { accepted: !persona.accepted })}>
                    <HublyCheckIcon size={14} aria-hidden /> {persona.accepted ? "Aceptada" : "Aceptar"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${persona.name}`}
                    onClick={async () => {
                      if (await askConfirm(`¿Eliminar a «${persona.name}»?`)) save(personas.filter((p) => p.id !== persona.id));
                    }}
                  >
                    <HublyTrashIcon size={14} />
                  </button>
                </>
              )}
            </div>
            <div className="hubly-personas-fields">
              {FIELDS.map(({ key, label, long }) => (
                <label key={key} data-long={long || undefined}>
                  {label}
                  {long ? (
                    <textarea rows={2} disabled={readOnly} value={persona[key]} onChange={(e) => patch(persona.id, { [key]: e.target.value })} />
                  ) : (
                    <input disabled={readOnly} value={persona[key]} onChange={(e) => patch(persona.id, { [key]: e.target.value })} />
                  )}
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
