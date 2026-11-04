import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-capas.mjs");
const deuda = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-deuda.mjs");
const trees: string[] = [];

after(() => {
  for (const tree of trees) rmSync(tree, { recursive: true, force: true });
});

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "hubly-capas-"));
  trees.push(root);
  mkdirSync(join(root, "scripts"), { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

function run(root: string, ...extra: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [script, "--root", root, ...extra], { encoding: "utf8" });
}

function falla(result: SpawnSyncReturns<string>, ...needles: string[]) {
  assert.equal(result.status, 1, `salió con ${result.status}: ${result.stdout}`);
  for (const needle of needles) assert.ok(result.stderr.includes(needle), `stderr sin «${needle}»:\n${result.stderr}`);
}

function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")}: ${result.stderr}`);
}

function repo(files: Record<string, string>): string {
  const root = tree(files);
  git(root, "init", "-q");
  git(root, "add", ".");
  git(root, "-c", "user.name=Pruebas", "-c", "user.email=pruebas@example.com", "-c", "commit.gpgsign=false", "commit", "-qm", "base");
  return root;
}

function runDeuda(root: string, cwd = root): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [deuda, "HEAD", "--root", join(root, "web")], { cwd, encoding: "utf8" });
}

test("un import de lib/ a components/ hace fallar el chequeo", () => {
  const root = tree({
    "components/Cover.tsx": "export function Cover() { return null; }\n",
    "lib/util.ts": 'import { Cover } from "@/components/Cover";\nexport const vista = Cover;\n',
  });
  falla(run(root), "lib/util.ts", "lib-importa-arriba", "1 hallazgos, permitidos 0");
});

test("un import de tipo en línea también cuenta", () => {
  const root = tree({
    "components/Cover.tsx": "export type T = string;\n",
    "lib/util.ts": 'export type Vista = import("@/components/Cover").T;\n',
  });
  falla(run(root), "lib/util.ts", "lib-importa-arriba", "1 hallazgos, permitidos 0");
});

test("un árbol sin violaciones pasa", () => {
  const root = tree({ "lib/util.ts": "export const uno = 1;\n" });
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("Chequeo de capas correcto. Violaciones heredadas sin empeorar: 0"));
});

test("la base absorbe la deuda existente y frena una violación nueva", () => {
  const root = tree({
    "components/Cover.tsx": "export function Cover() { return null; }\n",
    "lib/viejo.ts": 'import { Cover } from "@/components/Cover";\nexport const uno = Cover;\n',
  });
  assert.equal(run(root, "--update").status, 0);
  assert.equal(run(root).status, 0);

  writeFileSync(join(root, "lib/nuevo.ts"), 'import { Cover } from "@/components/Cover";\nexport const dos = Cover;\n');
  falla(run(root), "lib/nuevo.ts", "lib-importa-arriba");

  writeFileSync(join(root, "lib/viejo.ts"), 'import { Cover } from "@/components/Cover";\nimport { Cover as Otra } from "@/components/Cover";\nexport const uno = [Cover, Otra];\n');
  falla(run(root), "lib/viejo.ts", "2 hallazgos, permitidos 1");
});

test("un dominio no importa las secciones de otro, pero sí su pantalla", () => {
  const root = tree({
    "components/app/social/ComposerPanels.tsx": "export const Panels = 1;\n",
    "components/app/social/SocialView.tsx": "export const SocialView = 1;\n",
    "components/app/compositor/Seccion.tsx": 'import { Panels } from "@/components/app/social/ComposerPanels";\nexport const x = Panels;\n',
    "components/app/compositor/Pantalla.tsx": 'import { SocialView } from "@/components/app/social/SocialView";\nexport const y = SocialView;\n',
  });
  const result = run(root);
  falla(result, "components/app/compositor/Seccion.tsx", "dominio-cruzado");
  assert.ok(!result.stderr.includes("Pantalla.tsx"), "la pantalla pública no debe fallar");
});

