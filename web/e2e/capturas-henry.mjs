// Capturas de las 8 escenas del calendario social y su editor, para compararlas con docs/referencias/henry-2026-10-31/.
//   E2E_BASE=http://localhost:3001 node e2e/capturas-henry.mjs [ronda] [escena...]
// Guarda PNG de viewport en docs/planes-agentes/capturas-A/<ronda>/. Bloquea toda escritura a /api/ para no tocar datos guardados.
// Playwright borra web/e2e/.salida, por eso no se usa esa carpeta.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "planes-agentes", "capturas-A");
const RONDA = process.argv[2] || "ronda-1";
const SOLO = process.argv.slice(3);
const SALIDA = join(RAIZ, RONDA);
mkdirSync(SALIDA, { recursive: true });

import { deflateSync } from "node:zlib";

// Imagen de prueba (degradado marino a celeste) para que el editor tenga un archivo real que mostrar.
function crearPng(w, h) {
  const crcTabla = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTabla[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const trozo = (tipo, datos) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo), datos]);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(cuerpo));
    return Buffer.concat([len, cuerpo, sum]);
  };
  const cab = Buffer.alloc(13); cab.writeUInt32BE(w, 0); cab.writeUInt32BE(h, 4); cab[8] = 8; cab[9] = 2;
  const filas = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    const o = y * (w * 3 + 1);
    for (let x = 0; x < w; x += 1) {
      const t = (x + y) / (w + h);
      filas[o + 1 + x * 3] = Math.round(22 + (220 - 22) * t);
      filas[o + 2 + x * 3] = Math.round(50 + (239 - 50) * t);
      filas[o + 3 + x * 3] = Math.round(79 + (249 - 79) * t);
    }
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo("IHDR", cab), trozo("IDAT", deflateSync(filas)), trozo("IEND", Buffer.alloc(0))]);
}
const PNG = crearPng(720, 720);

