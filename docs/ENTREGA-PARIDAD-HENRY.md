# Entrega de paridad con Henry: 31 de octubre de 2026

Rama `agente/integracion`: fusiona `agente/glm-calidad`, `agente/gemini-flujos` y `agente/opus-diseno`, sin conflictos, más sus colas. Nada se ha publicado.

## Pruebas de esta entrega

Ejecutadas el 31 de octubre en la rama de integración, con servidor propio en el puerto 3004, sobre el código final (tras las correcciones de la revisión visual). Una corrida completa, sin repeticiones.

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Correcto. Deuda heredada sin empeorar: 1571 hallazgos |
| `npx tsc --noEmit` | Sin errores |
| `npm run build` | Compila |
| `npm test` | 43 pasan |
| `npm run test:db` | 69 pasan (PGlite con las migraciones reales y un `storage` mínimo) |
| `npx playwright test` | 88 pasan, en modo demo contra el servidor de desarrollo, con Chrome |
| `npm run audit:controles` | 679 controles: 564 responden, 29 ya activos, 49 enlaces, 19 deshabilitados, 17 sin efecto visible, 0 con error, 1 omitido |

La matriz dice 2026-11-01 porque el script escribe la fecha en UTC, y su texto «previo a la integración» es fijo. Entre corridas, «Café Bruma» y «Min» en `/marcas` intercambian el detalle: un clic suelto en «Café Bruma» sí navega a `/marca`, así que es variación de tiempos de la auditoría.

## Revisión visual

`/chat`, `/anuncios`, `/reportes` y `/dashboard`, mirando las capturas en 1440 claro, 1440 oscuro y 390 claro, arriba y al final del scroll; en `/chat`, también con conversación abierta y con un mensaje escrito. Sin errores de consola, sin desbordamiento y sin elementos cortados, medido en el navegador. A 1440 y a 390, 0 widgets quedan bajo el aviso al final del scroll de `/dashboard`.

Las pruebas pasaban con estos defectos, que se vieron en las capturas y se corrigieron:

| Defecto | Causa | Corrección |
|---|---|---|
| `/chat` en oscuro: área de mensajes blanca y título casi invisible | `#FAFBFC` fijo | Token `--ui-surface-2` |
| `/chat` en oscuro: buscador blanco, bordes claros y «# General» activo con poco contraste | Colores fijos y `--hb-accent` usado como texto | `--ui-muted`, `--ui-border` y `--hb-accent-text` |
| `/chat` a 1440: el botón de Hubi tapaba parte de «Enviar» | El compositor llegaba a la esquina del botón | Margen derecho en `.hubly-chat-form` |
| `/chat` a 390: el aviso pisaba el campo de mensaje | Alto del panel | Panel más bajo; sin solape medido |
| `/reportes` a 390: «Costo por visita» y «CTR» cortados | Rejilla fija de cuatro columnas con `overflow: hidden` | `.hubly-reporte-cifras`: dos columnas en móvil |
| `/reportes` en oscuro: icono del vacío casi invisible | `#DBEAFE` fijo | Token `--ui-sky-soft` |

## Pendiente tras la integración

- **Sin comprobar en esta revisión:** modo oscuro a 390, recorrido con teclado, hover y foco de cada control, y ventanas abiertas. La regresión de `/chat` en oscuro no tiene prueba automática: `rutas.spec.ts` no abre una conversación.
- **`/reportes` muestra cifras inventadas sin etiqueta:** «+24.2% vs semana previa», «Top 5% del sector» y «Gasto Total $2,231.21» aparecen sin «Datos de ejemplo», a diferencia de `/anuncios`. Choca con la regla de honestidad.
- **`/chat` y `/anuncios` no tienen `h1`.** La guía pide uno por pantalla.
- **`/chat`:** tras enviar un mensaje, la lista y la cabecera siguen diciendo «Sin mensajes aún».
- **Táctiles en móvil:** la tabla de `entregas/B.md` marcaba sus rutas como conformes, pero una medición a 390 px encontró controles bajo 44 px en las 12 (por ejemplo 19 de 22 en `/tareas`). Se corrigió ampliando a `.hubly-main` la regla móvil. Quedan bajo 44 px, medidos en el contenido de cada página: las casillas de tarea en `/tareas` (círculo de 18 px con área pulsable de 44 px por pseudoelemento), la casilla «Ver archivadas» en `/marcas` (13 px, su etiqueta mide 44 de alto) y el nombre «Min» en sus tarjetas (27 de ancho). Las ventanas abiertas de esas rutas no se midieron.
- **Sin efecto visible en `/dashboard/equipo`:** «7 días», «30 días», «90 días» y «Semana» aparecen así en la matriz. Falta revisar a mano si son botones muertos o si solo no hay datos que cambien.
- **`web/scripts/check-ui-baseline.json`:** sus topes siguen altos aunque se redujo deuda. No se ejecutó `--update`, porque el plan lo prohíbe sin autorización.
- **Token de verde legible en oscuro:** falta en la guía; hoy `#059669` en `/anuncios` y `/reportes` da menos de 4.5:1. En `/reportes` se ve claramente tenue.
- **Prueba inestable:** `calendario.spec.ts:77` falló 2 de 5 corridas durante el trabajo de A, por un post duplicado. Desde el bloqueo de escrituras no ha vuelto a fallar, pero la causa no está confirmada.
- **Cola de B descartada:** el botón «Subir» sin selector de archivos en `MediaLibrary.tsx:196` no corresponde al código: esa línea es el botón de inicio y el `input` de archivo sí existe.

## Matriz de rutas

Cubierto en las 21 rutas, en claro y oscuro: carga sin errores de consola y contraste de al menos 3:1 en botones, enlaces, pestañas y títulos visibles, tras hacer scroll. Esto **no** comprueba cada control abierto ni sus estados de hover, foco y carga.

| Ruta | Auditoría automática | Flujos con prueba propia |
|---|---|---|
| `/ajustes`, `/anuncios`, `/automatizaciones`, `/chat`, `/crm`, `/dashboard`, `/ia`, `/marca`, `/marcas`, `/notificaciones`, `/reportes`, `/tareas`, `/calendario` | Pasa | Ninguno nuevo |
| `/dashboard/equipo` y su alias `/equipo` | Pasa | Ninguno nuevo |
| `/dashboard/salud-cuentas` y su alias `/salud` | Pasa | Ninguno nuevo |
| `/estrategia` (alias de `/marca`) | Pasa | Ninguno nuevo |
| `/archivos` | Pasa | Subida, descarga, búsqueda, borrado, rechazo y reintento |
| `/proyectos` | Pasa | Ninguno nuevo |
| `/parrillas` | Pasa | Cuatro vistas, filtros, tabla, Kanban, feed, parrilla, importación CSV, tabla pegada y XLSX |
| Editor (en todas las rutas) | No aplica | Sidebar, marca fija, capas y Escape, recuperación, cambio de post, medios, copy por red, diez redes |

