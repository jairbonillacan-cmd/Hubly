# Encargo para Gemini 4 Argon High: investigación completa de Henry con REA para Hubly

Fecha de preparación: 31 de octubre de 2026.
Estado: plan de ejecución; este documento no acredita nuevas capturas, pruebas ni subagentes ejecutados.

El texto siguiente está preparado para entregarse íntegramente al agente coordinador.

## 1. Objetivo y resultado esperado

Actúa como coordinador de una investigación de ingeniería inversa de Henry mediante REA. Trabaja sobre el proyecto `C:/Users/T490s/Desktop/Proyectos/Hubly` y la aplicación de referencia `https://www.henry.cm/`.

Quiero entender y documentar cada sección, componente, botón, menú, modal, panel, formulario, vista y acción de Henry, incluyendo los estados y efectos que aparecen después de interactuar. Complementa los reportes existentes hasta producir una especificación que permita a otro equipo construir diseños y funcionalidad equivalentes en Hubly sin tener que volver a descubrir los flujos.

Para cada función responde: qué ve el usuario, cómo la activa, qué cambia, qué datos necesita, qué reglas aplica, cómo persiste y cómo implementarla en el Hubly actual. Relaciona siempre `interfaz → acción → lógica cliente → contrato de datos → resultado → adaptación a Hubly`.

Esta tarea produce investigación, evidencia y especificaciones de implementación. No implementes cambios en la aplicación como parte de este encargo. El pseudocódigo y los contratos propuestos viven en la documentación.

## 2. Punto de partida obligatorio

Lee las instrucciones aplicables del repositorio y la skill `reverse-engineer-anything` instalada en tu entorno. Después revisa:

- `docs-rea-henry-hubly-20261030-143712/00-INDICE.md`, `01-ALCANCE-Y-METODO.md`, `02-COBERTURA.md` y `03-ARQUITECTURA.md`.
- Las carpetas `funcionalidades/`, `especificacion-completa/`, `auditoria/`, `datos-y-red/`, `diseno/`, `movimiento/`, `codigo/` y `reconstruccion-hubly/` del mismo dossier.
- `docs/PLAN-PARIDAD-HENRY-2026-10-31.md`, `docs/PLAN-MVP-POSTIZ-HUBLY.md` y `docs/referencias/henry-2026-10-31/`.
- `DESIGN.md`, `PRODUCT.md`, el código vigente de `web/` y las migraciones de `supabase/`. Contrasta las descripciones históricas con los archivos actuales.

Los documentos existentes son antecedentes que debes verificar. No heredes sus porcentajes, cuentas de agentes o afirmaciones de ejecución como hechos nuevos. Una ruta reconocida en un bundle no equivale a una ruta recorrida; una ficha redactada no equivale a una interacción probada.

Existe un reporte anterior de CDP inaccesible en `127.0.0.1:9224`. Comprueba el estado real al ejecutar: ni ese fallo ni los puertos y targets históricos prueban el estado actual. Los `evidence_id` antiguos pueden no estar disponibles en una sesión nueva; usa los artefactos conservados y declara cualquier referencia irrecuperable.

Respeta la identidad actual de Hubly en `DESIGN.md`: marino/celeste, Hubi, logos e iconos propios. Las referencias antiguas del dossier a conservar terracota o descartar azul no deben gobernar la propuesta actual. Conserva también la decisión documentada de poder navegar por el sidebar manteniendo el compositor abierto y el borrador vinculado a su marca original. Identifica estas diferencias como decisiones de Hubly, sin atribuirlas a Henry.

## 3. Equipo: 20 subagentes reales

Usa **20 subagentes en total**, además del coordinador. Todos deben utilizar **Gemini 4 Argon High** y REA. No basta con escribir 20 nombres en un informe.

Antes de delegar, comprueba el identificador real de ese modelo y el ajuste de razonamiento High en el entorno que ejecutará el trabajo. No inventes un identificador ni cambies de modelo silenciosamente. Si no se puede seleccionar el modelo requerido o crear el mínimo de 10 subagentes reales, declara la limitación y pide únicamente la información necesaria para resolverla. Puedes avanzar con el inventario del coordinador, pero no declarar cumplido el requisito de equipo.

