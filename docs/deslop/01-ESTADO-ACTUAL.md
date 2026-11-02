# Estado actual

Medido el 1 de noviembre de 2026. Las cifras vivas están en [SEGUIMIENTO.md](SEGUIMIENTO.md).

## Lo que ya no hay que rehacer

| Hecho | Dónde |
|---|---|
| CI bloquea subir deuda, tamaño, avisos y código muerto | `.github/workflows/ci.yml`, `web/scripts/` |
| Prueba visual: 22 vistas en 3 tamaños | `web/e2e/visual.spec.ts` |
| Flujos con cuentas contra el simulador | `web/e2e/*-live.spec.ts`, job `flujos-con-cuentas` |
| Componentes base | `web/components/app/ui/` |
| Diálogos modales unificados | `web/components/app/ui/Modal.tsx` |
| Marcas, posts, tareas y otras colecciones en tablas con permisos | `supabase/migrations/0012` a `0015` |

## Diagnóstico

### 1. Un store que lo sabe todo
`web/lib/store.ts` tiene 2,304 líneas y 148 claves en el store recién creado (158 con un documento completo hidratado), de 15 dominios, y lo usan 66 archivos. Mezcla datos, ventanas abiertas, sincronización y reglas de negocio.

**Medición** (`Object.keys(useHublyStore.getState())`, 1 de noviembre de 2026):

- **106 acciones**, todas funciones.
- **23 claves de datos guardados**, exactamente las de `INITIAL_WORKSPACE_DATA`: `activeBrandId`, `activityEvents`, `ads`, `agency`, `agencyName`, `appliedRecommendationsMap`, `assets`, `brands`, `channels`, `dismissedRecommendationIds`, `invitations`, `messages`, `notebooks`, `notifications`, `onboarding`, `posts`, `profile`, `projects`, `tasks`, `team`, `testClock`, `widgets`, `workspaceId`.
- **19 claves de estado de interfaz**: `activeNotebookId`, `aiDrawerOpen`, `aiDrawerPrompt`, `autoSuggestionsModalOpen`, `cmdkOpen`, `composerDefaultDate`, `composerDirty`, `composerOpen`, `composerPending`, `dashboardWidgets`, `editWidgetsMode`, `editingPostId`, `hydrated`, `inviteModalOpen`, `isReferenceFixture`, `newBrandModalOpen`, `role`, `teamMembers`, `widgetConfigModalOpen`.
- **10 claves opcionales**, que no están en `INITIAL_WORKSPACE_DATA` y son datos, no interfaz: `schemaVersion`, `ideas`, `leads`, `quotes`, `automations`, `agents`, `taskLists`, `calendarActivities`, `chatScheduled` y `chatReminders`. Las rellena `normalizeWorkspacePayload` al hidratar un documento completo, y también las escriben acciones de su dominio (`addIdea`, `saveLead`, `addTaskList`, `flushChatQueue`…); `schemaVersion` es la excepción: la pone la normalización y no la escribe ninguna acción.

La cifra anterior, 125, contaba solo los miembros declarados en `HublyStoreState` (106 acciones y 19 claves de interfaz) y dejaba fuera las 23 claves de datos que llegan por `HublyWorkspaceData`.

**Consecuencia:** cualquier cambio exige entender todo el archivo, y las reglas de negocio no se pueden probar por separado.

### 2. Archivos partidos, no desacoplados
Las particiones anteriores movieron código sin cambiar su forma. 33 archivos reciben un `view` con todo el estado de su pantalla:

```tsx
export function EquipoResumen({ view }: { view: EquipoViewModel }) {
  const { profile, brands, teamPeriod /* … */ } = view;
```

**Consecuencia:** el archivo es más corto, pero ninguna sección se entiende, reutiliza o prueba sola. Además, los hooks `use*View` concentran lógica de varias secciones.

| Vista | Carpeta |
|---|---|
| Equipo | `components/app/dashboard/team/` |
| Inicio | `components/app/dashboard/inicio/` |
| Editor de post | `components/app/compositor/` |
| Sugerencias | `components/app/sugerencias/` |
| Parrillas | `app/(app)/parrillas/_vista/` |
| Anuncios | `app/(app)/anuncios/_vista/` |

### 3. Lógica de cuatro temas en un solo archivo
`lib/domain-selectors.ts` (1,596 líneas) calcula saludos, tareas, posts, salud de cuentas, recomendaciones, productividad y onboarding. `lib/types.ts` (768) y `lib/seed-data.ts` (1,540) mezclan todos los dominios.