test("lib/domain/ es puro: sin React, store, red ni window", () => {
  const root = tree({
    "lib/store.ts": "export const store = 1;\n",
    "lib/domain/posts.ts": 'import { useState } from "react";\nexport const visible = typeof window !== "undefined";\n',
  });
  falla(run(root), "lib/domain/posts.ts", "dominio-impuro", "2 hallazgos");
});

test("globalThis no cuela red ni DOM en lib/domain", () => {
  const root = tree({
    "lib/domain/posts.ts": 'const r = globalThis.fetch("/api/x");\nconst w = globalThis.window;\nconst s = self.fetch;\nexport const x = [r, w, s];\n',
  });
  falla(run(root), "lib/domain/posts.ts", "dominio-impuro", "3 hallazgos, permitidos 0", "globalThis.fetch", "globalThis.window", "self.fetch");
});

test("un slice no importa otro slice", () => {
  const root = tree({
    "lib/store/a.slice.ts": 'import type { B } from "./b.slice";\nexport type A = B;\n',
    "lib/store/b.slice.ts": "export type B = number;\n",
  });
  falla(run(root), "lib/store/a.slice.ts", "slice-cruzado");
});

test("un componente de cliente no importa lib/server/", () => {
  const root = tree({
    "lib/server/secreto.ts": "export const secreto = 1;\n",
    "components/app/chat/Cliente.tsx": '"use client";\nimport { secreto } from "@/lib/server/secreto";\nexport const x = secreto;\n',
    "components/app/chat/Servidor.tsx": 'import { secreto } from "@/lib/server/secreto";\nexport const y = secreto;\n',
  });
  const result = run(root);
  falla(result, "components/app/chat/Cliente.tsx", "server-en-cliente");
  assert.ok(!result.stderr.includes("Servidor.tsx"), "un componente de servidor sí puede importarlo");
});

test("lo compartido tampoco importa de un dominio", () => {
  const root = tree({
    "components/app/social/Panel.tsx": "export const Panel = 1;\n",
    "components/app/ui/Boton.tsx": 'import { Panel } from "@/components/app/social/Panel";\nexport const x = Panel;\n',
  });
  falla(run(root), "components/app/ui/Boton.tsx", "dominio-cruzado");
});

test("lib/domain/ no admite JSX", () => {
  const root = tree({ "lib/domain/vista.tsx": "export const Vista = () => <div>hola</div>;\n" });
  falla(run(root), "lib/domain/vista.tsx", "dominio-impuro", "1 hallazgos, permitidos 0");
});

const deudaBase = {
  "web/package.json": JSON.stringify({ scripts: { lint: "eslint . --max-warnings 0" } }),
  "web/scripts/check-size-baseline.json": "{}\n",
  "web/scripts/check-ui-baseline.json": "{}\n",
  "web/scripts/check-capas-baseline.json": "{}\n",
};

test("check-deuda frena una regla de capas que pasa de 0 a 1", () => {
  const root = repo({ ...deudaBase, "web/scripts/check-capas-baseline.json": '{"lib/viejo.ts":{"lib-importa-arriba":1}}\n' });
  writeFileSync(join(root, "web/scripts/check-capas-baseline.json"), '{"lib/viejo.ts":{"lib-importa-arriba":1},"lib/domain/probe.ts":{"dominio-impuro":1}}\n');
  const result = runDeuda(root);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("scripts/check-capas-baseline.json: la regla dominio-impuro subió de 0 a 1"), result.stderr);
});