Registra por agente: identificador real, tarea, modelo solicitado, modelo efectivo si el sistema lo expone, razonamiento, herramientas REA utilizadas, archivos propios, target asignado, dependencias y estado. Si el modelo efectivo no es verificable, indícalo expresamente.

| Agente | Responsabilidad exclusiva | Interacciones y entregables particulares |
|---|---|---|
| G01 | Shell, navegación y acceso | Sidebar y sus modos, selector de marca/agencia, búsqueda global, atajos, ayuda, notificaciones globales, tema, login y recuperación. Apilamiento y navegación con paneles abiertos. |
| G02 | Inicio y dashboard | Cada widget, personalización, agregar/quitar/reordenar, filtros, accesos rápidos, estados vacíos y navegación desde tarjetas. |
| G03 | Salud de cuentas y equipo | Métricas, compromisos, responsables, edición, invitaciones, miembros, roles visibles, logros y detalle de miembro. |
| G04 | CRM de agencia y de marca | Pipelines, etapas, leads, tablas, filtros, fichas, cotizaciones, importaciones, exportaciones, cálculos y transiciones. |
| G05 | Mi espacio, tareas y libretas | Vistas, Kanban, edición de tarea, subtareas, fechas, asignación, texto enriquecido, bloques, versiones y autoguardado. |
| G06 | Calendario, agenda, citas y revisión | Cada vista temporal, zonas horarias, navegación, alta/edición, arrastre, reprogramación, detalle y acceso a revisiones. |
| G07 | Chat, bandeja y asistente IA | Hilos, menciones, adjuntos, lectura, búsqueda, conversaciones IA, agentes, tarjetas, streaming, interrupción y confirmaciones de escritura. |
| G08 | Marcas, onboarding y núcleo | Alta, cambio y edición de marca, pasos de onboarding, voz, estrategia, productos, activos, aprendizaje y validaciones. |
| G09 | Proyectos, archivos y Content Manager | Vistas y detalle de proyecto, carpetas, carga, selección, búsqueda, orden, preview, descarga y uso de archivos desde otros módulos. |
| G10 | Social Media y parrillas | Pestañas, Mes/Semana/Tabla/Kanban/Feed, filtros, estados, cuotas, creación de parrilla y asistente «Traer mi mes». |
| G11 | Compositor de publicaciones | Todas las pestañas y redes presentes, formatos, copy general/por red, multimedios, orden, campos, responsables, fecha, borrador, programación y previews. Modales secundarios y relación con sidebar. |
| G12 | Aprobaciones, portales y Bio-Link | Enlaces compartidos, conexión de cuentas, revisión del cliente, comentarios, aprobación/rechazo, permisos, caducidad, bloques y preview del Bio-Link. |
| G13 | Anuncios, Photo Studio e investigación | Wizards, presets, carga, generación, variaciones, historial, investigación, inteligencia, filtros, remix y transferencia entre herramientas. |
| G14 | Automatizaciones y Landing Pages | Disparadores, condiciones, acciones, edición, validación, activación, historial, editor de landing, preview, publicación y formularios. |
| G15 | Analítica, insights y reportes | Periodos, comparación, redes, métricas, gráficos, filtros, sincronización, embudos, generación, exportación y enlaces de reporte. |
| G16 | Ajustes, billing, Full Service y HQ | Cada pestaña, permisos, integraciones, preferencias, planes, límites, directorio y panel administrativo. Delimita lo accesible por rol. |
| G17 | Diseño, componentes y movimiento | Mediciones, tokens, tipografía, responsive, temas, componentes comunes, overlays, foco y animaciones. Comprueba muestras de todos los dominios con REA. |
| G18 | Red, datos, estado y código | Contratos observados, entidades, persistencia, caché, SSE/Realtime, chunks y carga dinámica. Revisa los caminos técnicos de cada agente funcional. |
| G19 | Traducción técnica a Hubly | Lee la implementación actual y construye el mapa Henry→Hubly con brechas, contratos, archivos, dependencias y pasos implementables. Usa REA para contrastar flujos representativos de ambos productos cuando estén accesibles. |
| G20 | Auditoría independiente | Revisa trazabilidad, cobertura, contradicciones y calidad de las propuestas. Reproduce con REA interacciones de los demás agentes y devuelve las fichas insuficientes. |

