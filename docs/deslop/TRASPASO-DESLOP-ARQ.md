# Traspaso: rama `deslop-arq`, estado al cierre del 3 de noviembre de 2026

**Para:** Claude, o quien tome el relevo en casa.
**Plan vigente:** [docs/deslop/](README.md). Este traspaso no lo sustituye: explica cómo llega el trabajo de `paridad-henry` a ese plan.
**Equipo de origen:** `C:\Users\T490s\Desktop\Proyectos\Hubly` (carpeta del dueño, servidor en el puerto 3000).

---

## 0. Resumen en cinco líneas

1. **Trabajo de hoy fuera del plan.** En `paridad-henry` se trabajó todo el día en anti-slop y arquitectura sin el plan de deslop: lo hicieron Claude (fases 0 a 2) y un orquestador de Antigravity (fase 3, con la deuda de `check:ui` bajada a 0).
2. **`main` ya tenía otro camino.** Llevaba 193 commits más y su propio plan (F0 hecha). Parte de ese trabajo ya estaba resuelto en `main` de otra forma, y otra parte choca con tareas del plan (F1, F3, F4).
3. **Decisión: nada se copia a `main`.** Lo que vale se rehace sobre el código de `main`, en PRs pequeños desde la rama `deslop-arq`.
4. **Primer PR abierto: [#43](https://github.com/jairbonillacan-cmd/Hubly/pull/43).** Añade la regla `z-index-fijo`, la escala de capas y el registro de tandas en `check-deuda`. Pasa toda la batería en local.
5. **Pendiente:** los PR 2 y 3, después F1 según el plan, y dos decisiones del dueño (§6).

---

## 1. Estado del repositorio

| Rama | Commit | Estado |
|---|---|---|
| `main` | `1813b61` | Base de todo lo nuevo |
| `paridad-henry` | `ce3b2cb` | Subida a `origin` como respaldo. **No se fusiona**: es referencia |
| `deslop-arq` | `d5fa274` | PR [#43](https://github.com/jairbonillacan-cmd/Hubly/pull/43) abierto contra `main` |
| `deslop/traspaso-arq` | — | Este documento, en su propio PR |

**Worktrees en el equipo de origen:**

- `Hubly-wt/deslop-arq` (rama `deslop-arq`)
- `Hubly-wt/traspaso-arq` (este traspaso)
- `Hubly-wt/coord-f0` (`main`, de la coordinación de F0)

En casa no hacen falta: basta con crear los propios (§7).

---

## 2. Lo que hizo Claude

### 2.1 En `paridad-henry`, antes de conocer el plan de `main`

| Commit | Qué |
|---|---|
| `64cfd2b` | Pendientes de la sesión anterior: cifras de ejemplo en `/reportes`, `h1`, foco visible, `--ui-positive-text` y dos E2E estables |
| `52b3f57` | **Fase 0.** `check:ui` con `z-index-fijo`, `prueba-escrita` y `estado-crudo`; escala `--layer-*`; las definiciones de token dejan de contar |
| `fdca25f` | **Fase 1.** `lib/labels.ts`, `trialDays`, `selectActiveBrand`/`useActiveBrand`, `lib/publishing/gateway.ts`, modales con `next/dynamic` y store en `lib/store-slices/` |
| `572c20f`, `ed8a70d` | Decisiones del dueño: `pending` se llama «Esperando cliente» y `scheduled` se llama «Programado» |
| `c12ba21` | **Fase 2.** Armazón partido en `components/app/shell/` (6 piezas) |
| `2cc700a` | `EquipoView`: borrado un modal de invitar duplicado y muerto (~575 líneas); logros a `lib/team-gamification.ts` sin emojis |
| `f06e79d` | `InicioView` en un archivo por widget. Decisión del dueño: «+ Nota» crea la libreta como en `/tareas`. Quitado el Escape global |
| `9e35cb8` | `/parrillas` en componentes; `lib/share-links.ts`; modal de cuentas con la receta §9.9 |
| `28794b9` | Prompt para un orquestador con subagentes (`docs/planes-agentes/PROMPT-ORQUESTADOR-FASE-3.md`) |

Con esto, `check:ui` bajó de 1562 a 1263 hallazgos. La batería quedó así: `tsc` limpio, 43/43 tests y 86/88 E2E, con los dos fallos de Salud de cuentas por datos guardados.

### 2.2 Al comparar con `main`

- **Lo que ya estaba resuelto en `main`:**
  - Armazón en 8 piezas.
  - Kit de UI (`Modal`, `Button`, `Field`, `EmptyState`, `PageHeader`).
  - Motor de publicación real (`engine`, `runner`, ADR 0003).
  - Los `h1`, el cintillo de ejemplo y la prueba de Salud.
- **Las reglas del plan que impiden portar el resto tal cual:**
  - Un PR por tarea.
  - El contrato del store, que no se edita en F1.
  - `check-deuda` vigila las exenciones.
- **Plan de Gemini.** Se revisó un plan de Gemini y se corrigieron tres errores:
  - Cambiar el texto guardado de «En aprobación» rompe `store.contract.test.ts`.
  - Las reglas nuevas hacían fallar `check-deuda`.
  - Su «ola 3» (dejar en 0 los 812 hallazgos) duplicaba F3 y F4 y tocaba D2.

### 2.3 En `deslop-arq`: PR #43

- **Regla `z-index-fijo`:** cualquier `z-index` de 10 o más escrito como número falla.
- **Capas:** escala completa de 12 `--layer-*` y tabla en la guía §5.
- **Tokens en una línea:** `:root { --x: … }` ya no cuenta como valor fijo.
- **`check-ui-reglas.mjs`:** registra las reglas por tandas.
- **`check-deuda`:**
  - Admite la deuda inicial de una tanda nueva en las dos bases de `check:ui`.
  - Cierra un hueco: una regla limpiada a 0 no puede volver a entrar como nueva.
- **Bases:** solo entra `z-index-fijo`, con 41 hallazgos que ya existían. Las demás reglas no cambian.
- **Batería local:** `lint`, `check:muerto`, `check:ui`, `check:size`, `check:capas`, `check-deuda origin/main`, `tsc`, `npm test` 189/189, `test:db` 198/198 y `build`.
- **Sin correr:** Playwright y las pruebas visuales, porque el PR no toca pantallas.

---

## 3. Lo que hizo Antigravity

Un orquestador de Antigravity siguió el prompt de `28794b9`, **sobre `paridad-henry`, no sobre `main`**. Todos los commits salen a nombre de Jair Bonilla, con coautoría de Claude.

| Commit | Lote | `check:ui` | Archivos |
|---|---|---|---:|
| `75507a2` | G · La prueba de Salud sirve la semilla en el `GET` | — | 2 |
| `9a77095` | B · `/anuncios` a tokens y duotono | 1263 → 1161 | 3 |
| `4428d50` | C · Libretas y lector a tokens y receta §9.9 | 1161 → 1052 | 5 |
| `f664f08` | D · Modales y `MemberDrawer` con `useLayer` y tokens | 1052 → 945 | 8 |
| `e5ee90e` | E · `EquipoView` y medallas de logros | 945 → 900 | 3 |
| `9d5bba3` | F · Pantallas medianas y `FloatingAIDrawer` | 900 → 792 | 10 |
| `186a473` | A · CSS globales a tokens, escala y capas | 792 → 61 | 5 |
| `8a69790` | H · Primera mitad de la cola | 61 → 29 | 13 |
| `ce3b2cb` | I · Cierre a 0 (incluye `askConfirm` en `MediaLibrary`) | 29 → 0 | 17 |

**Verificación que reporta, sin comprobar por Claude:**

- `tsc` limpio y 43/43 tests en cada lote.
- `test:db` 69/69.
- Playwright por lote (salud 3/3, compositor 6/6, rutas 42/42, archivos 3/3) y **88/88** al cierre.

**Observaciones para quien porte:**

- **Exenciones.** Añadió **25 `ui-ok:` nuevos**: kraft de la libreta, paleta de marca, logos de terceros. En `main`, `check-deuda` no deja subir el total de `ui-ok` (hoy 21). Esas exenciones no pueden viajar tal cual.
- **Los archivos ya no existen así en `main`.** Trabajó sobre los de `paridad-henry`; en `main` ya están partidos (`anuncios/_vista`, `dashboard/team`, `dashboard/inicio`, `parrillas/_vista`).
- **Tabla de equivalencias.** Sus diffs, sobre todo `186a473` (CSS globales), sirven para saber qué hex pasa a qué token. Úsalos así cuando F3 y F4 limpien cada archivo en `main`.

---

## 4. Lo que no se porta, y por qué

| Pieza de `paridad-henry` | Motivo |
|---|---|
| `lib/store-slices/` | F1 define otra estructura (`lib/store/*.slice.ts`, `lib/domain/`) y exige el contrato del store |
| `components/app/shell/` (6 piezas) | `main` ya tiene 8 |
| `lib/publishing/gateway.ts` | `main` tiene el motor real (ADR 0003) |
| Widgets de `InicioView`, `EquipoView`, partes de `/parrillas` | Son F3-2, F3-1 y F3-3; `main` ya las tiene partidas en `_vista/` |
| Logros a `lib/team-gamification.ts` y sus emojis | F4-7, bloqueada por D2 |
| La limpieza de color de la Fase 3 | Se rehace dentro de cada tarea F3 y F4, sobre los archivos de `main` |
| `trialDays` y la regla `prueba-escrita` | `main` ya no tiene el texto «7 días» |

---

## 5. Lo que sigue en `deslop-arq`

| Paso | Contenido | Referencias en `main` |
|---|---|---|
| **PR 2** | `lib/labels.ts` solo para lo que se ve, con la regla `estado-crudo` en su propia tanda. Además, `selectActiveBrand` y `useActiveBrand`, `lib/share-links.ts` y quitar los atajos de marca | `brand-min` en `parrillas/_vista/useParrillasPage.tsx:52`, `reportes/page.tsx:55`, `NotebookReaderModal.tsx:113,145,154`, `dashboard/inicio/useInicioView.tsx:300` (**crea tareas con esa marca**), `dashboard/team/EquipoResumen.tsx:157`, `useEquipoView.tsx:133`. `min-nov` en `useParrillasPage.tsx:58`. «En aprobación» y «Planificado» en `lib/calendar-views.ts:101,105` |
| **PR 3** | Quitar el Escape global, «+ Nota» con `useCreateNotebook` y el modal «Cuentas de…» con `<Modal>` y `<Button variant="secondary">` | `useInicioView.tsx:144` y el modal propio de libreta en `InicioContenido.tsx`. Modal de cuentas en `parrillas/_vista/ParrillasIdeas.tsx` (con `zIndex: 100`) |
| **Luego** | F1-1 a F1-7 en orden, con un solo agente, sin editar `store.contract.test.ts`. En paralelo, solo en CSS: F4-1 (`tokens.css`, adonde se mudan `--layer-*` y `--ui-positive-*`) y F4-2. Después F2 y F3, con la limpieza visual de cada vista en la misma pasada. F4-7 espera a D2 | `docs/deslop/04-TAREAS.md` |

**Antes de cada PR, rutina de `03-REGLAS-PARA-AGENTES.md`:**

- Trae `main` con `git merge origin/main`.
- Corre la batería completa.
- Actualiza las bases solo tras bajar deuda, o con el protocolo de movimiento.

---

## 6. Decisiones del dueño pendientes

1. **D2: los logros y el XP** se implementan, se ocultan o se eliminan. Bloquea F4-7 y el destino del catálogo de logros.
2. **Nombre guardado de `pending`.** «Esperando cliente» ya es el nombre visible. Cambiar el valor guardado (`statusLabel` y el texto del historial) obliga a tocar `store.contract.test.ts`. Propuesta: un PR aparte tras F1, con aprobación explícita.
3. Siguen abiertas **D1** (`/anuncios`) y **D3** (modo demo público), del plan.

---

## 7. Cómo retomar en casa

```bash
git fetch origin
```

```bash
git worktree add ../Hubly-wt/deslop-arq origin/deslop-arq
```

```bash
cd ../Hubly-wt/deslop-arq && git switch deslop-arq && cd web && npm ci
```

1. Mira el CI de [#43](https://github.com/jairbonillacan-cmd/Hubly/pull/43). Si está verde, revisa y fusiona, y trae `main` a `deslop-arq` antes de empezar el PR 2.
2. Usa siempre un puerto del 3100 al 3199 y pasa `E2E_PORT`. El 3000 es del dueño.
3. Lee este traspaso, `README.md` y `03-REGLAS-PARA-AGENTES.md` antes de tocar código.
