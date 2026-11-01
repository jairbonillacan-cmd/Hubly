import { expect, test } from "@playwright/test";

// PNG de 1×1 válido, con el nombre único para no depender de archivos previos.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

// Nombres que la prueba subió: afterEach los borra de .data/media, también si la prueba falla.
const subidos: string[] = [];

test.afterEach(async ({ request }) => {
  for (const nombre of subidos.splice(0)) {
    const ws = (await (await request.get("/api/workspace")).json()) as { brands: { id: string }[] };
    for (const marca of ws.brands ?? []) {
      const res = await request.get(`/api/media?brandId=${encodeURIComponent(marca.id)}`);
      if (!res.ok()) continue;
      const { items } = (await res.json()) as { items: { id: string; name: string }[] };
      for (const item of items.filter((x) => x.name === nombre)) {
        await request.delete(`/api/media/${item.id}`);
      }
    }
  }
});

test("subir, encontrar y borrar un archivo real", async ({ page }) => {
  const nombre = `prueba-${Date.now()}.png`;
  await page.goto("/archivos");
  await page.waitForLoadState("networkidle");
  await page.getByTestId("media-input").setInputFiles({ name: nombre, mimeType: "image/png", buffer: PNG });
  subidos.push(nombre);
  const archivo = page.locator(".hubly-media-file", { hasText: nombre });
  await expect(archivo).toBeVisible();
  const respuesta = await page.request.get((await archivo.locator("a").getAttribute("href"))!);
  expect(respuesta.headers()["content-type"]).toBe("image/png");
  expect(Buffer.from(await respuesta.body()).equals(PNG)).toBe(true);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Buscar archivos").fill(nombre);
  await expect(page.locator(".hubly-media-file", { hasText: nombre })).toBeVisible();

  // La confirmación ahora es el diálogo propio de la app, no el nativo del navegador.
  await page.getByRole("button", { name: `Eliminar ${nombre}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.locator(".hubly-media-file", { hasText: nombre })).toHaveCount(0);
});

test("rechaza un archivo fuera de límite y permite quitarlo", async ({ page }) => {
  await page.goto("/archivos");
  await page.waitForLoadState("networkidle");
  await page.getByTestId("media-input").setInputFiles({ name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("x") });
  await expect(page.locator(".hubly-media-queue")).toContainText("no se admite");
  await page.getByRole("button", { name: "Quitar virus.exe" }).click();
  await expect(page.locator(".hubly-media-queue")).toHaveCount(0);
});

test("un fallo de subida ofrece reintentar", async ({ page }) => {
  const nombre = `reintento-${Date.now()}.png`;
  await page.goto("/archivos");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Cargando biblioteca…")).toHaveCount(0);
  let fallar = true;
  await page.route("**/api/media/*/file", async (route) => {
    if (route.request().method() === "PUT" && fallar) {
      fallar = false;
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.getByTestId("media-input").setInputFiles({ name: nombre, mimeType: "image/png", buffer: PNG });
  subidos.push(nombre);
  await expect(page.locator(".hubly-media-queue")).toContainText("Se perdió la conexión");
  await page.locator(".hubly-media-queue").getByRole("button", { name: "Reintentar" }).click();
  await expect(page.locator(".hubly-media-file", { hasText: nombre })).toBeVisible();
  // La confirmación ahora es el diálogo propio de la app, no el nativo del navegador.
  await page.getByRole("button", { name: `Eliminar ${nombre}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.locator(".hubly-media-file", { hasText: nombre })).toHaveCount(0);
});