No asignes nuevos subagentes desde los subagentes: cualquier reasignación pasa por el coordinador y conserva el máximo de 20. Si la concurrencia disponible es menor, ejecuta los 20 en oleadas, respetando el límite real. La concurrencia y el número total de subagentes son medidas distintas.

Cada especialista funcional documenta diseño, lógica y datos de su propio módulo; G17–G19 profundizan y verifican esas dimensiones, no sustituyen el trabajo de los especialistas.

## 4. Coordinación sin colisiones

El coordinador mantiene una cola de tareas y un registro de propiedad de archivos y targets. Cada agente escribe en su carpeta. Solo el coordinador integra matrices e índices compartidos.

Asigna un target exclusivo a cada agente que interactúe. Si no hay suficientes, usa un turno exclusivo por target. Dos agentes no pueden navegar, cambiar viewport, capturar un escenario o iniciar observación simultáneamente sobre el mismo target.

Pestañas distintas pueden compartir marca activa, almacenamiento, cookies, sesión y suscripciones. Serializa también cambios globales o usa contextos aislados cuando el entorno lo permita. No copies ni exportes credenciales para crear aislamiento. Registra los cambios de contexto y avisa antes de liberar el target.

Los agentes transversales usan sus propios targets o esperan el turno de revisión; no interrumpen capturas de otros. G10/G11/G12 acuerdan los límites entre calendario, compositor y portal; G09/G11 acuerdan el selector de medios. Una misma función tiene un propietario y referencias cruzadas.

## 5. Método de investigación con REA

Descubre las herramientas realmente disponibles antes de utilizarlas; nombres y opciones dependen de la versión instalada. Usa las capacidades que exponga el servidor, sin inventar parámetros ni asumir soporte.

1. Descubre el navegador con `list_browser_targets` sobre un endpoint CDP local identificado y selecciona el target de Henry por URL. No reutilices a ciegas IDs históricos.
2. Para inspección pasiva usa las herramientas disponibles de página/sesión. Para acciones del agente usa `capture_browser_scenario` con acciones declaradas, precondición, resultado esperado, espera observable y criterio de parada.
3. Recuerda que un escenario en modo connect puede navegar inicialmente a `start_url` y perder estado temporal. Reconstruye las precondiciones dentro del escenario; no destruyas trabajo sin guardar del usuario.
4. Obtén imágenes cuando la pregunta sea visual. DOM y AX por sí solos no acreditan apariencia. Captura estados intermedios cuando importen las transiciones.
5. Analiza los bundles locales pertinentes con `analyze_javascript_application` y las herramientas estáticas disponibles. Sigue imports y chunks diferidos de submenús y modales, conservando procedencia y hashes. El texto formateado no recupera el fuente original.
6. Si están disponibles, usa listeners y ubicaciones de fuente como pistas, y compara capturas equivalentes. Un listener registrado o un módulo cargado no prueba que se ejecutó el camino investigado.
7. Vincula observación, código y red. No atribuyas una solicitud a un handler solo porque aparezcan próximos en el tiempo. No deduzcas el código privado del servidor a partir de su contrato público.
8. Guarda resultados completos o referencias retenidas utilizables, junto con sus límites de truncamiento, paginación y periodo de observación. Conserva snapshots anteriores cuando haya cambios de build.

No instales ni repares REA de forma preventiva. Si hay un fallo, aplica la guía de recuperación de la skill al fallo concreto. Un timeout no prueba que la operación se detuvo: verifica su estado antes de repetir acciones que puedan escribir.

Si Henry no está accesible, continúa con evidencia y bundles existentes y marca lo pendiente de runtime. Si un permiso, token o integración impide un flujo, registra el punto exacto y la alternativa de análisis disponible. No presentes como ejecutada una interacción reconstruida estáticamente.

Para explorar escrituras usa registros de prueba identificables en un entorno autorizado. Abrir y cancelar un diálogo no prueba guardar. Acciones que envían mensajes o invitaciones reales, publican contenido, conectan cuentas, generan cargos o eliminan datos del usuario requieren un destino de prueba autorizado o quedan documentadas hasta el último paso seguro. No intentes evitar guards para acceder a funciones de otro rol.

