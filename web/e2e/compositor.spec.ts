import { expect, test, type Page } from "@playwright/test";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const abrirEditor = async (page: Page, ruta = "/calendario") => {
  await page.goto(ruta);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    (window as unknown as { __hubly?: { getState: () => { openComposer: () => void } } }).__hubly?.getState().openComposer();
  });
  await expect(page.locator(".hubly-composer")).toBeVisible();
};

const editor = (page: Page) => page.locator(".hubly-composer");

test.beforeEach(async ({ page }) => {
  // El guardado va por POST /api/workspace: se intercepta para que las pruebas no alteren los datos demo guardados.
  await page.route("**/api/workspace**", (route) =>
    route.request().method() === "GET"
      ? route.continue()
      : route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );
  await page.addInitScript(() => {
    if (sessionStorage.getItem("e2e-limpio")) return;
    sessionStorage.setItem("e2e-limpio", "1");
    Object.keys(localStorage).filter((k) => k.startsWith("hubly:borrador:")).forEach((k) => localStorage.removeItem(k));
  });
});

// La subida de archivos sí llega a /api/media: se borran por nombre, también si la prueba falla.
test.afterEach(async ({ request }) => {
  const ws = (await (await request.get("/api/workspace")).json()) as { brands: { id: string }[] };
  for (const marca of ws.brands ?? []) {
    const res = await request.get(`/api/media?brandId=${encodeURIComponent(marca.id)}`);
    if (!res.ok()) continue;
    const { items } = (await res.json()) as { items: { id: string; name: string }[] };
    for (const item of items.filter((x) => x.name === "a.png" || x.name === "b.png")) {
      await request.delete(`/api/media/${item.id}`);
    }
  }
});

test("el sidebar funciona con el editor abierto y el borrador conserva su marca", async ({ page }) => {
  await abrirEditor(page);
  await page.getByLabel("Título del post").fill("Borrador de prueba");
  const marca = await editor(page).locator(".hubly-composer-badges span").first().innerText();

  await expect(page.locator(".hubly-sidebar")).toHaveClass(/is-collapsed/);
  await page.locator(".hubly-sidebar-collapse-btn").click();
  await expect(page.locator(".hubly-sidebar")).not.toHaveClass(/is-collapsed/);

  // Un enlace del sidebar navega detrás sin cerrar el editor.
  await page.locator('.hubly-sidebar a[href="/tareas"]').first().click();
  await expect(page).toHaveURL(/\/tareas/);
  await expect(editor(page)).toBeVisible();
  await expect(page.getByLabel("Título del post")).toHaveValue("Borrador de prueba");

  // Cambiar la marca activa no reasigna el borrador.
  await page.evaluate(() => {
    const store = (window as unknown as { __hubly: { getState: () => { brands: { id: string }[]; activeBrandId: string; setActiveBrand: (id: string) => void } } }).__hubly.getState();
    const otra = store.brands.find((b) => b.id !== store.activeBrandId);
    if (otra) store.setActiveBrand(otra.id);
  });
  await expect(editor(page).locator(".hubly-composer-badges span").first()).toHaveText(marca);
  // Deja la marca activa como estaba: el modo demo guarda este cambio.
  await page.evaluate((nombre) => {
    const store = (window as unknown as { __hubly: { getState: () => { brands: { id: string; name: string }[]; setActiveBrand: (id: string) => void } } }).__hubly.getState();
    const original = store.brands.find((b) => b.name === nombre);
    if (original) store.setActiveBrand(original.id);
  }, marca);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
});