// La subida real pide un registro, envía el archivo a una URL firmada y lo confirma. Aquí cada paso se simula en el navegador.
async function simularMedia(ctx, retrasoMs = 0) {
  const registros = new Map();
  await ctx.route("**/api/media", async (r) => {
    if (r.request().method() !== "POST") return r.continue();
    const cuerpo = r.request().postDataJSON();
    const record = { id: `e2e-${registros.size + 1}`, brandId: cuerpo.brandId, folder: cuerpo.folder || "", name: cuerpo.name, kind: "image", mime: cuerpo.mime, sizeBytes: cuerpo.sizeBytes, status: "pending", createdAt: new Date().toISOString() };
    registros.set(record.id, record);
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ record, upload: { url: `${BASE}/__e2e_subida/${record.id}`, headers: {} } }) });
  });
  await ctx.route("**/__e2e_subida/**", async (r) => {
    if (retrasoMs) await new Promise((ok) => setTimeout(ok, retrasoMs));
    return r.fulfill({ status: 200, body: "" });
  });
  await ctx.route("**/api/media/*/file", (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
}

async function abrirCalendario(page, conDatos = false) {
  await page.goto(`${BASE}/parrillas?tab=calendario`);
  await page.waitForLoadState("networkidle");
  const ejemplo = page.getByRole("button", { name: /datos de ejemplo/i });
  if (await ejemplo.count()) await ejemplo.first().click();
  await page.locator(".hubly-social-calendar").waitFor();
  if (conDatos) await sembrar(page);
  await page.waitForTimeout(250);
}

// Posts de prueba solo en la memoria de esta página (las escrituras a /api/ están bloqueadas): permiten ver tarjetas, chips y filas reales.
async function sembrar(page) {
  await page.evaluate(() => {
    const st = window.__hubly.getState();
    const base = { brandId: st.activeBrandId, caption: "Copy de ejemplo", cover: "steam", scheduledTime: "", assignee: "", pillar: "General" };
    const posts = [
      { title: "Reel de la temporada de otoño en Café Bruma", network: "Instagram", networks: ["Instagram", "TikTok"], format: "Reel / Video", status: "scheduled", scheduledDate: "2026-10-27", scheduledTime: "09:00" },
      { title: "Carrusel con tres recetas de bebidas calientes para compartir con tus amigos en las tardes frías", network: "Facebook", networks: ["Facebook", "LinkedIn", "Pinterest"], format: "Carrusel", status: "approved", scheduledDate: "2026-10-29" },
      { title: "Historia del día de muertos", network: "Instagram", networks: ["Instagram"], format: "Story", status: "pending", scheduledDate: "2026-10-31", scheduledTime: "18:30" },
      { title: "Idea sin fecha: taller de latte art", network: "Instagram", networks: ["Instagram"], format: "Imagen", status: "draft", scheduledDate: "" },
    ];
    posts.forEach((p) => st.savePost({ ...base, ...p }));
  });
}

async function abrirEditor(page) {
  await abrirCalendario(page);
  await page.evaluate(() => window.__hubly?.getState().openComposer());
  await page.locator(".hubly-composer").waitFor();
  await page.waitForTimeout(700); // el modal tarda 500 ms en asentarse
}

async function fijarSidebar(page, abierto) {
  const colapsado = await page.locator(".hubly-sidebar").evaluate((el) => el.classList.contains("is-collapsed")).catch(() => null);
  if (colapsado === null) return;
  if (abierto === colapsado) {
    await page.locator(".hubly-sidebar-collapse-btn").click();
    await page.waitForTimeout(350);
  }
}

async function cambiarVista(page, nombre) {
  await page.getByRole("tab", { name: nombre, exact: true }).click();
  await page.waitForTimeout(250);
}

// Cada escena deja la página lista; la captura la hace el bucle principal.
const ESCENAS = {
  "01-compositor-carga": {
    desc: "Editor con una subida en curso y vista previa",
    editor: true,
    retraso: 20000,
    async preparar(page) {
      await abrirEditor(page);
      await page.locator(".hubly-composer-networks").getByRole("button", { name: "Facebook", exact: true }).click();
      await page.getByLabel("Subir archivos del post").setInputFiles([{ name: "Fondo1.png", mimeType: "image/png", buffer: PNG }]);
      await page.locator(".hubly-media-queue").waitFor();
      await page.waitForTimeout(500);
    },
  },
  "02-selector-content-manager": {
    desc: "Selector de la biblioteca sobre el editor",
    editor: true,
    async preparar(page) {
      await abrirEditor(page);
      await page.getByRole("button", { name: /Content Manager/ }).click();
      await page.getByRole("dialog", { name: "Content Manager" }).waitFor();
      await page.waitForTimeout(400);
    },
  },
  "03-formatos-vista-previa": {
    desc: "Editor desplazado a formato y vista previa",
    editor: true,
    async preparar(page) {
      await abrirEditor(page);
      await page.getByLabel("Subir archivos del post").setInputFiles([{ name: "Fondo1.png", mimeType: "image/png", buffer: PNG }]);
      await page.locator(".hubly-composer-media li").waitFor();
      await page.locator(".hubly-composer-networks").getByRole("button", { name: "Facebook", exact: true }).click();
      await page.locator(".hubly-composer-main").evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await page.waitForTimeout(300);
    },
  },
  "04-calendario-kanban": {
    desc: "Calendario en vista Kanban",
    async preparar(page, datos) {
      await abrirCalendario(page, datos);
      await cambiarVista(page, "Kanban");
    },
  },
  "05-calendario-tabla": {
    desc: "Calendario en vista Tabla",
    async preparar(page, datos) {
      await abrirCalendario(page, datos);
      await cambiarVista(page, "Tabla");
    },
  },
  "06-calendario-semana": {
    desc: "Calendario en vista Semana",
    async preparar(page, datos) {
      await abrirCalendario(page, datos);
      await cambiarVista(page, "Semana");
    },
  },
  "09-calendario-mes-extra": {
    desc: "Calendario en vista Mes (no está en las referencias)",
    extra: true,
    async preparar(page, datos) {
      await abrirCalendario(page, datos);
    },
  },
  "07-menu-calendario": {
    desc: "Menú «Más opciones» sobre la tabla",
    async preparar(page, datos) {
      await abrirCalendario(page, datos);
      await cambiarVista(page, "Tabla");
      await page.getByRole("button", { name: "Más opciones", exact: true }).click();
      await page.getByRole("menuitem").first().waitFor();
      await page.waitForTimeout(250);
    },
  },
  "08-compositor-pinterest": {
    desc: "Editor con Pinterest seleccionado",
    editor: true,
    async preparar(page) {
      await abrirEditor(page);
      await page.getByLabel("Subir archivos del post").setInputFiles([{ name: "Cancha.png", mimeType: "image/png", buffer: PNG }]);
      await page.locator(".hubly-composer-media li").waitFor();
      await page.locator(".hubly-composer-networks").getByRole("button", { name: "Pinterest", exact: true }).click();
      await page.waitForTimeout(500);
    },
  },
};

// Combinaciones con valor: claro y oscuro en escritorio y móvil; sidebar abierto/retraído solo donde se ve (calendario en escritorio);
// movimiento reducido en el editor, que es donde hay animación de entrada.
const VARIANTES = [
  { id: "esc-claro", w: 1440, h: 900, tema: "light", sidebar: "auto" },
  { id: "esc-oscuro", w: 1440, h: 900, tema: "dark", sidebar: "auto" },
  { id: "mov-claro", w: 390, h: 844, tema: "light", sidebar: "auto" },
  { id: "mov-oscuro", w: 390, h: 844, tema: "dark", sidebar: "auto" },
  { id: "esc-claro-sidebar-abierto", w: 1440, h: 900, tema: "light", sidebar: "abierto", soloCalendario: true },
  { id: "esc-claro-sidebar-retraido", w: 1440, h: 900, tema: "light", sidebar: "retraido", soloCalendario: true },
  { id: "esc-claro-con-datos", w: 1440, h: 900, tema: "light", sidebar: "auto", soloCalendario: true, datos: true },
  { id: "esc-oscuro-con-datos", w: 1440, h: 900, tema: "dark", sidebar: "auto", soloCalendario: true, datos: true },
  { id: "mov-claro-con-datos", w: 390, h: 844, tema: "light", sidebar: "auto", soloCalendario: true, datos: true },
  { id: "esc-claro-mov-reducido", w: 1440, h: 900, tema: "light", sidebar: "auto", reducido: true, soloEditor: true },
];

const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL || "msedge" });
const hechos = [];
const errores = [];

