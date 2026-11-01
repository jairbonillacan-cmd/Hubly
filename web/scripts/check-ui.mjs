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

function scan() {
  const result = {};
  for (const dir of scanDirs) {
    for (const full of walk(join(root, dir))) {
      const file = relative(root, full).split(sep).join("/");
      if (skipped.some((re) => re.test(file))) continue;
      readFileSync(full, "utf8").split(/\r?\n/).forEach((line, index) => {
        if (line.includes("ui-ok:")) return;
        for (const rule of RULES) {
          if (!rule.test(line)) continue;
          result[file] ??= {};
          result[file][rule.id] ??= [];
          result[file][rule.id].push(index + 1);
        }
      });
    }
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
