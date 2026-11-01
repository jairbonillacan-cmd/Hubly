import { expect, test, type Page } from "@playwright/test";

// El guardado va por POST /api/workspace: se intercepta para que las pruebas no alteren los datos demo guardados.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/workspace*", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ json: { ok: true, version: 1 } })
  );
});

const openChat = async (page: Page, name = "café-bruma") => {
  await page.goto("/chat");
  await page.getByRole("button", { name, exact: false }).first().click();
  return page.getByRole("region", { name: new RegExp(`Conversación ${name}`) });
};
const composer = (page: Page) => page.locator(".hubly-chat-panel .hubly-chat-input").last();
const lastMessage = (page: Page) => page.locator(".hubly-chat-scroll .hubly-chat-msg").last();
const tool = (page: Page, name: string) => lastMessage(page).getByRole("button", { name, exact: true });
// La lista puede repintarse bajo el cursor mientras hidrata: se insiste hasta ver la barra.
const showTools = (page: Page) =>
  expect(async () => {
    await lastMessage(page).hover();
    await expect(lastMessage(page).locator(".hubly-chat-tools")).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 15_000 });

test("envía con menciones y enlaces, sin desbordar", async ({ page }) => {
  await openChat(page);
  await composer(page).pressSequentially("Hola @Lu");
  await expect(page.getByRole("listbox", { name: "Mencionar a alguien" })).toBeVisible();
  await composer(page).press("Enter");
  await composer(page).pressSequentially("mira https://hubly.mx/a");
  await composer(page).press("Enter");
  await expect(lastMessage(page).locator(".hubly-chat-mention")).toContainText("@Lucía Ramírez");
  await expect(lastMessage(page).getByRole("link", { name: "https://hubly.mx/a" })).toHaveAttribute("target", "_blank");
  await expect(composer(page)).toHaveValue("");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test("Shift+Enter no envía y reacciona, edita y borra", async ({ page }) => {
  await openChat(page, "General");
  await composer(page).pressSequentially("uno");
  await composer(page).press("Shift+Enter");
  await composer(page).pressSequentially("dos");
  await expect(page.locator(".hubly-chat-scroll .hubly-chat-msg")).toHaveCount(0);
  await composer(page).press("Enter");

  await showTools(page);
  await tool(page, "Reaccionar").click();
  await page.getByRole("button", { name: "Ver más emojis" }).click();
  await page.getByRole("menuitem", { name: "Reaccionar con 🚀" }).click();
  await expect(lastMessage(page).locator(".hubly-chat-reaction")).toHaveAttribute("aria-pressed", "true");

  await showTools(page);
  await tool(page, "Editar").click();
  await page.getByRole("textbox", { name: "Editar mensaje" }).fill("corregido");
  await page.getByRole("textbox", { name: "Editar mensaje" }).press("Enter");
  await expect(lastMessage(page)).toContainText("corregido");
  await expect(lastMessage(page)).toContainText("(editado)");

  await showTools(page);
  await tool(page, "Eliminar").click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).last().click();
  await expect(page.getByText("corregido")).toHaveCount(0);
});

test("el hilo guarda respuestas y las cuenta", async ({ page }) => {
  await openChat(page);
  await showTools(page);
  await tool(page, "Responder en hilo").click();
  const hilo = page.getByRole("complementary", { name: "Hilo" });
  await hilo.getByRole("textbox", { name: "Responder en el hilo" }).fill("respuesta");
  await hilo.getByRole("textbox", { name: "Responder en el hilo" }).press("Enter");
  await expect(hilo.locator(".hubly-chat-hilo-replies")).toContainText("respuesta");
  await expect(page.locator(".hubly-chat-scroll").getByRole("button", { name: "1 respuesta" })).toBeVisible();
  await page.keyboard.press("Tab");
  await hilo.getByRole("button", { name: "Cerrar hilo" }).click();
  await expect(hilo).toHaveCount(0);
});

test("programa un mensaje, lo cancela y envía el que vence", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-03T10:00:00") });
  await openChat(page);

  await composer(page).fill("para mañana");
  await page.getByRole("button", { name: "Programar el mensaje" }).click();
  await page.getByRole("menuitem", { name: "Mañana a las 9 a.m." }).click();
  await expect(page.locator(".hubly-chat-queue")).toContainText("Programados (1)");
  await expect(page.locator(".hubly-chat-queue")).toContainText("para mañana");
  await page.getByRole("button", { name: "Cancelar «para mañana»" }).click();
  await expect(page.locator(".hubly-chat-queue")).toHaveCount(0);

  await composer(page).fill("en un minuto");
  await page.getByRole("button", { name: "Programar el mensaje" }).click();
  await page.getByLabel("Otra fecha y hora").fill("2026-11-03T10:01");
  await page.getByRole("button", { name: "Programar mensaje" }).click();
  await expect(page.locator(".hubly-chat-queue")).toContainText("Programados (1)");
  await page.clock.fastForward("02:00");
  await expect(lastMessage(page)).toContainText("en un minuto");
  await expect(page.locator(".hubly-chat-queue")).toHaveCount(0);
});