## Pendiente del plan

- **Matriz por control:** la genera `npm run audit:controles` en [MATRIZ-CONTROLES.md](MATRIZ-CONTROLES.md). Cubre lo visible al cargar cada ruta y si pulsar produce un cambio; no cubre ventanas abiertas, y la persistencia solo se prueba en los flujos de `e2e/`.
- **Criterio de listas:** Proyectos ya tiene filtro, conteo, edición, fijar, archivar y eliminar. Marcas y Tareas ya tenían búsqueda y vistas. Salud de Cuentas no se revisó con este criterio.
- **Revalidación en Henry en vivo:** `capture_browser_scenario` ya funciona. Observado el 31 de octubre: «Columnas por» ofrece Estatus, Formato, Responsable y Publicación (`ev_94a53490a97b38c5d84e64403c68ffeb728d971277fd38654c312f459370d664`), y las pantallas de Kanban, Proyectos y Marcas (`ev_f3bbcb90cca23ab371886d350d20b92e6f8363809f5608dc76a91a3fda5ac761`, `ev_e3be0c7219ebb3e057c482009f67c50bbe4996b3d6bece1890fe0b04fcab6a94`, `ev_a961606cd273cce5a5c2f97edd2cabc03027609a3de7ba9afba83227405320e2`). Sigue sin observarse la opción «Pilar», los límites de 20 y 100 MB (vienen del bundle) y los pasos actuales del importador. El importador de Henry trae publicaciones de cuentas conectadas, así que el de Hubly (tablas) es deliberadamente distinto.
- **Comparación visual sistemática** de las ocho escenas: se revisaron capturas de compositor, sidebar, móvil, tabla, Kanban y semana; no todas las combinaciones de escritorio/móvil y claro/oscuro.
- **Pantallas con datos de ejemplo** que siguen fuera de este alcance, como `/anuncios` y las pestañas de reportes y enlaces en modo demo.

## Sin verificar contra Supabase real

Las políticas y funciones SQL se probaron en PGlite con un esquema `storage` mínimo. Nunca se ejecutaron en un proyecto real:

- La subida por URL firmada, incluido el encabezado `x-upsert`.
- La descarga firmada y el acceso del portal por el encabezado `x-hubly-share-token`.
- El límite efectivo del bucket, que depende del plan. Si es menor a 100 MB, Storage rechazará esos videos.

**Antes de usarlo:** ejecutar `supabase/migrations/0004_archivos_y_medios.sql` y probar una subida y un enlace de cliente.

## Diferencias intencionales con Henry

- Arrastrar a «Publicado» no publica: se registra manualmente con fecha y enlace.
- Una fecha pasada se muestra como «Pendiente de registrar», porque no hay cron de publicación.
- Los ajustes por red se guardan como referencia; todavía no se envían a ninguna red.
- Un video HEVC muestra un aviso, sin transcodificación.
- La semana calcula título y columnas del mismo intervalo.

## Estabilidad de las pruebas de navegador

Las últimas dos corridas completas dieron 58 de 58, sin cambios de código entre ellas. Una corrida anterior, justo después de editar `ia/page.tsx` con el servidor de desarrollo encendido, dio 56 aprobadas y no se registró cuáles fallaron. Puede ser una recompilación durante la prueba, pero no está confirmado.

## Traspaso de la sesión del 31 de octubre (tarde): dónde quedó el trabajo

Objetivo de la sesión: continuar el diseño UX/UI en `paridad-henry`, en diez puntos. **No está terminado.** Avance:

| # | Punto | Estado |
|---|---|---|
| 0 | Revisar `git status`, sesiones y docs | Hecho. Ajustes ya estaba commiteado (`4d25385`) y ninguna sesión de Hubly seguía activa. |
| 1 | Salud de Cuentas | **Hecho y commiteado** (`ce50097`). |
| — | Revisar Ajustes | Visto en 1440 claro/oscuro y 390: sin defectos claros que corregir. |
| 2 | Clasificar controles dudosos | Parcial, ver abajo. |
| 3 | Auditoría de ventanas abiertas | Script reescrito. La matriz **no** se actualizó: falta una corrida limpia. |
| 4 | Estados de interacción | Script nuevo `audit:estados` escrito, **sin ejecutar**. |
| 5 | Comparación visual con Henry (8 escenas) | **Sin ejecutar.** El script de capturas se perdió (estaba en el scratchpad de la sesión). |
| 6 | Móvil, 21 rutas a 390 px | Sin empezar (solo Salud de Cuentas y Ajustes revisados). |
| 7 | `/anuncios` e `/ia` | Propuesta lista, **sin aplicar**. |
| 8 | Limpieza de `web/.data/media` y prueba de Excel | Sin empezar. |
| 9 | Verificación completa y matriz final | Sin empezar. Las cinco verificaciones no se corrieron al final; solo `salud-cuentas.spec.ts` y `tsc` se corrieron tras el punto 1. |

### 1. Salud de Cuentas (hecho)

`web/components/app/dashboard/SaludCuentasView.tsx` se rehízo con la plantilla A (agenda): un `h1` «Salud de cuentas» con subtítulo y salud promedio; una sola barra con periodo, búsqueda y orden; filtros con contador; sugerencias y cuentas como filas dentro de un contenedor, sin tarjetas de métricas ni colores fijos; editor de compromisos en línea con los mismos `data-testid`. Estilos `hubly-salud-*` al final de `web/app/(app)/dashboard-polish.css`, solo con tokens. Pruebas nuevas en `web/e2e/salud-cuentas.spec.ts` (3 pasan). Se vio en 1440 claro, 1440 oscuro y 390; en móvil se corrigió un desbordamiento de los botones de acción **sin volver a capturar**.

