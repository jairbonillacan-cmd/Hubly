// Pulsa cada control visible de las 21 rutas y anota qué ocurre: npm run audit:controles
// No guarda nada: bloquea toda escritura al servidor y evita salir del sitio.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const RUTAS = ["/dashboard", "/dashboard/equipo", "/dashboard/salud-cuentas", "/calendario", "/tareas", "/chat", "/notificaciones", "/ia", "/marcas", "/marca", "/archivos", "/proyectos", "/parrillas", "/reportes", "/anuncios", "/crm", "/automatizaciones", "/ajustes"];
const ALIAS = { "/equipo": "/dashboard/equipo", "/salud": "/dashboard/salud-cuentas", "/estrategia": "/marca" };
const SALTAR = /cerrar sesi|eliminar cuenta|salir/i;

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-MX", timezoneId: "America/Mexico_City" });
await context.addInitScript(() => localStorage.setItem("hubly-audit", "1"));
await context.route("**/*", (route) => {
  const req = route.request();
  const url = new URL(req.url());
  if (url.origin !== BASE) return route.abort();
  if (req.method() !== "GET" && !url.pathname.startsWith("/_next")) return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  return route.continue();
});

const firma = (page) =>
  page.evaluate(() => {
    const raiz = document.querySelector("main") || document.body;
    const visibles = document.querySelectorAll('[role="dialog"],[role="menu"],[role="alertdialog"],[role="listbox"],.hubly-overlay,.hubly-picker-scrim').length;
    return `${location.pathname}${location.search}|${visibles}|${document.body.innerText.length}|${raiz.querySelectorAll("*").length}|${document.querySelectorAll('[aria-pressed="true"],[aria-selected="true"],[aria-expanded="true"],[aria-current]').length}`;
  });

const controles = (page) =>
  page.evaluate(() => {
    const nombre = (el) => (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 60);
    const salida = [];
    document.querySelectorAll('main button, main a[href], main [role="tab"], main [role="button"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || getComputedStyle(el).visibility === "hidden") return;
      salida.push({ nombre: nombre(el), disabled: el.disabled === true, tag: el.tagName, href: el.getAttribute("href") || "" });
    });
    return salida;
  });

const filas = [];
for (const ruta of RUTAS) {
  const page = await context.newPage();
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(BASE + ruta);
  await page.waitForLoadState("networkidle");
  const lista = await controles(page);
  const vistos = new Set();
  for (let i = 0; i < lista.length; i += 1) {
    const c = lista[i];
    const clave = `${c.nombre}|${c.tag}`;
    if (!c.nombre || vistos.has(clave)) continue;
    vistos.add(clave);
    const fila = { ruta, control: c.nombre, resultado: "", detalle: "" };
    filas.push(fila);
    if (SALTAR.test(c.nombre)) { fila.resultado = "omitido"; fila.detalle = "acción de sesión"; continue; }
    if (c.disabled) { fila.resultado = "deshabilitado"; continue; }
    if (c.tag === "A") { fila.resultado = "enlace"; fila.detalle = c.href; continue; }
    await page.goto(BASE + ruta);
    await page.waitForLoadState("networkidle");
    const actuales = page.locator('main button, main a[href], main [role="tab"], main [role="button"]');
    const n = await actuales.count();
    let objetivo = null;
    for (let j = 0; j < n; j += 1) {
      const el = actuales.nth(j);
      const nom = ((await el.getAttribute("aria-label")) || (await el.innerText().catch(() => "")) || (await el.getAttribute("title")) || "").replace(/\s+/g, " ").trim().slice(0, 60);
      if (nom === c.nombre && (await el.isVisible())) { objetivo = el; break; }
    }
    if (!objetivo) { fila.resultado = "no reproducible"; continue; }
    const antes = await firma(page);
    const errs = errores.length;
    try {
      await objetivo.click({ timeout: 2500 });
      await page.waitForTimeout(350);
      const despues = await firma(page);
      fila.resultado = errores.length > errs ? "error" : despues === antes ? "sin efecto visible" : "responde";
      if (errores.length > errs) fila.detalle = errores.at(-1).slice(0, 120);
    } catch (e) {
      fila.resultado = "no se pudo pulsar";
      fila.detalle = String(e.message).split("\n")[0].slice(0, 100);
    }
  }
  await page.close();
  console.log(ruta, lista.length, "controles");
}
await browser.close();

const conteo = (r) => filas.filter((f) => f.resultado === r).length;
const esc = (s) => String(s).replace(/\|/g, "\\|");
const md = [
  "# Matriz de controles de Hubly",
  "",
  `Generada con \`npm run audit:controles\` en modo demo el ${new Date().toISOString().slice(0, 10)}. Cubre botones, enlaces y pestañas visibles al cargar cada ruta, sin sidebar.`,
  "",
  "**Qué significa:** «responde» indica que pulsar cambió la página, sin error; no prueba que el resultado sea correcto ni que persista, porque la auditoría bloquea las escrituras. La persistencia y los permisos se prueban en `e2e/` y `tests/`. «Sin efecto visible» pide revisión manual: puede ser un botón muerto o un cambio que esta firma no detecta. No cubre controles dentro de ventanas abiertas.",
  "",
  `**Totales:** ${filas.length} controles · ${conteo("responde")} responden · ${conteo("enlace")} enlaces · ${conteo("sin efecto visible")} sin efecto visible · ${conteo("deshabilitado")} deshabilitados · ${conteo("error")} con error · ${conteo("no se pudo pulsar") + conteo("no reproducible")} sin poder probar · ${conteo("omitido")} omitidos.`,
  "",
  `Alias con la misma pantalla: ${Object.entries(ALIAS).map(([a, b]) => `\`${a}\` → \`${b}\``).join(", ")}.`,
  "",
  "| Ruta | Control | Resultado | Detalle |",
  "|---|---|---|---|",
  ...filas.map((f) => `| \`${f.ruta}\` | ${esc(f.control)} | ${f.resultado} | ${esc(f.detalle)} |`),
  "",
].join("\n");
fs.writeFileSync(new URL("../../docs/MATRIZ-CONTROLES.md", import.meta.url), md);
console.log(md.split("\n")[6]);
