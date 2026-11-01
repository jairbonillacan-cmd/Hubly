# Tareas

Cada tarea es un PR. **Riesgo:** B bajo, M medio, A alto. **Sin cambios visibles** salvo donde se indique. Todas cumplen además [03-REGLAS-PARA-AGENTES.md](03-REGLAS-PARA-AGENTES.md).

## F0: Controles

Va primero, un agente a la vez.

### F0-1 Script de medición · B
- **Crea:** `web/scripts/medir-deslop.mjs`.
- **Hace:** imprime en Markdown las medidas de [SEGUIMIENTO.md](SEGUIMIENTO.md): líneas de `store.ts`, archivos sobre 400, componentes con `view`, `style={{`, deuda de `check:ui`, `!important`, `eslint-disable` y `as unknown as`.
- **Acepta:** coincide con las cifras de partida, o explica por qué no.

### F0-2 Chequeo de capas · M
- **Depende de:** F0-1.
- **Crea:** `web/scripts/check-capas.mjs`, `npm run check:capas`, paso en `web` de CI.
- **Hace:** verifica las reglas de dependencia de [02-ARQUITECTURA-OBJETIVO.md](02-ARQUITECTURA-OBJETIVO.md). Lo que ya viola la regla va a `scripts/check-capas-baseline.json`, que solo baja. No añade dependencias: usa la API de TypeScript.
- **Extiende** `check-deuda.mjs` para vigilar esa base.
- **Acepta:** un `import` prohibido nuevo hace fallar la comprobación, probado con una prueba unitaria.

### F0-3 Reglas nuevas de `check:ui` · M
- **Depende de:** F0-1.
- **Archivos:** `web/scripts/check-ui.mjs`, base, `check-deuda.mjs`.
- **Hace:** añade `style-inline`, `important`, `view-prop` y `use-store-sin-selector` como reglas con base. La última parte de 1 hallazgo, en `useInicioView.tsx`, y llega a 0 en F1-6.
- **Además:** alinea `docs/ARCHITECTURE.md` y `docs/CODE_STANDARDS.md` con este plan.
- **Acepta:** añadir un `style={{` en un archivo nuevo falla; `check-deuda` no cuenta las reglas nuevas como empeorar.

### F0-4 Cobertura de los flujos críticos · M
- **Crea:** `web/e2e/critico-live.spec.ts`, añadido al job `flujos-con-cuentas`.
- **Cubre, con cuentas:** crear marca, crear y editar un post, mover un post, crear y completar una tarea, crear una libreta, recargar y ver que siguió ahí.
- **Por qué:** F1 reescribe lo que estos flujos usan, y hoy solo se prueban en modo demo.
- **Acepta:** pasa en CI. Para probar que detecta fallos, rompe una acción en local y confirma que falla.

## F1: Store por dominio

**Un solo agente en toda la fase.** Solo mover: sin cambiar lógica ni estado. Requiere F0 completa. Cada tarea corre los flujos con cuentas. Se hace en este orden: de menos a más acoplado.

| Tarea | Crea | Mueve | Riesgo |
|---|---|---|---|
| **F1-1** Armazón y sincronización | `lib/store/sync.ts`, `lib/store/ui.slice.ts` | `extractWorkspaceData`, `persistWorkspaceState`, `syncFromServer`, `switchWorkspace`, modales, `cmdkOpen`, `aiDrawer*`, `composer*`, `editWidgetsMode` | A |
| **F1-2** Simples | `agents`, `automations`, `crm`, `projects`, `assets`, `notebooks` | `*Agent`, `*Automation`, `*Lead`, `*Quote`, `*Project`, `addAsset`, `*Notebook*` | M |
| **F1-3** Tareas | `tasks.slice.ts` | `addTask`, `updateTask`, `toggleTaskStatus`, `deleteTask`, `moveTask`, `*TaskList` | M |
| **F1-4** Equipo y tablero | `team.slice.ts`, `dashboard.slice.ts` | `*TeamMember`, `*TeamInvitation`, `recordActivityEvent`, `*Widget*`, `*Onboarding*`, `*Notification*` | M |
| **F1-5** Marcas | `brands.slice.ts` | `addBrand`, `updateBrand*`, `togglePersonaAccepted`, `setBrandCustomMetrics`, `*Recommendation*`, `setActiveBrand`, `updateProfile`, `updateAgency` | M |
| **F1-6** Posts y chat | `posts.slice.ts`, `chat.slice.ts` | `savePost`, `updatePost*`, `approveAllBrandPosts`, `deletePost`, `duplicatePost`, `movePost`, `patchPost`, `addPostComment`, `*Idea*`, `recordPublication`, `setPostResults`, `setCalendarActivities`, `*Chat*`, `flushChatQueue`, `scheduleChatMessage` | A |

**F1-6 también:** elimina el único `useHublyStore()` sin selector.

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

**Acepta F3:** ningún componente recibe `view`. `page.tsx` bajo 80 líneas. Sin carpetas `_vista` ni `partes`. Capturas sin diferencias.

## F4: CSS y estilos en línea

Puede correr en paralelo con F1 a F3, **sin tocar los mismos archivos**. Coordina en [SEGUIMIENTO.md](SEGUIMIENTO.md).

### F4-1 Tokens en un solo lugar · M
- **Crea:** `app/(app)/tokens.css`.
- **Mueve:** todas las definiciones `--ui-*`, `--hb-*` desde `globals.css`, `hubly-saas.css`, `app-base.css` y `dashboard-polish.css`.
- **Quita** los duplicados y los tokens prohibidos sin uso.
- **Cuidado:** el orden de los imports decide qué valor gana; `app/layout.tsx` y `(app)/layout.tsx` cargan cada uno los suyos, y `globals.css` también sirve a la landing.
- **Acepta:** capturas sin diferencias en las 66 vistas.

### F4-2 Tokens de estado · M
- **Hace:** define `--ui-danger*`, `--ui-success*`, `--ui-warning*` claro y oscuro, a partir de `STATUS_META`. Añádelos a la §3 de la guía.
- **Sustituye:** `#B91C1C`, `#DC2626`, `#10B981`, `#15803D`, `#DCFCE7`, `#FEF2F2` y similares, si coinciden con un estado.
- **Acepta:** contraste de 4.5:1 en claro y oscuro; deuda de color menor a 350.

### F4-3 Partir `dashboard-polish.css` · A
- **Hace:** reparte sus 3,112 líneas entre el `<dominio>.css` de cada dominio. Un PR por dominio, de menor a mayor. Conserva el orden relativo, porque de él dependen muchas reglas.
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