Decisiones tomadas, por si quieres revertirlas:
- Se quitó el periodo **«Custom»**: no permitía elegir fechas y su etiqueta decía «acumulado trimestral». Sigue en el tipo `CommitmentPeriod`.
- Las sugerencias muestran 4 y «Ver N más».
- Se quitaron las tarjetas KPI de colores y el chip de sugerencia dentro de cada cuenta (duplicaba la lista).
- Nuevo botón «Activar» por cuenta (antes solo se podía hacer pulsando el avatar).

Comparación con Henry (observado en vivo con REA, solo navegación): su pantalla tiene pestañas Inicio/Cuentas/Equipo, periodos 7 días/30 días/Esta semana/Este mes/Custom, búsqueda «Buscar marca…», Filtros, Archivar, un aviso «Declara qué medir en tus marcas» con «Empezar», y un modal «Sugerencias automáticas» por marca con metas editables. Evidencia: `ev_cda51080805f6c1f9ad1b5de96d929ea17396933a81b1de3aee448ccbfedf005` (navegación), `ev_16e4b3c2b5963ff05133e3d364c6f682dd22cffb531bd6b6d014198f3a572a0a` (modal abierto), `ev_09352ae4674bfab126ba748e6ecf6dd0a9170a09513f1e3da4f2eac828d3c278` (pantalla sin modal). La cuenta de Henry solo tenía una marca sin compromisos, así que no se vio su lista de cuentas con datos. No se copió código.

### 2. Controles dudosos

- **«Archivar» en `/marcas`:** correcto. El timeout de la auditoría era por estado contaminado: la tienda demo vive en `localStorage` y un clic anterior («Por usuario») ocultaba el botón. Un clic suelto funciona.
- **«Enviar mensaje a Hubi» en `/ia`:** mismo diagnóstico, funciona. Pendiente: ponerle `disabled` cuando el campo está vacío, para que el estado sea real.
- **`Crear regla`, `Crear actividad`, `Guardar` en Nuevo prospecto:** correctos, formularios con campos obligatorios vacíos.
- **«Exportar PDF», «Nuevo», «Reporte Ejecutivo Imprimible» en `/reportes`:** correctos (llaman a `window.print()` o muestran una hoja que ya estaba abierta). Hay que confirmarlo con la nueva auditoría.
- **Pestañas ya seleccionadas** (Cards, Lista, Pipeline, Filas, Este mes, Todas…): correctas, no cambian nada.
- **«Subir» en `/archivos`:** correcto, abre el selector del sistema.
- **KPIs de `/anuncios`** (Gasto Total, Visitas al perfil, Costo por visita, CTR): **botón muerto**, son `span role="button"` sin acción. Quitar el `role`.
- **«Cerrar menú de perfil» en el sidebar:** defecto real, el botón de colapsar lo tapaba. **Corregido**: el popover pasó de 276 a 236 px en `web/app/(app)/layout.tsx`. Falta verificarlo con la auditoría.
- **«Mi vista» y «Todo el equipo» en `/dashboard/equipo`:** sin `aria-pressed`. **Corregido** en `EquipoView.tsx`.
- **«Mover … hacia arriba» en Configurar widgets del Dashboard:** timeout; sin diagnosticar (¿deshabilitado o tapado?).

### 3. Auditoría de ventanas abiertas

`web/e2e/auditoria-controles.mjs` se reescribió. Ahora, además de la página: recorre el sidebar y el botón de Hubi, y por cada menú, modal o panel que abre un control, recorre los controles de dentro (una ronda). Detecta qué cambió (URL, ventana, estado, tema, selector de archivos, impresión, portapapeles, intento de guardar) y distingue «ya activo». El editor (compositor) se abre pero no se recorre: lo cubre `compositor.spec.ts`. La salida lleva una columna «Ventana». Una corrida completa tarda unos 13 min con 4 en paralelo.

La primera corrida dio 718 controles (315 en páginas, 403 en ventanas), pero **no sirve como matriz** y por eso no se commiteó: (a) el estado de `localStorage` contaminaba a los controles siguientes, (b) «mueve el foco» contaba como respuesta y ocultaba botones muertos. Ambos ya se corrigieron en el script (limpia el almacenamiento antes de cada control y quita la señal de foco), pero **no se volvió a correr**. Hallazgos de esa corrida que sí parecen reales: los de la lista del punto 2 y que las ventanas de las tarjetas de bienvenida del Dashboard («TU PRIMER POST», etc.) no se reabren al repetir el recorrido (puede ser del script).

**Siguiente paso:** `npm run audit:controles` desde `web/` con `localhost:3000` encendido; revisar los «sin efecto visible», «no se pudo pulsar» y «no reproducible», corregir lo que sea botón muerto y volver a correr. `docs/MATRIZ-CONTROLES.md` sigue siendo la versión vieja (221 controles, sin ventanas); se sobrescribe al correr la auditoría.

### 4. Estados de interacción

`web/e2e/auditoria-estados.mjs` (`npm run audit:estados`) recorre cada ruta con Tab en claro y oscuro y avisa de controles sin indicador de foco. No se ha ejecutado. Hover, deshabilitado, carga y error siguen sin revisar de forma sistemática.

`npm run check:ui` **ya fallaba antes de esta sesión**, desde el rediseño de Ajustes (`4d25385`): `dashboard-polish.css` tiene tamaños de texto fuera de escala (17 hallazgos, permitidos 15) y un radio de más (7 contra 6) en las reglas `hubly-personas-*` y vecinas, y `BuyerPersonas.tsx` y `ProjectEditModal.tsx` importan `lucide-react`. Mis cambios no añaden hallazgos. Hay que corregirlo antes de entregar; no se ejecutó `--update`.

### 5. Comparación visual con Henry

Las ocho escenas de `docs/referencias/henry-2026-10-31/` son: 01 compositor cargando un archivo con Facebook seleccionado, 02 selector Content Manager, 03 formatos y vista previa, 04 calendario Kanban, 05 calendario Tabla, 06 calendario Semana, 07 menú del calendario, 08 compositor con Pinterest. Para capturarlas en Hubly: abrir `/parrillas?tab=calendario` (botón «datos de ejemplo»), cambiar de vista con `getByRole("tab")`, abrir el editor con `window.__hubly.getState().openComposer()` (como `compositor.spec.ts`) y bloquear las escrituras a `/api/`. Falta capturar escritorio y móvil, claro y oscuro, sidebar abierto y retraído, y movimiento reducido, y mirar las imágenes.

### 7. `/anuncios` e `/ia` (propuesta, sin aplicar)