const SOLO_VARIANTE = (process.env.VARIANTES || "").split(",").filter(Boolean);
for (const v of VARIANTES) {
  if (SOLO_VARIANTE.length && !SOLO_VARIANTE.includes(v.id)) continue;
  for (const [clave, escena] of Object.entries(ESCENAS)) {
    if (SOLO.length && !SOLO.some((s) => clave.startsWith(s))) continue;
    if (v.soloCalendario && escena.editor) continue;
    if (escena.extra && !v.datos) continue;
    if (v.soloEditor && !escena.editor) continue;
    const ctx = await browser.newContext({
      viewport: { width: v.w, height: v.h },
      locale: "es-MX",
      timezoneId: "America/Mexico_City",
      reducedMotion: v.reducido ? "reduce" : "no-preference",
      deviceScaleFactor: 1,
      hasTouch: v.w < 768,
    });
    await ctx.addInitScript((t) => {
      try { localStorage.setItem("hubly-theme", t); } catch {}
    }, v.tema);
    // Ninguna escritura llega al servidor: la tienda de demo guarda por /api/.
    await ctx.route("**/api/**", (r) =>
      r.request().method() === "GET" ? r.continue() : r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
    );
    await simularMedia(ctx, escena.retraso || 0);
    const page = await ctx.newPage();
    page.setDefaultTimeout(12_000);
    page.on("pageerror", (e) => errores.push(`${clave} ${v.id}: ${e.message}`));
    try {
      await escena.preparar(page, v.datos);
      if (!escena.editor && v.w >= 768 && v.sidebar !== "auto") await fijarSidebar(page, v.sidebar === "abierto");
      const archivo = join(SALIDA, `${clave}__${v.id}.png`);
      await page.screenshot({ path: archivo });
      hechos.push(`${clave}__${v.id}`);
    } catch (e) {
      errores.push(`${clave} ${v.id}: ${String(e.message).split("\n")[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${hechos.length} capturas en ${SALIDA}`);
for (const e of errores) console.log(`ERROR ${e}`);
process.exitCode = errores.length ? 1 : 0;
