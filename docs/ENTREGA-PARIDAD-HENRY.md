# Entrega de paridad con Henry: 31 de octubre de 2026

Rama `paridad-henry`. Nada se ha fusionado ni publicado.

## Pruebas de esta entrega

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores |
| `npm run build` | Compila |
| `npm test` | 33 pasan |
| `npm run test:db` | 69 pasan (PGlite con las migraciones reales y un `storage` mínimo) |
| `npx playwright test` | 58 pasan, en modo demo contra el servidor de desarrollo |

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