Hoy ambas parecen funciones terminadas:
- `/anuncios` muestra «Gasto Total $2,231.21», «Visitas al perfil 268», «CTR 5.40%», anuncios con gasto y «Click Score» y un «Diagnóstico Creativo Hubi». Son cifras fijas del código (`SAMPLE_ADS`), de otra marca y sin una etiqueta clara.
- `/ia` responde con un texto fijo de «piezas minerales» para cualquier marca, y «Programar en parrilla» **crea un post real** con ese texto.

Propuesta:
1. `/anuncios`: aviso arriba (`role="note"`): «Datos de ejemplo. Aún no hay una cuenta publicitaria conectada: estas cifras y anuncios no son de tu marca.» Una etiqueta «Ejemplo» en cada KPI y anuncio. El modal pasa a «Ejemplo de diagnóstico» con la nota «Hubi todavía no analiza anuncios». «Analizar» pasa a «Ver ejemplo». Quitar el `role="button"` de los KPIs.
2. `/ia`: aviso permanente «Hubi todavía no responde con IA. Las respuestas son ejemplos de formato». Las respuestas se titulan «Ejemplo de formato» y usan solo datos reales de la marca (nombre, personas, pilares), sin gancho ni copy inventado. Quitar «Programar en parrilla». Las tarjetas «Conectar las redes», «Traer mis diseños», «Invitar a mi equipo» y «¿Qué hay pendiente?» pasan a ser enlaces reales (`/parrillas`, `/archivos`, `/ajustes?tab=equipo`, `/tareas`) en lugar de respuestas falsas. Enviar deshabilitado con el campo vacío. Verificar los ids de `?tab=` de `/parrillas` antes de enlazar.

No hay métricas ni mensajes de éxito inventados en la propuesta. Con backend (`backendEnabled`) ambas ya muestran `LiveUnavailable`.

### 8. Limpieza y prueba de Excel

Sin empezar. En `web/.data/media/` están `a.png`, `b.png`, `06-calendario-semana.png` y `prueba-*.png` (ids vistos en `/archivos`: `36805afd…`, `84f2543b…`, `511aeb92…`, `8c414a1f…`); **no** se debe borrar `WhatsApp Image 2026-10-27 at 09.57.42.jpeg`. Se borran desde `/archivos` o editando `.data/media/index.json`. Falta hacer que `archivos.spec.ts` limpie lo que sube y buscar por qué la prueba de Excel de `calendario.spec.ts` falló una vez (hipótesis sin confirmar: recompilación del servidor de desarrollo durante la corrida).

## Cosas que conviene saber

- **Las pruebas de Playwright escriben en los datos demo.** El espacio de demo se guarda en el servidor (`.data/workspaces/workspace-default.json`) mediante `POST /api/workspace`. Mis primeras corridas de `salud-cuentas.spec.ts` descartaron una sugerencia y cambiaron las publicaciones de Clínica Norte (14/6 → 10/10) en los datos reales. **Se restauraron a mano** (publicaciones 14/6 y sugerencias descartadas vacías, en `workspace-default.json` y `hubly-db.json`). La prueba ahora bloquea los `POST` a `/api/workspace` y deja el archivo intacto. Las demás pruebas (`compositor`, `calendario`, `listas`) no se revisaron con este criterio.
- **`npx playwright test` borra `web/e2e/.salida/`** (es su `outputDir`). No guardes ahí capturas ni scripts propios.
- `web/.data/` está ignorado por Git: los datos demo no viajan con el repositorio. En casa se parte de la semilla.
- REA: `capture_browser_scenario` pide `browser: {mode:"connect", cdp_endpoint, target_id}`, `start_url: {url}` y `actions` con `action` y `step_id` (por ejemplo `wait_for_timeout` con `duration_ms`, `click` con `locator: {kind:"role", role, name}`). Con `capture: {at_end:["screenshot","accessibility"]}` el resultado trae la imagen en base64 y es muy largo. Puertos CDP 9224 a 9227; `list_browser_targets` pide `cdp_endpoint`.
- En Git Bash, una ruta que empieza con `/` (como `/dashboard`) pasada como argumento se convierte en ruta de Windows. Usa PowerShell para esos comandos.

## Para seguir en casa

1. `git fetch && git checkout paridad-henry && git pull`, luego `cd web && npm install && npm run dev`.
2. Aplicar la propuesta del punto 7 (`web/app/(app)/ia/page.tsx`, `web/app/(app)/anuncios/page.tsx`).
3. Correr `npm run audit:controles`, corregir botones muertos y volver a correrla; commitear la matriz.
4. Correr `npm run audit:estados` y corregir `check:ui` (punto 4).
5. Capturar las ocho escenas y las 21 rutas a 390 px, mirar las imágenes y corregir.
6. Limpiar `.data/media` y arreglar la prueba de Excel.
7. `npx tsc --noEmit`, `npm run build`, `npm test`, `npm run test:db`, `npx playwright test`, y actualizar este documento.

Decisiones que necesito: (a) si aceptas quitar «Custom» del periodo; (b) si en `/ia` prefieres enlaces reales o respuestas de ejemplo en las cuatro tarjetas de acción; (c) si `/anuncios` debe ocultarse por completo mientras no haya cuentas conectadas, en lugar de mostrar datos de ejemplo.

## Traspaso: rediseño del buscador global (trabajo de otra sesión)

Esta parte **no la hice yo**. Según el usuario, la hizo GPT 6 en otra sesión; el repositorio no registra quién fue. Yo solo la leí, corrí `tsc` y su script de verificación, y la subí tal como estaba, **sin terminar y sin revisar a fondo**. Archivos: `web/components/app/CommandPaletteModal.tsx` (reescrito, +232 −411 con el CSS), reglas `hubly-command-*` al final de `web/app/(app)/dashboard-polish.css` y `web/e2e/verificar-buscador.cjs` (copia del script de verificación que dejó en `output/`, con la ruta de `@playwright/test` corregida).

### Qué cambió en el buscador (⌘/Ctrl K, botón «Buscar» del sidebar)

