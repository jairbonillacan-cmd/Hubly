# Seguimiento

**Solo quien coordina edita este archivo**, en commits propios sobre `main` o en su PR. Los agentes reportan al entregar: si cada PR lo tocara, chocarían entre sí. **Estados:** Pendiente · En curso · En revisión · Hecha · Bloqueada.

Antes de iniciar una tarea, quien coordina la marca **En curso** con su agente. Esa fila es la reserva de sus archivos.

## Medidas

Se obtienen con `node scripts/medir-deslop.mjs`, desde `web/`.

| Medida | Partida (`aa4a1d3`) | Actual | Meta |
|---|---:|---:|---:|
| Líneas de `lib/store.ts` | 2,304 | 101 | < 150 |
| Archivos sobre 400 líneas, sin simuladores ni iconos | 35 | 33 | 0 |
| `page.tsx` sobre 80 líneas | 17 | 17 | 0 |
| Archivos con prop `view` | 33 | 33 | 0 |
| `style={{` sin simuladores | 1,475 | 1,475 | < 150 |
| Deuda de `check:ui`: reglas de siempre | 864 | 836 | < 100 |
| Deuda de `check:ui`: reglas nuevas | 1,628 | 1,646 | 0 |
| Deuda de `check:ui`: total | 2,492 | 2,482 | < 100 |
| `!important` en CSS | 157 | 157 | < 10 |
| Líneas con `eslint-disable` | 79 | 78 | < 25 |
| Exenciones `ui-ok:` | 21 | 21 | No sube |
| `as unknown as` | 7 | 7 | ≤ 2 |
| Archivos que leen `backendEnabled` | 39 | 39 | ≤ 3, tras D3 |

Los simuladores e iconos sobre 400 líneas (9) son excepción del ADR 0005.

## Decisiones del dueño

| ID | Decisión | Respuesta |
|---|---|---|
| D1 | Cifras de ejemplo de `/anuncios` | **En la demo se quedan, etiquetadas «Ejemplo»; con cuentas reales, estado vacío «Función prevista» y ninguna cifra.** [ADR 0006](../adr/0006-demo-anuncios-y-logros.md) |
| D2 | Logros y XP | **Se eliminan** logros, XP, niveles y rachas: mezclan cifras inventadas. Se quedan las métricas reales del equipo. [ADR 0006](../adr/0006-demo-anuncios-y-logros.md) |
| D3 | Modo demo público | **Sí, en el navegador de cada visitante:** semilla propia y sin guardar en el disco del servidor. Un solo punto elige el modo; las vistas no leen `backendEnabled`. [ADR 0006](../adr/0006-demo-anuncios-y-logros.md) |
| D4 | Hacer obligatorio `flujos-con-cuentas` en `main` | **Sí. Hecho el 4 de noviembre:** `flujos-con-cuentas` es obligatorio en la protección de `main`, junto a `web` y `secretos`. Lo aplicó el coordinador por encargo expreso del dueño. |

## Tareas

