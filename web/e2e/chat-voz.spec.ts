import { expect, test } from "@playwright/test";

// Micrófono simulado de Chromium: prueba la grabación, la subida y la reproducción de verdad.
test.use({
  permissions: ["microphone"],
  launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
});

test("graba, se puede descartar y se envía como audio reproducible", async ({ page }) => {
  await page.route("**/api/workspace*", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ json: { ok: true, version: 1 } })
  );
  await page.goto("/chat");
  await page.getByRole("button", { name: "café-bruma" }).first().click();
  await page.getByRole("button", { name: "Grabar una nota de voz" }).click();
  await expect(page.locator(".hubly-chat-recording")).toContainText("Grabando");
  await page.getByRole("button", { name: "Descartar la grabación" }).click();
  await expect(page.locator(".hubly-chat-recording")).toHaveCount(0);
  await expect(page.locator(".hubly-chat-scroll audio")).toHaveCount(0);

  await page.getByRole("button", { name: "Grabar una nota de voz" }).click();
  await expect(page.locator(".hubly-chat-recording-time")).toHaveText("0:01", { timeout: 5000 });
  await page.getByRole("button", { name: "Enviar nota" }).click();
  const audio = page.locator(".hubly-chat-scroll audio").last();
  await expect(audio).toBeVisible();
  await expect.poll(() => audio.evaluate((el: HTMLAudioElement) => el.readyState > 0 && !el.error)).toBe(true);
});
