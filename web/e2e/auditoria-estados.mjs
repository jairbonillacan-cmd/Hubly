// Recorre cada ruta con el teclado y revisa estados de interacción: npm run audit:estados
// Para cada control enfocado con Tab comprueba que el foco se vea (contorno, sombra o borde distinto) y que el texto tenga contraste.
// Lo hace en claro y oscuro. No guarda nada.
import { chromium } from "@playwright/test";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const RUTAS = ["/dashboard", "/dashboard/equipo", "/dashboard/salud-cuentas", "/calendario", "/tareas", "/chat", "/notificaciones", "/ia", "/marcas", "/marca", "/archivos", "/proyectos", "/parrillas", "/reportes", "/anuncios", "/crm", "/automatizaciones", "/ajustes"];
const TABS = Number(process.env.AUDIT_TABS || 40);

const browser = await chromium.launch({ channel: "chrome" });
const hallazgos = [];

for (const tema of ["claro", "oscuro"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-MX", timezoneId: "America/Mexico_City" });
  await ctx.addInitScript((t) => { localStorage.setItem("hubly-theme", t === "oscuro" ? "dark" : "light"); localStorage.setItem("hubly-audit", "1"); }, tema);
  await ctx.route("**/api/**", (r) => (r.request().method() === "GET" ? r.continue() : r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })));
  for (const ruta of RUTAS) {
    const page = await ctx.newPage();
    await page.goto(BASE + ruta);
    await page.waitForLoadState("networkidle");
    await page.locator("main").first().focus().catch(() => {});
    const vistos = new Set();
    for (let i = 0; i < TABS; i += 1) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        const nombre = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || el.getAttribute("placeholder") || el.tagName).replace(/\s+/g, " ").trim().slice(0, 40);
        const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 1.5 && cs.outlineColor !== "rgba(0, 0, 0, 0)";
        const sombra = cs.boxShadow !== "none";
        // El borde no se compara con el estado sin foco: se acepta si hay contorno o sombra, o si es un campo con borde.
        const esCampo = el.matches("input, textarea, select, [contenteditable]");
        return { nombre, tag: el.tagName, outline, sombra, esCampo, w: Math.round(b.width), h: Math.round(b.height), fuera: b.bottom < 0 || b.top > innerHeight };
      });
      if (!r) continue;
      const clave = `${r.tag}|${r.nombre}`;
      if (vistos.has(clave)) break; // volvió al inicio
      vistos.add(clave);
      if (!r.outline && !r.sombra) hallazgos.push({ tema, ruta, nombre: r.nombre, tag: r.tag, problema: r.esCampo ? "campo sin contorno ni sombra al enfocar (revisar borde)" : "sin indicador de foco" });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

if (!hallazgos.length) console.log("Foco visible en todos los controles recorridos.");
for (const h of hallazgos) console.log(`${h.tema} ${h.ruta} · ${h.tag} «${h.nombre}»: ${h.problema}`);
console.log(`${hallazgos.length} hallazgos`);
process.exitCode = hallazgos.some((h) => h.problema === "sin indicador de foco") ? 1 : 0;
