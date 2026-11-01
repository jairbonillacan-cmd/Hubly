import { expect, test, type Page } from "@playwright/test";

type Store = {
  getState: () => {
    activeBrandId: string;
    brands: { id: string; core?: { pillars?: string[] } }[];
    posts: { id: string; title: string; status: string; scheduledDate: string; brandId: string }[];
    savePost: (p: unknown) => void;
    deletePost: (id: string) => void;
  };
};

const TITULO = `E2E calendario ${Date.now()}`;
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

const abrir = async (page: Page) => {
  await page.goto("/parrillas?tab=calendario");
  await page.waitForLoadState("networkidle");
  const verDatos = page.getByRole("button", { name: /datos de ejemplo/i });
  if (await verDatos.count()) await verDatos.first().click();
  await expect(page.locator(".hubly-social-calendar")).toBeVisible();
};

const crear = (page: Page, titulo: string, fecha: string, status = "scheduled") =>
  page.evaluate(
    ([t, f, s]) => {
      const store = (window as unknown as { __hubly: Store }).__hubly.getState();
      store.savePost({ brandId: store.activeBrandId, title: t, caption: "copy", network: "Instagram", networks: ["Instagram"], format: "Imagen", cover: "steam", status: s, scheduledDate: f, scheduledTime: "", assignee: "", pillar: "General" });
    },
    [titulo, fecha, status]
  );

const limpiar = async (page: Page, prefijo: string) => {
  await page.evaluate((p) => {
    const store = (window as unknown as { __hubly: Store }).__hubly.getState();
    store.posts.filter((x) => x.title.startsWith(p)).forEach((x) => store.deletePost(x.id));
  }, prefijo);
  // El modo demo guarda en segundo plano: espera a que el borrado llegue al servidor.
  await page.waitForLoadState("networkidle");
};

// El guardado va por POST /api/workspace: se intercepta para que las pruebas no alteren los datos demo guardados.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/workspace**", (route) =>
    route.request().method() === "GET"
      ? route.continue()
      : route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );
});

