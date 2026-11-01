import { expect, test, type Page } from "@playwright/test";

// Dos personas guardan a la vez contra el Supabase simulado, con las migraciones reales:
// node tests/dev-live.mjs 3210 54410 y E2E_LIVE=1 E2E_PORT=3210 E2E_MOCK_PORT=54410 npx playwright test e2e/fusion-live.spec.ts
const MOCK = `http://localhost:${process.env.E2E_MOCK_PORT || "54399"}`;
const KEY = { apikey: "clave-de-prueba", "Content-Type": "application/json" };
test.skip(!process.env.E2E_LIVE, "Requiere el modo con cuentas");

const unique = Date.now();
const signUp = async (email: string) =>
  (await (await fetch(`${MOCK}/auth/v1/signup`, { method: "POST", headers: KEY, body: JSON.stringify({ email, password: "clave-de-prueba", data: { name: email.split("@")[0] } }) })).json()) as { access_token: string; user: { id: string } };

type Store = { getState: () => { posts: { id: string; title: string }[]; patchPost: (id: string, patch: { title: string }) => void } };
const editar = (page: Page, id: string, title: string) =>
  page.evaluate(([i, t]) => (window as unknown as { __hubly: Store }).__hubly.getState().patchPost(i, { title: t }), [id, title]);
const enPantalla = (page: Page, id: string) =>
  page.evaluate((i) => (window as unknown as { __hubly: Store }).__hubly.getState().posts.find((p) => p.id === i)?.title, id);
const enServidor = async (page: Page, id: string) =>
  page.evaluate(async (i) => ((await (await fetch("/api/workspace")).json()) as { data: { posts: { id: string; title: string }[] } }).data.posts.find((p) => p.id === i)?.title, id);

test("dos personas: se unen cambios distintos y se avisa si chocan", async ({ browser }) => {
  test.setTimeout(120_000);
  const [anaMail, betoMail] = [`ana${unique}@prueba.test`, `beto${unique}@prueba.test`];
  const ana = await signUp(anaMail);
  const beto = await signUp(betoMail);
  const auth = { ...KEY, Authorization: `Bearer ${ana.access_token}` };
  const agencyId = (await (await fetch(`${MOCK}/rest/v1/rpc/create_agency`, { method: "POST", headers: auth, body: JSON.stringify({ agency_name: "Prueba fusión" }) })).json()) as string;
  const post = (id: string) => ({ id, brandId: "m1", title: id, networks: ["Instagram"], status: "draft", comments: [], scheduledDate: "2026-11-10", scheduledTime: "09:00", format: "Post", caption: "" });
  await fetch(`${MOCK}/rest/v1/rpc/save_workspace`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ target_agency: agencyId, new_data: { brands: [{ id: "m1", name: "Marca", handle: "@m", initials: "M", color: "#16324F" }], posts: [post("p1"), post("p2")], tasks: [] }, expected_version: 1 }),
  });
  await fetch(`${MOCK}/__test/member`, { method: "POST", headers: KEY, body: JSON.stringify({ agencyId, userId: beto.user.id, role: "editor" }) });

  const enter = async (email: string) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/login?next=%2Fcalendario");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL("**/calendario");
    await expect.poll(() => enPantalla(page, "p1")).toBe("p1");
    return page;
  };
  const a = await enter(anaMail);
  const b = await enter(betoMail);

  await editar(a, "p1", "de Ana");
  await expect.poll(() => enServidor(a, "p1")).toBe("de Ana");
  // Beto sigue con la versión anterior y cambia otro post: no debe ver un conflicto.
  await editar(b, "p2", "de Beto");
  await expect.poll(() => enServidor(a, "p2")).toBe("de Beto");
  expect(await enServidor(a, "p1")).toBe("de Ana");
  await expect.poll(() => enPantalla(b, "p1")).toBe("de Ana");
  await expect(b.getByRole("button", { name: "Reemplazar con la mía" })).toHaveCount(0);

  // Ana no ha recibido lo de Beto y ambas tocan el mismo post: aquí sí se pregunta.
  await editar(a, "p2", "choque de Ana");
  await expect(a.getByRole("button", { name: "Reemplazar con la mía" })).toBeVisible();
  expect(await enServidor(a, "p2")).toBe("de Beto");
});
