#!/usr/bin/env node
/*
 * Propiedad de archivos de los tres agentes. Es la fuente de verdad del reparto.
 *
 *   node <ruta>/comprobar-propiedad.mjs A|B|C   revisa los commits de la rama actual contra la base
 *   node <ruta>/comprobar-propiedad.mjs --solape  comprueba que ningún archivo del repo tenga dos dueños
 *
 * Una entrada que termina en / abarca toda la carpeta, incluidos archivos nuevos.
 */
import { execSync } from "node:child_process";

const BASE = "73bf591d7c05207ff2f767ffc12358dc6fea0897";
const COM = "web/components/app/";
const APP = "web/app/(app)/";

const DUENOS = {
  A: [
    "docs/planes-agentes/entregas/A.md",
    "docs/planes-agentes/capturas-A/",
    APP + "anuncios/", APP + "ia/", APP + "parrillas/", APP + "calendario/", APP + "dashboard/",
    APP + "equipo/", APP + "salud/",
    APP + "layout.tsx", APP + "app-base.css", APP + "dashboard-polish.css", APP + "hubly-saas.css",
    COM + "CommandPaletteModal.tsx", COM + "PostComposerModal.tsx", COM + "FloatingAIDrawer.tsx",
    COM + "DescubreHublyWidget.tsx", COM + "DashboardSubNav.tsx", COM + "AutoSuggestionsModal.tsx",
    COM + "MonthDragCalendar.tsx",
    COM + "dashboard/", COM + "social/", COM + "media/",
    "web/components/previews/",
    "web/e2e/verificar-buscador.cjs", "web/e2e/buscador.spec.ts", "web/e2e/capturas-henry.mjs",
  ],
  B: [
    "docs/planes-agentes/entregas/B.md",
    "docs/MATRIZ-CONTROLES.md",
    APP + "crm/", APP + "tareas/", APP + "chat/", APP + "notificaciones/", APP + "automatizaciones/",
    APP + "reportes/", APP + "marcas/", APP + "marca/", APP + "estrategia/", APP + "archivos/",
    APP + "proyectos/", APP + "ajustes/",
    COM + "ajustes/", COM + "tasks/", COM + "reports/", COM + "gemini/",
    COM + "ArchivosYProyectosView.tsx", COM + "WidgetConfigModal.tsx", COM + "AccessPanel.tsx",
    COM + "KanbanDropSlot.tsx", COM + "KraftNotebookCard.tsx", COM + "NotebookEditor.tsx",
    COM + "NotebookReaderModal.tsx", COM + "NewBrandModal.tsx", COM + "InviteTeamModal.tsx",
    "web/e2e/auditoria-controles.mjs",
  ],
  C: [
    "docs/planes-agentes/entregas/C.md",
    COM + "marca/BuyerPersonas.tsx", COM + "projects/ProjectEditModal.tsx",
    "web/e2e/archivos.spec.ts", "web/e2e/calendario.spec.ts", "web/e2e/compositor.spec.ts",
    "web/e2e/listas.spec.ts", "web/e2e/rutas.spec.ts", "web/e2e/salud-cuentas.spec.ts",
    "web/e2e/auditoria-estados.mjs",
    "web/lib/calendar-views.test.ts", "web/lib/post-import.test.ts", "web/lib/post-draft.test.ts",
  ],
};

const coincide = (archivo, entrada) => (entrada.endsWith("/") ? archivo.startsWith(entrada) : archivo === entrada);
const duenosDe = (archivo) => Object.keys(DUENOS).filter((a) => DUENOS[a].some((e) => coincide(archivo, e)));
const lineas = (cmd) => execSync(cmd, { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);

const arg = process.argv[2];

if (arg === "--solape") {
  const entradas = Object.entries(DUENOS).flatMap(([a, lista]) => lista.map((e) => [a, e]));
  const choques = entradas.flatMap(([a, x], i) =>
    entradas.slice(i + 1).filter(([b, y]) => a !== b && (x.startsWith(y) || y.startsWith(x))).map(([b, y]) => `${a}:${x} ↔ ${b}:${y}`)
  );
  const dobles = lineas("git -c core.quotepath=off ls-files").filter((f) => duenosDe(f).length > 1);
  [...choques, ...dobles].forEach((c) => console.error(`✗ ${c}`));
  if (choques.length || dobles.length) process.exit(1);
  console.log("Sin solapes: ningún archivo tiene dos dueños.");
  process.exit(0);
}

if (!DUENOS[arg]) {
  console.error("Uso: comprobar-propiedad.mjs A|B|C o --solape");
  process.exit(2);
}

const tocados = lineas(`git -c core.quotepath=off diff --name-only ${BASE}...HEAD`);
const ajenos = tocados.filter((f) => !DUENOS[arg].some((e) => coincide(f, e)));
ajenos.forEach((f) => console.error(`✗ ${f} no es de ${arg}: ${duenosDe(f).join(", ") || "congelado"}`));
if (ajenos.length) {
  console.error(`\n${ajenos.length} archivo(s) fuera de tu propiedad. Sácalos de tus commits y anótalos en la cola de tu entrega.`);
  process.exit(1);
}
console.log(`Correcto: ${tocados.length} archivo(s) tocados, todos de ${arg}.`);
