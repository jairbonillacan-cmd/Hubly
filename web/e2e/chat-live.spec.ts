import { expect, test, type Browser, type Page } from "@playwright/test";

// Dos personas en dos navegadores contra el Supabase simulado: `npm run dev:live` y
// E2E_LIVE=1 E2E_PORT=3200 npx playwright test e2e/chat-live.spec.ts
const MOCK = `http://localhost:${process.env.E2E_MOCK_PORT || "54399"}`;
const KEY = { apikey: "clave-de-prueba", "Content-Type": "application/json" };
test.skip(!process.env.E2E_LIVE, "Requiere npm run dev:live");

const unique = Date.now();
const rejected: string[] = [];

async function signUp(email: string, name: string) {
  const res = await fetch(`${MOCK}/auth/v1/signup`, { method: "POST", headers: KEY, body: JSON.stringify({ email, password: "clave-de-prueba", data: { name } }) });
  return (await res.json()) as { access_token: string; user: { id: string } };
}

const rpc = async (token: string, fn: string, body: object) => {
  const res = await fetch(`${MOCK}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...KEY, Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return res.json();
};

async function enter(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  // Una escritura rechazada debe hacer fallar la prueba con su causa, no solo mostrar un aviso.
  page.on("response", async (res) => {
    if (res.status() >= 400 && res.url().includes("/rest/v1/")) {
      rejected.push(`${res.request().method()} ${res.url().replace(MOCK, "")} ${res.status()} ${await res.text().catch(() => "")}`);
    }
  });
  await page.goto("/login?next=%2Fchat");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/chat");
  await expect(page.locator(".hubly-chat-item", { hasText: "General" })).toBeVisible();
  return page;
}

const open = (page: Page, name: string) => page.locator(".hubly-chat-item", { hasText: name }).click();
const composer = (page: Page) => page.locator(".hubly-chat-panel .hubly-chat-input").last();

test("dos personas conversan en vivo y lo privado sigue privado", async ({ browser }) => {
  test.setTimeout(180_000);
  const ana = await signUp(`ana${unique}@prueba.test`, "Ana Ruiz");
  const beto = await signUp(`beto${unique}@prueba.test`, "Beto Luna");
  const carla = await signUp(`carla${unique}@prueba.test`, "Carla Paz");
  const agencyId = (await rpc(ana.access_token, "create_agency", { agency_name: "Agencia prueba" })) as string;
  await rpc(ana.access_token, "save_workspace", {
    target_agency: agencyId,
    new_data: { brands: [{ id: "b1", name: "Café Bruma", handle: "@bruma", initials: "CB", color: "#16324F" }], posts: [], tasks: [] },
    expected_version: 1,
  });
  for (const u of [beto, carla]) {
    await fetch(`${MOCK}/__test/member`, { method: "POST", headers: KEY, body: JSON.stringify({ agencyId, userId: u.user.id }) });
  }

  const [a, b, c] = [
    await enter(browser, `ana${unique}@prueba.test`),
    await enter(browser, `beto${unique}@prueba.test`),
    await enter(browser, `carla${unique}@prueba.test`),
  ];

  // Mensaje en vivo y contador de sin leer.
  await open(a, "General");
  await expect(b.locator(".hubly-chat-item", { hasText: "General" }).locator(".hubly-chat-badge")).toHaveCount(0);
  await composer(a).fill("hola equipo");
  await composer(a).press("Enter");
  await expect(b.locator(".hubly-chat-item", { hasText: "General" }).locator(".hubly-chat-badge")).toHaveText("1");
  await open(b, "General");
  await expect(b.locator(".hubly-chat-msg").last()).toContainText("hola equipo");
  await expect(b.locator(".hubly-chat-item", { hasText: "General" }).locator(".hubly-chat-badge")).toHaveCount(0);
  await expect(a.locator(".hubly-chat-msg")).toHaveCount(1); // Sin duplicar el propio.

  // Escribiendo.
  await composer(b).pressSequentially("ya");
  await expect(a.locator(".hubly-chat-typing")).toContainText("Beto Luna está escribiendo");
  await composer(b).press("Enter");
  await expect(a.locator(".hubly-chat-msg").last()).toContainText("ya");

  // Reacción, edición y borrado llegan al otro.
  const first = (p: Page) => p.locator(".hubly-chat-msg").first();
  await first(b).hover();
  await first(b).getByRole("button", { name: "Reaccionar", exact: true }).click();
  await b.getByRole("menuitem", { name: "Reaccionar con 🔥" }).click();
  await expect(first(a).locator(".hubly-chat-reaction")).toContainText("1");
  await first(b).locator(".hubly-chat-reaction").click();
  await expect(first(a).locator(".hubly-chat-reaction")).toHaveCount(0);

  await first(a).hover();
  await first(a).getByRole("button", { name: "Editar", exact: true }).click();
  await a.getByRole("textbox", { name: "Editar mensaje" }).fill("hola a todos");
  await a.getByRole("textbox", { name: "Editar mensaje" }).press("Enter");
  await expect(first(b)).toContainText("hola a todos");
  await expect(first(b)).toContainText("(editado)");

  // Hilo en vivo.
  await first(a).hover();
  await first(a).getByRole("button", { name: "Responder en hilo", exact: true }).click();
  await a.getByRole("textbox", { name: "Responder en el hilo" }).fill("respuesta");
  await a.getByRole("textbox", { name: "Responder en el hilo" }).press("Enter");
  await expect(first(b).getByRole("button", { name: "1 respuesta" })).toBeVisible();

  // Mensaje directo: llega a Beto, Carla no lo ve; y hay presencia real.
  await a.getByRole("button", { name: "Escribir a alguien del equipo" }).click();
  await a.locator(".hubly-chat-people-pop .hubly-chat-menuitem", { hasText: "Beto Luna" }).click();
  await expect(a.locator(".hubly-chat-pill .hubly-chat-online")).toBeVisible();
  await composer(a).fill("solo para ti");
  await composer(a).press("Enter");
  await expect(b.locator(".hubly-chat-item", { hasText: "Ana Ruiz" })).toBeVisible();
  await open(b, "Ana Ruiz");
  await expect(b.locator(".hubly-chat-msg").last()).toContainText("solo para ti");
  await c.waitForTimeout(1500);
  await expect(c.locator(".hubly-chat-item", { hasText: "Ana Ruiz" })).toHaveCount(0);
  await expect(c.getByText("solo para ti")).toHaveCount(0);

  await b.context().close();
  await expect(a.locator(".hubly-chat-pill .hubly-chat-online")).toHaveCount(0);

  expect(rejected).toEqual([]);

  // Bot: entra por su URL secreta y llega en vivo.
  await open(a, "General");
  await a.getByRole("button", { name: "Ver detalles de General" }).click();
  await a.getByRole("complementary", { name: "Detalles del chat" }).getByRole("button", { name: "Crear bot" }).click();
  await a.getByRole("alertdialog").getByRole("textbox").fill("Ventas");
  await a.getByRole("alertdialog").getByRole("button", { name: "Crear bot" }).click();
  const url = await a.locator(".hubly-chat-boturl-value").innerText();
  const res = await a.request.post(url, { data: { text: "venta nueva @Ana Ruiz" } });
  expect(res.status()).toBe(200);
  await expect(a.locator(".hubly-chat-msg").last()).toContainText("venta nueva");
  await expect(a.locator(".hubly-chat-msg").last()).toContainText("Bot");
  expect((await a.request.post(`${url}x`, { data: { text: "no" } })).status()).toBe(401);
  await a.getByRole("button", { name: "Cerrar detalles" }).click();

  // Mención sin leer para quien no está mirando.
  await expect(c.locator(".hubly-chat-item", { hasText: "General" }).locator(".hubly-chat-badge")).toBeVisible();
  await composer(a).fill("revisa esto @Carla Paz");
  await composer(a).press("Enter");
  await expect(c.locator(".hubly-chat-item", { hasText: "General" }).locator(".hubly-chat-badge")).toContainText("@");

  // Tarjeta de perfil.
  await open(c, "General");
  await c.locator(".hubly-chat-msg-namebtn", { hasText: "Ana Ruiz" }).first().click();
  await expect(c.getByRole("menu", { name: "Perfil de Ana Ruiz" })).toContainText("En línea");
  await c.keyboard.press("Escape");

  // Canal privado: Carla deja de verlo en cuanto se cierra.
  await a.getByRole("button", { name: "Crear canal" }).click();
  await a.getByRole("alertdialog").getByRole("textbox").fill("dirección");
  await a.getByRole("alertdialog").getByRole("button", { name: "Crear canal" }).click();
  await expect(c.locator(".hubly-chat-item", { hasText: "dirección" })).toBeVisible();
  await a.getByRole("button", { name: "Ver detalles de dirección" }).click();
  await a.getByLabel("Solo personas elegidas").check();
  await c.reload();
  await expect(c.locator(".hubly-chat-item", { hasText: "General" })).toBeVisible();
  await c.waitForTimeout(1000);
  await expect(c.locator(".hubly-chat-item", { hasText: "dirección" })).toHaveCount(0);
  await a.getByRole("button", { name: "Cerrar detalles" }).click();

  // Historial por páginas y búsqueda de lo que no está cargado.
  await open(a, "General");
  for (let i = 0; i < 55; i += 1) {
    await composer(a).fill(`relleno ${i}`);
    await composer(a).press("Enter");
  }
  await expect(a.locator(".hubly-chat-msg").last()).toContainText("relleno 54");
  await a.reload();
  await open(a, "General");
  await expect(a.locator(".hubly-chat-msg").last()).toContainText("relleno 54");
  await expect(a.getByText("hola a todos")).toHaveCount(0);
  await a.getByRole("button", { name: "Ver mensajes anteriores" }).click();
  await expect(a.getByText("hola a todos")).toBeVisible();
  await a.reload();
  await a.getByRole("searchbox", { name: "Buscar conversaciones" }).fill("hola a todos");
  await a.locator(".hubly-chat-result").first().click();
  await expect(a.locator(".hubly-chat-msg.is-highlighted")).toContainText("hola a todos");

  // Persiste al recargar, y nada del chat va al documento compartido.
  await a.reload();
  await open(a, "General");
  await expect(a.locator(".hubly-chat-msg").last()).toContainText("relleno 54");
  const doc = await a.evaluate(async () => (await (await fetch("/api/workspace", { cache: "no-store" })).json()).data.messages);
  expect(doc).toEqual([]);
  expect(rejected).toEqual([]);
});
