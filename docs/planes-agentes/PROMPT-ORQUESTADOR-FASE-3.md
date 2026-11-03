# Prompt: orquestador de la Fase 3 (deuda anti-slop)

Eres el orquestador de Hubly para hoy. Coordinas subagentes; tú no editas pantallas.

Tu trabajo es dividir, lanzar, revisar lo que te entregan, integrarlo y commitear. Termina el día con la deuda de `check:ui` lo más baja posible, sin romper nada y sin cambiar la forma de `/dashboard` ni de `/calendario`.

## 1. Lee antes de lanzar a nadie

1. `AGENTS.md` y `web/AGENTS.md`. Esta versión de Next.js (16.4) difiere de la que conoces: su documentación está en `web/node_modules/next/dist/docs/`.
2. `docs/GUIA-UX-UI-AGENTES.md` completa. Es la ley visual; cada subagente debe leerla también.
3. Las secciones «Plan anti-slop y arquitectura» al final de `docs/ENTREGA-PARIDAD-HENRY.md`, para saber qué ya está hecho y por qué.
4. Rama `paridad-henry`. Ejecuta `git log --oneline -12` y `git status`.

## 2. Estado de partida

- **`check:ui`:** 1263 hallazgos en 47 archivos (`web/scripts/check-ui-baseline.json`).
- **Pruebas:** `tsc` limpio, `npm test` 43/43, `npm run test:db` 69/69.
- **Playwright:** 86/88. Las 2 que fallan son conocidas: `e2e/salud-cuentas.spec.ts:14` y `:51`. Leen el espacio de demo guardado en `web/.data/workspaces/workspace-default.json` en vez de la semilla. No las cuentes como regresión tuya.
- **Ya existe, úsalo:**
  - `lib/labels.ts` (etiquetas)
  - `lib/publishing/gateway.ts` (publicar)
  - `lib/share-links.ts`
  - `lib/use-active-brand.ts`
  - `lib/store-slices/`
  - `components/app/shell/`
  - `components/app/dashboard/widgets/`
  - `components/app/social/parrillas/`
  - Clases `.hubly-pop` (sombra de menú) y `.hubly-shell-scrim` (velo)
  - Escala `--layer-*` (guía §5)
  - `useLayer` y `useModalPresence`

## 3. Reglas que no se negocian

1. **No apagues ni reinicies el servidor de desarrollo.** El usuario lo está viendo. Si `localhost:3000` responde, úsalo.
2. **La base de `check:ui` es tuya.** Solo tú ejecutas `npm run check:ui -- --update`, una vez por lote integrado y después de comprobar que la deuda bajó. Ningún subagente la toca.
3. **Un archivo, un dueño.** Dos subagentes nunca editan el mismo archivo. Los CSS globales (`dashboard-polish.css`, `hubly-saas.css` y `app-base.css`) son de un solo subagente durante todo el día. Si otro necesita una clase nueva, te la pide a ti y tú se la pasas a ese dueño.
4. **Mover no es reescribir.** Al partir o limpiar, el JSX se mueve tal cual y solo se cambia lo que marca la guía. Un archivo nuevo debe salir con 0 hallazgos.
5. **Colores:**
   - Solo tokens de la guía §3.
   - `ui-ok: motivo` solo para colores de marca de terceros (Instagram, WhatsApp…) o maquetas que reproducen algo externo.
   - El verde solo significa estado correcto; el error toma su color de `STATUS_META.changes`.
   - Si falta un token, no se inventa: se usa el más cercano y se avisa.
6. **No cambies textos, datos ni comportamiento** salvo lo que la guía obliga: sin exclamaciones, mayúscula solo inicial, «Función prevista» y «Datos de ejemplo».
7. **Cualquier cambio de flujo o de producto se le pregunta al usuario. Tú no lo decides.** Ejemplos: quitar un modal, unificar dos formas de hacer algo, cambiar qué hace un botón. Junta las preguntas y házselas de una vez.
8. **Git:**
   - Commits en `paridad-henry`, uno por lote integrado, en español. El mensaje termina con la línea de coautoría que use tu entorno.
   - No hagas push ni abras PR sin que te lo pidan.
   - No metas archivos de `output/` ni capturas sueltas.

## 4. Lotes de trabajo

Lanza en paralelo los subagentes cuyos archivos no se cruzan. Cifras actuales de deuda entre paréntesis.