test("Escape cierra solo la capa superior y conserva los cambios", async ({ page }) => {
  await abrirEditor(page);
  await page.getByLabel("Título del post").fill("Con selector");
  const abrir = page.getByRole("button", { name: /Content Manager/ });
  await abrir.click();
  const selector = page.getByRole("dialog", { name: "Content Manager" });
  await expect(selector).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(selector).toHaveCount(0);
  await expect(editor(page)).toBeVisible();
  await expect(abrir).toBeFocused();
  await expect(page.getByLabel("Título del post")).toHaveValue("Con selector");

  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await expect(editor(page)).toHaveCount(0);

  // Al volver a abrir se recuperan los cambios, con aviso.
  await page.evaluate(() => (window as unknown as { __hubly: { getState: () => { openComposer: () => void } } }).__hubly.getState().openComposer());
  await expect(page.getByLabel("Título del post")).toHaveValue("Con selector");
  await expect(page.getByText("Recuperamos cambios sin guardar")).toBeVisible();
  await page.getByRole("button", { name: "Descartarlos" }).click();
  await expect(page.getByLabel("Título del post")).toHaveValue("");
});

test("los cambios se recuperan tras recargar", async ({ page }) => {
  await abrirEditor(page);
  await page.getByLabel("Título del post").fill("Antes de recargar");
  await page.waitForTimeout(400);
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (window as unknown as { __hubly: { getState: () => { openComposer: () => void } } }).__hubly.getState().openComposer());
  await expect(page.getByLabel("Título del post")).toHaveValue("Antes de recargar");
});

test("abrir otro post con cambios pide decidir", async ({ page }) => {
  await abrirEditor(page);
  await page.getByLabel("Título del post").fill("Sin guardar");
  await page.waitForTimeout(100);
  const destino = await page.evaluate(() => {
    const store = (window as unknown as { __hubly: { getState: () => { posts: { id: string; title: string }[]; openComposer: (id: string) => void } } }).__hubly.getState();
    store.openComposer(store.posts[0].id);
    return store.posts[0].title;
  });
  const dialogo = page.getByRole("alertdialog");
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: "Seguir editando" }).click();
  await expect(page.getByLabel("Título del post")).toHaveValue("Sin guardar");

  await page.evaluate(() => {
    const store = (window as unknown as { __hubly: { getState: () => { posts: { id: string }[]; openComposer: (id: string) => void } } }).__hubly.getState();
    store.openComposer(store.posts[0].id);
  });
  await page.getByRole("alertdialog").getByRole("button", { name: "Descartar" }).click();
  await expect(page.getByLabel("Título del post")).toHaveValue(destino);
});

test("varios archivos, orden, copy por red y guardado sin fecha", async ({ page }) => {
  const titulo = `Post ${Date.now()}`;
  await abrirEditor(page);
  await page.getByLabel("Título del post").fill(titulo);
  await page.getByLabel("Subir archivos del post").setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: PNG },
    { name: "b.png", mimeType: "image/png", buffer: PNG },
  ]);
  const lista = page.getByRole("list", { name: /Archivos del post/ }).or(page.locator(".hubly-composer-media"));
  await expect(lista.locator("li")).toHaveCount(2);
  const nombres = () => lista.locator("img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")));
  const inicial = await nombres();
  await page.getByRole("button", { name: `Mover ${inicial[0]} después` }).click();
  expect(await nombres()).toEqual([inicial[1], inicial[0]]);

  // El copy general se hereda hasta personalizar una red.
  await page.getByLabel("Copy general").fill("Copy común");
  await page.getByRole("button", { name: "Pinterest", exact: true }).click();
  await page.getByRole("tab", { name: "Pinterest" }).click();
  await expect(page.getByLabel("Copy de Pinterest")).toHaveValue("Copy común");
  await expect(page.getByText("Hereda el copy general")).toBeVisible();
  await page.getByLabel("Copy de Pinterest").fill("Solo Pinterest");
  await expect(page.locator(".hubly-phone-app")).toContainText("Solo Pinterest");
  await expect(page.locator(".np-pin-save")).toHaveText("Guardar");
  await page.getByRole("button", { name: "Volver a heredar" }).click();
  await expect(page.getByLabel("Copy de Pinterest")).toHaveValue("Copy común");

  // Sin fecha no se puede programar, pero sí guardar, y no recibe la fecha de hoy.
  await page.getByRole("radio", { name: "Programar" }).click();
  await expect(page.getByRole("button", { name: "Selecciona fecha" })).toBeDisabled();
  await page.getByRole("radio", { name: "Solo guardar" }).click();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(editor(page)).toHaveCount(0);
  const guardado = await page.evaluate((t) => {
    const store = (window as unknown as { __hubly: { getState: () => { posts: { title: string; scheduledDate: string; status: string; media?: unknown[] }[] } } }).__hubly.getState();
    return store.posts.find((p) => p.title === t);
  }, titulo);
  expect(guardado?.scheduledDate).toBe("");
  expect(guardado?.status).toBe("draft");
  expect(guardado?.media).toHaveLength(2);
  await page.evaluate((t) => {
    const store = (window as unknown as { __hubly: { getState: () => { posts: { id: string; title: string }[]; deletePost: (id: string) => void } } }).__hubly.getState();
    const creado = store.posts.find((p) => p.title === t);
    if (creado) store.deletePost(creado.id);
  }, titulo);
});

