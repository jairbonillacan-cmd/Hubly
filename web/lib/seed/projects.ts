// Proyectos de ejemplo exclusivos del modo demo y del fixture de referencia visual.
import type { BrandProject } from "../types";

export function createSeedProjects(): BrandProject[] {
  return [
    {
      id: "proj-1",
      brandId: "brand-bruma",
      title: "Lanzamiento Suscripción Café de Temporada · Otoño",
      description:
        "Parrilla de 16 piezas, 4 Reels de barra, secuencia de anuncios en Meta y página de aterrizaje para oficinas.",
      progress: 75,
      status: "En curso",
      dueDate: "2026-11-15",
      deliverablesCount: 16,
    },
    {
      id: "proj-2",
      brandId: "brand-bruma",
      title: "Rediseño de Empaque y Etiquetas de Origen",
      description:
        "Fotografía de producto y plantillas editables para anunciar cada nuevo lote semanal en Stories.",
      progress: 100,
      status: "Completado",
      dueDate: "2026-10-25",
      deliverablesCount: 8,
    },
    {
      id: "proj-3",
      brandId: "brand-min",
      title: "Campaña Botas Chelsea Edición Numerada",
      description:
        "Documental corto en taller, carruseles de anatomía de calzado y pauta de conversión en Meta y TikTok.",
      progress: 45,
      status: "En curso",
      dueDate: "2026-11-20",
      deliverablesCount: 12,
    },
    {
      id: "proj-4",
      brandId: "brand-norte",
      title: "Mes de Mapeo Digital de Lunares",
      description:
        "Serie de cápsulas en video con las 3 dermatólogas y campañas de generación de citas por WhatsApp.",
      progress: 90,
      status: "Revisión",
      dueDate: "2026-11-05",
      deliverablesCount: 10,
    },
  ];
}
