# Tareas

Cada tarea es un PR. **Riesgo:** B bajo, M medio, A alto. **Sin cambios visibles** salvo donde se indique. Todas cumplen además [03-REGLAS-PARA-AGENTES.md](03-REGLAS-PARA-AGENTES.md).

## F0: Controles

Va primero, un agente a la vez.

### F0-1 Script de medición · Hecha
`web/scripts/medir-deslop.mjs` define e imprime las medidas. Si una definición cambia, cambia también la cifra de partida en [SEGUIMIENTO.md](SEGUIMIENTO.md), en el mismo PR.

### F0-2 Chequeo de capas · M
- **Depende de:** F0-1.
- **Crea:** `web/scripts/check-capas.mjs`, `npm run check:capas`, paso en `web` de CI.
- **Hace:** verifica las reglas de dependencia de [02-ARQUITECTURA-OBJETIVO.md](02-ARQUITECTURA-OBJETIVO.md). Lo que ya viola la regla va a `scripts/check-capas-baseline.json`, que solo baja. No añade dependencias: usa la API de TypeScript. Hoy se esperan pocas violaciones: `lib/types.ts` → `components/Cover`, `compositor` → `social` (6), `dashboard` → `social` (1) y `shell` → `chat` (1). Si salen muchas más, revisa el chequeo antes de crear la base.
- **Extiende** `check-deuda.mjs` para vigilar esa base.
- **Acepta:** un `import` prohibido nuevo hace fallar la comprobación, probado con una prueba unitaria.

### F0-3 Reglas nuevas de `check:ui` · M
- **Depende de:** F0-1.
- **Archivos:** `web/scripts/check-ui.mjs`, base, `check-deuda.mjs`.
- **Hace:** añade `style-inline`, `important`, `view-prop` y `use-store-sin-selector` como reglas con base. La última parte de 1 hallazgo, en `useInicioView.tsx`, y llega a 0 en F1-6.
- **Además:** alinea `docs/ARCHITECTURE.md` y `docs/CODE_STANDARDS.md` con este plan.
- **Rutas sin vigilar:** `check:ui` solo revisa `app/(app)` y `components/app`. Añade `app/share`, `app/reporte`, `app/cotizacion`, `app/invitacion`, `app/login`, `app/register`, `app/recuperar`, `app/nueva-clave`, `app/onboarding` y `app/page.tsx` con una **base separada**, también vigilada por `check-deuda`. Si se suman a la base actual, sube el total de cada regla y `check-deuda` falla.
- **Exenciones:** `check-deuda` también falla si sube el total de `ui-ok:` o de `eslint-disable`, salvo cuando un archivo se mueve sin cambiar ese total.
- **Acepta:** añadir un `style={{` en un archivo nuevo falla; `check-deuda` no cuenta las reglas nuevas como empeorar.

### F0-4 Cobertura de los flujos críticos · M
- **Crea:** `web/e2e/critico-live.spec.ts`, añadido al job `flujos-con-cuentas`.
- **Cubre, con cuentas:** crear marca, crear y editar un post, mover un post, crear y completar una tarea, crear una libreta, recargar y ver que siguió ahí.
- **Por qué:** F1 reescribe lo que estos flujos usan, y hoy solo se prueban en modo demo.
- **Acepta:** pasa en CI. Para probar que detecta fallos, rompe una acción en local y confirma que falla. La lista de specs del job está escrita a mano en `ci.yml`: confirma en el log que la nueva corrió y no aparece como `skipped`.

### F0-5 Contrato del store · M
- **Crea:** `web/lib/store.contract.test.ts`. Debe pasar **antes** de mover nada y seguir sin cambios durante toda F1.
- **Fija tres cosas:**
  1. La lista ordenada de las claves de `useHublyStore.getState()`: **148** en el estado recién creado y **158** con un documento completo hidratado. La interfaz `HublyStoreState` declara 125 de ellas (106 acciones y 19 claves de interfaz) y las 23 restantes llegan por `...INITIAL_WORKSPACE_DATA`. Si dos slices definen la misma clave, la última gana en silencio; esta prueba es la que lo detecta.
  2. Una secuencia de acciones de todos los dominios, con reloj y datos fijos, cuyo resultado se compara con una foto. Normaliza los ids generados.
  3. Qué se guarda: la forma del documento que recibe `saveWorkspaceToStorage`, y qué acciones provocan guardar. Un campo que deje de guardarse es pérdida de datos, y ninguna prueba visual lo vería.