test("adjunta un archivo y lo muestra en el mensaje y en detalles", async ({ page }) => {
  await openChat(page);
  await page.locator(".hubly-chat-panel input[type=file]").setInputFiles({
    name: "brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hola"),
  });
  await expect(page.locator(".hubly-chat-file-state")).not.toContainText("%");
  await composer(page).press("Enter");
  await expect(lastMessage(page).locator(".hubly-chat-attachment")).toContainText("brief.txt");

  await page.getByRole("button", { name: "Ver detalles de café-bruma" }).click();
  const detalles = page.getByRole("complementary", { name: "Detalles del chat" });
  await expect(detalles.getByRole("link", { name: "brief.txt" })).toBeVisible();
});

test("rechaza un tipo de archivo no admitido sin perder el texto", async ({ page }) => {
  await openChat(page);
  await composer(page).fill("no se pierde");
  await page.locator(".hubly-chat-panel input[type=file]").setInputFiles({
    name: "virus.exe",
    mimeType: "application/x-msdownload",
    buffer: Buffer.from("x"),
  });
  await expect(page.locator(".hubly-chat-composer-error")).toContainText("no se admite");
  await expect(composer(page)).toHaveValue("no se pierde");
});

test("sin permiso de micrófono explica qué hacer", async ({ page }) => {
  await openChat(page);
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denegado", "NotAllowedError"));
  });
  await page.getByRole("button", { name: "Grabar una nota de voz" }).click();
  await expect(page.locator(".hubly-chat-composer-error")).toContainText("permiso del micrófono");
});

test("manda elementos de Hubly desde el menú", async ({ page }) => {
  await openChat(page);
  await page.getByRole("button", { name: "Mandar un elemento de Hubly" }).click();
  await expect(page.locator(".hubly-chat-kind")).toHaveCount(8);
  await page.getByRole("menuitem", { name: "Tareas" }).click();
  const first = page.locator(".hubly-chat-option").first();
  const title = (await first.locator(".hubly-chat-option-title").innerText()).trim();
  await first.click();
  await expect(lastMessage(page).locator(".hubly-chat-attachment")).toContainText(title);
});

test("crea, renombra y elimina un canal; la lista fija y silencia", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Crear canal" }).click();
  await page.getByRole("alertdialog").getByRole("textbox").fill("producción");
  await page.getByRole("alertdialog").getByRole("button", { name: "Crear canal" }).click();
  await page.getByRole("button", { name: "Ver detalles de producción" }).click();

  const detalles = page.getByRole("complementary", { name: "Detalles del chat" });
  await detalles.getByLabel("Nombre").fill("rodajes");
  await detalles.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.locator(".hubly-chat-pill h1")).toHaveText("rodajes");

  await page.getByRole("button", { name: "Opciones de rodajes" }).click();
  await page.getByRole("menuitem", { name: "Fijar en la lista" }).click();
  await expect(page.getByRole("button", { name: /Fijados/ })).toBeVisible();

  await page.getByRole("button", { name: "Silenciar avisos" }).click();
  await expect(page.getByRole("button", { name: "Activar avisos" })).toHaveAttribute("aria-pressed", "true");

  await detalles.getByRole("button", { name: "Eliminar canal" }).click();
  await page.getByRole("alertdialog").getByRole("textbox").fill("rodajes");
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar canal" }).click();
  await expect(page.locator(".hubly-chat-item-name", { hasText: "rodajes" })).toHaveCount(0);
});

test("abre un mensaje directo con alguien del equipo", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Escribir a alguien del equipo" }).click();
  await page.locator(".hubly-chat-people-pop .hubly-chat-menuitem").first().click();
  await expect(page.locator(".hubly-chat-pill h1")).not.toHaveText("");
  await expect(page.locator(".hubly-chat-input")).toBeVisible();
});

test("en móvil navega de la lista a la conversación y vuelve", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/chat");
  await page.locator(".hubly-chat-item", { hasText: "café-bruma" }).click();
  await expect(page.locator(".hubly-chat-lista")).toBeHidden();
  await expect(composer(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  await page.getByRole("button", { name: "Volver a conversaciones" }).click();
  await expect(page.locator(".hubly-chat-lista")).toBeVisible();
});
