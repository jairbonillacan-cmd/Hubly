#!/usr/bin/env node
/*
 * Reglas de dependencia de docs/deslop/02-ARQUITECTURA-OBJETIVO.md.
 * Compara contra scripts/check-capas-baseline.json: lo que ya viola una regla no
 * falla, pero ningún archivo puede sumar violaciones y uno nuevo debe salir limpio.
 *
 *   npm run check:capas              revisa
 *   npm run check:capas -- --list    además muestra cada violación heredada
 *   npm run check:capas -- --update  reescribe la base (solo tras reducir deuda)
 *
 * La pantalla pública de un dominio es su archivo `<Algo>View.tsx`: solo esas se
 * pueden importar entre dominios (regla 3). --root apunta a otro árbol; lo usan
 * las pruebas.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const args = process.argv.slice(2);
const rootArg = args.indexOf("--root");
if (rootArg !== -1 && !args[rootArg + 1]) {
  console.error("Falta la ruta después de --root.");
  process.exit(2);
}
const root = rootArg === -1 ? join(dirname(fileURLToPath(import.meta.url)), "..") : args[rootArg + 1];
const baselinePath = join(root, "scripts", "check-capas-baseline.json");

const RULES = [
  { id: "lib-importa-arriba", why: "lib/ importa de components/ o app/ (regla 1)" },
  { id: "dominio-impuro", why: "lib/domain/ no es puro: React, store, red o window (regla 2)" },
  { id: "dominio-cruzado", why: "un dominio importa otro sin pasar por su pantalla (regla 3)" },
  { id: "slice-cruzado", why: "un slice importa otro slice (regla 4)" },
  { id: "server-en-cliente", why: "un módulo de cliente importa lib/server/ (regla 5)" },
];
const why = Object.fromEntries(RULES.map((rule) => [rule.id, rule.why]));
const SHARED = new Set(["ui", "icons"]);
const IMPURE_PACKAGE = /^(react|react-dom|zustand|@supabase(\/|$))/;
const IMPURE_PATH = /^(lib\/store(\/|\.ts$)|lib\/(supabase|server)\/)/;
const PURE_NAMES = new Set(["window", "document", "localStorage", "sessionStorage", "fetch"]);

const toPosix = (path) => path.split(sep).join("/");
const domainOf = (path) => path.match(/^components\/app\/([^/]+)\//)?.[1] ?? null;
const isScreen = (path) => /^components\/app\/[^/]+\/[A-Z][^/]*View\.tsx$/.test(path);
const isSlice = (path) => /^lib\/store\/[^/]+\.slice\.tsx?$/.test(path);

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) yield path;
  }
}

function importsOf(source) {
  const found = [];
  const lineOf = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      found.push({ line: lineOf(statement), specifier: statement.moduleSpecifier.text });
    } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      found.push({ line: lineOf(statement), specifier: statement.moduleSpecifier.text });
    }
  }
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      found.push({ line: lineOf(node.arguments[0]), specifier: node.arguments[0].text });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function resolveSpecifier(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) base = join(root, specifier.slice(2));
  else if (specifier.startsWith(".")) base = join(dirname(fromFile), specifier);
  else return { package: specifier };
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return { file: toPosix(relative(root, candidate)) };
  }
  return {};
}

const isClientModule = (source) => {
  const [first] = source.statements;
  return Boolean(first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === "use client");
};

// Nombres que delatan red o DOM. Se ignoran como nombre de propiedad, declaración o import.
function isName(node) {
  const parent = node.parent;
  if (!parent) return false;
  return (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isQualifiedName(parent) && parent.right === node) ||
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
    (ts.isParameter(parent) && parent.name === node) ||
    (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isPropertyDeclaration(parent) && parent.name === node) ||
    ts.isImportSpecifier(parent) ||
    ts.isExportSpecifier(parent)
  );
}

function impureUsage(source) {
  const found = [];
  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      found.push({ line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, name: "JSX" });
      return;
    }
    if (ts.isIdentifier(node) && PURE_NAMES.has(node.text) && !isName(node)) {
      found.push({ line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, name: node.text });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function scan() {
  const found = {};
  const add = (file, id, line, detail) => {
    found[file] ??= {};
    found[file][id] ??= [];
    found[file][id].push({ line, detail });
  };
  for (const dir of ["app", "components", "lib"]) {
    for (const path of walk(join(root, dir))) {
      const file = toPosix(relative(root, path));
      const source = ts.createSourceFile(file, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const client = isClientModule(source);
      for (const { line, specifier } of importsOf(source)) {
        const target = resolveSpecifier(specifier, path);
        const targetFile = target.file;
        if (file.startsWith("lib/") && targetFile && /^(components|app)\//.test(targetFile)) {
          add(file, "lib-importa-arriba", line, targetFile);
        }
        if (file.startsWith("lib/domain/") && ((target.package && IMPURE_PACKAGE.test(target.package)) || (targetFile && IMPURE_PATH.test(targetFile)))) {
          add(file, "dominio-impuro", line, targetFile ?? target.package);
        }
        const fromDomain = domainOf(file);
        const toDomain = targetFile ? domainOf(targetFile) : null;
        if (fromDomain && toDomain && fromDomain !== toDomain && !SHARED.has(toDomain) && !isScreen(targetFile)) {
          add(file, "dominio-cruzado", line, targetFile);
        }
        if (isSlice(file) && targetFile && isSlice(targetFile)) add(file, "slice-cruzado", line, targetFile);
        if (targetFile?.startsWith("lib/server/") && client && !file.startsWith("app/api/")) add(file, "server-en-cliente", line, targetFile);
      }
      if (file.startsWith("lib/domain/")) {
        for (const { line, name } of impureUsage(source)) add(file, "dominio-impuro", line, name);
      }
    }
  }
  return found;
}

const toCounts = (found) =>
  Object.fromEntries(
    Object.keys(found).sort().map((file) => [
      file,
      Object.fromEntries(Object.keys(found[file]).sort().map((id) => [id, found[file][id].length])),
    ]),
  );

const countRule = (counts, id) =>
  Object.values(counts).reduce((sum, rules) => sum + (rules[id] ?? 0), 0);

const found = scan();
const counts = toCounts(found);
const violations = Object.values(counts).reduce(
  (sum, rules) => sum + Object.values(rules).reduce((total, count) => total + count, 0),
  0,
);

if (args.includes("--update")) {
  writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`Base actualizada: ${violations} violaciones en ${Object.keys(counts).length} archivos.`);
  process.exit(0);
}

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
let worse = 0;

for (const [file, rules] of Object.entries(counts)) {
  for (const [id, count] of Object.entries(rules)) {
    const allowed = baseline[file]?.[id] ?? 0;
    if (count > allowed) {
      worse += 1;
      const lines = found[file][id].map(({ line }) => line);
      console.error(`✗ ${file}: ${why[id]}\n  ${count} hallazgos, permitidos ${allowed}. Líneas: ${lines.join(", ")}`);
    } else if (args.includes("--list")) {
      const hits = found[file][id].map(({ line, detail }) => `${line} → ${detail}`);
      console.log(`· ${file} [${id}] ${hits.join(", ")}`);
    }
  }
}

const summary = RULES.map(({ id }) => `${id}: ${countRule(counts, id)}`).join(", ");
if (worse > 0) {
  console.error(`\nEl chequeo falló: ${worse} archivo(s) o regla(s) empeoraron. Corrige el código; no actualices la base para pasar.`);
  console.error(`Violaciones encontradas por regla: ${summary}.`);
  process.exit(1);
}
console.log(`Chequeo de capas correcto. Violaciones heredadas sin empeorar: ${violations} (${summary}).`);