- **Acepta:** quitar un campo de `extractWorkspaceData`, o el `persistWorkspaceState` de una acción, hace fallar la prueba.

### F0-6 Compuerta de F1 · B · la activa el dueño
- **Hace:** con D4 respondida, `flujos-con-cuentas` pasa a ser obligatorio en `main`. Hoy solo lo son `web` y `secretos`, así que un PR de F1 podría fusionarse con esos flujos en rojo.

## F1: Store por dominio

**Un solo agente en toda la fase.** Solo mover: sin cambiar lógica ni estado. Requiere F0 completa. Cada tarea corre los flujos con cuentas y `store.contract.test.ts`, que no se edita. Se hace en este orden: de menos a más acoplado.

El store tiene **148 claves** recién creado (`Object.keys(useHublyStore.getState())`) y **158** con un documento completo hidratado: **106 acciones**, **23 claves de datos guardados** y **19 claves de estado de interfaz**, más **10 opcionales** que no están en el estado inicial (`schemaVersion`, `ideas`, `leads`, `quotes`, `automations`, `agents`, `taskLists`, `calendarActivities`, `chatScheduled`, `chatReminders`).

**Solo se asignan abajo las 106 acciones y las 19 claves de estado de interfaz.** Las **23 claves de datos** entran por `...INITIAL_WORKSPACE_DATA` en `store.ts` y ningún slice las declara: es una de las trampas comprobadas de abajo. No hay que asignarlas como claves, pero no están huérfanas: sus mutaciones viven en las acciones que reparte la tabla. Las **10 opcionales** son datos igual que esas y llegan por dos vías: al normalizar un documento completo y al ejecutar acciones que la tabla también reparte. Su dueño funcional es el slice de esas acciones, y ninguna se declara en el estado inicial. F1 debe conservarlas.

Antes de cada tarea, compara la tabla con `lib/store.ts`. Lo que no tenga dueño se pregunta, no se improvisa.

**Trampas comprobadas:**
- `...INITIAL_WORKSPACE_DATA` se queda como primer spread en `store.ts`. Un slice no declara datos guardados como `tasks: []`, porque pisaría los datos iniciales. Solo declara estado que no se guarda, y sus acciones.
- `teamMembers` y `dashboardWidgets` se derivan de los datos iniciales: se calculan en `store.ts` o en su slice, y la prueba de contrato debe seguir igual.
- Los slices importan el tipo con `import type`. `sync.ts` no importa valores de `store.ts`, para no crear un ciclo al cargar.
- `lib/invitaciones.ts` y `lib/live-merge-bridge.ts` usan `useHublyStore` directamente, igual que las specs mediante `__hubly`. No cambies esa forma.
- `createActivityItem` (11 usos), `withPostLog` (10), `runAutomations` (3) y `STATUS_TO_LABEL` (3) cruzan dominios. Van en F1-1 a `lib/domain/activity.ts`, `lib/domain/posts.ts` y `lib/domain/automations.ts`, tal cual.
- Ningún archivo nuevo puede superar 400 líneas. Por eso marcas se parte en dos slices.