test("programar elige fecha y hora y publicar ya no finge publicar", async ({ page }) => {
  await abrirEditor(page);
  await page.getByRole("radio", { name: "Programar" }).click();
  await page.getByRole("button", { name: "Elegir fecha y hora" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".hubly-datepick")).toHaveCount(0);
  await expect(editor(page)).toBeVisible();
  await page.getByRole("button", { name: "Elegir fecha y hora" }).click();
  await page.getByRole("button", { name: "Mes siguiente" }).click();
  await page.locator(".hubly-datepick-day:not([data-outside])").first().click();
  await page.getByRole("button", { name: "Subir hora" }).click();
  await page.getByRole("button", { name: "Listo" }).click();
  await expect(page.locator(".hubly-composer-datefield")).toContainText("10:00");
  await expect(page.getByRole("button", { name: "Programar", exact: true })).toBeEnabled();

  await page.getByRole("radio", { name: "Publicar ya" }).click();
  await expect(page.getByRole("button", { name: "Marcar como publicado" })).toBeVisible();
  await expect(page.locator(".hubly-composer-datefield")).toHaveCount(0);
  await page.getByRole("button", { name: "Marcar como publicado" }).click();
  await expect(page.locator(".hubly-composer-foot [role='alert']")).toContainText("Escribe el copy");
});

test("los colaboradores de Instagram llegan al teléfono y tienen tope", async ({ page }) => {
  await abrirEditor(page);
  const campo = page.getByLabel(/Colaboradores de Instagram/);
  for (const cuenta of ["@uno", "dos", "tres"]) {
    await campo.fill(cuenta);
    await campo.press("Enter");
  }
  await expect(page.locator(".hubly-composer-collabfield > span")).toHaveCount(3);
  await expect(campo).toHaveCount(0);
  await expect(page.locator(".np-post-head").first()).toContainText("y 3 más");
});

test("cada una de las diez redes tiene su propia interfaz en el teléfono", async ({ page }) => {
  await abrirEditor(page);
  const senas: Record<string, string> = {
    Instagram: ".np-ig-top",
    Facebook: ".np-fb-top",
    TikTok: ".np-tt-tabs",
    LinkedIn: ".np-li-top",
    YouTube: ".np-immersive, .np-yt-top",
    X: ".np-x-top",
    Threads: ".np-th-top",
    Pinterest: ".np-pin-top",
    Reddit: ".np-rd-top",
    "Google Business": ".np-gb-search",
  };
  const red = (nombre: string) => page.locator(".hubly-composer-networks").getByRole("button", { name: nombre, exact: true });
  for (const nombre of Object.keys(senas)) {
    if (nombre !== "Instagram") await red(nombre).click();
    await page.locator(".hubly-composer-netpills").getByRole("button", { name: nombre, exact: true }).click();
    await expect(page.locator(".hubly-phone .hubly-phone-island")).toBeVisible();
    await expect(page.locator(`.hubly-phone-app`).locator(senas[nombre]).first()).toBeVisible();
  }
});
