// Pulsa cada control visible de las 21 rutas y de las ventanas que abren: npm run audit:controles
// No guarda nada: bloquea toda escritura al servidor y evita salir del sitio.
// Por cada ruta recorre la página, y por cada menú, modal o panel que se abre, recorre sus controles.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const RUTAS = ["/dashboard", "/dashboard/equipo", "/dashboard/salud-cuentas", "/calendario", "/tareas", "/chat", "/notificaciones", "/ia", "/marcas", "/marca", "/archivos", "/proyectos", "/parrillas", "/reportes", "/anuncios", "/crm", "/automatizaciones", "/ajustes"];
const ALIAS = { "/equipo": "/dashboard/equipo", "/salud": "/dashboard/salud-cuentas", "/estrategia": "/marca" };
const SALTAR = /cerrar sesi|eliminar cuenta|salir/i;
const PARALELO = Number(process.env.AUDIT_PARALELO || 4);
const SHELL = "(sidebar y Hubi)";

const browser = await chromium.launch({ channel: "chrome" });

// Código que corre dentro de la página: una sola definición de «qué es un control» y «qué es una ventana».
const enPagina = () => {
  const SEL = 'button, a[href], [role="tab"], [role="button"], [role="menuitem"], [role="option"], [role="switch"], input[type="checkbox"], input[type="radio"]';
  const VENTANAS = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], .hubly-overlay, .hubly-picker-scrim, .hubly-dropdown, .hubly-cal-filters, .hubly-drawer, .hubly-hubi-panel, .hubly-social-pop, .hubly-composer-pop, .hubly-composer-menu';
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width >= 2 && r.height >= 2 && getComputedStyle(el).visibility !== "hidden";
  };
  const nombre = (el) => {
    const etiqueta = el.matches('input[type="checkbox"], input[type="radio"]') ? el.closest("label")?.innerText : "";
    return (el.getAttribute("aria-label") || el.innerText || etiqueta || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  };
  const raices = (ambito) => {
    if (ambito === "ventana") return [...document.querySelectorAll("[data-aud-ventana]")];
    if (ambito === "shell") return [...document.querySelectorAll(".hubly-sidebar, .hubly-hubi-fab")];
    return [document.querySelector("main") || document.body];
  };
  const lista = (ambito) => {
    const vistos = new Map();
    const salida = [];
    for (const raiz of raices(ambito)) {
      for (const el of raiz.querySelectorAll(SEL)) {
        if (!visible(el)) continue;
        if (ambito !== "ventana" && el.closest("[data-aud-ventana]")) continue;
        const n = nombre(el);
        const clave = `${n}|${el.tagName}`;
        const idx = vistos.get(clave) ?? 0;
        vistos.set(clave, idx + 1);
        const activo = ["aria-selected", "aria-pressed", "aria-checked"].some((a) => el.getAttribute(a) === "true") || (el.getAttribute("aria-current") && el.getAttribute("aria-current") !== "false") || el.checked === true;
        salida.push({ nombre: n, tag: el.tagName, idx, disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true", href: el.getAttribute("href") || "", activo });
      }
    }
    return salida;
  };
  const ubicar = (ambito, c) => (() => {
    let k = 0;
    for (const raiz of raices(ambito)) {
      for (const el of raiz.querySelectorAll(SEL)) {
        if (!visible(el) || (ambito !== "ventana" && el.closest("[data-aud-ventana]"))) continue;
        if (nombre(el) === c.nombre && el.tagName === c.tag) {
          if (k === c.idx) return el;
          k += 1;
        }
      }
    }
    return null;
  })();
  const marcarVistas = () => document.querySelectorAll(VENTANAS).forEach((e) => e.setAttribute("data-aud-vista", "1"));
  const ventanasVisibles = () => [...document.querySelectorAll(VENTANAS)].filter(visible);
  const etiquetaVentana = (el) =>
    (el.getAttribute("aria-label") || el.querySelector("h1,h2,h3")?.textContent || el.className.toString().split(" ")[0] || el.getAttribute("role") || "ventana").replace(/\s+/g, " ").trim().slice(0, 50);
  // Marca la ventana nueva (o el contenedor del control si solo cambió aria-expanded) y devuelve su etiqueta.
  const detectarVentana = (el) => {
    document.querySelectorAll("[data-aud-ventana]").forEach((e) => e.removeAttribute("data-aud-ventana"));
    const nuevas = ventanasVisibles().filter((e) => !e.hasAttribute("data-aud-vista"));
    let raiz = nuevas.at(-1) || null;
    if (!raiz && el && el.getAttribute("aria-expanded") === "true") {
      const id = el.getAttribute("aria-controls");
      raiz = (id && document.getElementById(id)) || el.parentElement;
    }
    if (!raiz) return null;
    raiz.setAttribute("data-aud-ventana", "1");
    return { etiqueta: etiquetaVentana(raiz), editor: !!raiz.closest(".hubly-composer, .hubly-composer-overlay") || raiz.matches(".hubly-composer, .hubly-composer-overlay") };
  };
  const firma = () => ({
    url: `${location.pathname}${location.search}`,
    ventanas: ventanasVisibles().length,
    texto: document.body.innerText.slice(0, 15000),
    campos: [...document.querySelectorAll("input, select, textarea")].map((e) => e.value).join("|"),
    nodos: document.body.querySelectorAll("*").length,
    estados: [...document.querySelectorAll('[aria-pressed="true"],[aria-selected="true"],[aria-expanded="true"],[aria-current],[aria-checked="true"]')].map((e) => e.getAttribute("aria-label") || e.innerText || e.tagName).join(";"),
    tema: document.documentElement.className,
    foco: document.activeElement ? `${document.activeElement.tagName}:${(document.activeElement.getAttribute("aria-label") || "").slice(0, 20)}` : "",
  });
  const tapado = (el) => {
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return t && !el.contains(t) ? `${t.tagName.toLowerCase()}.${String(t.className).split(" ")[0]}` : "";
  };
  window.__aud = { lista, ubicar, marcarVistas, detectarVentana, firma, tapado };
};

const diferencias = (a, b) => {
  const c = [];
  if (a.url !== b.url) c.push(`navega a ${b.url}`);
  if (b.ventanas > a.ventanas) c.push("abre una ventana");
  if (b.ventanas < a.ventanas) c.push("cierra una ventana");
  if (a.tema !== b.tema) c.push("cambia la clase de la página");
  if (a.estados !== b.estados) c.push("cambia un estado");
  if (a.texto !== b.texto && a.url === b.url) c.push("cambia el texto");
  else if (a.nodos !== b.nodos && a.url === b.url) c.push("cambia el contenido");
  if (a.campos !== b.campos && a.url === b.url) c.push("cambia un campo");
  return c;
};

async function nuevoContexto() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-MX", timezoneId: "America/Mexico_City", acceptDownloads: false });
  const estado = { bloqueadas: 0 };
  await ctx.addInitScript(() => {
    localStorage.setItem("hubly-audit", "1");
    window.__aud_evt = [];
    window.print = () => window.__aud_evt.push("abre la impresión");
    window.open = () => { window.__aud_evt.push("abre otra pestaña"); return null; };
    try { navigator.clipboard.writeText = async () => { window.__aud_evt.push("copia al portapapeles"); }; } catch {}
  });
  await ctx.addInitScript(enPagina);
  await ctx.route("**/*", (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== BASE) return route.abort();
    if (req.method() !== "GET" && !url.pathname.startsWith("/_next")) {
      estado.bloqueadas += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    }
    return route.continue();
  });
  return { ctx, estado };
}

