# Coordinación de los tres agentes

Fecha: 31 de octubre de 2026. Base común: commit `73bf591` de `paridad-henry`.

## Cómo lanzarlos

Abre cada agente y pégale **todo** el bloque «Prompt» de su plan. Pueden arrancar a la vez, en cualquier orden.

| Agente | Modelo orquestador | Subagentes | Plan | Rama | Carpeta | Puerto |
|---|---|---|---|---|---|---|
| A | Opus 5.5, esfuerzo medio | Sonnet 5.5, esfuerzo alto | [PLAN-A-OPUS.md](PLAN-A-OPUS.md) | `agente/opus-diseno` | `C:\Users\jairb\Desktop\Hubly-wt\opus` | 3001 |
| B | Gemini 3.8 Flash High | Gemini 3.8 Flash High | [PLAN-B-GEMINI.md](PLAN-B-GEMINI.md) | `agente/gemini-flujos` | `C:\Users\jairb\Desktop\Hubly-wt\gemini` | 3002 |
| C | GLM 5.3 Flash Max | GLM 5.3 Flash Max | [PLAN-C-GLM.md](PLAN-C-GLM.md) | `agente/glm-calidad` | `C:\Users\jairb\Desktop\Hubly-wt\glm` | 3003 |

## Por qué no se pisan

1. **Carpeta y rama propias.** Cada agente trabaja en su propio `git worktree`. Sus archivos, `.next`, `node_modules` y datos demo (`web/.data`) están separados.
2. **Archivos exclusivos.** Cada archivo tiene como máximo un dueño, definido en [comprobar-propiedad.mjs](comprobar-propiedad.mjs). Lo que no aparece en la lista está congelado para los tres.
3. **Sin dependencias.** Ninguna tarea necesita el resultado de otro agente. Si alguno encuentra algo fuera de su propiedad, no lo toca: lo anota en la cola de su entrega.
4. **Comprobación antes de terminar.** Cada agente corre el comprobador sobre sus commits. El reparto completo pasa `--solape`.

| Dueño | Qué le toca | Por qué ese nivel |
|---|---|---|
| A | Diseño y criterio: `/anuncios`, `/ia`, buscador, compositor, calendario, dashboard y todo el CSS global | Decisiones de producto y comparación visual |
| B | Flujos: auditoría de controles, botones muertos y móvil en las otras 11 rutas | Criterio acotado por una auditoría concreta |
| C | Calidad mecánica: iconos, higiene de pruebas, prueba de Excel, auditoría de foco y pruebas unitarias | Tareas cerradas con resultado verificable |

**Congelado para los tres:** `web/lib/store.ts`, `web/lib/types.ts` y el resto de `web/lib/` salvo las pruebas nuevas de C; `web/app/api/`; `supabase/`; `web/package.json` y su lockfile; `web/playwright.config.ts`; `web/scripts/`; `web/components/app/icons/`; `AppDialogHost.tsx`, `SaveStatus.tsx`, `LiveUnavailable.tsx`; `DESIGN.md`, `AGENTS.md`, `docs/ENTREGA-PARIDAD-HENRY.md` y `docs/GUIA-UX-UI-AGENTES.md`.

## Lo que verás mientras trabajan

El servidor de `localhost:3000` corre en esta carpeta y **no** mostrará el trabajo de los agentes hasta integrarlo, porque cada uno edita su propia copia. Para verlo en vivo abre:

- Opus: http://localhost:3001
- Gemini: http://localhost:3002
- GLM: http://localhost:3003

Ningún agente puede apagar ni usar el servidor del 3000.

## Fallos esperados de `check:ui`

Hoy falla en cuatro reglas, repartidas así. Cada agente solo responde por las suyas, así que verá las ajenas hasta la integración.

| Regla | Dueño |
|---|---|
| `dashboard-polish.css`, tamaño de texto y radio | A |
| `BuyerPersonas.tsx` y `ProjectEditModal.tsx`, lucide | C |

## Integración (solo cuando los tres terminen)

La hace el agente A, después de que le digas que los tres entregaron. Ningún otro agente fusiona.

1. Leer `docs/planes-agentes/entregas/A.md`, `B.md` y `C.md`, en la rama de cada uno.
2. Crear `agente/integracion` desde `73bf591` en `C:\Users\jairb\Desktop\Hubly-wt\integracion` y fusionar, en este orden, C, B y A. No debe haber conflictos. Si aparece uno, detenerse y avisar: significa que falló el reparto.
3. Resolver las colas de las tres entregas.
4. En esa carpeta, con servidor propio en el puerto 3004: `npm run check:ui`, `npx tsc --noEmit`, `npm run build`, `npm test`, `npm run test:db`, `npx playwright test` y `npm run audit:controles`. Commitear la matriz resultante.
5. Actualizar `docs/ENTREGA-PARIDAD-HENRY.md` con resultados reales.
6. **Pedirte permiso** y entonces fusionar a `paridad-henry` en la carpeta principal sin reiniciar el servidor del 3000. A partir de ahí verás todo ahí mismo. No se toca `main`.
7. Limpiar `web/.data/media` de la carpeta principal desde `/archivos`, solo los archivos de prueba (`a.png`, `b.png`, `06-calendario-semana.png`, `prueba-*.png`). Nunca `WhatsApp Image 2026-10-27 at 09.57.42.jpeg`.

## Fuera de estos planes

- **Probar contra Supabase real** (migración `0004`, subida firmada, enlace de cliente): necesita tu proyecto y tus credenciales.
- **Revalidar en Henry en vivo** («Pilar», límites de 20 y 100 MB, importador): necesita tu sesión de Henry con CDP.
- **Fusionar a `main` y publicar:** decisión tuya.
