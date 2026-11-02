# Seguimiento

**Solo quien coordina edita este archivo**, en commits propios sobre `main` o en su PR. Los agentes reportan al entregar: si cada PR lo tocara, chocarÃ­an entre sÃ­. **Estados:** Pendiente Â· En curso Â· En revisiÃ³n Â· Hecha Â· Bloqueada.

Antes de iniciar una tarea, quien coordina la marca **En curso** con su agente. Esa fila es la reserva de sus archivos.

## Medidas

Se obtienen con `node scripts/medir-deslop.mjs`, desde `web/`.

| Medida | Partida (`aa4a1d3`) | Actual | Meta |
|---|---:|---:|---:|
| LÃ­neas de `lib/store.ts` | 2,304 | 2,304 | < 150 |
| Archivos sobre 400 lÃ­neas, sin simuladores ni iconos | 35 | 35 | 0 |
| `page.tsx` sobre 80 lÃ­neas | 17 | 17 | 0 |
| Archivos con prop `view` | 33 | 33 | 0 |
| `style={{` sin simuladores | 1,475 | 1,475 | < 150 |
| Deuda en la base de `check:ui` | 812 | 812 | < 100 |
| `!important` en CSS | 157 | 157 | < 10 |
| LÃ­neas con `eslint-disable` | 79 | 79 | < 25 |
| Exenciones `ui-ok:` | 21 | 21 | No sube |
| `as unknown as` | 7 | 7 | â‰¤ 2 |
| Archivos que leen `backendEnabled` | 39 | 39 | â‰¤ 3, tras D3 |

Los simuladores e iconos sobre 400 lÃ­neas (9) son excepciÃ³n del ADR 0005.

## Decisiones del dueÃ±o

| ID | DecisiÃ³n | Respuesta |
|---|---|---|
| D1 | Cifras de ejemplo de `/anuncios` | Pendiente |
| D2 | Logros y XP | Pendiente |
| D3 | Modo demo pÃºblico | Pendiente |
| D4 | Hacer obligatorio `flujos-con-cuentas` en `main` | **SÃ­.** Lo activa el dueÃ±o cuando `critico-live.spec.ts` corra en `main`. NingÃºn agente cambia ajustes de GitHub. |

## Tareas

| Tarea | Depende de | Archivos principales | Estado | Agente | PR |
|---|---|---|---|---|---|
| F0-1 MediciÃ³n | â€” | `scripts/` | Hecha | | este plan |
| F0-2 Capas | â€” | `scripts/`, CI | En revisiÃ³n | `impl-f0-2` | #36 |
| F0-3 Reglas `check:ui` | â€” | `scripts/`, docs | Pendiente | | |
| F0-4 Flujos crÃ­ticos | â€” | `e2e/`, CI | En curso | `impl-f0-4` | â€” |
| F0-5 Contrato del store | â€” | `lib/store.contract.test.ts` | En revisiÃ³n | `impl-f0-5` | #37 |
| F0-6 Compuerta de F1 | F0-4, D4 | Ajuste en GitHub | Bloqueada | | |
| F1-1 ArmazÃ³n, sesiÃ³n y ventanas | F0 | `lib/store*`, `lib/domain/` | Pendiente | | |
| F1-2 Dominios simples | F1-1 | `lib/store*` | Pendiente | | |
| F1-3 Tareas | F1-2 | `lib/store*` | Pendiente | | |
| F1-4 Equipo y tablero | F1-3 | `lib/store*` | Pendiente | | |
| F1-5 Marcas | F1-4 | `lib/store*` | Pendiente | | |
| F1-6 Posts y chat | F1-5 | `lib/store*`, `useInicioView` | Pendiente | | |
| F1-7 Reglas fuera del store | F1-6 | `lib/store/`, `lib/domain/` | Pendiente | | |
| F2-1 Selectores | F1 | `lib/domain*` | Pendiente | | |
| F2-2 Tipos | F1 | `lib/types*` | Pendiente | | |
| F2-3 Datos de ejemplo | F1 | `lib/seed*` | Pendiente | | |
| F2-4 Servidor | F1 | `app/api/`, `lib/server/` | Pendiente | | |
| F3-1 Equipo | F1, F2-2 | `dashboard/team/` | Pendiente | | |
| F3-2 Inicio | F1, F2-2 | `dashboard/inicio/` | Pendiente | | |
| F3-3 Parrillas | F1, F2-2 | `parrillas/_vista/` | Pendiente | | |
| F3-4 Anuncios | F1, F2-2, D1 | `anuncios/_vista/` | Bloqueada | | |
| F3-5 Editor de post | F1, F2-2 | `compositor/` | Pendiente | | |
| F3-6 Libreta y sugerencias | F1, F2-2 | `NotebookReaderModal`, `sugerencias/` | Pendiente | | |
| F3-7 Salud | F1, F2-2 | `SaludCuentasView` | Pendiente | | |
| F3-8 Calendario | F1, F2-2 | `calendario/page` | Pendiente | | |
| F3-9 Chat | F1, F2-2 | `chat/page` | Pendiente | | |
| F3-10 Layout | F1, F2-2 | `(app)/layout` | Pendiente | | |
| F3-11 Rutas sueltas | F1, F2-2 | `crm`, `reportes`, `marca`, `marcas`, `ajustes`, `tareas` | Pendiente | | |
| F3-12 Componentes grandes | F1, F2-2 | Ver lista en la tarea | Pendiente | | |
| F3-13 Rutas restantes | F1, F2-2 | `ia`, `automatizaciones`, `notificaciones`, `onboarding`, `register`, `cotizacion`, `invitacion` | Pendiente | | |
| F3-14 Vistas pÃºblicas | F1, F2-2 | `share`, `reporte` | Pendiente | | |
| F3-15 Landing y chat en vivo | F1, F2-2 | `app/page`, `lib/chat-live` | Pendiente | | |
| F4-1 Tokens | F0 | CSS | Pendiente | | |
| F4-2 Tokens de estado | F4-1 | CSS, guÃ­a | Pendiente | | |
| F4-3 `dashboard-polish.css` | F4-1 | CSS, `(app)/layout` | Pendiente | | |
| F4-4 `hubly-saas.css` | F4-3 | CSS | Pendiente | | |
| F4-5 `!important` y oscuro | F4-4 | CSS | Pendiente | | |
| F4-6 `style={{}}` | F4-1 | Ver lotes | Pendiente | | |
| F4-7 Emojis y restos | F4-1, D2 | Varios | Bloqueada | | |
| F5-1 Anuncios | D1 | `anuncios` | Bloqueada | | |
| F5-2 Logros | D2 | `equipo` | Bloqueada | | |
| F5-3 Modo demo | D3, F2 | `backendEnabled` | Bloqueada | | |
| F6-1 Excepciones | F1 a F5 | Varios | Pendiente | | |
| F6-2 Topes | F6-1 | `scripts/` | Pendiente | | |
| F6-3 DocumentaciÃ³n | F6-2 | `docs/` | Pendiente | | |
| F6-4 AuditorÃ­a | F6-3 | Solo lectura | Pendiente | | |

