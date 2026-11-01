import { expect, test, type Locator, type Page } from "@playwright/test";

// Estas pruebas cambian de marca, abren modales y recorren pantallas: nada de eso debe llegar al espacio de demo guardado.
let errores: string[] = [];

test.beforeEach(async ({ page }) => {
  errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.route("**/api/**", (route) =>
    route.request().method() === "GET"
      ? route.continue()
      : route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );
});

test.afterEach(() => {
  expect(errores).toEqual([]);
});

// El atajo Ctrl+K lo registra CommandPaletteModal en un useEffect: no existe hasta que React termina de hidratar,
// y eso ocurre unos cientos de ms después de que la página reporta «cargada». Pulsarlo antes no hace nada.
async function abrirApp(page: Page, ruta = "/dashboard") {
  await page.goto(ruta);
  await page.waitForFunction(() => {
    const boton = document.querySelector('button[aria-label^="Buscar"]');
    return !!boton && Object.keys(boton).some((k) => k.startsWith("__reactProps"));
  });
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0))));
}

async function abrirConAtajo(page: Page) {
  // Una paleta recién cerrada sigue en el DOM 150 ms mientras se anima; hay que esperar a que se vaya.
  await expect(paleta(page)).toHaveCount(0);
  await expect(async () => {
    if (!(await paleta(page).isVisible())) await page.keyboard.press("Control+k");
    await expect(paleta(page)).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
}

const paleta = (page: Page) => page.getByRole("dialog", { name: "Buscar en Hubly" });
const campo = (page: Page) => page.getByRole("combobox");

function opcion(page: Page, titulo: string): Locator {
  return page.getByRole("option").filter({ has: page.locator(".hubly-command-label").getByText(titulo, { exact: true }) });
}

async function ejecutarEnPaleta(page: Page, texto: string, titulo: string) {
  await abrirConAtajo(page);
  await expect(campo(page)).toBeFocused();
  await campo(page).fill(texto);
  await opcion(page, titulo).click();
}

async function sinDesbordeHorizontal(page: Page) {
  const ancho = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, ventana: window.innerWidth }));
  expect(ancho.doc).toBeLessThanOrEqual(ancho.ventana);
}

test.describe("Buscador en escritorio", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("teclado: flechas con scroll, vacío, limpiar, Enter, Ctrl+K y Escape devuelven el foco", async ({ page }) => {
    await abrirApp(page);
    const abridor = page.getByRole("button", { name: "Buscar", exact: true }).first();
    await abridor.click();
    await expect(paleta(page)).toBeVisible();
    const input = campo(page);
    await expect(input).toBeFocused();

    for (let i = 0; i < 15; i++) await input.press("ArrowDown");
    await expect(input).toBeFocused();
    await expect
      .poll(() => page.locator(".hubly-command-results").evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);

    await input.fill("zzzz sin coincidencias");
    await expect(paleta(page).getByText("Sin resultados para", { exact: false })).toBeVisible();
    await input.press("Tab");
    await expect(page.getByRole("button", { name: "Limpiar búsqueda", exact: true }).first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");

    await input.fill("calendario");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/calendario$/);
    await expect(paleta(page)).toHaveCount(0);

    await abrirConAtajo(page);
    await expect(input).toBeFocused();
    await input.fill("a");
    await input.press("ArrowDown");
    await input.press("Escape");
    await expect(paleta(page)).toHaveCount(0);

    await abrirApp(page);
    await abridor.click();
    await input.fill("marca");
    await input.press("ArrowDown");
    await input.press("Escape");
    await expect(abridor).toBeFocused();

    await abridor.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await input.press("Tab");
    await expect(paleta(page).getByRole("button", { name: "Esc Cerrar" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(paleta(page)).toHaveCount(0);
    await expect(abridor).toBeFocused();
  });

  test("Ctrl+K alterna: abre y cierra", async ({ page }) => {
    await abrirApp(page);
    await abrirConAtajo(page);
    await expect(paleta(page)).toBeVisible();
    await page.keyboard.press("Control+k");
    await expect(paleta(page)).toHaveCount(0);
  });

  test("modo oscuro: abre con foco y el texto largo sin resultados no desborda", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("hubly-theme", "dark"));
    await abrirApp(page);
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Buscar", exact: true }).first().click();
    await expect(campo(page)).toBeFocused();

    await campo(page).fill("x".repeat(200));
    await expect(paleta(page).getByText("Sin resultados para", { exact: false })).toBeVisible();
    const caja = await paleta(page).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, right: r.right, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, ancho: innerWidth };
    });
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.right).toBeLessThanOrEqual(caja.ancho);
    expect(caja.scrollWidth).toBeLessThanOrEqual(caja.clientWidth);
    await campo(page).press("Escape");
    await expect(paleta(page)).toHaveCount(0);
  });
});

