# Entrega del agente C — GLM 5.3 Flash Max

Rama: `agente/glm-calidad` (worktree `C:\Users\jairb\Desktop\Hubly-wt\glm`, base `73bf591`).
Servidor propio: `localhost:3003`, quedó encendido. El de 3000 no se tocó.
Subagentes: este entorno no permite subagentes, así que las cinco tareas se hicieron en esta misma sesión, en el orden C1 → C2 → C3 → C4 → C5, con el mismo modelo. No hubo cambio de modelo.

## Resultado por tarea

### C1 — Quitar lucide de dos archivos ✅
- `BuyerPersonas.tsx`: `Check → HublyCheckIcon`, `Plus → HublyPlusIcon`, `Trash2 → HublyTrashIcon` (los tres existían en `DuotoneIcons.tsx`; no hubo que improvisar). Tamaños (15/15/14/14) y `aria-label` intactos.
- `ProjectEditModal.tsx`: `X → HublyCloseIcon` (existía), tamaño 18 y `aria-label="Cerrar"` intactos.
- `npm run check:ui` ya no lista esos dos archivos; el único fallo que queda es `dashboard-polish.css` (de otro agente, ver Cola).
- Verificado en vivo en el 3003: `/marca` pinta los iconos duotono y el botón «Aceptada» alterna y revierte; `/proyectos` abre el modal «Editar proyecto», la × cierra y responde.
- Commit `4b68476`.

### C2 — Las pruebas no deben escribir en los datos demo ✅
Bloqueo de `**/api/workspace**` (solo pasa GET, el resto responde `{"ok":true}`) con el comentario de una línea, en:
- `compositor.spec.ts`: integrado en el `beforeEach` que ya tenía.
- `calendario.spec.ts`: `beforeEach` nuevo antes del primer test.
- `rutas.spec.ts`: `beforeEach` nuevo antes de los bucles.
- `listas.spec.ts`: en línea dentro de «Proyectos…» y «Kanban como en Henry…», antes de su `page.goto`. Sin archivo auxiliar compartido.

Corridas (los 4 archivos, puerto 3003):
- Corrida de partida (sin bloqueo): **57 pasan, 1 falla** (`/dashboard en light`, preexistente, ver Cola).
- Corrida 1 con bloqueo: **57 pasan, 1 falla** (la misma).
- Corrida 2 con bloqueo: **57 pasan, 1 falla** (la misma).

Hash de `web/.data/workspaces/workspace-default.json` (`sha256sum`):
- Antes de la partida: `0fcad1e0…10c95`
- Tras la partida (las pruebas sí escribieron): `46f90970…843e`
- Tras corrida 1 con bloqueo: `46f90970…843e` (sin cambios)
- Tras corrida 2 con bloqueo: `46f90970…843e` (sin cambios)
- Commit `3d4af19`.

### C3 — archivos.spec limpia lo que sube, y prueba de Excel ✅
- `archivos.spec.ts` ganó un `test.afterEach` que borra por nombre exactamente lo que la prueba subió (`subidos.push(nombre)` tras cada `setInputFiles`; el test de `virus.exe` no sube nada). Recorre las marcas del workspace vía API y hace `DELETE /api/media/<id>`. Corre también si la prueba falla.
- Listado de `web/.data/media` antes y después de correr `archivos.spec.ts`: **idéntico** (mismos 6 archivos + `index.json`; hash de `index.json` `010e8567…9841e` antes y después; la única diferencia del `ls` son los mtimes del directorio).
- Excel («Traer mi mes lee un Excel real», `calendario.spec.ts`):
  - 10 corridas en solitario (`-g "Traer mi mes lee un Excel real" --repeat-each=10`): **10/10 ok**.
  - 10 corridas justo tras forzar recompilación del servidor (línea temporal en `BuyerPersonas.tsx`, revertida después): **10/10 ok**.
  - **Total: 20 corridas, 20 pasaron, 0 fallos.** No se encontró causa y no se tocó la prueba: no se inventa una.
- Commit `93be374`.

### C4 — Auditoría de foco (solo informe) ✅
`E2E_BASE=http://localhost:3003 npm run audit:estados` corrió sin defecto propio, a la primera:

```
Foco visible en todos los controles recorridos.
0 hallazgos
```

**Lista completa de controles sin indicador de foco, agrupada por ruta y tema: vacía.** (18 rutas × claro/oscuro, hasta 40 Tab por ruta, se quitó lo repetido.) Verificación de sanidad aparte: la misma lógica de la auditoría enfoca entre 33 y 38 controles distintos por ruta y tema en `/dashboard`, `/marca` y `/ajustes`, así que el «0» no es un script que no miró nada. Nada que corregir: no se tocó la interfaz y no sale nada para la Cola desde esta tarea. `auditoria-estados.mjs` quedó igual que estaba (no se necesita commit).