| Subagente | Archivos (es su dueño exclusivo) | Qué hace |
|---|---|---|
| **A · CSS globales** | `app/(app)/dashboard-polish.css` (416), `hubly-saas.css` (210), `app-base.css` (105) | Hex y rgb a tokens. Las 14 capas sueltas a `--layer-*`. Quitar los degradados. Borrar los tokens prohibidos de la guía §3 que nadie use (comprobarlo con grep en todo `web/`). No tocar las definiciones de `:root`. Va en tandas, y entre tanda y tanda revisa `/dashboard` y `/calendario` en claro y oscuro: son la referencia. |
| **B · Anuncios** | `app/(app)/anuncios/page.tsx` (102) | Colores a tokens. 3 emojis a duotono. Degradado fuera. Capa a token. Mantener «Datos de ejemplo». |
| **C · Libretas** | `components/app/NotebookReaderModal.tsx` (70), `KraftNotebookCard.tsx` (29), `tasks/NotebooksSection.tsx` (10) | La libreta Kraft es una ilustración: sus colores de papel pueden llevar `ui-ok` justificado. Todo lo demás, a tokens. El modal debe seguir la receta §9.9. |
| **D · Modales** | `AutoSuggestionsModal.tsx` (27), `InviteTeamModal.tsx` (24), `NewBrandModal.tsx` (24), `WidgetConfigModal.tsx` (13), `dashboard/PendientesModal.tsx` (11), `dashboard/MemberDrawer.tsx` (8) | Todos con `useLayer` y `useModalPresence`, sin z-index propio, y colores a tokens. Hoy varios escuchan Escape por su cuenta: pasarlos a `useLayer` sin romper `e2e/compositor.spec.ts`. |
| **E · Equipo** | `components/app/dashboard/EquipoView.tsx` (45) | Los 39 colores restantes, incluida la paleta de `AchievementBadgeSvg`, pasan a tokens o a un único marino con intensidades. |
| **F · Pantallas medianas** | `app/(app)/chat/page.tsx` (21), `reportes/page.tsx` (15), `crm/page.tsx` (12), `marca/page.tsx` (7), `tareas/page.tsx` (6), `components/app/tasks/TaskBoard.tsx` (22), `ArchivosYProyectosView.tsx` (15), `FloatingAIDrawer.tsx` (10, son 7 emojis) | Colores, capas, tamaños y emojis según la guía. |
| **G · Prueba de Salud** | `e2e/salud-cuentas.spec.ts` | Que en su `beforeEach` sirva la semilla (`createSeedWorkspaceData`) en el `GET` de `/api/workspace` en lugar de los datos guardados. Así pasa con 1 cuenta en riesgo y 7 sugerencias. No tocar la app. |

Cuando acabe un lote y quede tiempo, sigue con la cola de la base (archivos de menos de 6 hallazgos), repartida igual: un dueño por archivo.

**No hacer hoy:**
- No pasar a clases los estilos en línea del sidebar ni de los widgets. Es otro plan.
- Nada de Supabase ni de Zernio.
- No construir el Modo Revisión ni los portales `/review` y `/connect`.

## 5. Encargo para cada subagente

Copia esta plantilla y rellena lo que va entre ángulos:

> Eres un subagente de Hubly. Tu dueño exclusivo: `<archivos>`. No edites nada fuera de esa lista; si lo necesitas, para y pídelo.
>
> 1. Lee completas `docs/GUIA-UX-UI-AGENTES.md` y las notas de `web/AGENTS.md`.
> 2. Ejecuta `cd web && node scripts/check-ui.mjs --list` y apunta los hallazgos de tus archivos.
> 3. Corrige cada uno según la guía (§3 color, §4 tipografía, §5 espacio, capas y sombras, §6 iconos, §9.9 modal, §14 textos). Busca la receta antes de crear nada.
> 4. Verifica:
>    - `node scripts/check-ui.mjs` debe pasar, con tus archivos mejor que antes.
>    - `npx tsc --noEmit` sin errores.
>    - `npm test`.
>    - Si tocaste una pantalla, mírala en `http://localhost:3000` a 1440 claro, 1440 oscuro y 375, y recórrela con teclado. No reinicies el servidor.
> 5. No ejecutes `check:ui -- --update`, no hagas commits y no toques `check-ui-baseline.json`.
> 6. Entrega con el formato §17 de la guía, y añade:
>    - Hallazgos antes y después por archivo.
>    - Cada `ui-ok` que pusiste, con su motivo.
>    - Lo que se ve distinto.
>    - Cualquier decisión de producto que no tomaste.
>    - Lo que no pudiste comprobar.

## 6. Cómo integras cada lote

1. **Revisa el diff tú mismo.** Mira que no haya cambios fuera de sus archivos, que no se perdiera texto, que no aparezcan `!important`, que no se inventaran tokens y que cada `ui-ok` esté justificado. Si algo falla, devuélveselo al subagente con el motivo concreto.
2. **Corre `npm run check:ui`, `npx tsc --noEmit` y `npm test`.** Si pasan, ejecuta `npm run check:ui -- --update` y confirma que la cifra bajó.
3. **Corre `npx playwright test`** al menos tras los lotes A y D, y al final del día. Tarda de 5 a 12 minutos, así que lánzalo en segundo plano. Solo se permiten los 2 fallos conocidos (y ninguno cuando G esté integrado).
4. **Haz commit del lote** con un mensaje que diga qué cambió, qué se ve distinto y la cifra nueva de `check:ui`.
5. **Añade una sección corta a `docs/ENTREGA-PARIDAD-HENRY.md`.** Debe incluir:
   - Qué hizo el lote.
   - Qué se ve distinto.
   - Una tabla de verificación.
   - Lo que quedó sin comprobar.

## 7. Al cerrar el día

Responde al usuario con lo siguiente:

- La cifra de `check:ui`: empezó en 1263 y termina en la cifra nueva.
- Los commits del día.
- Lo que se ve distinto, pantalla por pantalla.
- Las preguntas de producto pendientes.
- Lo que no se comprobó.

No digas que algo funciona si no lo viste funcionar.
