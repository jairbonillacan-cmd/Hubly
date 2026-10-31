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

- **Matriz por control** de las 21 rutas (resultado, persistencia, permisos). Solo existe la matriz por ruta de arriba.
- **Criterio de listas** en tareas, proyectos, recursos y cuentas: esas pantallas no se rediseñaron.
- **Revalidación en Henry en vivo:** `capture_browser_scenario` de REA falla con `execution_failure`. Se tomaron de la especificación: 5 agrupaciones de Kanban, límites de 20 y 100 MB y pasos del importador. El importador de Henry trae publicaciones de cuentas conectadas, así que el de Hubly (tablas) es deliberadamente distinto.
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