| Tarea | Crea | Mueve | Riesgo |
|---|---|---|---|
| **F1-1** Armazón, sesión y ventanas | `lib/store/sync.ts`, `lib/store/session.slice.ts`, `lib/store/ui.slice.ts` | `extractWorkspaceData`, `persistWorkspaceState`, ayudas compartidas, `syncFromServer`, `switchWorkspace`, `hydrated`, `role`, `isReferenceFixture`, `applyReferenceFixture`, `setTestClock`, `resetDemoData`, `updateProfile`, `updateAgency`, modales, `cmdkOpen`, `aiDrawer*`, `composer*`, `editingPostId`, `editWidgetsMode` | A |
| **F1-2** Simples | `agents`, `automations`, `crm`, `projects`, `assets`, `notebooks` | `*Agent`, `*Automation`, `*Lead`, `*Quote`, `*Project`, `addAsset`, `*Notebook*` | M |
| **F1-3** Tareas | `tasks.slice.ts` | `addTask`, `updateTask`, `toggleTaskStatus`, `deleteTask`, `moveTask`, `*TaskList` | M |
| **F1-4** Equipo y tablero | `team.slice.ts`, `dashboard.slice.ts` | `*TeamMember`, `*TeamInvitation`, `recordActivityEvent`, `*Widget*` (solo acciones y datos del tablero, ver nota), `*Onboarding*`, `*Notification*` | M |
| **F1-5** Marcas | `brands.slice.ts`, `brandStrategy.slice.ts` | Marcas: `addBrand` (165 líneas), `updateBrand` y datos básicos, `setActiveBrand`. Estrategia: `updateBrandCommitments`, `togglePersonaAccepted`, `setBrandCustomMetrics`, `*Recommendation*` | A |
| **F1-6** Posts y chat | `posts.slice.ts`, `chat.slice.ts` | `savePost`, `updatePost*`, `approveAllBrandPosts`, `deletePost`, `duplicatePost`, `movePost`, `patchPost`, `addPostComment`, `*Idea*`, `recordPublication`, `setPostResults`, `setCalendarActivities`, `*Chat*`, `flushChatQueue`, `scheduleChatMessage` | A |

**`*Widget*` en F1-4:** son las acciones y el dato del tablero (`toggleWidgetVisibility`, `setWidgetVisibility`, `reorderWidgets`, `moveWidget`, `setWidgetSpan`, `setWidgetMetric`, `resetWidgetsLayout` y `dashboardWidgets`). Los flags de edición y los modales son estado de interfaz y quedan en F1-1: `editWidgetsMode`, `setEditWidgetsMode`, `widgetConfigModalOpen` y `setWidgetConfigModalOpen`. Así ninguna de las cuatro queda con dos dueños.

**Las 10 opcionales y quién las escribe.** No se declaran en el estado inicial: las rellena `normalizeWorkspacePayload` al hidratar y las escriben estas acciones, que ya tienen tarea en la tabla de arriba.

| Clave | Acciones que la escriben | Tarea |
|---|---|---|
| `schemaVersion` | ninguna: es la constante de versión y la pone `extractWorkspaceData` | F1-1 (`sync.ts`) |
| `ideas` | `addIdea`, `removeIdea`, `convertIdeaToPost` | F1-6 (`posts.slice.ts`) |
| `leads` | `saveLead`, `moveLead`, `deleteLead` | F1-2 (`crm`) |
| `quotes` | `saveQuote`, `deleteQuote` y `deleteLead`, que borra las de su lead | F1-2 (`crm`) |
| `automations` | `addAutomation`, `toggleAutomation`, `removeAutomation` | F1-2 (`automations`) |
| `agents` | `addAgent`, `updateAgent`, `duplicateAgent`, `deleteAgent` | F1-2 (`agents`) |
| `taskLists` | `addTaskList`, `renameTaskList`, `deleteTaskList` | F1-3 (`tasks.slice.ts`) |
| `calendarActivities` | `setCalendarActivities` | F1-6 (`posts.slice.ts`) |
| `chatScheduled` | `scheduleChatMessage`, `cancelChatScheduled`, `flushChatQueue` y `deleteChatChannel` | F1-6 (`chat.slice.ts`) |
| `chatReminders` | `addChatReminder`, `flushChatQueue` y `deleteChatChannel` | F1-6 (`chat.slice.ts`) |

Así las 10 tienen dueño funcional sin que ningún slice las declare: la trampa del primer spread no cambia.

**F1-6 también:** elimina el único `useHublyStore()` sin selector, en `useInicioView.tsx`.

**Acepta F1:** `lib/store.ts` tiene menos de 150 líneas y solo compone. Ningún archivo consumidor cambió su import. `lib/live-merge-bridge.ts` y `__hubly` siguen funcionando. Toda la suite, los flujos con cuentas y las capturas pasan sin diferencias.

