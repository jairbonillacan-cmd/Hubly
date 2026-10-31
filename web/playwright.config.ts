import { defineConfig } from "@playwright/test";

const port = process.env.E2E_PORT || "3000";

// Usa el Chrome instalado y un servidor ya encendido si lo hay; así no se reinicia el de desarrollo.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.salida",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    channel: process.env.E2E_CHANNEL || "chrome",
    viewport: { width: 1440, height: 900 },
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