### C5 — Pruebas unitarias nuevas ✅
Archivos nuevos (ningún caso repetido de `tests/unit.test.ts`):
- `lib/calendar-views.test.ts`: semana que cruza mes **y** año (`weekDays("2027-01-01")` completo, lunes→domingo), malla de febrero bisiesto y no bisiesto, posts sin fecha al final al ordenar (asc y desc) y `filterPosts`/`EMPTY_FILTERS`.
- `lib/post-import.test.ts`: columnas en otro orden (`guessMapping` + `reviewRows` con ese mapeo), fechas imposibles (`2026-02-30`, `32/13/2026`), archivo vacío (`parseDelimited("")`), duplicado contra lo ya existente en la marca y sin importar mayúsculas; mismo título con otra fecha no es duplicado.
- `lib/post-draft.test.ts`: recuperar un borrador guardado y `clearRecovery`, datos corruptos o clave ausente → `null` sin romper, y la marca no cambia al recuperar (clave por marca, por post y por persona; el borrador conserva su `brandId`).

`npm test`: **43 tests, 43 pasan, 0 fallan** (los 10 nuevos incluidos). No se descubrió ningún defecto real del código probado, así que no hay casos dejados fuera. Commit `50f2162`.

## PRUEBAS FINALES (desde `web/`, `E2E_PORT=3003`, `E2E_BASE=http://localhost:3003`)

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Falla solo `dashboard-polish.css` (§4 tamaño de texto, §5 radio): el fallo aceptable. |
| `npx tsc --noEmit` | Sin errores (`TSC OK`). |
| `npm run build` | Compila completo, sin chocar con el servidor del 3003 (no hizo falta apagarlo). |
| `npm test` | 43 tests, 43 pasan, 0 fallan. |
| `npm run test:db` | 69 ok, 0 fallos. |
| `npx playwright test` | **63 pasan, 1 falla**: `/dashboard en light` (contraste). Preexistente: la corrida de partida ya fallaba igual antes de ningún cambio mío. Causa en la Cola. |
| `node …\comprobar-propiedad.mjs C` (raíz del worktree) | `Correcto: 10 archivo(s) tocados, todos de C.` |

## Pruebas que siguen escribiendo y por qué
- `listas.spec.ts › "Núcleo de Marca guarda lo de cada marca, sin textos de otra"`: sin bloqueo a propósito — su aserción es que el dato sobrevive a una `page.reload()`, o sea persistencia real del servidor. Quedó anotado dentro del archivo. Se limpia sola (crea y elimina su persona), y de hecho el hash del workspace no cambió entre corridas.

## Lo que no se pudo verificar
- La causa del fallo aislado que tuvo una vez la prueba de Excel: en 20 corridas no volvió a fallar, así que la hipótesis de la recompilación queda sin confirmar ni descartar.
- La limpieza de `archivos.spec.ts` en un fallo real: en las corridas los 3 tests pasaron, así que el `afterEach` con residuos no se observó en vivo (el mecanismo corre siempre en Playwright, fallara o no el test).

## Cola (defectos reales que este plan prohíbe arreglar)
1. **`app/(app)/dashboard-polish.css` (agente A) rompe `check:ui`.** §4: 17 hallazgos de tamaño de texto (permitidos 15) en líneas 612, 739, 872, 905, 1209, 1255, 1454, 1590, 1614, 1821, 1846, 1853, 1868, 1893, 1990, 2010, 2040. §5: 7 hallazgos de radio (permitidos 6) en líneas 1180, 1207, 1255, 1662, 1761, 1767, 2039. Reproducir: `npm run check:ui`.
2. **Contraste ilegible en `/dashboard` en claro → falla `rutas.spec.ts`.** `components/app/DescubreHublyWidget.tsx` (agente A) pinta «Conecta las redes de tu cliente» y «Programa tu primer post» con `var(--ui-text-5)`, y `dashboard-polish.css:1469` define `--ui-text-5: #94A3B8` en claro: 2.56:1 contra blanco, por debajo de 3:1. Reproducir: `E2E_PORT=3003 npx playwright test e2e/rutas.spec.ts -g "dashboard en light"` (error exacto: `2.56 «Conecta las redes de tu cliente» rgb(148, 163, 184) / rgb(255,255,255)` y el mismo para «Programa tu primer post», en `e2e/rutas.spec.ts:81`).
3. **Residuos previos en `web/.data/media`:** `a.png` (ids `f628af3e…`, `66c44314…`) y `b.png` (ids `365f2481…`, `74a37949…`) dejados por corridas anteriores de `compositor.spec.ts` (sube medios y borra el post, no los archivos). No los borré: solo me tocaba limpiar lo que sube `archivos.spec.ts`. Quien toque el compositor (agente A, `PostComposerModal.tsx`) podría añadir la misma limpieza de `afterEach`.

## Commits de la rama
- `4b68476` Sustituye lucide por iconos duotono en BuyerPersonas y ProjectEditModal
- `3d4af19` Bloquea escrituras al workspace en las pruebas e2e de calendario, compositor, listas y rutas
- `93be374` archivos.spec borra en afterEach lo que sube, aunque falle
- `50f2162` Agrega pruebas unitarias de calendar-views, post-import y post-draft
- (este) Entrega del agente C
