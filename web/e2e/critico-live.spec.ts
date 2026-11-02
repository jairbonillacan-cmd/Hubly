import { expect, test, type Browser, type Page } from "@playwright/test";

// Los flujos que F1 reescribe, con cuentas contra el Supabase simulado y las migraciones reales:
// node tests/dev-live.mjs 3210 54410 y E2E_LIVE=1 E2E_PORT=3210 E2E_MOCK_PORT=54410 npx playwright test e2e/critico-live.spec.ts
const MOCK = `http://localhost:${process.env.E2E_MOCK_PORT || "54399"}`;
const KEY = { apikey: "clave-de-prueba", "Content-Type": "application/json" };
test.skip(!process.env.E2E_LIVE, "Requiere el modo con cuentas");

const unique = Date.now();
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

type Guardado = {
  brands: { id: string; name: string }[];
  posts: { title: string; scheduledDate: string; status: string }[];
  tasks: { title: string; status: string; listName: string }[];
  taskLists: { name: string }[];
  notebooks: { title: string; content: string }[];
};

const signUp = async (email: string) =>
  (await (await fetch(`${MOCK}/auth/v1/signup`, { method: "POST", headers: KEY, body: JSON.stringify({ email, password: "clave-de-prueba", data: { name: email.split("@")[0] } }) })).json()) as { access_token: string; user: { id: string } };

