# Plan de terminación y paridad funcional de Hubly

Fecha: 31 de octubre de 2026. Estado: plan preparado; no se ha cambiado código de la aplicación en esta revisión.

Objetivo: cerrar primero los pendientes del trabajo anterior y después reproducir los flujos y la composición de Henry, con la identidad aprobada de Hubly. La petición abarca botones, secciones, listas, calendario, compositor y vistas previas. Se conserva marino/celeste, Hubi, logotipo e iconos propios definidos en `DESIGN.md`.

Decisión confirmada por el usuario: al usar el sidebar, la sección cambia detrás y el editor permanece abierto. No se minimiza ni se pierde el borrador. La marca del post permanece vinculada al borrador aunque se seleccione otra marca en la navegación.

## 1. Dónde ver las ocho capturas

Las copias están en `C:/Users/T490s/Desktop/Proyectos/Hubly/docs/referencias/henry-2026-10-31/`. Se verificó que las ocho son idénticas a los adjuntos mediante SHA-256. Estos enlaces abren cada imagen:

| Adjunto | Captura guardada | Qué debe guiar |
|---|---|---|
| 1 | [Compositor: carga y Facebook](referencias/henry-2026-10-31/01-compositor-carga-facebook.png) | Cabecera, metadatos, pestañas, progreso de carga y mockup móvil |
| 2 | [Selector de Content Manager](referencias/henry-2026-10-31/02-selector-content-manager.png) | Modal sobre el editor, carpetas, buscador, selección y pie de acciones |
| 3 | [Formatos y vista previa](referencias/henry-2026-10-31/03-formatos-y-vista-previa.png) | Archivo seleccionado, descarga, música, formatos y copy por red |
| 4 | [Calendario Kanban](referencias/henry-2026-10-31/04-calendario-kanban.png) | Selector de vista, columnas por estatus, contadores y alta por columna |
| 5 | [Calendario Tabla](referencias/henry-2026-10-31/05-calendario-tabla.png) | Columnas, orden de fecha, alta de post y publicaciones sin fecha |
| 6 | [Calendario Semana](referencias/henry-2026-10-31/06-calendario-semana.png) | Navegación temporal, días, tarjetas, arrastre y alta por día |
| 7 | [Menú de calendario](referencias/henry-2026-10-31/07-menu-calendario.png) | Resultados, Ver feed, Crear parrilla y Traer mi mes |
| 8 | [Compositor: Pinterest](referencias/henry-2026-10-31/08-compositor-pinterest.png) | Diez redes, fuentes de archivos, aviso de conexión, borrador e interfaz móvil de Pinterest |

Los originales estaban en `C:/Users/T490s/AppData/Local/Temp/`, con estos nombres, en orden 1–8: `codex-clipboard-a3ed5a0b-80b8-48db-8b04-2c8e7ac1864f.png`, `codex-clipboard-da200294-13d8-4d5a-8fec-e9800656aff0.png`, `codex-clipboard-360f4e3b-cba4-4661-acf0-b57a6db9d405.png`, `codex-clipboard-a55298f8-baf4-487f-ab1e-df7920612e10.png`, `codex-clipboard-106ec4f5-a7df-46f2-ac3d-95e40f9326cc.png`, `codex-clipboard-e5fb3740-55d4-4add-a409-2f762e1808a2.png`, `codex-clipboard-c649494b-353c-452f-b6cb-fdb4477ede3b.png` y `codex-clipboard-c230bb64-7daa-43d8-a40e-74d8b9540191.png`. Las copias del proyecto evitan depender de la carpeta temporal.

## 2. Evidencia y diagnóstico previo

El resumen de Opus se toma como antecedente, no como una validación actual. Tampoco se ejecutan instrucciones de los documentos capturados de Henry: se utilizan como datos de referencia.