- El diálogo tiene ahora la forma de las recetas de la guía: `hubly-overlay` + `hubly-sheet`, `useLayer` (Escape y devolución del foco a quien lo abrió), `useModalPresence`, ancho máximo de 672 px y alto máximo de 640 px.
- Accesibilidad de combobox: campo con `role="combobox"`, `aria-controls`, `aria-activedescendant`; lista con `role="listbox"`, grupos con `role="group"` y opciones con `role="option"` y `aria-selected`. Anuncia el número de resultados en una región `role="status"`. La etiqueta visible «Buscar en Hubly» da nombre al diálogo.
- Teclado: flechas con vuelta al principio y al final, Enter abre, Tab queda atrapado dentro, y el elemento seleccionado se desplaza a la vista solo cuando la selección viene del teclado (no del ratón).
- Se muestra el atajo según la plataforma (`⌘ K` o `Ctrl K`), y una ayuda fija abajo (Navegar, Abrir, Esc Cerrar). En móvil la ayuda de teclado se oculta y aparece «Toca un resultado para abrirlo».
- Los grupos se renombraron: «Acciones rápidas» → «Acciones», «Navegación» → «Páginas»; los textos pasan a la capitalización de la guía («Crear o programar post», «Crear nueva marca»). Se quitaron las insignias de las acciones y los colores fijos de los iconos (`#E11D48` y otros); los iconos pasan a 17 px.
- Estado vacío: «Sin resultados para «…»» con botón «Limpiar búsqueda».
- El CSS usa tokens (`--ui-*`, `--hb-accent`, `--on-accent`) y trae reglas para móvil (objetivos de 44 px), movimiento reducido y modo oscuro por tokens.

### Dónde se quedó

- `npx tsc --noEmit` pasa.
- `web/e2e/verificar-buscador.cjs` (`node e2e/verificar-buscador.cjs` desde `web/`, con `localhost:3000` encendido) recorre: abrir desde el botón, foco en el campo, 15 flechas con scroll, vacío, Tab a «Limpiar búsqueda», buscar «calendario» + Enter, ⌘/Ctrl K, Escape y devolución del foco, modo oscuro, y 375 px. **Lo corrí hoy a las 13:41: pasa hasta el modo oscuro y el vacío en escritorio, y falla en el paso de móvil**: después de cambiar a 375 px y recargar, `Control+K` no abre el diálogo (no aparece el `combobox`). No sé si es un defecto del componente en móvil o del script (pulsa el atajo antes de que la página termine de cargar). Hay que investigarlo.
- Las capturas que dejó están en `output/` (`search-before*.png`, `search-desktop.png`, `search-dark.png`, `search-empty.png`, `search-debug.png`), que no se sube. Si quieres compararlas, regenéralas con el script.
- No hay prueba de Playwright propia del buscador dentro de `e2e/`; el script es una verificación suelta, no parte de `npx playwright test`.
- `check:ui` no se ejecutó sobre estos cambios.

### Por revisar

1. Corregir o explicar el fallo de móvil del script y, si es del componente, arreglarlo.
2. Pasar el script a una prueba de `e2e/*.spec.ts` y bloquear las escrituras a `/api/`.
3. Mirar el diálogo en 1440 claro, 1440 oscuro y 390 (`npm run check:ui`, foco y hover).
4. Algunos destinos de las acciones apuntan a `/dashboard?tab=cuentas` y `/dashboard?tab=equipo`, mientras que las pantallas reales son `/dashboard/salud-cuentas` y `/dashboard/equipo`. Conviene comprobarlo.
5. Los textos de las acciones y páginas siguen en tono mixto («Ajustes del Workspace», «Libretas Kraft», «ROAS»); la guía pide español de México y vocabulario fijo.


---

## Traspaso de la sesión del 2 de noviembre (tarde): sincronización con `origin/paridad-henry` (`5f25230`) y auditorías

### 1. Qué pasó en esta sesión

- Esta máquina (`T490s`) había quedado en el commit `73bf591` (previo a los 36 commits integrados en `origin/paridad-henry` hasta `5f25230`, donde ya se fusionaron `agente/glm-calidad`, `agente/gemini-flujos`, `agente/opus-diseno` y `agente/integracion`).
- Se sincronizó la rama local `paridad-henry` con `origin/paridad-henry` (`5f25230`) y se limpió `web/.data/media/` dejando únicamente el archivo real (`d165a776-2899-4137-baee-fd957f514082`, `WhatsApp Image 2026-10-27 at 09.57.42.jpeg`).
- Verificación sobre el código sincronizado (`5f25230`):
  - `npm run check:ui`: **Correcto** (`1571 hallazgos`, sin empeorar).
  - `npx tsc --noEmit`: **Sin errores**.
- Nota sobre el servidor local: el proceso Node en `localhost:3000` (PID 23144) quedó con el event loop bloqueado (acepta TCP pero no responde HTTP); siguiendo `AGENTS.md` no se mató el proceso. Al retomar, basta con reiniciar `npm run dev` en `web/`.

### 2. Qué queda pendiente a partir de `5f25230` (para la siguiente sesión)

Combinando la sección **«Pendiente tras la integración»** (líneas 36–47 de este documento) con los hallazgos de las auditorías de foco, escenas y móvil de hoy:

1. **Honestidad en `/reportes` (`web/app/(app)/reportes/page.tsx`):**
   - Muestra cifras fijas («+24.2% vs semana previa», «Top 5% del sector», «Gasto Total $2,231.21») sin cintillo `role="note"` ni etiqueta `Ejemplo`, a diferencia de `/anuncios`.
2. **Encabezado `h1` en `/chat` y `/anuncios`:**
   - Ambas pantallas carecen de un `<h1>` único como pide la guía.
3. **Estado de `/chat` tras enviar mensaje (`web/app/(app)/chat/page.tsx`):**
   - Al enviar un mensaje, la lista lateral y la cabecera siguen mostrando «Sin mensajes aún».
   - En móvil (`390×844`), revisar el reparto de ancho entre la columna de canales y la conversación activa.
4. **Foco visible (`:focus-visible`) y estados interactivos (`audit:estados`):**
   - `BUTTON «Marcar como leída»` en `web/app/(app)/notificaciones/page.tsx:106` usa `all: "unset"` en línea (sin anillo `:focus-visible`).
   - Revisar inputs con `outline: none` en `.hubly-hubi-composer input`, `.hubly-composer-field input` y buscadores en línea (`/parrillas`, `/tareas`, `/marca`, `/reportes`, `/anuncios`, `/chat`) para asegurar reemplazo visible con `var(--hb-accent)`.
5. **Barra inferior móvil `.hubly-mobile-tabbar` en modo oscuro (`web/app/(app)/layout.tsx`):**
   - Comprobar en `390×844` oscuro que ningún estilo en línea (`background: "rgba(255,255,255,0.92)"` o `#fff` en el menú «Más») pise la regla oscura de `dashboard-polish.css`.