| Tarea | Depende de | Archivos principales | Estado | Agente | PR |
|---|---|---|---|---|---|
| F0-1 Medición | — | `scripts/` | Hecha | | este plan |
| F0-2 Capas | — | `scripts/`, CI | Hecha | `impl-f0-2` | #36 |
| F0-3 Reglas `check:ui` | — | `scripts/`, docs | Hecha | `impl-f0-3` | #41 |
| F0-4 Flujos críticos | — | `e2e/`, CI | Hecha | `impl-f0-4` | #38 |
| F0-5 Contrato del store | — | `lib/store.contract.test.ts` | Hecha | `impl-f0-5` | #37 |
| F0-6 Compuerta de F1 | F0-4, D4 | Ajuste en GitHub | Hecha | coordinación | — |
| F1-1 Armazón, sesión y ventanas | F0 | `lib/store*`, `lib/domain/` | Hecha | `impl-f1-1` | #49 |
| F1-2 Dominios simples | F1-1 | `lib/store*` | Hecha | `impl-f1-2` | #50 |
| F1-3 Tareas | F1-2 | `lib/store*` | Hecha | `impl-f1-3` | #51 |
| F1-4 Equipo y tablero | F1-3 | `lib/store*` | Hecha | `impl-f1-4` | #52 |
| F1-5 Marcas | F1-4 | `lib/store*` | Hecha | `impl-f1-5` | #53 |
| F1-6 Posts y chat | F1-5 | `lib/store*`, `useInicioView` | Hecha | `impl-f1-6` | #54 |
| F1-7 Reglas fuera del store | F1-6 | `lib/store/`, `lib/domain/` | Hecha | `impl-f1-7` | #55 |
| F2-1 Selectores | F1 | `lib/domain*` | Hecha | `impl-f2-1` | #56, #57 |
| F2-2 Tipos | F1 | `lib/types*` | Hecha | `impl-f2-2` | #58 |
| F2-3 Datos de ejemplo | F1 | `lib/seed*` | Pendiente | | |
| F2-4 Servidor | F1 | `app/api/`, `lib/server/` | Pendiente | | |
| F3-1 Equipo | F1, F2-2 | `dashboard/team/` | Pendiente | | |
| F3-2 Inicio | F1, F2-2 | `dashboard/inicio/` | Pendiente | | |
| F3-3 Parrillas | F1, F2-2 | `parrillas/_vista/` | Pendiente | | |
| F3-4 Anuncios | F1, F2-2, D1 | `anuncios/_vista/` | Pendiente | | |
| F3-5 Editor de post | F1, F2-2 | `compositor/` | Pendiente | | |
| F3-6 Libreta y sugerencias | F1, F2-2 | `NotebookReaderModal`, `sugerencias/` | Pendiente | | |
| F3-7 Salud | F1, F2-2 | `SaludCuentasView` | Pendiente | | |
| F3-8 Calendario | F1, F2-2 | `calendario/page` | Pendiente | | |
| F3-9 Chat | F1, F2-2 | `chat/page` | Pendiente | | |
| F3-10 Layout | F1, F2-2 | `(app)/layout` | Pendiente | | |
| F3-11 Rutas sueltas | F1, F2-2 | `crm`, `reportes`, `marca`, `marcas`, `ajustes`, `tareas` | Pendiente | | |
| F3-12 Componentes grandes | F1, F2-2 | Ver lista en la tarea | Pendiente | | |
| F3-13 Rutas restantes | F1, F2-2 | `ia`, `automatizaciones`, `notificaciones`, `onboarding`, `register`, `cotizacion`, `invitacion` | Pendiente | | |
| F3-14 Vistas públicas | F1, F2-2 | `share`, `reporte` | Pendiente | | |
| F3-15 Landing y chat en vivo | F1, F2-2 | `app/page`, `lib/chat-live` | Pendiente | | |
| F4-1 Tokens | F0 | CSS | Pendiente | | |
| F4-2 Tokens de estado | F4-1 | CSS, guía | Pendiente | | |
| F4-3 `dashboard-polish.css` | F4-1 | CSS, `(app)/layout` | Pendiente | | |
| F4-4 `hubly-saas.css` | F4-3 | CSS | Pendiente | | |
| F4-5 `!important` y oscuro | F4-4 | CSS | Pendiente | | |
| F4-6 `style={{}}` | F4-1 | Ver lotes | Pendiente | | |
| F4-7 Emojis y restos | F4-1, F5-2 | Varios | Pendiente | | |
| F5-1 Anuncios | D1, F5-3 | `anuncios` | Pendiente | | |
| F5-2 Logros | D2 | `equipo` | Pendiente | | |
| F5-3 Modo demo | D3, F2 | `backendEnabled` | Pendiente | | |
| F6-1 Excepciones | F1 a F5 | Varios | Pendiente | | |
| F6-2 Topes | F6-1 | `scripts/` | Pendiente | | |
| F6-3 Documentación | F6-2 | `docs/` | Pendiente | | |
| F6-4 Auditoría | F6-3 | Solo lectura | Pendiente | | |

F4-3 y F3-10 tocan `(app)/layout.tsx`: no pueden ir a la vez.

## Registro