### 4. Estilos sin dueño
| Archivo | Líneas | `!important` |
|---|---:|---:|
| `app/(app)/dashboard-polish.css` | 3,112 | 124 |
| `app/globals.css` | 2,106 | 7 |
| `app/(app)/hubly-saas.css` | 1,672 | 19 |
| `app/(app)/app-base.css` | 757 | 7 |

Además hay 1,730 `style={{` (1,475 sin simuladores ni iconos) y 812 hallazgos de `check:ui`, de ellos 487 colores fijos y 189 `rgb`. `dashboard-polish.css` tiene 101 reglas `html.dark`, muchas porque la regla base usa un color fijo.

**Más `style={{` por archivo:** `TaskBoard` 89, `ParrillasCalendario` 55, `crm/page` 55, `AnunciosTarjetas` 54, `reportes/page` 51, `ArchivosYProyectosView` 48, `NotebookReaderModal` 47, `share/[token]/page` 45.

Los simuladores de `components/previews/` imitan a otras apps: ahí los colores fijos son legítimos, y se tratan aparte.

### 5. Dos arquitecturas
`backendEnabled` aparece en 39 archivos. El modo demo y el modo real conviven y hay fachadas que solo existen en demo, como `/anuncios` e `/ia`.

### 6. Silencios
- 79 líneas con `eslint-disable`. Muchas son válidas, pero varias tapan efectos que deberían ser otra cosa.
- `AutoSuggestionsModal` y `NotebookReaderModal` todavía tienen lógica de foco propia, duplicada con `Modal`.

## Archivos de código más grandes

| Líneas | Archivo | Tarea |
|---:|---|---|
| 2,304 | `lib/store.ts` | F1 |
| 1,596 | `lib/domain-selectors.ts` | F2-1 |
| 1,540 | `lib/seed-data.ts` | F2-3 |
| 916 | `components/app/NotebookReaderModal.tsx` | F3-6 |
| 851 | `components/app/dashboard/SaludCuentasView.tsx` | F3-7 |
| 804 | `app/(app)/calendario/page.tsx` | F3-8 |
| 775 | `app/(app)/chat/page.tsx` | F3-9 |
| 768 | `lib/types.ts` | F2-2 |
| 677 | `app/(app)/layout.tsx` | F3-10 |
| 647 | `lib/workspace-repository.ts` | F5-3 |

## Límites de los controles actuales

Comprobados al revisar este plan. Cada uno tiene su respuesta.

| Límite | Consecuencia si se ignora | Respuesta |
|---|---|---|
| `check:ui` guarda la deuda por archivo | Mover un archivo con deuda falla, aunque no empeore nada | Protocolo de movimiento en [03-REGLAS-PARA-AGENTES.md](03-REGLAS-PARA-AGENTES.md) |
| `check:ui` solo revisa `app/(app)` y `components/app` | `share`, `reporte`, login y la landing pueden empeorar sin aviso | F0-3 |
| `ui-ok:` y `eslint-disable` no tienen tope | Se puede callar un chequeo en vez de corregirlo | F0-3 |
| `flujos-con-cuentas` no es obligatorio en `main` | F1 se podría fusionar con flujos en rojo | D4, F0-6 |
| Las capturas no corren en CI, y abren cada ruta de cero | Un error de orden de CSS al navegar no se ve | Evidencia en el PR; prueba de navegación en F4-3 |
| Playwright reutiliza el servidor abierto y usa el 3000 por omisión | Sin `E2E_PORT`, las pruebas pasan contra el código del dueño y no contra tu rama | `E2E_PORT` obligatorio |
| Nada verifica qué datos guarda el store | Perder un campo al mover pasa todas las pruebas y destruye datos | F0-5 |

## Riesgos ya vividos

Son reales y se repetirán si no se atienden. Las reglas en [03-REGLAS-PARA-AGENTES.md](03-REGLAS-PARA-AGENTES.md) existen por ellos.

| Qué pasó | Lección |
|---|---|
| Un script de limpieza vació `EquipoView.tsx` | Revisar el tamaño del diff antes de cada commit |
| Quitar `ssr: false` rompió el chat | Correr la suite completa, no una parte |
| Leer tablas después de normalizar pudo romper pantallas | Correr los flujos con cuentas, no solo el modo demo |
| Una espera para pasar una prueba ocultó que `/calendario` se caía | Mirar la captura del fallo antes de ajustar la prueba |
| Un PR afirmó haber corrido una spec que se saltaba | Leer «passed» y «skipped» antes de escribirlo |
| Un tope se subió para que CI pasara | Los topes solo bajan; CI lo verifica |
| Un `build` dejó colgado un servidor de pruebas | Tras `build`, usar otro puerto y borrar `.next` |