6. **Contraste de verde en modo oscuro:**
   - Definir token semántico para sustituir `#059669` en `/anuncios` y `/reportes` (actualmente < 4.5:1 en oscuro).
7. **Controles sin efecto visible en `/dashboard/equipo` (`EquipoView.tsx`):**
   - Verificar si «7 días», «30 días», «90 días» y «Semana» deben filtrar datos o retirarse, y revisar la clase del botón «Reasignar tareas».


---

## Cierre del 3 de noviembre: correcciones finales y batería completa de verificación

### 1. Correcciones aplicadas sobre los pendientes de `5f25230`

1. **Honestidad en `/reportes` (`web/app/(app)/reportes/page.tsx`):**
   - Se añadió el cintillo permanente `role="note"`: *«Datos de ejemplo. Aún no hay cuentas conectadas para calcular métricas reales: estas cifras son una muestra de formato.»*.
   - Se etiquetaron con insignia `Ejemplo` los 4 KPIs (`Gasto Total`, `Visitas al perfil`, `Costo por visita al perfil`, `CTR Promedio`) y `· Ejemplo` en `Click Score Promedio`.
2. **Encabezado `<h1>` único en `/reportes`, `/anuncios` y `/chat`:**
   - `/reportes`: `<h1>Reportes</h1>` en la barra superior y ajuste del encabezado interno de la hoja imprimible a `<h2>`.
   - `/anuncios`: `<h1>Anuncios</h1>` en la barra superior.
   - `/chat`: `<h1>Chat</h1>` en el encabezado de la pantalla.
3. **Estado en `/chat` tras enviar mensaje (`web/app/(app)/chat/page.tsx`):**
   - Se calcula `generalCount` combinando mensajes de tienda y sesión para actualizar en vivo el aviso lateral, el subtítulo de `# General` y el subtítulo de la cabecera al enviar mensajes.
4. **Foco visible (`:focus-visible`) y estados interactivos (`web/app/(app)/dashboard-polish.css`, `web/app/(app)/notificaciones/page.tsx`):**
   - En `/notificaciones`, se sustituyó `all: "unset"` del botón `«Marcar como leída»` por estilos explícitos para preservar el anillo `:focus-visible`.
   - Se añadieron reglas `:focus-visible` con `var(--hb-accent)` para `.hubly-hubi-composer`, `.hubly-composer-field input`, `.hubly-main`, `.hubly-sheet` y `.hubly-mobile-tabbar`, así como la definición de `.hbtn-outline`.
5. **Barra inferior móvil `.hubly-mobile-tabbar` en modo oscuro (`web/app/(app)/layout.tsx`):**
   - Se reemplazó el fondo fijo `rgba(255, 255, 255, 0.96)` en línea por `var(--ui-surface)`.
6. **Contraste de verde en modo oscuro (`web/app/(app)/dashboard-polish.css`, `/anuncios`, `/reportes`):**
   - Se definió el token `--ui-positive-text` (`#047857` en claro, `#34D399` en oscuro) y se aplicó en `/anuncios` y `/reportes`, reduciendo además la deuda de `color-fijo` en `check:ui` de `1571` a `1562`.
7. **Semántica `aria-pressed` / `aria-current` para `audit:controles`:**
   - Se añadieron `aria-pressed` en los filtros de periodo, rango, marcas y filas de ranking de `/dashboard/equipo` (`EquipoView.tsx`), en los conmutadores `Cards`/`Tabla`/`Funnels` de `/anuncios`, en las pestañas de `AutoSuggestionsModal.tsx`, y `aria-current="page"` en `«Inicio de la biblioteca»` (`MediaLibrary.tsx`).
8. **Estabilidad de pruebas E2E (`buscador.spec.ts`, `calendario.spec.ts`):**
   - `buscador.spec.ts`: el saludo matutino en `/dashboard` (`«Buenos días, Jair»`) ahora coincide con `/^Buen(os|as)/`.
   - `calendario.spec.ts`: el botón `Revisar` del importador usa `{ name: "Revisar", exact: true }` para no colisionar en noviembre con el post del calendario de fondo `«3 señales para revisar un lunar con dermatoscopía»` (causa raíz del fallo intermitente en la prueba de Excel).

### 2. Resultados finales de verificación (3 de noviembre de 2026)

| Comando | Resultado |
|---|---|
| `npm run check:ui` | **Correcto.** Deuda heredada reducida de 1571 a **1562 hallazgos** (sin `--update`) |
| `npx tsc --noEmit` | **Sin errores** (0 errores) |
| `npm test` | **43/43 pasan** |
| `npm run test:db` | **69/69 pasan** (PGlite + RLS + migraciones) |
| `npm run audit:estados` | **0 hallazgos** (foco visible en todos los controles recorridos en claro y oscuro) |
| `npx playwright test` | **88/88 pasan** |
| `npm run audit:controles` | **688 controles** (268 en páginas, 420 en ventanas) · **573 responden** · **38 ya activos** · **49 enlaces** · **8 sin efecto visible** · **19 deshabilitados** · **0 con error** · **0 sin poder probar** · **1 omitido** |

---

## Plan anti-slop y arquitectura, Fase 0: guardarraíles (3 de noviembre)

Plan completo: limpiar primero (guardarraíles, fundaciones, monolitos, deuda por pantalla) y construir después el Modo Revisión y los portales `/review` y `/connect`.

- **`web/scripts/check-ui.mjs`:**
  - Ya no cuenta como deuda las líneas que definen un token (`--ui-surface: #FFFFFF;`).
  - Reglas nuevas:
    - `z-index-fijo`: capa de 10 o más escrita como número.
    - `prueba-escrita`: «7 días gratis» a mano. Escanea también `components/AgencyCalculator.tsx`, solo con esta regla.
    - `estado-crudo`: `{x.status}`, `{x.role}` o `{x.kind}` mostrados tal cual.
- **Capas:** escala única `--layer-*` en `dashboard-polish.css`, de `header` 20 a `dialog` 200. La tabla de §5 de la guía dice lo mismo.
- **Base regenerada con `--update`:** la autoriza el plan, porque la deuda real ya había bajado y las reglas nuevas necesitan tope.

  | | Hallazgos |
  |---|---:|
  | Base anterior | 1933 |
  | Real antes del cambio | 1562 |
  | Sin las definiciones de tokens, que no eran deuda | 1411 |
  | Base nueva (1411 + 70 de las reglas nuevas) | **1481** |

  Las reglas nuevas aportan: `z-index-fijo` 45, `estado-crudo` 22, `prueba-escrita` 3.