Lo que un agente descubra y otro deba saber: fecha, tarea y nota. Incluye aquí cada PR revertido y su causa.

| Fecha | Tarea | Nota |
|---|---|---|
| 2026-11-01 | Plan | Comprobado contra el código: inventario del store, topes al mover archivos, carga de CSS y puertos de prueba |
| 2026-11-01 | F0-2, F0-5 | En curso en worktrees `Hubly-wt/f0-2` y `Hubly-wt/f0-5`, ramas `deslop/f0-2` y `deslop/f0-5`, desde `01665df`. Archivos disjuntos: `scripts/` + CI frente a `lib/`. Esfuerzo del harness: MAX. |
| 2026-11-01 | F0-5 | **Cifras del store corregidas.** `useHublyStore.getState()` da **148** (no 125): 125 los declara `HublyStoreState` —106 acciones y 19 valores de interfaz— y 23 los aporta `...INITIAL_WORKSPACE_DATA`. Con un documento completo hidratado son **158**, por 10 campos opcionales del documento. Una nota anterior de este registro decía que faltaban 23 claves por asignar en F1: **era un error mío**. Las 23 son datos, no tienen dueño por diseño, y en el reparto de F1 solo faltaba una: `editingPostId`, asignada a F1-1. |
| 2026-11-01 | F0-2 | Revisión del delta: **aprobada, sin bloqueantes.** El agujero de `check-deuda` con reglas en 0 queda cerrado (reproducido por coordinación y por el revisor: `dominio-impuro` 0→1 → exit 1). Observaciones menores que pasan a F0-3: la prueba negativa de `check-ui` no discrimina, y `--root` produce un falso verde local porque `previous()` lee git del cwd y no del árbol apuntado. Pendiente de fusión por el dueño. |
| 2026-11-01 | F0-5 | Tercera revisión (delta `88968f2` + merge `4d00a9b`): **aprobada, sin bloqueantes.** Los tres huecos quedaron cerrados y comprobados: los cuatro sabotajes de persistencia fallan solo por la llamada de guardado; la hidratación pasa por `syncFromServer` → `loadWorkspaceFromStorage` → `normalizeWorkspacePayload` (verificado con `ideas`); el mensaje editado/reaccionado/fijado es el que sobrevive. El revisor instrumentó `persistWorkspaceState` y observó **86 de 86** llamadas. Pendiente de fusión. Observaciones de alcance para F1: la prueba de hidratación se acopla al literal `hubly:workspace:v3:` y las filas de acciones con nombre duplicado colapsan a la última ocurrencia (el total sí cubre la suma). |
| 2026-11-01 | F0-4 | Revisión: **aprobada, sin bloqueantes.** Los cinco flujos están, cada uno recarga y re-comprueba contra `/api/workspace`; el revisor hizo su propio sabotaje (editar un post sin persistir) y falló solo ese flujo. **Hueco conocido, para F1:** el contenido de la libreta se escribe pero no se comprueba —`critico-live.spec.ts` guarda `content` y solo verifica el título tras recargar—, así que perder `notebooks[].content` no lo detectaría ni esta prueba ni el contrato de F0-5 (que fija campos de primer nivel). Tampoco comprueban `res.ok` los ayudantes que siembran la agencia. Ninguno produce falso verde. |
| 2026-11-03 | Plan (#39) | Revisión independiente (`d1af02a`) y fusión (`516ab92`): documentadas en `01-ESTADO-ACTUAL.md` y `04-TAREAS.md` las 148/158 claves del store, la distinción entre el único slice que declara cada clave inicial y los escritores en tiempo de ejecución (`set(...)`), y las líneas exactas de `store.ts`. |
| 2026-11-03 | F0-3 (#41) | Revisión independiente (`25f5bde` / `2153cfc`) y fusión (`919b7bd`): añadidas `style-inline`, `important`, `view-prop` y `use-store-sin-selector` a `check:ui`; creada `check-ui-rutas-baseline.json` para las 10 rutas fuera de `(app)`; corregido `--root` en `check-deuda.mjs`, vigilancia de exenciones (`ui-ok:` 21, `eslint-disable` 79) y vigilancia de reglas en `0` en ambas bases de `check:ui`; alineados `ARCHITECTURE.md` y `CODE_STANDARDS.md`. La deuda de `check:ui` queda separada en reglas de siempre (`864`: `812` en `(app)` + `52` en rutas) y reglas nuevas (`1,628`: `1,523` en `(app)` + `105` en rutas), total `2,492`. |
| 2026-11-03 | F0-4 / F0-5 (#40) | Revisión independiente (`09c21b3` / `950e73a`) y fusión (`f75400c`): cerrado el hueco de libretas y campos anidados antes de abrir F1. `critico-live.spec.ts` comprueba `notebooks[].content` tras recargar y valida `res.ok` en la siembra; `store.contract.test.ts` verifica las 29 `CLAVES_ANIDADAS` con todas sus colecciones pobladas, ejercita `addNotebook` y `updateNotebook` con `content`, y comprueba también la salida normalizada de `saveWorkspaceToStorage` para `posts` y `notebooks`. |
| 2026-11-03 | Capas (#43) | Revisión de coordinación y fusión (`7e9e20e`): regla `z-index-fijo` (cualquier `z-index` de 10 o más escrito a mano), escala de 12 `--layer-*` en `dashboard-polish.css` con tabla en la guía §5, definiciones de token en una línea, `check-ui-reglas.mjs` con tandas y `check-deuda` que admite la deuda inicial de la tanda que llega en las dos bases y no deja volver una regla limpiada a 0. Solo entra `z-index-fijo`, con 41 hallazgos que ya existían: `1,628 → 1,669` nuevas, total `2,492 → 2,533`. Cifras reproducidas en local y `check-deuda origin/main` en verde. |
| 2026-11-03 | Traspaso (#44) | Fusión (`c99a3e0`) de `docs/deslop/TRASPASO-DESLOP-ARQ.md`: qué hizo `paridad-henry` y qué no se porta, los PR 2 y 3 con sus referencias en `main`, y las decisiones del dueño que siguen abiertas. `main` y `deslop-arq` quedan al mismo contenido. |
| 2026-11-03 | Controles (#45) | Hallazgo al revisar #43: en macOS, `npm test` fallaba en **5 pruebas de `check-deuda` sobre `main` limpio**. `tmpdir()` vive en `/var`, enlace a `/private/var`: `relative(repo, root)` salía del repositorio, `previous()` devolvía `null` y el chequeo decía «La deuda no subió» sin comparar ninguna base. PR #45 resuelve `--root` con `realpathSync`, falla si el árbol se sale del repositorio y añade la prueba que falla sin el arreglo. En Linux no se veía. |
| 2026-11-03 | Etiquetas (#46) | Fusión (`72a993e`): `web/lib/labels.ts` como fuente única de estados, roles y tipos de archivo; `status-meta`, `calendar-views`, `SocialCalendar`, el compositor, la API del espacio de trabajo y `/invitacion` leen de ahí. Regla nueva `estado-crudo` (tanda `etiquetas`) acotada a `kind` y `post.status`; entra con **0 hallazgos** porque el único real, `{asset.kind}` en `/tareas`, se corrige en el PR. `statusLabel` guardado sin cambios: el contrato del store no se toca. **Visible:** `scheduled` pasa a «Programado» en el kanban y en el filtro de publicación (antes «Planificado»), y el tipo de archivo deja de pintarse en inglés. Siguiente: marca activa (`selectActiveBrand`/`useActiveBrand`, los atajos de `brand-min` y `lib/share-links.ts`). |
| 2026-11-03 | Marca activa (#47) | Fusión (`173313c`): `lib/active-brand.ts` con `selectActiveBrand` y `lib/use-active-brand.ts` como hook. Seis cálculos propios pasan a uno (armazón, parrillas, reportes, inicio, equipo, libretas) y desaparecen los respaldos a `brand-min`/`min-nov` de la interfaz. `lib/share-links.ts` centraliza el enlace del portal y ya no inventa token. `BrandSwitcher` y `EquipoResumen` usan el color guardado de la marca: la deuda de `check:ui` baja de `864` a `861` (`--update` solo restó). Quedan los cuatro respaldos de `lib/workspace-repository.ts`, que reparan documentos incompletos y no eligen marca: son de F1/F2. |
| 2026-11-03 | Modales y libretas (#48) | Fusión (`b0b22ad`): «+ Nota» crea la libreta y abre el lector como `/tareas`; el modal Kraft duplicado desaparece y `InicioContenido` baja de 397 a 184 líneas. `useCreateNotebook` se muda a `components/app/` para no cruzar dominios (`check:capas` lo detectó). Se quita el Escape global del tablero —cerraba toda la pila— y el modal de cuentas usa `<Modal>` y `<Button>`. Deuda de `check:ui`: `2,530 → 2,482` (`836 + 1,646`, `--update` solo restó); `eslint-disable`: `79 → 78`. Con esto quedan hechos los PR 2 y 3 del traspaso. Siguiente sin bloqueo: F4-1 (tokens) y F4-2; F1 espera a que el dueño marque `flujos-con-cuentas` obligatorio (F0-6).
| 2026-11-03 | F1-1 (#49) | Fusión (`aa72d44`) con el visto bueno del dueño: `store.ts` baja de **2.304 a 1.908** líneas. `lib/store/sync.ts` (qué se guarda), `session.slice.ts` (hidratación, espacios, perfil), `ui.slice.ts` (modales y compositor), `lib/domain/posts.ts` (`withPostLog`) y `lib/domain/activity.ts` (`createActivityItem`). `STATUS_TO_LABEL` se elimina por duplicar `POST_STATUS_LABEL`. `HublyStoreState = StoreCoreState & SessionSlice & UiSlice`. Contrato del store **8/8 sin tocarlo**; 193 pruebas; `flujos-con-cuentas` en verde. **Queda pendiente en F1:** `runAutomations` sigue en `store.ts` hasta el slice de automatizaciones, porque sus entradas (`addTask`, notificación) se mueven con F1-3 y F1-6. Siguiente: F1-2. |
| 2026-11-03 | F1-2 (#50) | Fusión (`65b1097`): `store.ts` de **1.908 a 1.665** líneas. Seis slices nuevos en `lib/store/`: `crm` (leads y cotizaciones), `automations`, `agents`, `notebooks` (con `activeNotebookId`), `assets` y `projects`. Ningún slice declara datos guardados y ninguno importa a otro. Contrato **8/8 sin tocarlo**; 193 pruebas; `flujos-con-cuentas` en verde. Siguiente: F1-3 (tareas). |
| 2026-11-03 | F1-3 (#51) | Fusión: `store.ts` de **1.665 a 1.469** líneas. `lib/store/tasks.slice.ts` con `addTask`, `updateTask`, `toggleTaskStatus`, `deleteTask`, `moveTask` y las tres de listas; `AddTaskInput` viaja con ellas porque solo lo usaba `addTask`. Contrato **8/8 sin tocarlo**; 193 pruebas; `flujos-con-cuentas` en verde. Siguiente: F1-4 (equipo y tablero). |
| 2026-11-03 | F1-4 (#52) | Fusión: `store.ts` de **1.469 a 1.155** líneas. `team.slice.ts` (equipo, invitaciones, actividad; declara `teamMembers` desde `INITIAL_WORKSPACE_DATA.team`), `dashboard.slice.ts` (widgets, onboarding y `dashboardWidgets` derivado de `widgets`, con `OnboardingStepKey`) y `notifications.slice.ts` (avisos; el plan los daba a F1-4 sin archivo, se les dio el suyo). Contrato **8/8 sin tocarlo**; 193 pruebas; `flujos-con-cuentas` en verde. Siguiente: F1-5 (marcas, dos slices). |
| 2026-11-03 | F1-5 (#53) | Fusión: `store.ts` de **1.155 a 700** líneas. `brands.slice.ts` (`setActiveBrand`, `addBrand` de 165 líneas, `updateBrand`, `updateBrandCore`, `AddBrandInput`) y `brandStrategy.slice.ts` (personas, compromisos, métricas y las tres de recomendaciones, con `CommitmentPeriodKey`). Contrato **8/8 sin tocarlo**; 193 pruebas; `flujos-con-cuentas` en verde. Siguiente: F1-6 (posts y chat), donde entra `runAutomations`. |
| 2026-11-03 | F1-6 (#54) | Fusión: `store.ts` de **700 a 101** líneas; ya solo tiene el tipo compuesto, la composición y el guardia de lectores. `posts.slice.ts` (publicar, estados, resultados, ideas, comentarios, lote), `chat.slice.ts` (mensajes, canales, programados y cola) y `lib/domain/automations.ts` con `runAutomations` y `AutomationSource`, que evita que domain importe el store. Se quita el `setActiveNotebookId` duplicado de F1-2. Archivos sobre 400: 35 → 34. Contrato **8/8 sin tocarlo**; 193 pruebas; `flujos-con-cuentas` en verde. Siguiente: F1-7 (reglas fuera del store). |
| 2026-11-03 | F1-7 (#55) | **F1 cerrada.** `lib/domain/tasks.ts` (`buildTask`, `mergeTaskPatch`, `toggleTaskState`), `lib/domain/posts.ts` (`duplicatePostAsDraft`) y `lib/domain/brands.ts` (`applyCommitmentPatch`, `applyRecommendationToBrand`). Los slices quedan como cableado y `lib/domain/` sigue puro. **12 pruebas nuevas** (205 en total). Contrato **8/8 sin tocarlo**. Quedan en los slices solo mutaciones sin decisión (actualizar un miembro, crear un aviso). |
| 2026-11-04 | F2-1 (1/2) (#56) | Fusión: `domain-selectors.ts` de **1.596 a 1.039** líneas. `lib/domain/time.ts` (zona horaria y fechas), `greeting.ts`, `tasks.ts` (+`selectTasksBreakdown`), `posts.ts` (+`selectTodayPostsAndApprovals`) y `onboarding.ts`; el archivo sigue reexportando, así que no cambia ningún import. `isTaskCompleted`, `computeTaskDueBucket` e `isPostInApproval` se exportan para salud y equipo. **Falta (2/2):** `account-health`, `recommendations` y `team`, dividiendo `selectAccountsHealth` y `selectTeamProductivity`, que superan 80 líneas; y mover las pruebas por módulo. |
| 2026-11-04 | F2-1 (2/2) (#57) | Fusión: `domain-selectors.ts` queda en **30 líneas** (solo reexporta). `account-health.ts` + `account-health-evaluate.ts` (con `evaluateBrandAccount`), `recommendations.ts` y `team.ts` (con `evaluateTeamMember`, que recibe `hasBackend` para no importar el store desde domain). Pruebas repartidas por módulo con `test-fixtures.ts`; se borra `domain-selectors.test.ts`. Archivos sobre 400: 34 → 33. |
| 2026-11-04 | F0-6 y D1–D3 | **Decisiones tomadas** por encargo del dueño, con su motivo en el [ADR 0006](../adr/0006-demo-anuncios-y-logros.md). `flujos-con-cuentas` pasa a ser obligatorio en `main`: corre en todo PR, sin filtro de rutas, con la misma app que `web` y `secretos`. Quedan sin bloqueo F3-4, F4-7 y F5-1 a F5-3. **Orden:** F5-2 antes de F4-7 (borra la mayoría de sus emojis) y F5-3 antes de F5-1 (las cifras de ejemplo salen del repositorio de la demo). F5-3 sigue esperando a F2-3 y F2-4. |
| 2026-11-04 | F2-2 (#58) | Fusión: `lib/types.ts` (768 líneas) pasa a `lib/types/` con un archivo por dominio y `index.ts`; `@/lib/types` sigue igual. `CoverKind` se muda a `lib/types/cover.ts` (con reexport en `components/Cover`), lo que cierra la última violación `lib-importa-arriba`: capas de 9 a 8 y base actualizada. Se elimina el alias `TaskItem` en todo el código (9 archivos) y se queda `AgencyTask`; el `TaskItem` de Tiptap no se toca. |