test.describe("Buscador en móvil", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Ctrl+K abre tras recargar, cabe en 375 px y el texto largo no desborda", async ({ page }) => {
    await abrirApp(page);
    await page.reload();
    await page.waitForFunction(() => {
      const boton = document.querySelector('button[aria-label^="Buscar"]');
      return !!boton && Object.keys(boton).some((k) => k.startsWith("__reactProps"));
    });
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    await abrirConAtajo(page);
    await expect(campo(page)).toBeFocused();

    // La hoja entra deslizándose (180 ms): se mide cuando ya terminó.
    const medir = () =>
      paleta(page).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, right: r.right, bottom: r.bottom, ancho: innerWidth, alto: innerHeight, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
    await expect.poll(async () => (await medir()).bottom).toBeLessThanOrEqual(813);
    const geometria = await medir();
    expect(geometria.x).toBeGreaterThanOrEqual(0);
    expect(geometria.right).toBeLessThanOrEqual(375);
    expect(geometria.bottom).toBeLessThanOrEqual(813);
    expect(geometria.scrollWidth).toBeLessThanOrEqual(geometria.clientWidth);

    await campo(page).fill("x".repeat(200));
    await expect(paleta(page).getByText("Sin resultados para", { exact: false })).toBeVisible();
    await expect(paleta(page).getByText("Toca un resultado para abrirlo")).toBeVisible();
    await expect(paleta(page).locator(".hubly-command-shortcut")).toBeHidden();
    await sinDesbordeHorizontal(page);
    await campo(page).press("Escape");
    await expect(paleta(page)).toHaveCount(0);
  });

  test("abrir desde el botón de la barra superior y elegir una marca la cambia", async ({ page }) => {
    await abrirApp(page);
    await page.getByRole("button", { name: /^Buscar/ }).first().click();
    await expect(campo(page)).toBeFocused();
    await opcion(page, "Café Bruma (@cafebruma)").click();
    await expect(paleta(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Marca activa: Café Bruma/ })).toBeVisible();
  });
});

// Cada entrada de «Páginas» debe llevar a su pantalla, sin pasar por la redirección antigua /dashboard?tab=.
const DESTINOS: Array<{ titulo: string; ruta: string; marca: (page: Page) => Locator }> = [
  { titulo: "Dashboard · Inicio", ruta: "/dashboard", marca: (p) => p.getByRole("heading", { level: 1, name: /^Buenas/ }) },
  { titulo: "Dashboard · Salud de cuentas", ruta: "/dashboard/salud-cuentas", marca: (p) => p.getByRole("heading", { level: 1, name: "Salud de cuentas" }) },
  { titulo: "Dashboard · Equipo", ruta: "/dashboard/equipo", marca: (p) => p.getByRole("heading", { level: 2, name: /^Equipo/ }) },
  { titulo: "Mi espacio · Tareas y libretas", ruta: "/tareas", marca: (p) => p.locator("main").getByText("Libretas", { exact: true }).first() },
  { titulo: "Calendario", ruta: "/calendario", marca: (p) => p.getByRole("heading", { level: 1, name: "Calendario" }) },
  { titulo: "Social Media · Parrillas", ruta: "/parrillas", marca: (p) => p.locator("main").getByText("Tableros", { exact: true }).first() },
  { titulo: "Núcleo de marca", ruta: "/marca", marca: (p) => p.locator("main").getByText("Buyer personas").first() },
  { titulo: "Ads · Anuncios", ruta: "/anuncios", marca: (p) => p.locator("main").getByText("Anuncios").first() },
  { titulo: "Chat", ruta: "/chat", marca: (p) => p.locator("main").getByText("Mensajes directos").first() },
  { titulo: "Ajustes", ruta: "/ajustes", marca: (p) => p.getByRole("heading", { level: 1, name: "Configuración" }) },
];