## 6. Recorrido exhaustivo y expansión del inventario

Construye primero un grafo de superficies: `ruta → sección → componente → control → acción → estado resultante`. El alcance incluye la web pública y autenticada, portales alcanzables, variantes por marca/agencia/rol/plan, rutas dinámicas y parámetros que cambian la vista.

Por cada superficie:

1. Recorre todo el scroll, incluidos laterales, tablas, pies y zonas colapsadas. Enumera controles visibles y controles que aparecen con hover, selección o datos.
2. Abre cada pestaña, menú y submenú; activa controles por clic y por teclado cuando proceda. Incluye iconos sin etiqueta, clic derecho, doble clic, arrastre, orden, atajos y enlaces externos si existen.
3. Sigue cada resultado: si un botón abre un modal con otros botones, esos botones originan nuevas filas del inventario. Repite hasta cerrar el flujo o registrar un bloqueo concreto.
4. Repite con datos relevantes: vacío, un elemento, varios, selección múltiple, texto largo, límites, archivo válido/inválido, búsqueda sin resultados y errores reproducibles en entorno de prueba.
5. Comprueba la persistencia aplicable tras cerrar/reabrir, cambiar de vista, navegar, recargar o cambiar de marca. Distingue estado local, remoto y preferencia de usuario.
6. Contrasta entrada directa a la URL y navegación interna; incluye atrás/adelante, enlaces profundos y recuperación de sesión cuando sean aplicables.

Inventaría familias parametrizadas de controles, no cada fila repetida como un botón distinto. Registra sus variantes significativas y casos límite. Toda superficie nueva debe tener propietario; cualquier exclusión requiere motivo, nunca desaparecer del denominador.

## 7. Ficha obligatoria por interacción

Asigna IDs estables como `HEN-SOC-COMPOSER-0042`, independientes de los números históricos de agentes. Una ficha debe contener:

| Campo | Contenido obligatorio |
|---|---|
| Identidad | ID, ruta, sección, nombre del control, tipo de superficie, agente y enlaces al reporte previo. |
| Contexto | Fecha, build/hash si se conoce, target, viewport, tema, rol, plan, marca/agencia y datos de prueba. |
| Localización | Etiqueta visible o nombre accesible y locator reproducible; evita depender solo de clases generadas. |
| Precondiciones | Datos, permisos, pasos para llegar y estado inicial, incluidos paneles ya abiertos. |
| Acción | Clic, tecla, texto, archivo o arrastre exactos y orden de los pasos. |
| Resultado | Cambio visual y funcional, URL, elementos añadidos/retirados, foco, mensajes y estado posterior. |
| Variantes | Hover, foco, activo, deshabilitado, cargando, vacío, éxito, error y restricciones aplicables. |
| Reglas | Campos requeridos, límites, defaults, validación, cálculos y transiciones permitidas. |
| Datos y red | Lecturas/escrituras, método/ruta observados, forma de datos disponible, respuesta, error y persistencia. Desconocido cuando no se exponga. |
| Lógica cliente | Archivo y rango o símbolo localizable, origen/hash y condiciones/handlers relacionados. |
| Diseño | Dimensiones, composición, espaciados, tipografía, colores computados, bordes, sombras, iconos, overflow y responsive. |
| Movimiento | Disparador, duración/easing declarados o medidos, propiedades, interrupción y reduced motion. No inventes números. |
| Evidencia | ID REA, archivo conservado, captura antes/después, pasos y referencia de código que sustenten cada afirmación. |
| Hubly | Comportamiento equivalente, archivos existentes, brecha, datos/contratos propuestos, pseudocódigo y dependencias. |
| Aceptación | Dado/Cuando/Entonces para éxito y casos relevantes de error, permisos y conservación de datos. |
| Límites | Qué no se verificó, motivo, contradicciones, confianza y siguiente acción para resolverlo. |

Separa las etiquetas de procedencia: `OBSERVADO_RUNTIME`, `VISIBLE_EN_CAPTURA`, `DERIVADO_DE_CODIGO`, `HIPOTESIS` y `PROPUESTA_HUBLY`. Permite varias evidencias en una ficha y clasifica por afirmación. Añade `NO_VERIFICADO`, `BLOQUEADO` o `NO_APLICA` para el estado de los casos; justifica `NO_APLICA`.

