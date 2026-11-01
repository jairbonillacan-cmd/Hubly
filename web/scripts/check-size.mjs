#!/usr/bin/env node
/*
 * Tope de tamaño del código. Un archivo nuevo tiene hasta 400 líneas, y los que ya
 * lo superan (scripts/check-size-baseline.json) no pueden crecer.
 *
 *   npm run check:size            revisa
 *   npm run check:size -- --update  reescribe la base (solo tras reducir deuda)
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_LINES = 400;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, "scripts", "check-size-baseline.json");
const extensions = new Set([".ts", ".tsx", ".css"]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (extensions.has(extname(name)) && !/\.test\./.test(name)) yield path;
  }
}

const found = {};
for (const dir of ["app", "components", "lib"]) {
  for (const path of walk(join(root, dir))) {
    const lines = readFileSync(path, "utf8").split("\n").length;
    if (lines > MAX_LINES) found[relative(root, path).split(sep).join("/")] = lines;
  }
}

if (process.argv.includes("--update")) {
  const sorted = Object.fromEntries(Object.entries(found).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`Base reescrita: ${Object.keys(found).length} archivos de más de ${MAX_LINES} líneas.`);
  process.exit(0);
}

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
const failures = Object.entries(found).filter(([file, lines]) => lines > (baseline[file] ?? MAX_LINES));
for (const [file, lines] of failures) console.error(`${file}: ${lines} líneas, tope ${baseline[file] ?? MAX_LINES}`);
if (failures.length) process.exit(1);
console.log(`Chequeo de tamaño correcto. Archivos grandes sin crecer: ${Object.keys(found).length}.`);