test.describe("Destinos del buscador", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const destino of DESTINOS) {
    test(`Páginas: «${destino.titulo}» abre ${destino.ruta}`, async ({ page }) => {
      const visitadas: string[] = [];
      page.on("framenavigated", (f) => { if (f === page.mainFrame()) visitadas.push(new URL(f.url()).pathname + new URL(f.url()).search); });
      await abrirApp(page, destino.ruta === "/calendario" ? "/ajustes" : "/calendario");
      await ejecutarEnPaleta(page, destino.titulo, destino.titulo);
      await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe(destino.ruta);
      await expect(destino.marca(page)).toBeVisible();
      await expect(paleta(page)).toHaveCount(0);
      expect(visitadas.filter((u) => u.includes("tab="))).toEqual([]);
    });
  }

  test("Resultados: una tarea abre Mi espacio y un miembro abre /dashboard/equipo", async ({ page }) => {
    await abrirApp(page, "/calendario");
    await abrirConAtajo(page);
    await campo(page).fill("Conecta las redes");
    await page.getByRole("group", { name: "Tareas" }).getByRole("option").first().click();
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe("/tareas");

    await abrirConAtajo(page);
    await campo(page).fill("jair");
    await page.getByRole("group", { name: "Equipo" }).getByRole("option").first().click();
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe("/dashboard/equipo");
    await expect(page.getByRole("heading", { level: 2, name: /^Equipo/ })).toBeVisible();
  });

  test("Resultados: una libreta y un post abren su lector y su compositor, sin cambiar de pantalla", async ({ page }) => {
    await abrirApp(page, "/calendario");
    await abrirConAtajo(page);
    await campo(page).fill("Núcleo de marca");
    await page.getByRole("group", { name: "Libretas" }).getByRole("option").first().click();
    await expect(paleta(page)).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await abrirConAtajo(page);
    await campo(page).fill("a");
    await page.getByRole("group", { name: "Posts" }).getByRole("option").first().click();
    await expect(paleta(page)).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(/\/calendario$/);
  });

  const ACCIONES: Array<{ titulo: string; dialogo?: RegExp | string }> = [
    { titulo: "Crear o programar post" },
    { titulo: "Crear marca", dialogo: /^Nueva marca/ },
    { titulo: "Invitar al equipo", dialogo: /^Invitar a la agencia/ },
    { titulo: "Revisar sugerencias", dialogo: /^Sugerencias automáticas/ },
    { titulo: "Configurar widgets", dialogo: /^Configurar widgets/ },
    { titulo: "Pregúntale a Hubi", dialogo: "Hubi" },
  ];

  for (const accion of ACCIONES) {
    test(`Acciones: «${accion.titulo}» abre lo que dice`, async ({ page }) => {
      await abrirApp(page, "/calendario");
      await ejecutarEnPaleta(page, accion.titulo, accion.titulo);
      await expect(paleta(page)).toHaveCount(0);
      const abierto = accion.dialogo ? page.getByRole("dialog", { name: accion.dialogo }) : page.getByRole("dialog");
      await expect(abierto).toBeVisible();
      await expect(page).toHaveURL(/\/calendario$/);
    });
  }

  test("Los textos de la paleta usan el vocabulario de la guía", async ({ page }) => {
    await abrirApp(page);
    await abrirConAtajo(page);
    const grupos = await paleta(page).locator(".hubly-command-heading").allInnerTexts();
    expect(grupos.join("|")).not.toMatch(/Kraft|Publicaciones/);
    await campo(page).fill("roas");
    await expect(paleta(page).getByText("Sin resultados para", { exact: false })).toBeVisible();
    await campo(page).fill("workspace");
    await expect(paleta(page).getByText("Sin resultados para", { exact: false })).toBeVisible();
    await campo(page).fill("kraft");
    await expect(paleta(page).getByText("Sin resultados para", { exact: false })).toBeVisible();
  });
});
