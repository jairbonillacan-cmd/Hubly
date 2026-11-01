import { expect, test, type Page } from "@playwright/test";

const RUTAS = [
  "/ajustes", "/anuncios", "/archivos", "/automatizaciones", "/calendario", "/chat", "/crm",
  "/dashboard", "/dashboard/equipo", "/dashboard/salud-cuentas", "/equipo", "/estrategia", "/ia",
  "/marca", "/marcas", "/notificaciones", "/parrillas", "/proyectos", "/reportes", "/salud", "/tareas",
];

/** Devuelve los controles cuyo texto no alcanza 3:1 contra su fondo real. */
const contrasteBajo = (page: Page) =>
  page.evaluate(() => {
    const parse = (c: string) => {
      const srgb = c.startsWith("color(srgb");
      const m = (c.replace("srgb", "").match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]).map((v, i) => (srgb && i < 3 ? v * 255 : v));
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
    };
    const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const fondo = (el: Element | null) => {
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.backgroundImage !== "none") return null;
        const c = parse(s.backgroundColor);
        if (c.a > 0.95) return c;
        if (c.a > 0.05) return null;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    };
    const malos: string[] = [];
    for (const el of document.querySelectorAll("button, a, [role=tab], h1, h2, h3")) {
      const r = el.getBoundingClientRect();
      const texto = (el as HTMLElement).innerText?.trim();
      if (!texto || r.width === 0 || r.height === 0) continue;
      const estilo = getComputedStyle(el);
      if (estilo.visibility === "hidden" || Number(estilo.opacity) < 0.5 || (el as HTMLButtonElement).disabled) continue;
      const bg = fondo(el);
      if (!bg) continue;
      const a = lum(parse(estilo.color));
      const b = lum(bg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 3) malos.push(`${ratio.toFixed(2)} «${texto.slice(0, 40)}» ${estilo.color} / rgb(${bg.r},${bg.g},${bg.b})`);
    }
    return malos;
  });

// El guardado va por POST /api/workspace: se intercepta para que las pruebas no alteren los datos demo guardados.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/workspace**", (route) =>
    route.request().method() === "GET"
      ? route.continue()
      : route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );
});

for (const esquema of ["light", "dark"] as const) {
  for (const ruta of RUTAS) {
    test(`${ruta} en ${esquema}: sin errores ni controles ilegibles`, async ({ page }) => {
      const errores: string[] = [];
      page.on("pageerror", (e) => errores.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errores.push(m.text());
      });
      await page.addInitScript((tema) => {
        try {
          localStorage.setItem("hubly-theme", tema);
        } catch {}
      }, esquema);
      await page.emulateMedia({ colorScheme: esquema });
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 150));
      });
      expect(errores).toEqual([]);
      expect(await contrasteBajo(page)).toEqual([]);
    });
  }
}

test("/chat y /anuncios muestran su encabezado principal h1", async ({ page }) => {
  await page.goto("/chat");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "Chat" })).toBeVisible();

  await page.goto("/anuncios");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "Anuncios" })).toBeVisible();
});

test("/chat actualiza el estado vacío tras enviar un mensaje en # General", async ({ page }) => {
  await page.goto("/chat");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /# General/ }).click();
  await expect(page.getByText(/Sin mensajes aún/).first()).toBeVisible();

  const input = page.getByPlaceholder("Escribe un mensaje en # General...");
  await input.fill("Hola equipo, revisemos la parrilla");
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByText("Hola equipo, revisemos la parrilla").first()).toBeVisible();
  await expect(page.getByText(/Sin mensajes aún/)).toHaveCount(0);
  await expect(page.getByText("Todavía no hay canales con conversación.")).toHaveCount(0);
});

test("/reportes avisa cuando muestra cifras de ejemplo", async ({ page }) => {
  await page.goto("/reportes");
  await page.waitForLoadState("networkidle");
  const nota = page.getByRole("note");
  await expect(nota).toBeVisible();
  await expect(nota).toContainText("Datos de ejemplo.");
  await expect(page.getByText("Ejemplo", { exact: true }).first()).toBeVisible();
});

test("/dashboard/equipo refleja el periodo seleccionado y el estado activo de sus controles", async ({ page }) => {
  await page.goto("/dashboard/equipo");
  await page.waitForLoadState("networkidle");

  const btn7d = page.getByRole("button", { name: "7 días", exact: true });
  const btn30d = page.getByRole("button", { name: "30 días", exact: true });
  const btn90d = page.getByRole("button", { name: "90 días", exact: true });

  await expect(btn30d).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Últimos 30 días/)).toBeVisible();

  await btn7d.click();
  await expect(btn7d).toHaveAttribute("aria-pressed", "true");
  await expect(btn30d).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText(/Últimos 7 días/)).toBeVisible();

  await btn90d.click();
  await expect(btn90d).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Últimos 90 días/)).toBeVisible();
});

test("ventanas abiertas a 390 y modo oscuro mantienen contraste, foco y ocultan la píldora flotante", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("hubly-theme", "dark");
    } catch {}
  });
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/calendario");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.locator(".hubly-cal-filters")).toBeVisible();
  expect(await contrasteBajo(page)).toEqual([]);
  await expect(page.locator("[data-mision-pildora]")).toBeHidden();

  const brandOpt = page.locator(".hubly-cal-brand-option").first();
  await page.keyboard.press("Tab");
  await brandOpt.focus();
  const outlineStyle = await brandOpt.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outlineStyle).not.toBe("none");
});

test("controles de calendario conservan contraste en hover en modo oscuro", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("hubly-theme", "dark");
    } catch {}
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/calendario");
  await page.waitForLoadState("networkidle");
  const btnHoy = page.getByRole("button", { name: /Hoy|Ir a hoy/ }).first();
  await btnHoy.hover();
  expect(await contrasteBajo(page)).toEqual([]);
});