### F1-7 Reglas fuera del store · M
- **Depende de:** F1-6.
- **Hace:** saca de los slices la lógica que no toca estado (armar un post, calcular estados) a `lib/domain/`, con pruebas unitarias. Un PR por dominio.
- **Acepta:** ninguna acción pasa de 40 líneas; cada función nueva tiene prueba.

## F2: Lógica, tipos y datos

Requiere F1. En paralelo: un agente por tarea.

| Tarea | Archivos | Hace | Riesgo |
|---|---|---|---|
| **F2-1** Selectores | `lib/domain-selectors.ts` → `lib/domain/{greeting,tasks,posts,account-health,recommendations,team,onboarding}.ts` | Parte por función exportada y mueve sus pruebas. Divide `selectTeamProductivity` y `selectAccountsHealth`, que superan 80 líneas | M |
| **F2-2** Tipos | `lib/types.ts` → `lib/types/<dominio>.ts` + `index.ts` | Conserva `@/lib/types` como import. Elimina el alias `TaskItem` en favor de `AgencyTask` | B |
| **F2-3** Datos de ejemplo | `lib/seed-data.ts` → `lib/seed/<dominio>.ts` | Debe quedar claro que solo los usa el modo demo | B |
| **F2-4** Servidor | `app/api/workspace/route.ts`, `app/api/members/route.ts` → `lib/server/` | Las rutas validan, autorizan y delegan. Máximo 80 líneas por ruta | M |

**Acepta F2:** los archivos originales ya no existen o solo reexportan. Pruebas unitarias con la misma cifra o más. Flujos con cuentas en verde.

## F3: Vistas desacopladas

Requiere F1 y F2-2. Un agente por tarea. Primero las secciones, luego mover a la carpeta del dominio, en dos commits.

**Pasos de cada tarea:**
1. Lista lo que cada sección toma de `view`.
2. Convierte a props explícitas. Máximo 7; si no, parte la sección.
3. Mueve reglas de negocio del hook a `lib/domain/`, con pruebas.
4. Elimina el `view`, el tipo `*Model` y los `*-shared`.
5. Convierte el `style={{` de los archivos que tocaste, según F4.
6. Mueve a la carpeta del dominio.

| Tarea | Vista | Origen → destino | Riesgo |
|---|---|---|---|
| **F3-1** | Equipo | `dashboard/team/` → `equipo/` | M |
| **F3-2** | Inicio | `dashboard/inicio/` → `dashboard/` | M |
| **F3-3** | Parrillas | `parrillas/_vista/` → `components/app/parrillas/` | M |
| **F3-4** | Anuncios | `anuncios/_vista/` → `components/app/anuncios/`. **Espera D1** | B |
| **F3-5** | Editor de post | `compositor/`. **El más delicado:** corre `compositor.spec.ts` en cada paso | A |
| **F3-6** | Libreta y sugerencias | `NotebookReaderModal`, `sugerencias/`. Quita su lógica propia de foco y Escape, y usa `getFocusableElements` solo si `Modal` no alcanza | M |

Archivos grandes sin `view`, que se parten igual:

| Tarea | Archivo | Riesgo |
|---|---|---|
| **F3-7** | `dashboard/SaludCuentasView.tsx` → `salud/` | M |
| **F3-8** | `(app)/calendario/page.tsx` → `components/app/social/`. Es referencia visual: las capturas no pueden cambiar | M |
| **F3-9** | `(app)/chat/page.tsx` → `components/app/chat/` | M |
| **F3-10** | `(app)/layout.tsx`: animación del sidebar a `useSidebarMotion`, navegación a `shell/` | A |
| **F3-11** | Rutas sueltas: `crm`, `reportes`, `marca`, `marcas`, `ajustes`, `tareas`. Una tarea por ruta | M |
| **F3-12** | Componentes grandes: `TaskBoard`, `SocialCalendar`, `ArchivosYProyectosView`, `CommandPaletteModal`, `FloatingAIDrawer`, `ChatComposer`, `ChatMessageRow`, `ExtraWidgets`, `DescubreHublyWidget`, `NewBrandModal`. Una tarea por archivo | M |
| **F3-13** | Rutas restantes: `ia`, `automatizaciones`, `notificaciones`, `onboarding`, `register`, `cotizacion`, `invitacion` | B |
| **F3-14** | Vistas públicas: `share/[token]`, `reporte/[brandId]`. Quien las abre no tiene sesión: prueba sin sesión y con un enlace inválido | M |
| **F3-15** | `app/page.tsx` y `lib/chat-live.ts`. El segundo mantiene tiempo real: corre `chat-live.spec.ts` | M |

