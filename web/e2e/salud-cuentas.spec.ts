import { expect, test } from "@playwright/test";

// Estas pruebas cambian cifras y descartan sugerencias: nada de eso debe llegar al espacio de demo guardado.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/workspace**", (route) =>
    route.request().method() === "GET"
      ? route.continue()
      : route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );
  await page.goto("/dashboard/salud-cuentas");
  await page.waitForLoadState("networkidle");
});

test("Salud de cuentas: un h1, búsqueda, filtros, orden y vacío por filtro", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Salud de cuentas" })).toHaveCount(1);
  const tarjetas = page.locator('[data-testid^="account-health-card-"]');
  const total = await tarjetas.count();
  expect(total).toBeGreaterThan(1);

  await page.getByLabel("Buscar cuenta").fill("zzz-no-existe");
  await expect(page.getByTestId("accounts-empty-state")).toContainText("Sin resultados con estos filtros");
  await page.getByTestId("clear-accounts-filters-btn").click();
  await expect(tarjetas).toHaveCount(total);

  await page.getByTestId("filter-pill-en_riesgo").click();
  await expect(page.getByTestId("filter-pill-en_riesgo")).toHaveAttribute("aria-pressed", "true");
  await expect(tarjetas).toHaveCount(1);
  await page.getByTestId("filter-pill-todas").click();

  await page.getByLabel("Ordenar cuentas").selectOption("name_asc");
  const nombres = await tarjetas.locator(".hubly-cal-row-title").allInnerTexts();
  const primeros = nombres.map((n) => n.trim().split(/\s+/)[0]);
  expect(primeros).toEqual([...primeros].sort((a, b) => a.localeCompare(b, "es")));
});

test("Salud de cuentas: editar y guardar compromisos recalcula el cumplimiento", async ({ page }) => {
  const tarjeta = page.locator('[data-testid^="account-health-card-"]').last();
  await tarjeta.getByRole("button", { name: "Editar compromisos" }).click();
  const editor = tarjeta.locator('[data-testid^="commitment-editor-panel-"]');
  await expect(editor).toBeVisible();
  const comprometidas = editor.locator('input[aria-label^="Publicaciones comprometidas"]');
  const entregadas = editor.locator('input[aria-label^="Publicaciones entregadas"]');
  await comprometidas.fill("10");
  await entregadas.fill("10");
  await tarjeta.locator('[data-testid^="save-commitments-btn-"]').click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Compromisos de");
  await expect(tarjeta.locator('[data-testid^="account-fulfillment-text-"]')).toContainText("entregables");
});

test("Salud de cuentas: aplicar y descartar sugerencias", async ({ page }) => {
  const panel = page.getByTestId("rule-recommendations-panel");
  const filas = panel.locator('[data-testid^="recommendation-card-"]');
  await expect(panel.getByRole("heading", { name: "Sugerencias (7)" })).toBeVisible();
  await filas.first().getByRole("button", { name: "Descartar" }).click();
  await expect(panel.getByRole("heading", { name: "Sugerencias (6)" })).toBeVisible();
  await panel.getByRole("button", { name: "Ocultar" }).click();
  await expect(filas).toHaveCount(0);
  await panel.getByRole("button", { name: "Mostrar" }).click();
  await expect(filas.first()).toBeVisible();
});
