#!/usr/bin/env node
/*
 * Chequeo anti-slop de la app autenticada. Reglas en docs/GUIA-UX-UI-AGENTES.md.
 * Compara contra scripts/check-ui-baseline.json: la deuda ya existente no falla,
 * pero ningún archivo puede empeorar y un archivo nuevo debe salir limpio.
 *
 *   npm run check:ui            revisa
 *   npm run check:ui -- --list  además muestra cada línea con hallazgos
 *   npm run check:ui -- --update  reescribe la base (solo tras reducir deuda)
 *
 * Una línea con un motivo real se exime con el comentario `ui-ok: motivo`.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, "scripts", "check-ui-baseline.json");
const scanDirs = ["app/(app)", "components/app"];
// Fuera de la app autenticada, solo con las reglas que no dependen de su sistema visual.
const scanFiles = { "components/AgencyCalculator.tsx": ["prueba-escrita"] };
// Dibujos, marcas de terceros y simuladores de redes: su color es parte de la forma.
const skipped = [/components\/app\/icons\//, /\.test\./];

const FONT_SIZES = new Set([10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 18, 20, 28]);
const RADII = new Set([0, 2, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 999, 9999]);

const offScale = (scale, value) => !scale.has(Number(value));
// `--ui-surface: #FFFFFF;` es la fuente del token, no un color suelto.
const definesToken = (l) => /^\s*(:root\s*\{\s*)?--[\w-]+\s*:/.test(l);
// Del 10 hacia arriba es una capa de pantalla; 0–9 solo ordena dentro de un componente.
const layerNumber = (l) =>
  [...l.matchAll(/(?:zIndex:\s*|z-index:\s*|\bz-\[)(\d+)|\bz-(\d{2,})\b/g)].some((m) => Number(m[1] ?? m[2]) >= 10);

const RULES = [
  { id: "color-fijo", why: "color fijo: usa un token --ui-* o --hb-* (§3)", test: (l) => /#[0-9a-fA-F]{3,8}\b(?![\w-])/.test(l) && !/&#/.test(l) && !definesToken(l) },
  { id: "rgb-fijo", why: "rgb()/rgba() fijo: usa un token o rgb(var(--hb-accent-rgb) / alfa) (§3)", test: (l) => /\brgba?\(\s*\d/.test(l) && !definesToken(l) },
  { id: "z-index-fijo", why: "capa con número suelto: usa var(--layer-*) (§5)", test: layerNumber },
  { id: "prueba-escrita", why: "duración de la prueba escrita a mano: usa PRICING_CONSTANTS.trialDays", test: (l) => /\d+\s+días\s+gratis|prueba de \d+\s+días/i.test(l) },
  // Solo los campos que guardan códigos internos; otros `status` ya se guardan en español («Activo», «Pendiente»).
  { id: "estado-crudo", why: "valor interno mostrado tal cual: usa una etiqueta de lib/labels.ts", test: (l) => /(?<![=\w])\{\s*([\w.?]+\.kind|(post|\w+Post)\??\.status)\s*\}/.test(l) },
  { id: "degradado", why: "degradado decorativo (§15)", test: (l) => /(linear|radial|conic)-gradient|bg-(gradient|linear)-/.test(l) },
  { id: "lucide", why: "iconos de lucide: usa DuotoneIcons (§6)", test: (l) => /from\s+["']lucide-react["']/.test(l) },
  { id: "emoji", why: "emoji en la interfaz: usa un icono duotono (§15)", test: (l) => /\p{Extended_Pictographic}/u.test(l.replace(/[©®™]/g, "")) },
  { id: "dialogo-nativo", why: "alert/confirm/prompt nativo: usa askConfirm o askText (§9)", test: (l) => /\b(window\.)?(alert|confirm|prompt)\(/.test(l) && !/askConfirm|askText/.test(l) },
  { id: "exclamacion", why: "exclamación en el texto de interfaz (§14)", test: (l) => /["'`>]\s*¡/.test(l) },
  { id: "tailwind-color", why: "color de Tailwind: usa un token (§3)", test: (l) => /\b(bg|text|border|ring)-(red|green|emerald|blue|indigo|violet|purple|pink|gray|slate|zinc|neutral|amber|yellow)-\d{2,3}\b/.test(l) },
  { id: "transition-all", why: "transition: all; nombra las propiedades (§7)", test: (l) => /transition(-property)?:\s*["']?all\b/.test(l) },
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
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|css)$/.test(name)) out.push(full);
  }
  return out;
}

function scanFile(full, rules, result) {
  const file = relative(root, full).split(sep).join("/");
  readFileSync(full, "utf8").split(/\r?\n/).forEach((line, index) => {
    if (line.includes("ui-ok:")) return;
    for (const rule of rules) {
      if (!rule.test(line)) continue;
      result[file] ??= {};
      result[file][rule.id] ??= [];
      result[file][rule.id].push(index + 1);
    }
  });
}

function scan() {
  const result = {};
  for (const dir of scanDirs) {
    for (const full of walk(join(root, dir))) {
      const file = relative(root, full).split(sep).join("/");
      if (skipped.some((re) => re.test(file))) continue;
      scanFile(full, RULES, result);
    }
  }
  for (const [file, ids] of Object.entries(scanFiles)) {
    scanFile(join(root, file), RULES.filter((r) => ids.includes(r.id)), result);
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

const found = scan();
const args = process.argv.slice(2);

if (args.includes("--update")) {
  writeFileSync(baselinePath, `${JSON.stringify(toCounts(found), null, 2)}\n`);
  console.log(`Base actualizada: ${Object.keys(found).length} archivos con deuda.`);
  process.exit(0);
}

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
const why = Object.fromEntries(RULES.map((r) => [r.id, r.why]));
let worse = 0;
let debt = 0;

for (const [file, rules] of Object.entries(found)) {
  for (const [id, lines] of Object.entries(rules)) {
    const allowed = baseline[file]?.[id] ?? 0;
    debt += lines.length;
    if (lines.length > allowed) {
      worse += 1;
      console.error(`✗ ${file}: ${why[id]}\n  ${lines.length} hallazgos, permitidos ${allowed}. Líneas: ${lines.join(", ")}`);
    } else if (args.includes("--list")) {
      console.log(`· ${file} [${id}] líneas: ${lines.join(", ")}`);
    }
  }
}

if (worse > 0) {
  console.error(`\nEl chequeo falló: ${worse} regla(s) empeoraron. Corrige el código; no actualices la base para pasar.`);
  process.exit(1);
}
console.log(`Chequeo de UI correcto. Deuda heredada sin empeorar: ${debt} hallazgos.`);