Una propuesta de backend equivalente no debe aparecer como descripción del backend de Henry. Una apariencia inferida del CSS no debe aparecer como medición visual en vivo.

## 8. Requisitos adicionales para modales y paneles

Cada modal, drawer, popover, tooltip, selector y confirmación necesita ID propio, vínculo al control que lo abre y catálogo de todos sus controles internos. Documenta:

- Apertura, animación, posición, tamaño mínimo/máximo, backdrop, portal, z-index, scroll y comportamiento responsive.
- Foco inicial, Tab/Shift+Tab, Escape, clic exterior, restauración de foco y relación con el sidebar.
- Cerrar, cancelar, guardar, confirmar, deshacer, cambios sin guardar, guardado en curso y errores.
- Capas anidadas: qué ventana se cierra con Escape, cuál mantiene su estado y cómo vuelve el foco.
- Navegación o cambio de marca con el modal abierto, conservación del borrador y recuperación tras reapertura.

No asumas un comportamiento común: compruébalo por variante. La decisión de Hubly sobre compositor persistente se especifica expresamente aunque difiera de Henry.

## 9. Diseño y reconstrucción funcional para Hubly

G17 consolida componentes compartidos con medidas y variantes; cada ficha enlaza a su componente base y documenta diferencias. Usa capturas equivalentes, con viewport, tema y datos controlados. Como puntos de comparación usa 1440×900, 1024×768 y 390×844, ajustando según los breakpoints observados. Anota zoom y escala si afectan la comparación.

Distingue valores declarados, computados y medidos. Conserva fuentes y recursos como referencias con procedencia; para la implementación usa identidad y activos propios de Hubly. No confundas diferencias de marca deliberadas con defectos de reproducción.

G18 explica para cada dominio el modelo de entidades, relaciones, permisos observables, rutas de lectura/escritura, validación cliente/servidor, persistencia, cache invalidation y eventos. Documenta contratos completos solo hasta el detalle realmente expuesto. No guardes secretos, cookies, tokens de portales utilizables ni datos personales innecesarios en los reportes.

G19 inspecciona los archivos actuales antes de proponer rutas o módulos. Para cada función produce:

`ID Henry → estado actual de Hubly → diferencia → archivos a modificar/crear → contrato/modelo → lógica propuesta → dependencias → pruebas de aceptación`.

Clasifica Hubly como `EXISTE_VERIFICADO`, `EXISTE_PARCIAL`, `SOLO_INTERFAZ`, `PROPUESTO` o `NO_REVISADO`, con evidencia. Diferencia prototipo local de operación persistente y de integración real. En funcionalidades de publicación, contrasta el plan Postiz existente y no presupongas que Hubly debe utilizar el proveedor de Henry.

## 10. Secuencia y controles de calidad

**Fase 0 — Base y capacidades.** Registra cambios existentes sin modificarlos, lecturas iniciales, versión de herramientas, selección de modelo y acceso real. Crea registros de agentes, targets y propiedad de archivos. Identifica discrepancias del dossier.

**Fase 1 — Inventario.** G01–G16 entregan rutas/superficies/controles y brechas de evidencia; G17–G19 preparan matrices transversales; G20 revisa la definición del denominador. El coordinador asigna todo lo nuevo.

**Fase 2 — Piloto y expansión.** Valida primero un flujo completo de abrir→editar→validar→guardar/cancelar→reabrir, otro con modal anidado y otro con cambio de contexto. Ajusta la plantilla antes de multiplicarla. Después completa todos los dominios, sin limitarte a esos pilotos.

**Fase 3 — Profundización.** Conecta runtime, código y red; completa variantes, roles, estados y flujos entre módulos. Cada descubrimiento genera tarea y vuelve al inventario. Continúa el análisis estático durante esperas de targets.

**Fase 4 — Revisión independiente.** G20 reproduce al menos una interacción principal, una capa secundaria y un caso de persistencia/error por cada dominio donde apliquen, y todos los flujos que puedan perder datos o cambiar de contexto. Una muestra validada no acredita todos los controles: las evidencias del resto también se revisan documentalmente. Devuelve hallazgos al propietario hasta su corrección o bloqueo explícito.

