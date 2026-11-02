#!/usr/bin/env node
/*
 * Impide que un PR suba las bases de deuda para que un chequeo pase.
 * Compara contra la rama indicada: node scripts/check-deuda.mjs origin/main
 * --root apunta a otro árbol; lo usan las pruebas.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const base = args[0];
if (!base || base.startsWith("--")) {
  console.error("Indica la rama base: node scripts/check-deuda.mjs origin/main");
  process.exit(2);
}
const rootArg = args.indexOf("--root");
if (rootArg !== -1 && !args[rootArg + 1]) {
  console.error("Falta la ruta después de --root.");
  process.exit(2);
}
const root = rootArg === -1 ? join(dirname(fileURLToPath(import.meta.url)), "..") : args[rootArg + 1];
const current = (path) => readFileSync(join(root, path), "utf8");
const previous = (path) => {
  try {
    return execFileSync("git", ["show", `${base}:web/${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
};

const total = (value) =>
  typeof value === "number" ? value : Object.values(value).reduce((sum, item) => sum + total(item), 0);
const maxWarnings = (text) => Number(JSON.parse(text).scripts.lint.match(/--max-warnings (\d+)/)?.[1] ?? 0);

// Por regla: una regla nueva añade deuda ya existente sin que nadie haya empeorado nada.
const byRule = (text) => {
  const rules = {};
  for (const counts of Object.values(JSON.parse(text))) {
    for (const [id, count] of Object.entries(counts)) rules[id] = (rules[id] ?? 0) + count;
  }
  return rules;
};

const measures = [
  ["scripts/check-size-baseline.json", (text) => total(JSON.parse(text))],
  ["package.json", maxWarnings],
];
const guarded = [
  { path: "scripts/check-ui-baseline.json", absentMeansZero: false },
  // En capas cada regla existe desde el principio: si aparece con deuda, es nueva.
  { path: "scripts/check-capas-baseline.json", absentMeansZero: true },
];

let failed = false;
for (const { path, absentMeansZero } of guarded) {
  const before = previous(path);
  if (before === null) continue;
  const was = byRule(before);
  const now = byRule(current(path));
  const ids = absentMeansZero ? Object.keys(now) : Object.keys(was);
  for (const id of ids) {
    const [from, to] = [was[id] ?? 0, now[id] ?? 0];
    if (to > from) {
      console.error(`${path}: la regla ${id} subió de ${from} a ${to}`);
      failed = true;
    }
  }
}
for (const [path, measure] of measures) {
  const before = previous(path);
  if (before === null) continue;
  const [was, now] = [measure(before), measure(current(path))];
  if (now > was) {
    console.error(`${path}: la deuda subió de ${was} a ${now}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("La deuda no subió.");