F4-3 y F3-10 tocan `(app)/layout.tsx`: no pueden ir a la vez.

## Registro

Lo que un agente descubra y otro deba saber: fecha, tarea y nota. Incluye aquÃ­ cada PR revertido y su causa.

| Fecha | Tarea | Nota |
|---|---|---|
| 2026-11-01 | Plan | Comprobado contra el cÃ³digo: inventario del store, topes al mover archivos, carga de CSS y puertos de prueba |
| 2026-11-01 | F0-2, F0-5 | En curso en worktrees `Hubly-wt/f0-2` y `Hubly-wt/f0-5`, ramas `deslop/f0-2` y `deslop/f0-5`, desde `01665df`. Archivos disjuntos: `scripts/` + CI frente a `lib/`. Esfuerzo del harness: MAX. |
| 2026-11-01 | F0-5 | **Cifras del store corregidas.** `useHublyStore.getState()` da **148** (no 125): 125 los declara `HublyStoreState` â€”106 acciones y 19 valores de interfazâ€” y 23 los aporta `...INITIAL_WORKSPACE_DATA`. Con un documento completo hidratado son **158**, por 10 campos opcionales del documento. La nota anterior de este registro decÃ­a que faltaban 23 claves por asignar en F1: **era un error mÃ­o**. Las 23 son datos, no tienen dueÃ±o por diseÃ±o, y en el reparto de F1 solo faltaba una: `editingPostId`, asignada a F1-1. |
| 2026-11-01 | F0-2 | RevisiÃ³n del delta: **aprobada, sin bloqueantes.** El agujero de `check-deuda` con reglas en 0 queda cerrado (reproducido por coordinaciÃ³n y por el revisor: `dominio-impuro` 0â†’1 â†’ exit 1). Observaciones menores que pasan a F0-3: la prueba negativa de `check-ui` no discrimina, y `--root` produce un falso verde local porque `previous()` lee git del cwd y no del Ã¡rbol apuntado. Pendiente de fusiÃ³n por el dueÃ±o. |
| 2026-11-01 | F0-5 | Tercera revisiÃ³n (delta `88968f2` + merge `4d00a9b`): **aprobada, sin bloqueantes.** Los tres huecos quedaron cerrados y comprobados: los cuatro sabotajes de persistencia fallan solo por la llamada de guardado; la hidrataciÃ³n pasa por `syncFromServer` â†’ `loadWorkspaceFromStorage` â†’ `normalizeWorkspacePayload` (verificado con `ideas`); el mensaje editado/reaccionado/fijado es el que sobrevive. El revisor instrumentÃ³ `persistWorkspaceState` y observÃ³ **86 de 86** llamadas. Pendiente de fusiÃ³n. Observaciones de alcance para F1: la prueba de hidrataciÃ³n se acopla al literal `hubly:workspace:v3:` y las filas de acciones con nombre duplicado colapsan a la Ãºltima ocurrencia (el total sÃ­ cubre la suma). |
