#!/usr/bin/env node
/*
 * Imprime las medidas del plan de deslop en Markdown. Solo lee; no falla.
 * Cada medida se define aquí para que dos personas obtengan la misma cifra.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { NUEVAS } from "./check-ui-reglas.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const sources = [];
for (const dir of ["app", "components", "lib"]) {
  for (const path of walk(join(root, dir))) {
    if (![".ts", ".tsx", ".css"].includes(extname(path)) || /\.test\./.test(path)) continue;
    const text = readFileSync(path, "utf8");
    sources.push({ file: relative(root, path).split(sep).join("/"), text, lines: text.split("\n").length });
  }
}

const count = (text, pattern) => (text.match(pattern) ?? []).length;
const sum = (files, pattern) => files.reduce((total, { text }) => total + count(text, pattern), 0);
const code = sources.filter(({ file }) => !file.endsWith(".css"));
const css = sources.filter(({ file }) => file.endsWith(".css"));
// Imitan a otras apps o son dibujos: el plan los trata como excepción.
const excepted = ({ file }) => /^components\/(previews|app\/icons)\//.test(file);
// La deuda de `check:ui` se mide aparte: lo que marcan las reglas de siempre y
// lo que añadieron las nuevas. Se suman las dos bases, que también van aparte.
const uiDebt = (nuevas) =>
  ["check-ui-baseline.json", "check-ui-rutas-baseline.json"].reduce((sum, name) => {
    const counts = JSON.parse(readFileSync(join(root, "scripts", name), "utf8"));
    return (
      sum +
      Object.values(counts).reduce(
        (perFile, rules) =>
          perFile + Object.entries(rules).reduce((perRule, [id, count]) => perRule + (NUEVAS.has(id) === nuevas ? count : 0), 0),
        0,
      )
    );
  }, 0);

const rows = [
  ["Líneas de `lib/store.ts`", sources.find(({ file }) => file === "lib/store.ts")?.lines ?? 0],
  ["Archivos sobre 400 líneas, sin simuladores ni iconos", sources.filter((s) => s.lines > 400 && !excepted(s)).length],
  ["Simuladores e iconos sobre 400 líneas", sources.filter((s) => s.lines > 400 && excepted(s)).length],
  ["`page.tsx` sobre 80 líneas", code.filter(({ file, lines }) => file.endsWith("page.tsx") && lines > 80).length],
  ["Archivos con prop `view`", code.filter(({ text }) => /\(\{\s*view\b|\bview:\s*\w+(Model|View)\b/.test(text)).length],
  ["`style={{` sin simuladores", sum(code.filter((s) => !excepted(s)), /style=\{\{/g)],
  ["Deuda de `check:ui`: reglas de siempre", uiDebt(false)],
  ["Deuda de `check:ui`: reglas nuevas", uiDebt(true)],
  ["Deuda de `check:ui`: total", uiDebt(false) + uiDebt(true)],
  ["`!important` en CSS", sum(css, /!important/g)],
  ["Líneas con `eslint-disable`", sum(code, /eslint-disable/g)],
  ["Exenciones `ui-ok:`", sum(sources, /ui-ok:/g)],
  ["`as unknown as`", sum(code, /as unknown as/g)],
  ["Archivos que leen `backendEnabled`", code.filter(({ text }) => /backendEnabled/.test(text)).length],
];

console.log("| Medida | Valor |\n|---|---:|");
for (const [name, value] of rows) console.log(`| ${name} | ${value} |`);