async function cargar(page, ruta) {
  // La tienda del modo demo vive en localStorage: sin limpiarla, lo que hace un control contamina a los siguientes.
  await page.goto(BASE + "/robots.txt").catch(() => {});
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});
  await page.goto(BASE + (ruta === SHELL ? "/dashboard" : ruta));
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(150);
}

// Recorre el camino de clics que abre una ventana y la marca.
async function abrir(page, ruta, camino) {
  await cargar(page, ruta);
  let ventana = null;
  for (const paso of camino) {
    await page.evaluate(() => window.__aud.marcarVistas());
    const h = await page.evaluateHandle(([a, c]) => window.__aud.ubicar(a, c), [paso.ambito, paso.control]);
    const el = h.asElement();
    if (!el) return { ok: false };
    await el.hover({ timeout: 1500 }).catch(() => {});
    await el.click({ timeout: 4000 });
    await page.waitForTimeout(300);
    ventana = await page.evaluate((e) => window.__aud.detectarVentana(e), el);
    if (!ventana) {
      await page.waitForTimeout(500);
      ventana = await page.evaluate((e) => window.__aud.detectarVentana(e), el);
    }
    if (!ventana) return { ok: false };
  }
  return { ok: true, ventana };
}

async function pulsar(page, estado, ambito, c, ruta, camino, filas, ventanaNombre, porExplorar) {
  const fila = { ruta, ventana: ventanaNombre, control: c.nombre, resultado: "", detalle: "" };
  filas.push(fila);
  if (SALTAR.test(c.nombre)) { fila.resultado = "omitido"; fila.detalle = "acción de sesión"; return; }
  if (c.disabled) { fila.resultado = "deshabilitado"; return; }
  if (c.tag === "A") { fila.resultado = "enlace"; fila.detalle = c.href; return; }
  const abierto = await abrir(page, ruta, camino);
  if (!abierto.ok && camino.length) { fila.resultado = "no reproducible"; fila.detalle = "la ventana no se volvió a abrir"; return; }
  const h = await page.evaluateHandle(([a, x]) => window.__aud.ubicar(a, x), [ambito, c]);
  const el = h.asElement();
  if (!el) { fila.resultado = "no reproducible"; return; }
  const errores = [];
  const alError = (e) => errores.push(e.message);
  page.on("pageerror", alError);
  let selector = false;
  const alSelector = () => { selector = true; };
  page.on("filechooser", alSelector);
  const antes = await page.evaluate(() => window.__aud.firma());
  const escrituras = estado.bloqueadas;
  await page.evaluate(() => window.__aud.marcarVistas());
  try {
    await el.hover({ timeout: 1500 }).catch(() => {});
    try {
      await el.click({ timeout: 4000 });
    } catch (e1) {
      const por = await el.evaluate((n) => window.__aud.tapado(n)).catch(() => "");
      await page.waitForTimeout(500);
      await el.click({ timeout: 4000 }).catch((e2) => { throw new Error(`${String(e2.message).split("\n")[0].slice(0, 90)}${por ? `; lo tapa ${por}` : ""}`); });
    }
    await page.waitForTimeout(350);
    const despues = await page.evaluate(() => window.__aud.firma());
    const eventos = await page.evaluate(() => { const e = window.__aud_evt.splice(0); return e; });
    const cambios = diferencias(antes, despues);
    if (selector) cambios.push("abre el selector de archivos");
    cambios.push(...eventos);
    if (estado.bloqueadas > escrituras) cambios.push("intenta guardar (bloqueado)");
    const nueva = await page.evaluate((e) => window.__aud.detectarVentana(e), el);
    if (errores.length) { fila.resultado = "error"; fila.detalle = errores.at(-1).slice(0, 120); }
    else if (cambios.length || nueva) {
      fila.resultado = "responde";
      fila.detalle = cambios.join("; ");
      if (nueva && !cambios.includes("abre una ventana")) fila.detalle = ["abre una ventana", ...cambios].join("; ");
      if (nueva && !nueva.editor && porExplorar) porExplorar.push({ ambito: "ventana", control: c, etiqueta: nueva.etiqueta, camino: [...camino, { ambito, control: c }] });
      if (nueva?.editor) fila.detalle += " (editor: lo cubre compositor.spec)";
    } else if (c.activo) { fila.resultado = "ya activo"; fila.detalle = "estaba seleccionado"; }
    else { fila.resultado = "sin efecto visible"; }
  } catch (e) {
    fila.resultado = "no se pudo pulsar";
    fila.detalle = String(e.message).split("\n")[0].slice(0, 140);
  } finally {
    page.off("pageerror", alError);
    page.off("filechooser", alSelector);
  }
}