**Fase 5 — Integración.** El coordinador complementa los reportes existentes con referencias a las nuevas fichas, corrige afirmaciones contradichas conservando su historial y consolida el mapa de implementación de Hubly. G20 revisa los porcentajes recalculados y la trazabilidad final.

Da actualizaciones breves en hitos: agentes reales iniciados/terminados, controles descubiertos, verificados y bloqueados, hallazgos y siguiente resolución. No sustituyas entregables por mensajes de progreso.

## 11. Archivos de salida y conservación del trabajo previo

Crea una extensión del dossier en `docs-rea-henry-hubly-20261030-143712/ampliacion-interacciones-2026-10-31/`. Si ya existe, crea una ejecución identificada dentro de ella sin sobrescribir evidencia anterior.

```text
00-LEEME.md
01-INVENTARIO-RUTAS.csv
02-MATRIZ-INTERACCIONES.csv
03-MATRIZ-ESTADOS.csv
04-COBERTURA-Y-BLOQUEOS.md
05-DELTA-REPORTES-ANTERIORES.md
coordinacion/agentes.csv
coordinacion/targets-y-turnos.csv
coordinacion/tareas.csv
coordinacion/decisiones.md
agentes/G01/ ... agentes/G20/
  reporte.md
  interacciones.json
  evidencia/
componentes/catalogo.md
componentes/modales-y-capas.md
datos/contratos-y-persistencia.md
hubly/mapa-funcional.csv
hubly/especificaciones/
hubly/backlog-implementacion.md
auditoria/contradicciones.md
auditoria/reproduccion-independiente.md
evidencia/manifiesto.json
```

Las matrices y fichas deben compartir IDs y ser procesables, sin depender exclusivamente de prosa extensa. El manifiesto enlaza archivos, hashes, procedencia, fecha y referencias REA; genera sus hashes al terminar la escritura. Guarda rutas relativas para mover el dossier y omite credenciales.

El coordinador actualiza `00-INDICE.md` del dossier con el enlace a la ampliación y agrega referencias o correcciones concretas en los reportes afectados. No reemplaces todo el expediente ni borres versiones anteriores. No hagas commits ni staging de cambios ajenos.

## 12. Métricas y definición de terminado

Calcula por separado, con numerador y denominador:

- **Inventario:** superficies con inventario revisado / superficies descubiertas.
- **Interacciones:** acciones verificadas en runtime / acciones catalogadas.
- **Estados:** pares interacción-estado verificados / pares aplicables catalogados.
- **Análisis estático:** acciones con camino cliente identificado / acciones que requieren análisis cliente.
- **Diseño:** superficies con evidencia visual y especificación / superficies visuales catalogadas.
- **Hubly:** interacciones con propuesta implementable / interacciones catalogadas.
- **Bloqueos:** cantidad y causa por acceso, rol, datos, integración o herramientas.

Mantén los casos bloqueados y no verificados en sus denominadores aplicables. No sumes categorías solapadas para inflar porcentajes. Explica cómo se contó cada familia de controles y muestra los conteos nuevos frente al dossier anterior. Si el inventario crece, recalcula las métricas.

El cierre de cada módulo requiere: inventario completo según las fuentes revisadas; ficha de cada interacción; resultado y evidencia trazables o bloqueo concreto; especificación visual; lógica cliente/datos con límites explícitos; adaptación implementable a Hubly; y revisión independiente sin hallazgos críticos abiertos.

Si quedan interacciones sin acceso, entrega el resultado como **investigación parcial con pendientes de verificación**, enumera exactamente lo faltante y el requisito para desbloquearlo. No declares paridad total ni acceso al servidor privado. Tampoco afirmes exhaustividad universal: describe las rutas, contextos, versiones y estados efectivamente cubiertos.

La respuesta final debe enlazar el índice de la ampliación, resumir qué conocimiento nuevo se obtuvo respecto al expediente existente, mostrar métricas separadas, acreditar los agentes reales y su configuración verificable, explicar bloqueos y ordenar los próximos pasos de implementación de Hubly. El trabajo útil debe estar guardado aunque la verificación completa quede bloqueada.
