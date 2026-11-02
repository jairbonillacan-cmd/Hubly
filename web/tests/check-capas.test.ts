import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-capas.mjs");
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

test("un import de lib/ a components/ hace fallar el chequeo", () => {
  const root = tree({
    "components/Cover.tsx": "export function Cover() { return null; }\n",
    "lib/util.ts": 'import { Cover } from "@/components/Cover";\nexport const vista = Cover;\n',
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