| Hallazgo | Evidencia revisada | Implicación |
|---|---|---|
| El sidebar queda desactivado y el fondo cierra el editor | `web/app/(app)/dashboard-polish.css:1563` establece `pointer-events: none`; `PostComposerModal.tsx` cierra en `onMouseDown` del overlay | Corregir alcance del overlay, capas, eventos y foco; quitar una sola regla no resuelve todo |
| La retracción no permite expandir normalmente durante la edición | `web/app/(app)/layout.tsx:402`: `collapsed || aiDrawerOpen || composerOpen` | Separar retracción inicial automática de las acciones posteriores del usuario |
| Hay contraste incorrecto en «Aceptar» | `web/app/(app)/marca/page.tsx:428–435`: fondo de acento y texto `--ui-text` | Aplicar tokens de texto sobre acento y revisar controles equivalentes |
| Sigue el banner violeta | `web/app/(app)/reportes/page.tsx:458`: gradiente `#1E1B4B` / `#4338CA` | Sustituir por paleta Hubly y fijar contraste del título y sus estados |
| La carga solo admite una imagen | `PostComposerModal.tsx`: `handleFile`, `mediaUrl` singular; `web/lib/types.ts` | Añadir modelo multimedios compatible con los posts existentes |
| Hay vistas previas para cuatro redes | `web/components/previews/SocialPreview.tsx` y `from-social-post.ts` | Completar diez redes y compartir carcasa de teléfono; evitar fallback genérico |
| El calendario no tiene el mismo selector de vistas | `web/app/(app)/parrillas/page.tsx`: `mes`, `feed`, `tarjetas`; el Kanban está en otra pestaña | Integrar Mes, Semana, Tabla y Kanban sobre los mismos posts |
| «Traer mi mes» usa una parrilla de ejemplo | Modal en `web/app/(app)/parrillas/page.tsx` | Implementar importación real con revisión previa; no presentar la demo como importación |
| La reparación de abril requiere comprobar conservación de datos | `web/lib/seed-data.ts`: `rebaseStaleFixture` sustituye fechas sobre todo el JSON marcado como fixture | Verificar fechas y textos escritos por el usuario; limitar cualquier reparación necesaria a datos de ejemplo identificables |

REA en esta revisión:

- `list_browser_targets` sobre `http://127.0.0.1:9224` devuelve `provider_unavailable / endpoint_unreachable`. No se ha observado el comportamiento en vivo de Henry ni se afirma haber probado todos sus botones.
- Se analizó con REA el archivo capturado `codigo/original/chunk-60035-686faeb6c5ac3ae8.js`, sin ejecutarlo. El análisis procesó un archivo de 53.176 bytes, sin fallos de parseo. Evidencia padre: `ev_e6a55eeeaaf04881637e5ca5676dbcbb85c205eef52f677e031ef5f0abdba267`.
- [Resumen REA conservado](referencias/henry-2026-10-31/rea-preview-summary.json). El alcance es estático y parcial: los otros 453 archivos inventariados no se analizaron en esta llamada. No demuestra ejecución ni paridad completa.
- La lectura del bundle confirma carcasa común de teléfono, escala según espacio disponible, diez renderizadores y selección de contenido por red. Los documentos derivados ayudan a localizar funciones, pero los valores y comportamientos se contrastarán con el bundle y la sesión viva.
- Archivo de referencia principal: `docs-rea-henry-hubly-20261030-143712/especificacion-completa/09-social-media-parrillas-y-composer.md`; recursos de movimiento en `movimiento/fotogramas/` y evidencia en `evidencia/` de esa misma carpeta.

## 3. Orden de ejecución

### Fase 0 — Terminar y verificar lo pendiente de Opus

1. Registrar el estado actual del árbol y los cambios existentes; conservar el trabajo previo. La carpeta `docs-rea-henry-hubly-20261030-143712/` contiene archivos preparados en Git: excluirla de cualquier commit futuro mediante selección explícita de archivos, sin borrarla. No usar `git add .`.
2. Corregir botones de Salud de Cuentas y Núcleo de Marca y el banner de Reportes. Revisar la cascada real de estilos, incluido el título heredado del banner. Centralizar texto sobre fondo de acento para evitar reparaciones aisladas con colores fijos.
3. Revisar las 21 rutas autenticadas, abriendo sus controles y desplazando el contenido, en claro y oscuro: reposo, hover, foco, seleccionado, deshabilitado, carga y error. Buscar texto oscuro sobre marino y texto blanco sobre celeste en estilos inline y CSS.
4. Comprobar la reparación de fechas con un workspace antiguo que incluya posts, notas y fechas creados por el usuario; comprobar también idempotencia y aislamiento entre marcas. Si la sustitución global modifica contenido legítimo, hacer la reparación selectiva antes de continuar.
5. Ejecutar `npm run build`, `npm test` y `npm run test:db` desde `web`. Las 22 pruebas unitarias y 53 de permisos citadas por Opus son un resultado histórico; registrar cantidades y resultados del estado que realmente se pruebe.