test("check-deuda no cuenta las reglas nuevas de check-ui como deuda, pero vigila las de siempre", () => {
  const root = repo({ ...deudaBase, "web/scripts/check-ui-baseline.json": '{"components/app/x.tsx":{"color-fijo":1}}\n' });

  // F0-3 añade reglas: su deuda ya existía y no es un empeoramiento.
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":1,"style-inline":5}}\n');
  // Una base nueva tampoco: no había nada con qué compararla.
  writeFileSync(join(root, "web/scripts/check-ui-rutas-baseline.json"), '{"app/page.tsx":{"style-inline":3}}\n');
  const pasa = runDeuda(root);
  assert.equal(pasa.status, 0, pasa.stderr);
  assert.ok(pasa.stdout.includes("La deuda no subió."));

  // Si esta vigilancia se rompe, esta subida pasaría sin aviso.
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":2}}\n');
  const sube = runDeuda(root);
  assert.equal(sube.status, 1, sube.stdout);
  assert.ok(sube.stderr.includes("scripts/check-ui-baseline.json: la regla color-fijo subió de 1 a 2"), sube.stderr);

  // Una regla de siempre que estaba en 0 (ausente en was) tampoco puede subir a 1.
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":1,"lucide":1}}\n');
  const deCeroAUno = runDeuda(root);
  assert.equal(deCeroAUno.status, 1, deCeroAUno.stdout);
  assert.ok(deCeroAUno.stderr.includes("scripts/check-ui-baseline.json: la regla lucide subió de 0 a 1"), deCeroAUno.stderr);
});

test("check-deuda admite la deuda inicial de una tanda nueva, en las dos bases de check-ui", () => {
  const root = repo({
    ...deudaBase,
    "web/scripts/check-ui-baseline.json": '{"components/app/x.tsx":{"color-fijo":1,"style-inline":2}}\n',
    "web/scripts/check-ui-rutas-baseline.json": '{"app/page.tsx":{"style-inline":3}}\n',
  });
  // La tanda «capas» llega con deuda que ya existía en el código: no es un empeoramiento.
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":1,"style-inline":2,"z-index-fijo":3}}\n');
  writeFileSync(join(root, "web/scripts/check-ui-rutas-baseline.json"), '{"app/page.tsx":{"style-inline":3,"z-index-fijo":1}}\n');
  const pasa = runDeuda(root);
  assert.equal(pasa.status, 0, pasa.stderr);

  // Una tanda que ya estaba en la base (F0-3) sigue vigilada aunque llegue otra.
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":1,"style-inline":3,"z-index-fijo":3}}\n');
  const sube = runDeuda(root);
  assert.equal(sube.status, 1, sube.stdout);
  assert.ok(sube.stderr.includes("scripts/check-ui-baseline.json: la regla style-inline subió de 2 a 3"), sube.stderr);
});

test("check-deuda no deja volver una regla ya declarada que se limpió hasta 0", () => {
  // En la base la regla existe en check-ui.mjs, pero su deuda ya se limpió y no aparece.
  const root = repo({
    ...deudaBase,
    "web/scripts/check-ui.mjs": 'const RULES = [{ id: "z-index-fijo" }];\n',
    "web/scripts/check-ui-baseline.json": '{"components/app/x.tsx":{"color-fijo":1}}\n',
  });
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":1,"z-index-fijo":1}}\n');
  const result = runDeuda(root);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("scripts/check-ui-baseline.json: la regla z-index-fijo subió de 0 a 1"), result.stderr);
});

test("check-deuda vigila la base de las rutas fuera de (app)", () => {
  const root = repo({ ...deudaBase, "web/scripts/check-ui-rutas-baseline.json": '{"app/share/[token]/page.tsx":{"style-inline":45}}\n' });
  writeFileSync(join(root, "web/scripts/check-ui-rutas-baseline.json"), '{"app/share/[token]/page.tsx":{"style-inline":46}}\n');
  const result = runDeuda(root);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(
    result.stderr.includes("scripts/check-ui-rutas-baseline.json: la regla style-inline subió de 45 a 46"),
    result.stderr,
  );

  // También si una regla que partía de 0 en esa base sube a 1.
  writeFileSync(join(root, "web/scripts/check-ui-rutas-baseline.json"), '{"app/share/[token]/page.tsx":{"style-inline":45,"view-prop":1}}\n');
  const desdeCero = runDeuda(root);
  assert.equal(desdeCero.status, 1, desdeCero.stdout);
  assert.ok(
    desdeCero.stderr.includes("scripts/check-ui-rutas-baseline.json: la regla view-prop subió de 0 a 1"),
    desdeCero.stderr,
  );
});