const rpc = async (token: string, fn: string, body: object) => {
  const res = await fetch(`${MOCK}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...KEY, Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return res.json();
};

/** Cada flujo estrena agencia: un fallo no arrastra a los demás ni hereda datos de otro. */
async function cuenta(nombre: string) {
  const email = `${nombre}${unique}@prueba.test`;
  const user = await signUp(email);
  const agencyId = (await rpc(user.access_token, "create_agency", { agency_name: `Agencia ${nombre}` })) as string;
  await rpc(user.access_token, "save_workspace", {
    target_agency: agencyId,
    new_data: { brands: [{ id: "m1", name: "Marca base", handle: "@marca-base", initials: "MB", color: "#16324F" }], posts: [], tasks: [] },
    expected_version: 1,
  });
  return email;
}

async function entrar(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  await expect(page.locator(".hubly-sidebar")).toBeVisible();
  return page;
}

/** Lo que quedó en el servidor: la recarga solo puede traer esto. */
const guardado = (page: Page) =>
  page.evaluate(async () => ((await (await fetch("/api/workspace", { cache: "no-store" })).json()) as { data: Guardado }).data);

/** Un post del día de hoy, con la fecha que ya trae el botón del calendario. */
async function crearPost(page: Page, titulo: string) {
  await page.locator('.hubly-social-day[data-today] button[aria-label^="Nuevo post el"]').click();
  await expect(page.locator(".hubly-composer")).toBeVisible();
  await page.getByLabel("Título del post").fill(titulo);
  await page.locator(".hubly-composer-networks").getByRole("button", { name: "Facebook", exact: true }).click();
  await page.getByRole("radio", { name: "Solo guardar" }).click();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.locator(".hubly-composer")).toHaveCount(0);
}

test("crear marca: el asistente la guarda y sigue tras recargar", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await entrar(browser, await cuenta("marca"));
  const nombre = `Café Bruma ${unique}`;

  await page.goto("/marcas");
  await page.getByRole("button", { name: "Nueva marca" }).click();
  const asistente = page.getByRole("dialog", { name: "Nueva marca" });
  await asistente.getByLabel("Nombre de la marca").fill(nombre);
  await asistente.getByRole("button", { name: /Crear marca/ }).click();
  // Los pasos de equipo, redes y núcleo no son parte de este flujo: se omiten.
  for (let paso = 0; paso < 3; paso += 1) await asistente.getByRole("button", { name: "Omitir por ahora" }).click();
  await expect(asistente).toHaveCount(0);
  await expect(page.getByRole("button", { name: nombre, exact: true })).toBeVisible();

  await expect.poll(async () => (await guardado(page)).brands.map((b) => b.name)).toContain(nombre);

  await page.reload();
  await expect(page.getByRole("button", { name: nombre, exact: true })).toBeVisible();
});

test("crear y editar un post: el título nuevo gana y sigue tras recargar", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await entrar(browser, await cuenta("post"));
  const titulo = `Post crítico ${unique}`;
  const editado = `Post editado ${unique}`;

  await page.goto("/parrillas?tab=calendario");
  await expect(page.locator(".hubly-social-calendar")).toBeVisible();
  await crearPost(page, titulo);
  await expect(page.locator(".hubly-social-chip", { hasText: titulo })).toBeVisible();
  await expect.poll(async () => (await guardado(page)).posts.map((p) => p.title)).toContain(titulo);

  await page.reload();
  await page.locator(".hubly-social-chip", { hasText: titulo }).click();
  await expect(page.getByLabel("Título del post")).toHaveValue(titulo);
  await page.getByLabel("Título del post").fill(editado);
  await page.locator(".hubly-composer-foot").getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(".hubly-composer")).toHaveCount(0);
  await expect.poll(async () => (await guardado(page)).posts.map((p) => p.title)).toContain(editado);

  await page.reload();
  await expect(page.locator(".hubly-social-chip", { hasText: editado })).toBeVisible();
  await expect(page.locator(".hubly-social-chip", { hasText: titulo })).toHaveCount(0);
});

test("mover un post: la fecha nueva queda en el servidor y tras recargar", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await entrar(browser, await cuenta("mover"));
  const titulo = `Post para mover ${unique}`;
  const fecha = hoy();
  // Un día del mes en curso distinto de hoy, para que el movimiento se note.
  const destino = `${fecha.slice(0, 7)}-${fecha.slice(8) === "15" ? "16" : "15"}`;

  await page.goto("/parrillas?tab=calendario");
  await expect(page.locator(".hubly-social-calendar")).toBeVisible();
  await crearPost(page, titulo);
  await expect.poll(async () => (await guardado(page)).posts.map((p) => p.title)).toContain(titulo);

  await page.getByRole("tab", { name: "Tabla", exact: true }).click();
  const campo = page.getByLabel(`Fecha de ${titulo}`);
  await expect(campo).toHaveValue(fecha);
  await campo.fill(destino);
  await expect.poll(async () => (await guardado(page)).posts.find((p) => p.title === titulo)?.scheduledDate).toBe(destino);

  await page.reload();
  await page.getByRole("tab", { name: "Tabla", exact: true }).click();
  await expect(page.getByLabel(`Fecha de ${titulo}`)).toHaveValue(destino);
});

test("crear y completar una tarea: se guarda y sigue tras recargar", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await entrar(browser, await cuenta("tarea"));
  const lista = `Entregables ${unique}`;
  const tarea = `Revisar el calendario ${unique}`;

  await page.goto("/tareas");
  await page.getByRole("button", { name: "Nueva lista", exact: true }).first().click();
  await page.locator("#new-list-name").fill(lista);
  await page.getByRole("button", { name: "Crear lista" }).click();
  const campo = page.getByLabel(`Agregar tarea a ${lista}`);
  await campo.fill(tarea);
  await campo.press("Enter");

  const casilla = page.getByRole("checkbox", { name: `Completar ${tarea}` });
  await expect(casilla).toHaveAttribute("aria-checked", "false");
  await casilla.click();
  await expect(casilla).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => (await guardado(page)).tasks.find((t) => t.title === tarea)?.status).toBe("done");

  await page.reload();
  await expect(page.getByRole("checkbox", { name: `Completar ${tarea}` })).toHaveAttribute("aria-checked", "true");
});

test("crear una libreta: se guarda y sigue tras recargar", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await entrar(browser, await cuenta("libreta"));
  const titulo = `Minuta ${unique}`;

  await page.goto("/tareas?seccion=libretas");
  await expect(page.getByRole("heading", { name: /Libretas de/ })).toBeVisible();
  await page.getByRole("button", { name: "Nueva libreta" }).first().click();
  await page.locator("#nb-title-input").fill(titulo);
  await page.getByRole("textbox", { name: "Contenido de la libreta" }).click();
  await page.keyboard.type("Acuerdos de la semana");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.keyboard.press("Escape");

  await expect(page.locator("button", { hasText: titulo }).first()).toBeVisible();
  await expect.poll(async () => (await guardado(page)).notebooks.map((n) => n.title)).toContain(titulo);

  await page.reload();
  await expect(page.locator("button", { hasText: titulo }).first()).toBeVisible();
});