Salida de fase: pendientes corregidos, conservación de datos comprobada y base validada antes de las ampliaciones.

### Fase 1 — Inventario funcional con REA

1. Reanudar una sesión de Chrome autenticada en Henry con CDP accesible. Descubrir el target con REA antes de capturar; no reiniciar perfiles ni sobrescribir una sesión con trabajo sin guardar.
2. Crear una matriz por control: ruta, sección, etiqueta, estado inicial, acción, resultado esperado, cambios de datos, permisos, persistencia y evidencia. Clasificar: observado en vivo, visible en captura, derivado de bundle o pendiente.
3. Recorrer navegación, todas las pestañas, menús, filtros, orden, formularios, listas y modales de cada sección. Registrar estados vacíos, con datos, carga, error y permisos restringidos. Usar escenarios REA con acciones declaradas; no inferir funcionamiento por la presencia de un botón.
4. Capturar Henry y Hubly con viewport, zoom, datos y estado equivalentes; comparar lado a lado las ocho escenas. Para animaciones, comparar fotogramas y transiciones además de la imagen final.
5. Si 9224 sigue inaccesible, avanzar con capturas y bundles, dejando las interacciones no observadas como pendientes. La verificación final en vivo seguirá siendo necesaria para afirmar paridad.

Cobertura de las 21 rutas actuales:

| Grupo | Rutas | Revisión funcional |
|---|---|---|
| Inicio y cuentas | `/dashboard`, `/dashboard/salud-cuentas`, `/dashboard/equipo`, `/salud`, `/equipo` | Widgets, filtros, compromisos, equipo, invitaciones, acciones y aliases |
| Operación | `/calendario`, `/tareas`, `/chat`, `/notificaciones`, `/ia` | Vistas, edición, listas, responsables, estados, mensajes, avisos y paneles |
| Marcas y recursos | `/marcas`, `/marca`, `/estrategia`, `/archivos`, `/proyectos` | Cambio de marca, núcleo, edición, carpetas, búsqueda, selección y proyectos |
| Social y negocio | `/parrillas`, `/reportes`, `/anuncios`, `/crm`, `/automatizaciones`, `/ajustes` | Subpestañas completas, calendarios, reportes, formularios, reglas y ajustes |

Los flujos que salen de estas rutas también incluyen sus destinos: aprobación compartida, reporte público, invitación y autenticación. Se comprobará que no se regresen permisos o enlaces existentes.

### Fase 2 — Sidebar operativo con el editor abierto

Archivos principales: `web/app/(app)/layout.tsx`, `dashboard-polish.css`, `web/components/app/PostComposerModal.tsx`, `web/lib/store.ts` y los hosts de diálogos/paneles.

- Mantener la animación central y la retracción inicial; permitir expandir y contraer manualmente durante la edición y restaurar el estado de navegación correspondiente al cerrar.
- Separar la superficie oscurecida de la región interactiva del sidebar. Sus botones, menús y paneles deben recibir clics sin disparar el cierre del compositor. Restringir el cierre exterior a la zona prevista del fondo.
- Mantener el editor alojado en el layout compartido al cambiar de ruta; conservar título, copy, archivos, orden, pestaña, estado, fecha, responsable y ajustes por red. Fijar `brandId` al abrir un borrador, antes de guardar.
- Permitir notificaciones, búsqueda, ayuda, tema, cambio de sección y marca. Definir apilamiento por tipo de ventana para que los controles secundarios queden accesibles y no se tapen entre sí.
- Tratar el editor como panel de diálogo no modal cuando el sidebar sea interactivo; no declarar `aria-modal=true` mientras se permite navegación exterior. Los selectores secundarios sí tendrán foco contenido, restauración de foco y Escape limitado a la capa superior.
- Con un selector de Content Manager abierto, Escape cierra primero ese selector y conserva el editor. Aplicar la política común a otros modales, adaptando las confirmaciones y operaciones en curso a su función.

