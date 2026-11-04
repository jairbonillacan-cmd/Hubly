// Libretas Kraft iniciales exclusivas del modo demo y del fixture de referencia visual.
// Con cuentas reales (`options.live`) el espacio arranca sin libretas prefabricadas.
import type { NotebookItem } from "../types";

export const DEFAULT_NOTEBOOKS: NotebookItem[] = [
  {
    id: "nb-kraft-1",
    brandId: "brand-min",
    title: "TU PRIMER POST",
    subtitle: "N° 01 · OCT 26",
    stamp: "N° 01 · OCT 26",
    variant: "post",
    category: "Guía de operación",
    content:
      "Guía paso a paso para programar el primer post de tu cliente sin fricción:\n1. Define el pilar del Núcleo de marca.\n2. Redacta el copy con la voz oficial de la cuenta.\n3. Comparte la liga pública de revisión sin contraseñas para que tu cliente apruebe desde su celular.",
    bgGradient: "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
    accentColor: "#16324F",
    updatedAt: "2026-10-26T10:00:00-06:00",
    updatedBy: "Jair",
    isPinned: true,
  },
  {
    id: "nb-kraft-2",
    brandId: "brand-min",
    title: "REPORTES SIN POWERPOINT",
    subtitle: "N° 02 · OCT 26",
    stamp: "N° 02 · OCT 26",
    variant: "report",
    category: "Reportes en vivo",
    content:
      "Olvídate de tomar capturas de pantalla cada fin de mes:\n• Conecta las cuentas de Meta, Instagram y TikTok.\n• Hubly actualiza el alcance, CTR y Click Score automáticamente.\n• Comparte el reporte interactivo o imprímelo en PDF con 1 clic.",
    bgGradient: "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
    accentColor: "#5B67CA",
    updatedAt: "2026-10-26T12:30:00-06:00",
    updatedBy: "Jair",
    isPinned: true,
  },
  {
    id: "nb-kraft-3",
    brandId: "brand-min",
    title: "TU DÍA EN MI ESPACIO",
    subtitle: "N° 03 · OCT 26",
    stamp: "N° 03 · OCT 26",
    variant: "space",
    category: "Productividad",
    content:
      "Organiza la operación diaria de tu agencia:\n• Prioriza primero las tareas marcadas con resaltador amarillo.\n• Alterna entre vista de Cards, Kanban, Tabla y Calendario.\n• El tiempo activo se calcula solo mientras avanzas entregables.",
    bgGradient: "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
    accentColor: "#10B981",
    updatedAt: "2026-10-26T15:00:00-06:00",
    updatedBy: "Jair",
    isPinned: false,
  },
  {
    id: "nb-kraft-4",
    brandId: "brand-min",
    title: "NÚCLEO DE MARCA",
    subtitle: "N° 04 · OCT 26",
    stamp: "N° 04 · OCT 26",
    variant: "brand",
    category: "Estrategia IA",
    content:
      "Cada marca tiene su propio cerebro estratégico:\n• Extrae señales reales desde el sitio web del cliente.\n• Valida las 3 Buyer Personas con dolores y metas verificables.\n• Usa esas reglas de voz en cada copy de parrilla y anuncios.",
    bgGradient: "linear-gradient(180deg, #D9B78A 0%, #C79F6E 100%)",
    accentColor: "#16324F",
    updatedAt: "2026-10-26T17:15:00-06:00",
    updatedBy: "Jair",
    isPinned: false,
  },
];