`chat/page` también recibe `view` en parte: F3-9 lo elimina.

**Acepta F3:** ningún componente recibe `view`. `page.tsx` bajo 80 líneas. Sin carpetas `_vista` ni `partes`. Capturas sin diferencias.

### Cobertura de los archivos grandes

Los 44 archivos de `check-size-baseline.json` tienen destino:

| Destino | Archivos |
|---|---|
| F1 | `lib/store.ts` |
| F2 | `lib/domain-selectors.ts`, `lib/seed-data.ts`, `lib/types.ts` |
| F3-1 a F3-11 | `EquipoCabecera`, `EquipoLogrosRanking`, `ComposerContenido`, `usePostComposerModal`, `SugerenciasCuerpo`, `NotebookReaderModal`, `SaludCuentasView`, `calendario/page`, `chat/page`, `(app)/layout`, `reportes/page`, `ParrillasCalendario`, `ParrillasLinks` |
| F3-12 a F3-15 | `TaskBoard`, `SocialCalendar`, `ArchivosYProyectosView`, `CommandPaletteModal`, `FloatingAIDrawer`, `ChatComposer`, `ChatMessageRow`, `ExtraWidgets`, `DescubreHublyWidget`, `NewBrandModal`, `share/[token]/page`, `app/page`, `lib/chat-live.ts` |
| F4 | `dashboard-polish.css`, `hubly-saas.css`, `globals.css`, `app-base.css` |
| F5-3 | `lib/workspace-repository.ts` |
| Excepción por ADR 0005 | `components/previews/*` (6 archivos), `SocialIcons`, `DuotoneIcons`, `HublyIcons` |

## F4: CSS y estilos en línea

Puede correr en paralelo con F1 a F3, **sin tocar los mismos archivos**. Coordina en [SEGUIMIENTO.md](SEGUIMIENTO.md).

### F4-1 Tokens en un solo lugar · M
- **Crea:** `app/tokens.css`, importado primero en `app/layout.tsx`, para que también lo tengan las rutas fuera de `(app)`.
- **Mueve:** las 253 definiciones de variables desde `globals.css` (40), `hubly-saas.css` (148), `app-base.css` (51) y `dashboard-polish.css` (14).
- **Primero:** lista los tokens definidos más de una vez con distinto valor o selector. Para cada uno, anota cuál gana hoy en la app, en la landing y en `share`. Conserva ese resultado, aunque haga falta un selector de alcance.
- **Quita** los duplicados y los tokens prohibidos sin uso.
- **Cuidado:** el orden de los imports decide qué valor gana. `app/not-found.tsx` y `app/reporte/[brandId]/page.tsx` importan estos CSS directamente: revísalos con las capturas, porque `visual.spec.ts` podría no cubrirlos.
- **Acepta:** capturas sin diferencias en las 66 vistas.

### F4-2 Tokens de estado · M
- **Hace:** define `--ui-danger*`, `--ui-success*`, `--ui-warning*` claro y oscuro, a partir de `STATUS_META`. Añádelos a la §3 de la guía.
- **Sustituye:** `#B91C1C`, `#DC2626`, `#10B981`, `#15803D`, `#DCFCE7`, `#FEF2F2` y similares, si coinciden con un estado.
- **Acepta:** contraste de 4.5:1 en claro y oscuro; deuda de color menor a 350.