Criterio decisivo: escribir un borrador, abrir cada función del sidebar, cambiar de ruta y marca, y comprobar que el editor permanece abierto y el post sigue perteneciendo a su marca original.

### Fase 3 — Compositor y Content Manager

Referencias visuales: capturas 1, 2, 3 y 8.

- Ajustar ancho útil, cabecera, etiquetas, metadatos, pestañas, separación editor/preview, scroll interior y pie fijo. Conservar la composición de referencia y aplicar los tokens de Hubly.
- Completar acciones de cabecera: duplicar, eliminar y cerrar con borrador recuperable; validar comportamiento de guardar, cancelar, revisión y programación sin descartar cambios accidentalmente.
- Implementar selección de redes y formatos válidos, copy General y personalización por red, responsables, aviso al publicar, color y campos adicionales según evidencia confirmada. Mostrar validaciones junto al campo y el efecto real de cada acción.
- Ampliar el modelo con lista ordenada de medios, tipo, URL, miniatura y estado de carga, copy y ajustes por red y fecha opcional para borradores sin programar. Mantener lectura de `mediaUrl` existente y adaptar persistencia, API, previews, portal y reportes; migrar solo lo necesario.
- Cargar imágenes y video con progreso real, selección múltiple, quitar, reordenar, reintentar y cancelar. El límite y los formatos se derivarán de la evidencia y de lo que soporte cada integración. No usar porcentajes ficticios.
- Content Manager como selector sobre el editor: carpetas, ruta/migas, búsqueda, archivos filtrados por marca, miniaturas, selección múltiple, contador, Agregar y Cancelar. Incorporar los archivos elegidos al borrador al confirmar.
- Revisar Notas, To-Dos, Documentos, Chat y Actividad: crear, editar, completar o quitar según corresponda; responsables, fechas, adjuntos, scroll, persistencia y estados vacíos. Los registros de actividad deberán reflejar las acciones reales.
- Verificar descarga, música y opciones particulares de cada red contra Henry. Canva y Drive requieren adaptadores y conexión real; si falta configuración, dar un estado explícito con la acción necesaria. No simular éxito ni activar un conector vacío.

### Fase 4 — iPhone y publicación nativa por red

Archivos principales: `web/components/previews/`, `PostComposerModal.tsx` y los tipos/adaptadores compartidos.

- Crear `PhoneFrame` reutilizable: marco, esquinas, botones laterales, isla, hora, señal, batería, área segura y barra inferior. Escalar proporcionalmente al espacio disponible, sin deformar el post ni cortar los controles del editor.
- Renderizar dentro del teléfono Instagram, Facebook, TikTok, LinkedIn, YouTube, X, Threads, Pinterest, Reddit y Google Business. Ampliar el catálogo actual de ocho redes y los cuatro previews existentes de forma consistente.
- Cada red tendrá cabecera, avatar, nombre, tipografía, navegación, composición y acciones reconocibles. Feed, carrusel, reel/video, story, texto y pin cambiarán su estructura según la compatibilidad confirmada.
- Sincronizar imagen/video, orden de carrusel, miniatura, proporción, copy General/personalizado y marca en tiempo real. Añadir navegación del carrusel y reproducción controlada; los controles de una simulación no publican ni generan interacciones reales.
- Usar colores e identidad de cada red dentro de la simulación y la identidad de Hubly fuera. No mostrar métricas inventadas como resultados del post; cualquier muestra decorativa debe ser inequívoca.
- Conservar un estado vacío veraz. En móvil ofrecer vista previa accesible mediante pestaña o panel: hoy se oculta a menos de 860 px y no debe desaparecer la función.

Criterio decisivo: las diez redes se ven dentro del mismo tipo de iPhone, muestran el contenido actual y poseen una interfaz propia; Pinterest no termina en un teléfono genérico.

### Fase 5 — Calendario, tablas, Kanban, feed y listas

Referencias visuales: capturas 4, 5, 6 y 7. Reutilizar `MonthDragCalendar`, `PostMonthCalendar`, `ProductionBoard` y `FeedSimulator` donde corresponda, evitando stores paralelos.