async function auditarRuta(ruta) {
  const { ctx, estado } = await nuevoContexto();
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  const filas = [];
  const ambito = ruta === SHELL ? "shell" : "main";
  await cargar(page, ruta);
  const lista = await page.evaluate((a) => window.__aud.lista(a), ambito);
  const pendientes = [];
  for (const c of lista) {
    if (!c.nombre) continue;
    await pulsar(page, estado, ambito, c, ruta, [], filas, "", pendientes);
  }
  // Una ronda: los controles dentro de cada ventana que se abrió.
  for (const v of pendientes) {
    const abierto = await abrir(page, ruta, v.camino).catch(() => ({ ok: false }));
    if (!abierto.ok) continue;
    const dentro = await page.evaluate(() => window.__aud.lista("ventana"));
    const hechos = new Set(filas.filter((f) => f.ventana === v.etiqueta).map((f) => f.control));
    for (const c of dentro) {
      if (!c.nombre || hechos.has(c.nombre)) continue;
      hechos.add(c.nombre);
      await pulsar(page, estado, "ventana", c, ruta, v.camino, filas, v.etiqueta, null);
    }
  }
  await ctx.close();
  console.log(ruta, lista.length, "controles en la página,", filas.length, "en total");
  return filas;
}

const cola = [...RUTAS, SHELL];
const porRuta = new Map();
await Promise.all(
  Array.from({ length: PARALELO }, async () => {
    while (cola.length) {
      const ruta = cola.shift();
      try { porRuta.set(ruta, await auditarRuta(ruta)); }
      catch (e) { porRuta.set(ruta, [{ ruta, ventana: "", control: "(toda la ruta)", resultado: "error", detalle: String(e.message).split("\n")[0].slice(0, 120) }]); console.log(ruta, "ERROR", e.message.split("\n")[0]); }
    }
  })
);
await browser.close();

