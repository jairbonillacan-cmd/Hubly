import { expect, test } from "@playwright/test";

// Contra el Supabase simulado, que usa las migraciones reales:
// node tests/dev-live.mjs 3210 54410 y E2E_LIVE=1 E2E_PORT=3210 E2E_MOCK_PORT=54410 npx playwright test e2e/marcas-live.spec.ts
const MOCK = `http://localhost:${process.env.E2E_MOCK_PORT || "54399"}`;
const KEY = { apikey: "clave-de-prueba", "Content-Type": "application/json" };
test.skip(!process.env.E2E_LIVE, "Requiere el modo con cuentas");

const unique = Date.now();
const signUp = async (email: string) =>
  (await (await fetch(`${MOCK}/auth/v1/signup`, { method: "POST", headers: KEY, body: JSON.stringify({ email, password: "clave-de-prueba", data: { name: email.split("@")[0] } }) })).json()) as { access_token: string; user: { id: string } };

test("asignar una marca limita lo que recibe el miembro y guardar no borra lo oculto", async ({ browser }) => {
  test.setTimeout(120_000);
  const [anaMail, betoMail] = [`ana${unique}@prueba.test`, `beto${unique}@prueba.test`];
  const ana = await signUp(anaMail);
  const beto = await signUp(betoMail);
  const auth = { ...KEY, Authorization: `Bearer ${ana.access_token}` };
  const agencyId = (await (await fetch(`${MOCK}/rest/v1/rpc/create_agency`, { method: "POST", headers: auth, body: JSON.stringify({ agency_name: "Prueba marcas" }) })).json()) as string;
  const brand = (id: string, name: string) => ({ id, name, handle: `@${id}`, initials: id, color: "#16324F" });
  await fetch(`${MOCK}/rest/v1/rpc/save_workspace`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      target_agency: agencyId,
      new_data: { brands: [brand("m1", "Marca Uno"), brand("m2", "Marca Dos")], posts: [{ id: "p1", brandId: "m1", title: "Post uno" }, { id: "p2", brandId: "m2", title: "Post dos" }], tasks: [], notebooks: [{ id: "n1", brandId: "m1", title: "Libreta uno" }, { id: "n2", brandId: "m2", title: "Libreta dos" }] },
      expected_version: 1,
    }),
  });
  await fetch(`${MOCK}/__test/member`, { method: "POST", headers: KEY, body: JSON.stringify({ agencyId, userId: beto.user.id, role: "editor" }) });

  const enter = async (email: string) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/login?next=%2Fajustes%3Ftab%3Dequipo");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/ajustes**");
    return page;
  };
  const leer = (page: Awaited<ReturnType<typeof enter>>) =>
    page.evaluate(async () => {
      const res = await fetch("/api/workspace");
      return (await res.json()) as { version: number; agencyId: string; data: { brands: { id: string }[]; posts: { id: string; title: string }[]; tasks: unknown[]; notebooks: { id: string }[] } };
    });

  const a = await enter(anaMail);
  const b = await enter(betoMail);
  expect((await leer(b)).data.posts.map((p) => p.id).sort()).toEqual(["p1", "p2"]);

  const marcas = a.getByRole("group", { name: `Marcas de ${betoMail}` });
  await expect(marcas).toContainText("Ve todas las marcas");
  await marcas.getByRole("button", { name: "Marca Uno" }).click();
  await expect(marcas).toContainText("Ve 1 de 2 marcas");

  const visto = await leer(b);
  expect(visto.data.brands.map((x) => x.id)).toEqual(["m1"]);
  expect(visto.data.posts.map((p) => p.id)).toEqual(["p1"]);
  expect(visto.data.notebooks.map((n) => n.id)).toEqual(["n1"]);

  // Beto guarda lo único que recibe: lo de la otra marca debe seguir ahí.
  const saved = await b.evaluate(async (w) => {
    const res = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agencyId: w.agencyId, version: w.version, data: w.data }) });
    return res.status;
  }, visto);
  expect(saved).toBe(200);
  const dueña = (await leer(a)).data;
  expect(dueña.posts.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
  expect(dueña.notebooks.map((n) => n.id).sort()).toEqual(["n1", "n2"]);

  await marcas.getByRole("button", { name: "Marca Uno" }).click();
  await expect(marcas).toContainText("Ve todas las marcas");
  expect((await leer(b)).data.posts.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
});