- Cabecera común con anterior/siguiente, Hoy, período correcto, contador/cuota, Mes/Semana/Tabla/Kanban, filtros, menú y Nuevo post. Conservar filtros y período entre vistas y recordar la preferencia cuando proceda.
- Semana: siete días alineados, fecha actual, tarjetas con miniatura y resumen, creación por día, desplazamiento correcto y arrastre/reprogramación sin mover posts publicados.
- Tabla: columnas Post, Fecha, Estatus, Publicación, Formato y Redes; ordenar, filtrar, editar campos permitidos, abrir el editor desde la fila y añadir un post. Las acciones de una celda no deben activar accidentalmente la fila.
- Kanban: selector de agrupación, encabezados y contadores, alta contextual, tarjetas claras y arrastre que cambie el campo correcto. Verificar agrupaciones contra REA; no confundir estatus de revisión con publicación efectiva.
- Posts sin fecha: representación real en datos, contador y bandeja/lista recuperable; no desaparecer al filtrar el mes ni recibir automáticamente la fecha de hoy.
- Menú: Resultados cambia la información mostrada; Ver feed abre la simulación; Crear parrilla usa contenido y período reales; Traer mi mes ofrece entrada, mapeo, validación y resumen previo a importar. Comprobar duplicados y errores por fila.
- Mejorar las demás listas con jerarquía, miniaturas, columnas consistentes, estados legibles, búsqueda, orden, selección y acciones contextuales cuando aporten valor. Probar títulos largos y cantidades grandes; usar paginación o virtualización solo donde el volumen lo justifique.
- En pantallas pequeñas, usar scroll localizado o representación alternativa manteniendo accesibles campos y acciones. Proveer alternativa por teclado a las operaciones de arrastre.

### Fase 6 — Secciones restantes y verificación final

- Completar la matriz de la fase 1 para cada sección. Un botón se considera terminado solo cuando su resultado, persistencia, permisos y errores están comprobados. Corregir los huecos encontrados sin sustituirlos por demos ni simples avisos de éxito.
- Ejecutar build, pruebas unitarias y permisos después de la implementación. Añadir regresiones relevantes para borrador/marca, fechas, multimedios, copy por red, cambios de vista y cierre de la capa superior.
- Registrar escenarios de navegador: sidebar con borrador; Content Manager sobre editor; guardar y reabrir; cambiar red/formato; video/carrusel; sin fecha; tabla y Kanban; permisos de lectura; error de carga y recuperación.
- Hacer una ronda visual agrupada en escritorio y móvil, claro y oscuro, con los mismos estados de las ocho capturas. Corregir el lote de defectos encontrado y hacer una segunda ronda solo para confirmar las correcciones. Usar REA para capturar/comparar donde esté disponible y revisar las diferencias de identidad intencionales por separado.
- Registrar errores de consola, foco, scroll, tamaños y contraste. Comprobar animación y `prefers-reduced-motion`. No dar por validada una pantalla solo por verla en una hoja de miniaturas.
- Entregar matriz final con evidencia por flujo, capturas comparativas, resultados de pruebas y dependencias pendientes concretas. Mientras no se recupere Henry en vivo, declarar ese límite al informar el grado de paridad.

## 4. Condiciones de cierre

1. Pendientes de contraste, banner y fechas resueltos sin pérdida de datos.
2. Sidebar y sus funciones operan con el editor abierto; el borrador y su marca se conservan.
3. Compositor, archivos y pestañas guardan y recuperan contenido; los flujos no terminan en botones decorativos.
4. Las diez redes tienen publicación nativa dentro del mockup de iPhone, sincronizada con el borrador.
5. Mes, Semana, Tabla y Kanban comparten datos, filtros y período; los posts sin fecha siguen accesibles.
6. Las 21 rutas y sus flujos vinculados tienen una matriz de revisión completa. Las integraciones que requieran credenciales muestran su estado real y requisitos concretos.
7. Build y pruebas pertinentes pasan; las comparaciones visuales e interactivas tienen evidencia. Las pruebas históricas no sustituyen las actuales.
8. La evidencia capturada de Henry queda fuera de cualquier commit de aplicación.

Este documento define la ejecución posterior. En esta pasada solo se inspeccionaron fuentes y evidencia, se utilizó REA, se conservaron los ocho adjuntos y se escribió el plan; no se hicieron correcciones de producto ni se repitieron build o pruebas.
