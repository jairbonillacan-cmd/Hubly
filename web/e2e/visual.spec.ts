import { expect, test, type Page } from "@playwright/test";

// Red de seguridad de los refactors: mismas pantallas, mismos datos y misma hora.
// Las capturas son de este equipo; se regeneran solo si el cambio visual es intencional.
const HORA = new Date("2026-11-03T10:00:00");

const PANTALLAS = [
  ["dashboard", "/dashboard"],
  ["calendario", "/calendario"],
  ["chat", "/chat"],
  ["parrillas", "/parrillas"],
  ["equipo", "/dashboard/equipo"],
  ["anuncios", "/anuncios"],
  ["ajustes", "/ajustes"],
  ["archivos", "/archivos"],
  ["automatizaciones", "/automatizaciones"],
  ["crm", "/crm"],
  ["dashboard-salud-cuentas", "/dashboard/salud-cuentas"],
  ["equipo-raiz", "/equipo"],
  ["estrategia", "/estrategia"],
  ["ia", "/ia"],
  ["marca", "/marca"],
  ["marcas", "/marcas"],
  ["notificaciones", "/notificaciones"],
  ["proyectos", "/proyectos"],
  ["reportes", "/reportes"],
  ["salud", "/salud"],
  ["tareas", "/tareas"],
] as const;

const VISTAS = [
  ["1440-claro", { width: 1440, height: 900 }, "light"],
  ["1440-oscuro", { width: 1440, height: 900 }, "dark"],
  ["375-claro", { width: 375, height: 812 }, "light"],
] as const;

const preparar = async (page: Page, tema: string) => {
  await page.clock.setFixedTime(HORA);
  await page.route("**/api/workspace**", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ json: { ok: true } })
  );
  await page.addInitScript((valor) => localStorage.setItem("hubly-theme", valor), tema);
};

const captura = { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.002, timeout: 15_000 } as const;

for (const [nombreVista, viewport, tema] of VISTAS) {
  test.describe(nombreVista, () => {
    test.use({ viewport });

    for (const [nombre, ruta] of PANTALLAS) {
      test(nombre, async ({ page }) => {
        await preparar(page, tema);
        await page.goto(`${ruta}?fixture=reference`);
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot(`${nombre}-${nombreVista}.png`, captura);
      });
    }

    test("nuevo post", async ({ page }) => {
      await preparar(page, tema);
      await page.goto("/calendario?fixture=reference");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => {
        (window as unknown as { __hubly: { getState: () => { openComposer: () => void } } }).__hubly.getState().openComposer();
      });
      await expect(page.locator(".hubly-composer")).toBeVisible();
      await expect(page).toHaveScreenshot(`nuevo-post-${nombreVista}.png`, captura);
    });
  });
}