test("--root compara contra el repositorio del árbol apuntado, no contra el del cwd", () => {
  // El repo del cwd no tiene la base: antes, `git show` fallaba y se saltaba la comprobación.
  const ajeno = repo({ "web/package.json": JSON.stringify({ scripts: { lint: "eslint . --max-warnings 0" } }) });
  const root = repo({ ...deudaBase, "web/scripts/check-ui-rutas-baseline.json": '{"app/page.tsx":{"style-inline":3}}\n' });
  writeFileSync(join(root, "web/scripts/check-ui-rutas-baseline.json"), '{"app/page.tsx":{"style-inline":4}}\n');

  const result = runDeuda(root, ajeno);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("scripts/check-ui-rutas-baseline.json: la regla style-inline subió de 3 a 4"), result.stderr);
});

test("--root a través de un enlace sigue comparando contra la base", () => {
  // En macOS el temporal vive en /var, un enlace a /private/var: comparar cadenas en
  // vez de rutas reales sacaba al árbol del repositorio y `git show` no encontraba
  // nada, así que el chequeo pasaba en verde sin mirar la base.
  const root = repo({ ...deudaBase, "web/scripts/check-ui-baseline.json": '{"components/app/x.tsx":{"color-fijo":1}}\n' });
  writeFileSync(join(root, "web/scripts/check-ui-baseline.json"), '{"components/app/x.tsx":{"color-fijo":2}}\n');
  const enlace = mkdtempSync(join(tmpdir(), "hubly-enlace-"));
  trees.push(enlace);
  const alias = join(enlace, "alias");
  symlinkSync(root, alias);

  const result = runDeuda(alias);
  assert.equal(result.status, 1, result.stdout);
  assert.ok(result.stderr.includes("scripts/check-ui-baseline.json: la regla color-fijo subió de 1 a 2"), result.stderr);
});

test("--root fuera de un repositorio avisa en vez de dar verde", () => {
  const result = runDeuda(tree(deudaBase));
  assert.equal(result.status, 2, result.stdout);
  assert.ok(result.stderr.includes("--root no apunta a un repositorio git"), result.stderr);
});

test("check-deuda frena una exención nueva y admite moverla de archivo", () => {
  const exento = "// ui-ok: motivo\n// eslint-disable-next-line regla\nconst a = 1;\n";
  const root = repo({ ...deudaBase, "web/app/pantalla.tsx": exento });

  // Mover el archivo sin tocar las líneas conserva el total.
  writeFileSync(join(root, "web/app/otra.tsx"), exento);
  rmSync(join(root, "web/app/pantalla.tsx"));
  const movido = runDeuda(root);
  assert.equal(movido.status, 0, movido.stderr);

  writeFileSync(join(root, "web/app/otra.tsx"), "// ui-ok: motivo\n// ui-ok: otro motivo\n// eslint-disable-next-line regla\nconst a = 1;\n");
  const uiOk = runDeuda(root);
  assert.equal(uiOk.status, 1, uiOk.stdout);
  assert.ok(uiOk.stderr.includes("Exenciones ui-ok: subieron de 1 a 2"), uiOk.stderr);

  writeFileSync(
    join(root, "web/app/otra.tsx"),
    "// ui-ok: motivo\n// eslint-disable-next-line regla\n// eslint-disable-next-line otra\nconst a = 1;\n",
  );
  const eslint = runDeuda(root);
  assert.equal(eslint.status, 1, eslint.stdout);
  assert.ok(eslint.stderr.includes("Exenciones eslint-disable: subieron de 1 a 2"), eslint.stderr);
});
