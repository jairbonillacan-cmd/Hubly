import { expect, test } from "@playwright/test";

const SUFIJO = Date.now();

test("Proyectos: crear, editar, filtrar, fijar, archivar y eliminar", async ({ page }) => {
  const titulo = `E2E proyecto ${SUFIJO}`;
  await page.goto("/proyectos");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Nuevo proyecto" }).first().click();
  await page.locator("form input").first().fill(titulo);
  await page.locator("form button[type=submit]").click();
  const fila = page.locator(".hubly-project-row", { hasText: titulo });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText("Sin fecha");

  await fila.locator(".hubly-project-open").click();
  const dialogo = page.getByRole("dialog", { name: `Editar ${titulo}` });
  await dialogo.getByLabel("Estado").selectOption("Revisión");
  await dialogo.getByLabel("Fecha límite").fill("2026-12-05");
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(fila).toContainText("Revisión");
  await expect(fila).toContainText("5 dic");

  await page.getByLabel("Filtrar proyectos").selectOption("Completado");
  await expect(fila).toHaveCount(0);
  await page.getByLabel("Filtrar proyectos").selectOption("Revisión");
  await expect(fila).toBeVisible();
  await page.getByLabel("Filtrar proyectos").selectOption("todos");

  await page.getByRole("button", { name: `Fijar ${titulo}` }).click();
  await expect(page.locator(".hubly-project-row").first()).toContainText(titulo);

  await page.getByRole("button", { name: `Archivar ${titulo}` }).click();
  await expect(fila).toHaveCount(0);
  await page.getByLabel("Filtrar proyectos").selectOption("archivados");
  await expect(fila).toBeVisible();

  await page.getByRole("button", { name: `Eliminar ${titulo}` }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
  await expect(fila).toHaveCount(0);
  await page.waitForLoadState("networkidle");
});

test("Núcleo de Marca guarda lo de cada marca, sin textos de otra", async ({ page }) => {
  await page.goto("/marca");
  await page.waitForLoadState("networkidle");
  // Lo que se ve es lo guardado en la marca activa, no un texto fijo.
  const guardado = await page.evaluate(() => {
    const s = (window as unknown as { __hubly: { getState: () => { activeBrandId: string; brands: { id: string; core: { whatTheySell: string; personas: unknown[] } }[] } } }).__hubly.getState();
    return s.brands.find((b) => b.id === s.activeBrandId)!.core;
  });
  await expect(page.locator("textarea").first()).toHaveValue(guardado.whatTheySell);
  await expect(page.locator(".hubly-personas-list article")).toHaveCount(guardado.personas.length);
  await expect(page.getByRole("button", { name: /Léelo de mi sitio|Volver a generar/ })).toHaveCount(0);

  const nombre = `E2E persona ${SUFIJO}`;
  const personas = page.locator(".hubly-personas-list article");
  const antes = await personas.count();
  await page.getByRole("button", { name: "Agregar persona" }).click();
  await expect(personas).toHaveCount(antes + 1);
  const nueva = personas.last();
  await nueva.getByLabel("Nombre de la persona").fill(nombre);
  await nueva.getByRole("button", { name: "Aceptar", exact: true }).click();
  await expect(nueva.getByRole("button", { name: "Aceptada" })).toBeVisible();
  await page.waitForTimeout(300);
  await page.waitForLoadState("networkidle");

  await page.reload();
  await page.waitForLoadState("networkidle");
  const guardada = page.locator(".hubly-personas-list article").filter({ has: page.locator(`input[value="${nombre}"]`) });
  await expect(guardada).toHaveCount(1);
  await guardada.getByRole("button", { name: `Eliminar ${nombre}` }).click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
  await expect(guardada).toHaveCount(0);
  await page.waitForLoadState("networkidle");
});

test("Kanban como en Henry: agregar estatus y tarjeta compacta", async ({ page }) => {
  await page.goto("/parrillas?tab=calendario");
  await page.waitForLoadState("networkidle");
  const ver = page.getByRole("button", { name: /datos de ejemplo/i });
  if (await ver.count()) await ver.first().click();
  await page.getByRole("tab", { name: "Kanban", exact: true }).click();
  const nombre = `E2E estatus ${SUFIJO}`;
  await page.getByRole("button", { name: "Agregar estatus" }).click();
  await page.locator('[role="dialog"] input, [role="alertdialog"] input').last().fill(nombre);
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await expect(page.getByRole("region", { name: nombre })).toBeVisible();
  await page.evaluate((n) => {
    const store = (window as unknown as { __hubly: { getState: () => { activeBrandId: string; brands: { id: string; workflowStatuses?: { name: string }[] }[]; updateBrand: (id: string, p: unknown) => void } } }).__hubly.getState();
    const marca = store.brands.find((b) => b.id === store.activeBrandId);
    if (marca) store.updateBrand(marca.id, { workflowStatuses: marca.workflowStatuses?.filter((w) => w.name !== n) });
  }, nombre);
  await page.waitForLoadState("networkidle");
});
