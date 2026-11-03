#!/usr/bin/env node
/*
 * Chequeo anti-slop de la interfaz. Reglas en docs/GUIA-UX-UI-AGENTES.md; las
 * cuatro nuevas salen del plan de deslop (docs/deslop/04-TAREAS.md, F0-3).
 * Compara contra scripts/check-ui-baseline.json, y las rutas fuera de (app)
 * contra scripts/check-ui-rutas-baseline.json: la deuda ya existente no falla,
 * pero ningún archivo puede empeorar y un archivo nuevo debe salir limpio.
 *
 *   npm run check:ui            revisa
 *   npm run check:ui -- --list  además muestra cada línea con hallazgos
 *   npm run check:ui -- --update  reescribe las bases (solo tras reducir deuda)
 *   --root apunta a otro árbol; lo usan las pruebas.
 *
 * Una línea con un motivo real se exime con el comentario `ui-ok: motivo`.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { esNueva } from "./check-ui-reglas.mjs";

const args = process.argv.slice(2);
const rootArg = args.indexOf("--root");
if (rootArg !== -1 && !args[rootArg + 1]) {
  console.error("Falta la ruta después de --root.");
  process.exit(2);
}
const root = rootArg === -1 ? join(dirname(fileURLToPath(import.meta.url)), "..") : args[rootArg + 1];

// Cada conjunto tiene su base: la deuda de las rutas nuevas no se mezcla con la
// de la app, que es la que ya estaba medida.
const SETS = [
  {
    label: "app/(app) y components/app",
    baseline: "check-ui-baseline.json",
    paths: ["app/(app)", "components/app"],
  },
  {
    label: "rutas fuera de (app)",
    baseline: "check-ui-rutas-baseline.json",
    paths: [
      "app/share",
      "app/reporte",
      "app/cotizacion",
      "app/invitacion",
      "app/login",
      "app/register",
      "app/recuperar",
      "app/nueva-clave",
      "app/onboarding",
      "app/page.tsx",
    ],
  },
];

// Dibujos, marcas de terceros y simuladores de redes: su color es parte de la forma.
const skipped = [/components\/app\/icons\//, /\.test\./];

const FONT_SIZES = new Set([10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 18, 20, 28]);
const RADII = new Set([0, 2, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 999, 9999]);

const offScale = (scale, value) => !scale.has(Number(value));

const RULES = [
  { id: "color-fijo", why: "color fijo: usa un token --ui-* o --hb-* (§3)", test: (l) => /#[0-9a-fA-F]{3,8}\b(?![\w-])/.test(l) && !/&#/.test(l) },
  { id: "rgb-fijo", why: "rgb()/rgba() fijo: usa un token o rgb(var(--hb-accent-rgb) / alfa) (§3)", test: (l) => /\brgba?\(\s*\d/.test(l) },
  { id: "degradado", why: "degradado decorativo (§15)", test: (l) => /(linear|radial|conic)-gradient|bg-(gradient|linear)-/.test(l) },
  { id: "lucide", why: "iconos de lucide: usa DuotoneIcons (§6)", test: (l) => /from\s+["']lucide-react["']/.test(l) },
  { id: "emoji", why: "emoji en la interfaz: usa un icono duotono (§15)", test: (l) => /\p{Extended_Pictographic}/u.test(l.replace(/[©®™]/g, "")) },
  { id: "dialogo-nativo", why: "alert/confirm/prompt nativo: usa askConfirm o askText (§9)", test: (l) => /\b(window\.)?(alert|confirm|prompt)\(/.test(l) && !/askConfirm|askText/.test(l) },
  { id: "exclamacion", why: "exclamación en el texto de interfaz (§14)", test: (l) => /["'`>]\s*¡/.test(l) },
  { id: "tailwind-color", why: "color de Tailwind: usa un token (§3)", test: (l) => /\b(bg|text|border|ring)-(red|green|emerald|blue|indigo|violet|purple|pink|gray|slate|zinc|neutral|amber|yellow)-\d{2,3}\b/.test(l) },
  { id: "transition-all", why: "transition: all; nombra las propiedades (§7)", test: (l) => /transition(-property)?:\s*["']?all\b/.test(l) },
  { id: "hbtn-directo", why: "botón con clases .hbtn: usa <Button> de components/app/ui (§9.2)", test: (l) => /className="hbtn\b/.test(l) && !/hbtn-outline|hbtn-indigo/.test(l), skipFile: /components\/app\/ui\// },
  {
    id: "tamano-fuente",
    why: "tamaño de texto fuera de la escala (§4)",
    test: (l) => [...l.matchAll(/(?:fontSize:\s*|font-size:\s*)(\d+(?:\.\d+)?)(?:px)?\b/g)].some((m) => offScale(FONT_SIZES, m[1])),
  },
  {
    id: "radio",
    why: "radio fuera de la escala (§5)",
    test: (l) => [...l.matchAll(/(?:borderRadius:\s*|border-radius:\s*)(\d+(?:\.\d+)?)(?:px)?\s*(?:[,;}]|$)/g)].some((m) => offScale(RADII, m[1])),
  },
  { id: "style-inline", why: "estilo en línea: usa una clase con tokens; style={{ }} solo para un valor calculado (§9.12)", test: (l) => /style=\{\{/.test(l) },
  { id: "important", why: "!important: corrige la causa o justifícalo con un comentario (§15)", test: (l) => /!important/.test(l) },
  { id: "view-prop", why: "la sección recibe view entera: pide props explícitas (docs/deslop/02-ARQUITECTURA-OBJETIVO.md)", test: (l) => /\(\{\s*view\b|\bview:\s*\w+(Model|View)\b/.test(l) },
  { id: "use-store-sin-selector", why: "useHublyStore() sin selector: suscribe a todo el store, pasa un selector (F1-6)", test: (l) => /useHublyStore\(\s*\)/.test(l) },
];
const why = Object.fromEntries(RULES.map((rule) => [rule.id, rule.why]));

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|css)$/.test(name)) out.push(full);
  }
  return out;
}

function filesOf(paths) {
  const out = [];
  for (const path of paths) {
    const full = join(root, path);
    if (!existsSync(full)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|css)$/.test(full)) out.push(full);
  }
  return out;
}

function scan(paths) {
  const result = {};
  for (const full of filesOf(paths)) {
    const file = relative(root, full).split(sep).join("/");
    if (skipped.some((re) => re.test(file))) continue;
    readFileSync(full, "utf8").split(/\r?\n/).forEach((line, index) => {
      if (line.includes("ui-ok:")) return; if (/^\s*--[\w-]+:/.test(line)) return; // Una definición de token no es usar un color fijo.
      for (const rule of RULES) {
        if (rule.skipFile?.test(file) || !rule.test(line)) continue;
        result[file] ??= {};
        result[file][rule.id] ??= [];
        result[file][rule.id].push(index + 1);
      }
    });
  }
  return result;
}

const toCounts = (found) =>
  Object.fromEntries(
    Object.keys(found).sort().map((file) => [
      file,
      Object.fromEntries(Object.keys(found[file]).sort().map((id) => [id, found[file][id].length])),
    ]),
  );

const sumCounts = (counts) =>
  Object.values(counts).reduce((total, rules) => total + Object.values(rules).reduce((ruleTotal, count) => ruleTotal + count, 0), 0);

const scanned = SETS.map((set) => {
  const found = scan(set.paths);
  return { set, found, counts: toCounts(found) };
});

if (args.includes("--update")) {
  for (const { set, counts } of scanned) {
    writeFileSync(join(root, "scripts", set.baseline), `${JSON.stringify(counts, null, 2)}\n`);
    console.log(`Base actualizada: ${set.label} · ${sumCounts(counts)} hallazgos en ${Object.keys(counts).length} archivos (scripts/${set.baseline}).`);
  }
  process.exit(0);
}

let worse = 0;
const debt = { siempre: 0, nuevas: 0 };
const bySet = [];

for (const { set, found } of scanned) {
  const baselinePath = join(root, "scripts", set.baseline);
  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
  const setDebt = { total: 0, siempre: 0, nuevas: 0 };

  for (const [file, rules] of Object.entries(found)) {
    for (const [id, lines] of Object.entries(rules)) {
      const allowed = baseline[file]?.[id] ?? 0;
      if (lines.length > allowed) {
        worse += 1;
        console.error(`✗ ${file} [${id}]: ${why[id]}\n  ${lines.length} hallazgos, permitidos ${allowed}. Líneas: ${lines.join(", ")}`);
      } else if (args.includes("--list")) {
        console.log(`· ${file} [${id}] líneas: ${lines.join(", ")}`);
      }
      setDebt.total += lines.length;
      setDebt[esNueva(id) ? "nuevas" : "siempre"] += lines.length;
    }
  }

  debt.siempre += setDebt.siempre;
  debt.nuevas += setDebt.nuevas;
  bySet.push({ set, debt: setDebt });
}

if (worse > 0) {
  console.error(`\nEl chequeo falló: ${worse} regla(s) empeoraron. Corrige el código; no actualices la base para pasar.`);
  process.exit(1);
}

console.log(`Chequeo de UI correcto. Deuda heredada sin empeorar: ${debt.siempre + debt.nuevas} hallazgos.`);
for (const { set, debt: setDebt } of bySet) {
  console.log(`  ${set.label} · scripts/${set.baseline}: ${setDebt.total} (de siempre ${setDebt.siempre}, nuevas ${setDebt.nuevas})`);
}
console.log(`  De las reglas de siempre: ${debt.siempre}. De las nuevas: ${debt.nuevas}.`);