## Plan anti-slop y arquitectura, Fase 1: fundaciones (3 de noviembre)

Sin cambio visual salvo uno: en `/tareas` el tipo de archivo dice «IMAGEN» y «DOCUMENTO» en lugar de «IMAGE» y «DOC».

- **Diccionario de etiquetas (`web/lib/labels.ts`):**
  - Estado de post en dos vocabularios, ambos en este archivo:
    - `POST_STATUS_LABEL`, corto: el que se guarda en `statusLabel`.
    - `POST_STATUS_CLIENT_LABEL`, el del cliente.
  - `store.ts`, `calendar-views.ts` y `STATUS_META` leen de aquí.
  - Roles: el `ROLE_LABEL` duplicado en `api/workspace/route.ts` e `invitacion/[token]` pasa a `roleLabel()`.
  - Tipo de archivo: `MEDIA_KIND_LABEL`.
  - **Decisión pendiente, sin aplicar:** un mismo estado se nombra distinto según la pantalla. «En aprobación» y «Esperando cliente» dicen lo mismo, y «Planificado» en la tabla equivale a «Programado».
- **Regla `estado-crudo` acotada:** ahora solo marca `{x.kind}` y `{post.status}`. Los demás `status` y `role` ya se guardan en español o los escribe la agencia.
- **Planes:** `PRICING_CONSTANTS.trialDays` (7). `AgencyCalculator` ya no escribe la duración a mano.
- **Marca activa:** `selectActiveBrand` en `domain-selectors.ts` y `useActiveBrand()` sustituyen 11 derivaciones. Todas siguen ahora la regla del sidebar: elegida, luego la primera sin archivar, luego la primera. `/parrillas` y `/reportes` ya no buscan el id de ejemplo `brand-min`.
- **Puerta de publicación (`web/lib/publishing/gateway.ts`):**
  - `SocialPublishingGateway` con `mode`, `reschedule` y `markPublished`, más su implementación `manualGateway`.
  - El calendario, el feed, el mes y el registro de publicación pasan por `publishing`.
  - `schedule` y `cancel` llegan con el conector real: hoy no tendrían a quién servir.
- **`next/dynamic`:** los 7 modales del layout cargan aparte. Se quitaron los envoltorios `as unknown as`.
- **Store en slices (`web/lib/store-slices/`):** `ui`, `sync`, `brands`, `posts`, `crm`, `tasks`, `team` y `workspace`, más `helpers`.
  - El código de las acciones se movió sin reescribirlo.
  - `useHublyStore`, el estado inicial y la protección de lector siguen en `store.ts` (de 2080 a 317 líneas).

### Verificación

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Correcto, **1456** hallazgos (antes 1481) |
| `npx tsc --noEmit` | 0 errores |
| `npm test` | 43/43 |
| `npm run test:db` | 69/69 |
| `npx playwright test` | **86/88** |
| Navegador | `/dashboard` y el buscador (⌘K) abren, sin errores de la app en consola |

Las 2 que fallan son `salud-cuentas.spec.ts:14` y `:51`, y no vienen de esta fase:

- **Por qué fallan:** la prueba lee el espacio de demo guardado en `web/.data/workspaces/workspace-default.json`, no la semilla. Ese archivo tiene 6 tareas vencidas (del 29 de octubre al 1 de noviembre) y da 3 cuentas en riesgo y 8 sugerencias.
- **Comprobación:** con la semilla limpia, calculado con los mismos selectores para hoy, el 2 y el 1 de noviembre, salen 1 cuenta en riesgo y 7 sugerencias, lo que espera la prueba.
- **Arreglo pendiente:** que la prueba sirva la semilla en su `GET` en lugar de depender de los datos guardados.

## Plan anti-slop y arquitectura, Fase 2 (primer corte): armazón (3 de noviembre)

`app/(app)/layout.tsx` baja de 1968 a 1119 líneas. Seis piezas pasan a `web/components/app/shell/`: `MobileTopbar`, `MobileTabbar`, `NotificationsPopover`, `BrandMenu`, `ProfilePopover` y `ShellModals`.

- **Cómo se movió:** el JSX se copió tal cual. Cada componente lee del store lo suyo y recibe por props solo el estado propio del armazón: cajón abierto, `withQuery`, `isNavActive` y cerrar.
- **Perfil:** el borrador y su guardado viven ahora en `ProfilePopover`.
- **Sin cambio:** el sidebar sigue en el layout, porque su animación recorre sus hijos directos.

### Capas a tokens

| Pieza | Antes | Ahora |
|---|---:|---|
| Barra superior móvil | 45 | `--layer-fab` (45) |
| Barra inferior móvil | 46 | `--layer-fab` (45) |
| Cajón móvil | 59 | `--layer-drawer` (50) |
| Velo del cajón | 58 | `--layer-drawer` (50), va antes en el DOM |
| Menús del sidebar | 65 y 70 | `--layer-dropdown` (40), dentro de la capa del sidebar |

Verificado en el navegador: el cajón queda sobre la barra inferior y el velo.

### Colores a tokens

Se ven distinto:

- **Modo oscuro:** el ítem activo del menú de marcas y del de espacios de trabajo usa `--ui-sky-soft`. Antes era `#F1F9FD`, un recuadro casi blanco sobre el fondo oscuro.
- **Marca Min:** su cuadro muestra su propio color (`#5B67CA`). Antes un caso especial con el id `brand-min` la pintaba de marino.
- **Contadores e iniciales:** suben de 8.5–9.5 px a 10 px, el mínimo de la escala.
- **Botón de guardar perfil:** dice «Perfil actualizado», sin exclamación.

Se ven igual: sombras y velo con los valores de la guía (`.hubly-shell-pop`, `.hubly-shell-scrim`) y texto sobre marino con `--on-accent`. El círculo de Hubi en la barra inferior conserva `#F1F9FD` con `ui-ok`: Hubi va siempre sobre celeste pálido.

### Verificación

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Correcto, **1422** hallazgos (antes 1456); el layout y `shell/` sin hallazgos |
| `npx tsc --noEmit` | 0 errores |
| `npm test` | 43/43 |
| `npx playwright test` | 86/88; fallan las 2 de Salud de cuentas ya documentadas |
| Navegador | Notificaciones, menú de marcas y perfil en escritorio; barra superior, barra inferior y cajón a 375 px; menú de marcas en oscuro |

