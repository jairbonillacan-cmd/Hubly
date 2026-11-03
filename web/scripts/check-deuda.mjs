#!/usr/bin/env node
/*
 * Impide que un PR suba las bases de deuda para que un chequeo pase.
 * Compara contra la rama indicada: node scripts/check-deuda.mjs origin/main
 * --root apunta a otro árbol del mismo repositorio; lo usan las pruebas.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { NUEVAS, esNueva } from "./check-ui-reglas.mjs";

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

// `git show` debe leer el repositorio que contiene a `root`, no el del cwd: con
// --root son distintos y antes se comparaba cualquier cosa, sin dar error.
const repo = (() => {
  try {
    return execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
})();
if (!repo) {
  console.error(`--root no apunta a un repositorio git: ${root}`);
  process.exit(2);
}
try {
  execFileSync("git", ["-C", repo, "rev-parse", "--verify", "--quiet", `${base}^{commit}`], { stdio: "ignore" });
} catch {
  console.error(`La rama base no existe: ${base}`);
  process.exit(2);
}

const prefix = relative(repo, root).split(sep).join("/");
const inRepo = (path) => (prefix ? `${prefix}/${path}` : path);
const current = (path) => readFileSync(join(root, path), "utf8");
const previous = (path) => {
  try {
    return execFileSync("git", ["-C", repo, "show", `${base}:${inRepo(path)}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
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
  // Toda regla ausente en la base vale 0; solo al cruzar F0-3 se ignoran las 4 nuevas que aún no existían en was.
  { path: "scripts/check-ui-baseline.json", skipInitialNewRules: true },
  { path: "scripts/check-ui-rutas-baseline.json", skipInitialNewRules: false },
  { path: "scripts/check-capas-baseline.json", skipInitialNewRules: false },
];

let failed = false;
for (const { path, skipInitialNewRules } of guarded) {
  const before = previous(path);
  if (before === null) continue;
  if (!existsSync(join(root, path))) {
    console.error(`${path}: desapareció; una base solo puede bajar, no borrarse.`);
    failed = true;
    continue;
  }
  const was = byRule(before);
  const now = byRule(current(path));
  const introducingNewRules = skipInitialNewRules && ![...NUEVAS].some((id) => id in was);
  const ids = Object.keys(now).filter((id) => !(introducingNewRules && esNueva(id)));
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

// Silenciar un chequeo con `ui-ok:` o `eslint-disable` es otra forma de subir la
// deuda. Se comparan los totales de las mismas carpetas que mide medir-deslop:
// mover un archivo sin cambiar sus líneas pasa.
const EXENCIONES = [
  { nombre: "ui-ok", patron: /ui-ok:/g },
  { nombre: "eslint-disable", patron: /eslint-disable/g },
];
const EXENCION_DIRS = ["app", "components", "lib"];
const EXENCION_EXT = /\.(ts|tsx|css)$/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXENCION_EXT.test(name)) yield path;
  }
}

function exemptionsNow() {
  const counts = Object.fromEntries(EXENCIONES.map(({ nombre }) => [nombre, 0]));
  for (const dir of EXENCION_DIRS) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    for (const path of walk(full)) {
      const text = readFileSync(path, "utf8");
      for (const { nombre, patron } of EXENCIONES) counts[nombre] += (text.match(patron) ?? []).length;
    }
  }
  return counts;
}

function exemptionsBase() {
  const counts = Object.fromEntries(EXENCIONES.map(({ nombre }) => [nombre, 0]));
  const paths = EXENCION_DIRS.map((dir) => `:(top)${inRepo(dir)}`);
  const grep = spawnSync("git", ["-C", repo, "grep", "-I", "--full-name", "-e", "ui-ok:", "-e", "eslint-disable", base, "--", ...paths], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  // 1 es «sin coincidencias», que es un total de cero.
  if (grep.status !== 0 && grep.status !== 1) {
    console.error(`No se pudieron leer las exenciones de ${base}: ${grep.stderr}`);
    process.exit(2);
  }
  for (const line of (grep.stdout ?? "").split("\n")) {
    const ref = line.indexOf(":");
    const next = line.indexOf(":", ref + 1);
    if (ref === -1 || next === -1) continue;
    // `<rama>:<ruta>:<contenido>`; la ruta que interesa es la del árbol apuntado.
    const [file, content] = [line.slice(ref + 1, next), line.slice(next + 1)];
    if (!EXENCION_EXT.test(file)) continue;
    for (const { nombre, patron } of EXENCIONES) counts[nombre] += (content.match(patron) ?? []).length;
  }
  return counts;
}

const was = exemptionsBase();
const now = exemptionsNow();
for (const { nombre } of EXENCIONES) {
  if (now[nombre] > was[nombre]) {
    console.error(`Exenciones ${nombre}: subieron de ${was[nombre]} a ${now[nombre]}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("La deuda no subió.");