### F4-3 Partir `dashboard-polish.css` · A
- **Hace:** reparte sus 3,112 líneas entre el `<dominio>.css` de cada dominio. Un PR por dominio, de menor a mayor. Conserva el orden relativo, porque de él dependen muchas reglas.
- **Carga:** cada `<dominio>.css` se importa en `(app)/layout.tsx`, en lista y orden fijos, en el lugar que ocupaba `dashboard-polish.css`. **No lo importes desde la pantalla:** Next ordena el CSS por chunk, y la cascada podría cambiar al navegar sin recargar. Las capturas abren cada ruta de cero, así que no lo detectarían.
- **Actualiza** los imports de `app/not-found.tsx` y `app/reporte/[brandId]/page.tsx`, que hoy cargan el archivo directamente.
- **Comprueba además:** navega con clics, sin recargar, entre `/dashboard`, `/calendario` y `/parrillas`, y compara con la carga directa.
- **Acepta:** el archivo desaparece. Capturas sin diferencias.

### F4-4 Partir `hubly-saas.css` y unir duplicados · A
- **Depende de:** F4-3.
- **Hace:** primero busca clases sin uso y elimínalas. Reparte el resto por dominio. Une reglas repetidas.
- **Cuidado:** algunas clases se arman con plantillas de texto: busca por prefijo antes de borrar.

### F4-5 Quitar `!important` y `html.dark` · M
- **Depende de:** F4-3 y F4-4.
- **Hace:** cada regla `html.dark` que solo cambia un color se elimina usando el token en la regla base. Cada `!important` se elimina corrigiendo la causa, o lleva comentario.

### F4-6 `style={{}}` por lotes · M
Un PR por lote de hasta 10 archivos. Si el archivo pertenece a una tarea de F3 en curso, se salta.

| Lote | Archivos |
|---|---|
| 1 | `tasks/TaskBoard`, `crm/page`, `reportes/page` |
| 2 | `ArchivosYProyectosView`, `marcas/page`, `share/[token]/page` |
| 3 | Los que queden con más de 20 |
| 4 | El resto, salvo `previews/` |

**`components/previews/`** imita a otras apps: sus colores son legítimos, con `// ui-ok: simulador`. No se le aplica la meta de `style`, y se documenta en el ADR 0005.

### F4-7 Emojis y restos · B
- **Hace:** sustituye los 51 emojis por iconos duotono (la mayoría en el catálogo de logros: espera D2), y corrige `tamano-fuente`, `radio`, `degradado`, `exclamacion` y `transition-all`.

## F5: Fachadas y modo demo

Requiere decisiones del dueño. No empezar sin ellas.

| Tarea | Decisión | Hace | Riesgo |
|---|---|---|---|
| **F5-1** Anuncios | D1 | Aplica lo decidido sobre `SAMPLE_ADS` | B |
| **F5-2** Logros | D2 | Implementar con backend, ocultar con bandera o eliminar `FULL_39_ACHIEVEMENTS_CATALOG` y XP | M |
| **F5-3** Modo demo | D3 | Reduce `backendEnabled` a un solo punto: las pantallas no saben en qué modo están. Si no hay demo público, retira los caminos de disco y `/api/workspace` de disco. Parte `workspace-repository.ts` | A |

## F6: Cierre

Requiere todo lo anterior.

| Tarea | Hace |
|---|---|
| **F6-1** Excepciones | Revisa cada `eslint-disable`. Sustituye los `set-state-in-effect` que se resuelven derivando estado, con `key` o con `useSyncExternalStore`. Meta: menos de 25 |
| **F6-2** Topes | Baja `check:size` a 400 sin base, salvo excepciones por ADR. Elimina las bases que quedaron en cero |
| **F6-3** Documentación | Actualiza `ARCHITECTURE.md`, `CODE_STANDARDS.md`, `ROADMAP.md`, `AGENTS.md`; archiva este plan en `docs/archivo/` y deja un ADR final |
| **F6-4** Auditoría | Un agente que no participó revisa contra [02-ARQUITECTURA-OBJETIVO.md](02-ARQUITECTURA-OBJETIVO.md), recorre la app con teclado y en 3 tamaños, y lista lo que falte |