Consola sin errores nuevos. Hay dos errores viejos:

- `MobileTopbar is not defined`: salió durante la recarga en caliente, mientras el layout estaba a medio editar.
- El aviso de `<script>`: viene del script de tema de `app/layout.tsx` y ya existía antes de esta fase.

### Pendiente de la Fase 2

- **`EquipoView`:** sacar el catálogo de logros, decidir qué hacer con `DemoInviteTeamModal` y cambiar los 41 emojis por iconos duotono.
- **`InicioView`:** un archivo por widget.
- **`/parrillas`:** separar la tabla y el diálogo de compartir.
- **Sidebar:** pasar sus estilos en línea a clases.

## Plan anti-slop y arquitectura, Fase 2 (segundo corte): `EquipoView` (3 de noviembre)

`components/app/dashboard/EquipoView.tsx` baja de 3192 a 2495 líneas.

- **Modal de invitar duplicado, borrado:** eran unas 575 líneas (`InviteTeamModal`, `DemoInviteTeamModal` y `ROLE_OPTIONS`). Era código muerto: se exportaba, pero nadie lo importaba. El botón «Invitar» de la pantalla abre el modal real (`components/app/InviteTeamModal.tsx`) a través del store. No había nada que fusionar.
- **Datos a `lib/team-gamification.ts`:** el catálogo de 39 logros, los niveles de XP y las categorías de esfuerzo.
  - El catálogo se va sin el campo `emoji`, que no se pintaba en ninguna parte.
  - Los títulos pasan a mayúscula inicial: «Semana completa», «Club de los mil». Se conservan CRM, Hubly y Ads.
- **Colores:**
  - Los niveles dejan los puntos verde, rosa y menta. Ahora son un solo marino con intensidad creciente, de 0.25 a 1: así el color dice «más alto».
  - Las categorías de esfuerzo pasan de fondos lavanda, rosa, azul y menta a `--ui-surface-2` con borde, y sus puntos van en `--hb-accent-text`.
- **Ranking:** el número de puesto sustituye a las medallas 🥇🥈🥉. Los tres primeros van en acento.
- **Menús de filtros y de editar marcas:** su capa pasa a `--layer-dropdown` y la sombra a la clase de la guía. `.hubly-shell-pop` se renombra a `.hubly-pop`, porque ya sirve a cualquier menú emergente.
- **Otros arreglos:**
  - El aviso dice «Enlace copiado», sin exclamación, y su check usa `--ui-positive-text`.
  - La barra de actividad de hoy pasa de degradado a `--hb-accent` liso.
- **Pendiente en `EquipoView`:** unos 50 colores fijos (entre ellos, la paleta de `AchievementBadgeSvg`), 6 rgb y 3 tamaños de texto.

### Verificación

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Correcto, **1338** hallazgos (antes 1422); `EquipoView` sin emojis, capas, degradados ni exclamaciones |
| `npx tsc --noEmit` | 0 errores |
| `npm test` | 43/43 |
| `npx playwright test` | 86/88; fallan las 2 de Salud de cuentas ya documentadas |
| Navegador, `/dashboard/equipo` | Sin emojis en la página. Logros con los títulos nuevos, ranking con números, categorías neutras y niveles en marino de 0.25 a 1 |

## Plan anti-slop y arquitectura, Fase 2 (tercer corte): `InicioView` (3 de noviembre)

`components/app/dashboard/InicioView.tsx` baja de 1785 a unas 430 líneas. Es pantalla de referencia, así que su forma no cambió. Se comparó con `docs/guia-ui/dashboard-1440.png` y `dashboard-oscuro-1440.png`, y se revisó a 375 px sin desborde.

- **Un archivo por widget en `components/app/dashboard/widgets/`:** `TareasWidget`, `LibretasWidget`, `HoyWidget`, `NotificacionesWidget`, `AprobacionesWidget`, `GraficaAdsWidget`, `AdsActivosWidget` y `ProyectosCriticosWidget`.
  - El JSX se movió tal cual.
  - Cada widget lee del store con selectores.
  - Solo bajan como props el filtro «solo esta marca» y los cálculos que dependen de él (`tasksBreakdown` y `todayAndApprovals`), porque los comparten Tareas, Hoy y Aprobaciones.
- **Suscripción al store:** el padre deja `useHublyStore()` completo y pasa a un selector por campo. Ya no se vuelve a renderizar con cualquier cambio del store.
- **Libretas:** «+ Nota» crea la libreta y abre el lector global con `useCreateNotebook`, igual que `/tareas`. Decidido con el usuario. Se borró el modal propio de crear libreta (unas 180 líneas, con color fijo y título forzado a mayúsculas).
- **Escape:** se quitó el manejador global que cerraba a la vez el editor, el buscador y el resto de ventanas. Cada ventana ya lo maneja con su propia capa, y este se saltaba la pila de capas del editor.
- **Código muerto:** se borró el estado y el envío del formulario de invitación, que no se pintaba.
- **Colores (los 8 widgets quedan sin hallazgos):**
  - El formato del post («Story») y el click score dejan el verde y pasan a pastilla neutra. El verde solo marca estado; era un defecto listado en la guía §2.
  - «Aprobar» y «Guardar tarea» pasan a acento (`--hb-accent` / `--on-accent`).
  - La tarea completada conserva el verde (`--ui-positive-text`), porque ahí sí es estado.
  - «Atrasada» usa `STATUS_META.changes.color`, la referencia de error de la guía.
  - Los celestes fijos pasan a `--ui-sky-soft` y `--ui-sky-border`. La tarjeta de notificación queda algo más celeste en claro, y en oscuro deja de ser un recuadro casi blanco.
  - La CTR media va en `--ui-text`.
  - El botón dice «Copiado», sin exclamación.

### Verificación

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Correcto, **1294** hallazgos (antes 1338) |
| `npx tsc --noEmit` | 0 errores |
| `npm test` | 43/43 |
| `npx playwright test` | 86/88; fallan las 2 de Salud de cuentas ya documentadas |

**Sin comprobar:**

- No se pulsó «+ Nota» en el navegador, para no crear una libreta en los datos de demo del usuario. Usa el mismo `useCreateNotebook` que `/tareas`.
- Los estilos en línea de los widgets siguen ahí: la guía §2 los lista como deuda, pero pasarlos a clases es otro corte.
