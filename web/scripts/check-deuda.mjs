#!/usr/bin/env node
/*
 * Impide que un PR suba las bases de deuda para que un chequeo pase.
 * Compara contra la rama indicada: node scripts/check-deuda.mjs origin/main
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = process.argv[2];
if (!base) {
  console.error("Indica la rama base: node scripts/check-deuda.mjs origin/main");
  process.exit(2);
}
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
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

const measures = [
  ["scripts/check-ui-baseline.json", (text) => total(JSON.parse(text))],
  ["scripts/check-size-baseline.json", (text) => total(JSON.parse(text))],
  ["package.json", maxWarnings],
];

let failed = false;
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
