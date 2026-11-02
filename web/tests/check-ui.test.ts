import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "check-ui.mjs");
const trees: string[] = [];

after(() => {
  for (const tree of trees) rmSync(tree, { recursive: true, force: true });
});

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "hubly-ui-"));
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

test("un style={{ nuevo falla", () => {
  const root = tree({ "components/app/Nuevo.tsx": "export function Nuevo() {\n  return <div style={{ padding: 4 }} />;\n}\n" });
  falla(run(root), "components/app/Nuevo.tsx", "style-inline", "1 hallazgos, permitidos 0");
});

test("un !important nuevo falla", () => {
  const root = tree({ "app/(app)/nuevo.css": ".nuevo {\n  color: var(--ui-text);\n  padding: 4px !important;\n}\n" });
  falla(run(root), "app/(app)/nuevo.css", "important", "1 hallazgos, permitidos 0");
});

test("una sección que recibe view falla", () => {
  const root = tree({
    "components/app/team/Resumen.tsx": "export function Resumen({ view }: { view: EquipoViewModel }) {\n  return <p>{view.profile.name}</p>;\n}\n",
  });
  falla(run(root), "components/app/team/Resumen.tsx", "view-prop");
});

test("useHublyStore() sin selector falla, con selector no", () => {
  const root = tree({
    "components/app/inicio/useInicioView.tsx":
      'import { useHublyStore } from "@/lib/store";\nexport const useInicioView = () => {\n  const store = useHublyStore();\n  const perfil = useHublyStore((s) => s.profile);\n  return { store, perfil };\n};\n',
  });
  falla(run(root), "useInicioView.tsx", "use-store-sin-selector", "1 hallazgos, permitidos 0");
});

test("las reglas de siempre también vigilan las rutas fuera de (app)", () => {
  const root = tree({ "app/page.tsx": "export default function Inicio() {\n  return <main style={{ color: \"#FFFFFF\" }} />;\n}\n" });
  falla(run(root), "app/page.tsx", "color-fijo", "style-inline");
});

test("las rutas fuera de (app) llevan su propia base", () => {
  const root = tree({
    "components/app/Limpio.tsx": "export const Limpio = 1;\n",
    "app/login/page.tsx": "export default function Login() {\n  return <div style={{ padding: 4 }} />;\n}\n",
  });

  assert.equal(run(root, "--update").status, 0);

  // Cada base guarda solo su conjunto: la de la app no absorbe las rutas.
  const app = readFileSync(join(root, "scripts", "check-ui-baseline.json"), "utf8");
  const rutas = readFileSync(join(root, "scripts", "check-ui-rutas-baseline.json"), "utf8");
  assert.ok(!app.includes("app/login"), `la base de la app no debe tener las rutas:\n${app}`);
  assert.ok(rutas.includes("app/login/page.tsx"), `la base de las rutas debe tener la ruta:\n${rutas}`);

  assert.equal(run(root).status, 0);
  writeFileSync(
    join(root, "app/login/page.tsx"),
    "export default function Login() {\n  return (\n    <div>\n      <span style={{ padding: 4 }} />\n      <b style={{ margin: 2 }} />\n    </div>\n  );\n}\n",
  );
  falla(run(root), "app/login/page.tsx", "style-inline", "2 hallazgos, permitidos 1");
});

test("el resumen separa la deuda de siempre de la de las reglas nuevas", () => {
  const root = tree({
    "components/app/viejo.tsx": "export const Viejo = <div style={{ padding: 4 }} />;\n",
    "app/register/page.tsx": "export default function Register() {\n  return <div style={{ padding: 4 }} />;\n}\n",
  });
  assert.equal(run(root, "--update").status, 0);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("Deuda heredada sin empeorar: 2 hallazgos."), result.stdout);
  assert.ok(result.stdout.includes("De las reglas de siempre: 0. De las nuevas: 2."), result.stdout);
});

test("una línea con ui-ok: no cuenta", () => {
  const root = tree({
    "components/app/Exento.tsx": "const estilo = <div style={{ width: ancho }} />; // ui-ok: valor calculado\n",
  });
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("Deuda heredada sin empeorar: 0 hallazgos."));
});
