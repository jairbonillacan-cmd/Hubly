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