const filas = [...RUTAS, SHELL].flatMap((r) => porRuta.get(r) ?? []);
const conteo = (r) => filas.filter((f) => f.resultado === r).length;
const esc = (s) => String(s).replace(/\|/g, "\\|");
const enVentana = filas.filter((f) => f.ventana).length;
const md = [
  "# Matriz de controles de Hubly",
  "",
  `Generada con \`npm run audit:controles\` en modo demo el ${new Date().toISOString().slice(0, 10)} (previo a la integración). Cubre botones, enlaces y pestañas visibles al cargar cada ruta, la barra lateral y el botón de Hubi, y los controles dentro de cada menú, modal o panel que abre un control de la página (una ronda de profundidad).`,
  "",
  "**Qué significa:** «responde» indica que pulsar cambió la página (el detalle dice qué cambió) sin error; no prueba que el resultado sea correcto ni que persista, porque la auditoría bloquea las escrituras. La persistencia y los permisos se prueban en `e2e/` y `tests/`. «Ya activo» es una pestaña o filtro que ya estaba seleccionado, así que no cambia nada: es lo esperado. «Sin efecto visible» pide revisión manual: puede ser un botón muerto o un cambio que la auditoría no detecta. Los editores (compositor) se abren pero no se recorren aquí: los cubre `compositor.spec.ts`.",
  "",
  `**Totales:** ${filas.length} controles (${filas.length - enVentana} en páginas, ${enVentana} dentro de ventanas) · ${conteo("responde")} responden · ${conteo("ya activo")} ya activos · ${conteo("enlace")} enlaces · ${conteo("sin efecto visible")} sin efecto visible · ${conteo("deshabilitado")} deshabilitados · ${conteo("error")} con error · ${conteo("no se pudo pulsar") + conteo("no reproducible")} sin poder probar · ${conteo("omitido")} omitidos.`,
  "",
  `Alias con la misma pantalla: ${Object.entries(ALIAS).map(([a, b]) => `\`${a}\` → \`${b}\``).join(", ")}.`,
  "",
  "| Ruta | Ventana | Control | Resultado | Detalle |",
  "|---|---|---|---|---|",
  ...filas.map((f) => `| \`${f.ruta}\` | ${esc(f.ventana || "—")} | ${esc(f.control)} | ${f.resultado} | ${esc(f.detalle)} |`),
  "",
].join("\n");
fs.writeFileSync(new URL("../../docs/MATRIZ-CONTROLES.md", import.meta.url), md);
console.log(md.split("\n")[6]);