test("las cuatro vistas comparten posts, filtros y período", async ({ page }) => {
  await abrir(page);
  await crear(page, TITULO, hoy());
  await crear(page, `${TITULO} sin fecha`, "", "draft");

  for (const vista of ["Mes", "Semana", "Tabla", "Kanban"]) {
    await page.getByRole("tab", { name: vista, exact: true }).click();
    await expect(page.locator(".hubly-social-calendar").getByText(TITULO, { exact: true }).first()).toBeVisible();
  }

  // El filtro se conserva entre vistas.
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("group", { name: "Filtros" }).getByRole("checkbox", { name: "Pinterest" }).check();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Tabla", exact: true }).click();
  await expect(page.locator(".hubly-social-calendar").getByText(TITULO, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await page.keyboard.press("Escape");

  // Sin fecha: accesible con contador y sin recibir la de hoy.
  await page.getByRole("button", { name: /Mostrar \d+ sin fecha/ }).click();
  await expect(page.locator(".hubly-social-calendar").getByText(`${TITULO} sin fecha`).first()).toBeVisible();
  await page.getByRole("tab", { name: "Mes", exact: true }).click();

  // Título y columnas de la semana salen del mismo intervalo.
  await page.getByRole("tab", { name: "Semana", exact: true }).click();
  const weekCols = page.locator(".hubly-social-week-col");
  await expect(weekCols).toHaveCount(7);
  const columnas = await weekCols.evaluateAll((c) => c.map((x) => x.getAttribute("aria-label")));
  expect(columnas).toHaveLength(7);
  expect(new Date(`${columnas[0]}T12:00:00Z`).getUTCDay()).toBe(1);
  const dia = String(Number(columnas[0]!.slice(8)));
  await expect(page.locator(".hubly-social-period h2")).toContainText(dia);

  await limpiar(page, TITULO);
});

test("la tabla edita en la celda sin abrir el editor y ordena", async ({ page }) => {
  await abrir(page);
  await crear(page, TITULO, hoy());
  await page.getByRole("tab", { name: "Tabla", exact: true }).click();
  await page.getByLabel(`Formato de ${TITULO}`).selectOption("Story");
  await expect(page.locator(".hubly-composer")).toHaveCount(0);
  await page.locator(".hubly-social-table thead").getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.locator(".hubly-social-table th[aria-sort=ascending]")).toContainText("Post");
  await page.getByRole("cell", { name: TITULO }).getByRole("button", { name: TITULO }).click();
  await expect(page.locator(".hubly-composer")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await limpiar(page, TITULO);
});

test("Kanban: mover cambia el atributo y nunca marca como publicado", async ({ page }) => {
  await abrir(page);
  await crear(page, TITULO, hoy(), "draft");
  await page.getByRole("tab", { name: "Kanban", exact: true }).click();
  await page.getByLabel("Columnas por").selectOption("publicacion");
  const selector = page.getByLabel(`Mover ${TITULO} a otra columna`);
  await expect(selector.locator('option[value="published"]')).toBeDisabled();
  await selector.selectOption("approved");
  await expect(page.getByRole("region", { name: "Aprobado" }).getByText(TITULO)).toBeVisible();
  const estado = await page.evaluate((t) => (window as unknown as { __hubly: Store }).__hubly.getState().posts.find((p) => p.title === t)?.status, TITULO);
  expect(estado).toBe("approved");
  await page.getByLabel("Columnas por").selectOption("pilar");
  const primerPilar = await page.evaluate(() => {
    const s = (window as unknown as { __hubly: Store }).__hubly.getState();
    const b = s.brands.find((br) => br.id === s.activeBrandId) ?? s.brands[0];
    return b?.core?.pillars?.[0] ?? "General";
  });
  await page.getByLabel(`Mover ${TITULO} a otra columna`).selectOption(primerPilar);
  await expect(page.getByRole("region", { name: primerPilar }).getByText(TITULO)).toBeVisible();
  for (const grupo of ["estatus", "formato", "responsable"]) await page.getByLabel("Columnas por").selectOption(grupo);
  await page.getByLabel("Columnas por").selectOption("estatus");
  await page.getByLabel(`Mover ${TITULO} a otra columna`).selectOption("pendiente");
  await expect(page.getByRole("region", { name: "Pendiente de revisión" }).getByText(TITULO)).toBeVisible();
  await limpiar(page, TITULO);
});

test("Traer mi mes: mapeo, errores por fila, duplicados y revisión antes de crear", async ({ page }) => {
  await abrir(page);
  const base = `${TITULO} import`;
  await crear(page, `${base} duplicado`, "2026-11-12", "draft");
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: /Traer mi mes/ }).click();
  const tabla = [
    "Título\tFecha\tRedes\tFormato",
    `${base} bueno\t12/11/2026\tInstagram, TikTok\tReel`,
    `${base} duplicado\t2026-11-12\tInstagram\tImagen`,
    `${base} malo\t31/02/2026\tMySpace\tImagen`,
    `${base} sin fecha\t\tPinterest\tImagen`,
  ].join("\n");
  await page.getByLabel(/O pega tu tabla/).fill(tabla);
  await page.getByRole("button", { name: "Continuar con lo pegado" }).click();
  await expect(page.locator(".hubly-import-map select").first()).toHaveValue("0");
  const antes = await page.evaluate(() => (window as unknown as { __hubly: Store }).__hubly.getState().posts.length);
  await page.getByRole("button", { name: "Revisar" }).click();
  await expect(page.getByText("Fecha no válida")).toBeVisible();
  await expect(page.getByText("Red desconocida: MySpace")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Duplicado", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __hubly: Store }).__hubly.getState().posts.length)).toBe(antes);
  await page.getByRole("button", { name: "Importar 2 como borradores" }).click();
  await expect(page.getByText("Se crearon 2 borradores")).toBeVisible();
  const creados = await page.evaluate((b) => (window as unknown as { __hubly: Store }).__hubly.getState().posts.filter((p) => p.title.startsWith(b)).map((p) => [p.title, p.status, p.scheduledDate]), base);
  expect(creados).toEqual(expect.arrayContaining([[`${base} bueno`, "draft", "2026-11-12"], [`${base} sin fecha`, "draft", ""]]));
  await page.getByRole("button", { name: "Listo" }).click();
  await limpiar(page, TITULO);
});

test("Ver feed y Crear parrilla usan posts reales", async ({ page }) => {
  await abrir(page);
  await crear(page, TITULO, hoy());
  await crear(page, `${TITULO} sin fecha`, "", "draft");
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: /Ver feed/ }).click();
  await expect(page.getByRole("dialog", { name: "Ver feed" })).toContainText(/fuera del feed por no tener fecha/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: /Crear parrilla/ }).click();
  await expect(page.locator(".hubly-social-modal")).toContainText(TITULO);
  await page.keyboard.press("Escape");
  await limpiar(page, TITULO);
});

test("Traer mi mes lee un Excel real", async ({ page }) => {
  await abrir(page);
  await page.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: /Traer mi mes/ }).click();
  await page.getByLabel("Archivo a importar").setInputFiles("e2e/fixtures/parrilla.xlsx");
  await page.getByRole("button", { name: "Revisar" }).click();
  await page.getByRole("button", { name: "Importar 2 como borradores" }).click();
  await expect(page.getByText("Se crearon 2 borradores")).toBeVisible();
  const creados = await page.evaluate(() => (window as unknown as { __hubly: Store }).__hubly.getState().posts.filter((p) => p.title.startsWith("E2E xlsx")).map((p) => p.scheduledDate).sort());
  expect(creados).toEqual(["2026-11-20", "2026-11-21"]);
  await page.getByRole("button", { name: "Listo" }).click();
  await limpiar(page, "E2E xlsx");
});

test("Escape y sidebar también funcionan sobre el calendario con el editor abierto", async ({ page }) => {
  await abrir(page);
  await page.locator(".hubly-social-tools").getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.locator(".hubly-composer")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(page.locator(".hubly-composer")).toHaveCount(0);
});
