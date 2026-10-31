# Matriz de controles de Hubly

Generada con `npm run audit:controles` en modo demo el 2026-10-31 (previo a la integración). Cubre botones, enlaces y pestañas visibles al cargar cada ruta, la barra lateral y el botón de Hubi, y los controles dentro de cada menú, modal o panel que abre un control de la página (una ronda de profundidad).

**Qué significa:** «responde» indica que pulsar cambió la página (el detalle dice qué cambió) sin error; no prueba que el resultado sea correcto ni que persista, porque la auditoría bloquea las escrituras. La persistencia y los permisos se prueban en `e2e/` y `tests/`. «Ya activo» es una pestaña o filtro que ya estaba seleccionado, así que no cambia nada: es lo esperado. «Sin efecto visible» pide revisión manual: puede ser un botón muerto o un cambio que la auditoría no detecta. Los editores (compositor) se abren pero no se recorren aquí: los cubre `compositor.spec.ts`.

**Totales:** 679 controles (259 en páginas, 420 dentro de ventanas) · 565 responden · 29 ya activos · 46 enlaces · 19 sin efecto visible · 19 deshabilitados · 0 con error · 0 sin poder probar · 1 omitidos.

Alias con la misma pantalla: `/equipo` → `/dashboard/equipo`, `/salud` → `/dashboard/salud-cuentas`, `/estrategia` → `/marca`.

| Ruta | Ventana | Control | Resultado | Detalle |
|---|---|---|---|---|
| `/dashboard` | — | Inicio | enlace | /dashboard |
| `/dashboard` | — | Cuentas | enlace | /dashboard/salud-cuentas |
| `/dashboard` | — | Equipo | enlace | /dashboard/equipo |
| `/dashboard` | — | 2 pendientes | responde | abre una ventana; cambia el texto |
| `/dashboard` | — | Nuevo post | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo (editor: lo cubre compositor.spec) |
| `/dashboard` | — | Nueva marca | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | — | Invitar equipo | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | — | Buscar | responde | abre una ventana; cambia un estado; cambia el texto |
| `/dashboard` | — | + Widget | responde | abre una ventana; cambia un estado; cambia el texto |
| `/dashboard` | — | Editar | responde | cambia un estado; cambia el texto |
| `/dashboard` | — | Min (2) | responde | cambia el texto |
| `/dashboard` | — | Nueva | responde | cambia el texto; cambia un campo |
| `/dashboard` | — | Mi espacio → | enlace | /tareas |
| `/dashboard` | — | Nota | responde | abre una ventana; cambia el texto; cambia un campo |
| `/dashboard` | — | TU PRIMER POST N° 01 · OCT 26 | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | — | REPORTES SIN POWERPOINT ★ N° 02 · OCT 26 | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | — | TU DÍA EN MI ESPACIO N° 03 · OCT 26 | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | — | NÚCLEO DE MARCA N° 04 · OCT 26 | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | — | Ver libretas → | enlace | /libretas |
| `/dashboard` | — | Calendario → | enlace | /calendario |
| `/dashboard` | — | Ver todas → | enlace | /parrillas |
| `/dashboard` | Lo que te toca | Listo | responde | cierra una ventana; cambia el texto |
| `/dashboard` | Lo que te toca | Abrir Mi espacio | enlace | /tareas |
| `/dashboard` | Nueva marca / Cuenta de cliente | Cerrar modal de nueva marca | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Cafetería & Panadería | responde | cambia un estado; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Hospitalidad & Diseño | ya activo | estaba seleccionado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Clínica Dermatológica | responde | cambia un estado; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Restaurante & Gastronomía | responde | cambia un estado; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | E-commerce & Moda | responde | cambia un estado; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Inmobiliaria & Arquitectura | responde | cambia un estado; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Tecnología / SaaS | responde | cambia un estado; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #16324F | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #C87A51 | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #2E5E4E | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #5B50D6 | ya activo | estaba seleccionado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #B88D40 | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #E11D48 | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #0EA5E9 | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #10B981 | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #7C3AED | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Seleccionar color #0F172A | responde | cambia un estado |
| `/dashboard` | Nueva marca / Cuenta de cliente | Disminuir Posts / mes | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Aumentar Posts / mes | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Disminuir Stories / mes | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Aumentar Stories / mes | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Disminuir Reels / mes | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Aumentar Reels / mes | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Disminuir Campañas Ads | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Aumentar Campañas Ads | responde | cambia el texto |
| `/dashboard` | Nueva marca / Cuenta de cliente | Cancelar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Nueva marca / Cuenta de cliente | Crear marca | responde | cambia el texto |
| `/dashboard` | Invitar miembro al equipo | Cerrar modal de invitación | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Invitar miembro al equipo | Seleccionar todas | responde | cambia un estado; cambia el texto |
| `/dashboard` | Invitar miembro al equipo | CB Café Bruma | responde | cambia un estado; cambia el texto |
| `/dashboard` | Invitar miembro al equipo | M Min | responde | cambia un estado; cambia el texto |
| `/dashboard` | Invitar miembro al equipo | CN Clínica Norte | responde | cambia un estado; cambia el texto |
| `/dashboard` | Invitar miembro al equipo | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Invitar miembro al equipo | Generar invitación local | responde | cambia el texto |
| `/dashboard` | Resultados de búsqueda | Crear o programar post Abre el compositor de posts, Reels y  | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo (editor: lo cubre compositor.spec) |
| `/dashboard` | Resultados de búsqueda | Crear marca Configura identidad y compromisos mensuales | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Resultados de búsqueda | Invitar al equipo Genera una invitación con rol y marcas asi | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Resultados de búsqueda | Revisar sugerencias Compromisos propuestos según el cumplimi | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto |
| `/dashboard` | Resultados de búsqueda | Configurar widgets Mostrar, ocultar, cambiar columna o reord | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto |
| `/dashboard` | Resultados de búsqueda | Pregúntale a Hubi Consulta tareas vencidas, salud de cuentas | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto |
| `/dashboard` | Resultados de búsqueda | Dashboard · Inicio Resumen operativo, tareas, libretas y apr | responde | cierra una ventana; cambia un estado; cambia el texto |
| `/dashboard` | Resultados de búsqueda | Dashboard · Salud de cuentas Cumplimiento de entregas, presu | responde | navega a /dashboard/salud-cuentas; cierra una ventana; cambia un estado |
| `/dashboard` | Resultados de búsqueda | Dashboard · Equipo Carga operativa, actividad semanal e invi | responde | navega a /dashboard/equipo; cierra una ventana; cambia un estado |
| `/dashboard` | Resultados de búsqueda | Mi espacio · Tareas y libretas Entregables y notas de estrat | responde | navega a /tareas; cierra una ventana; cambia un estado |
| `/dashboard` | Resultados de búsqueda | Calendario Planeación mensual de posts | responde | navega a /calendario; cierra una ventana; cambia un estado |
| `/dashboard` | Resultados de búsqueda | Social Media · Parrillas Parrilla de posts y flujo de aproba | responde | navega a /parrillas; cierra una ventana; cambia un estado |
| `/dashboard` | Resultados de búsqueda | CB Café Bruma (@cafebruma) Cafetería de especialidad y tosta | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Resultados de búsqueda | M Min (@min) minerales y cristales decorativos al mayoreo ·  | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Resultados de búsqueda | CN Clínica Norte (@clinicanorte.derma) Dermatología clínica  | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Resultados de búsqueda | TU PRIMER POST N° 01 · OCT 26 Guía de operación | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Resultados de búsqueda | REPORTES SIN POWERPOINT N° 02 · OCT 26 Reportes en vivo | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Resultados de búsqueda | TU DÍA EN MI ESPACIO N° 03 · OCT 26 Productividad | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Resultados de búsqueda | NÚCLEO DE MARCA N° 04 · OCT 26 Estrategia IA | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Resultados de búsqueda | Conecta las redes de tu cliente Min · Jair · Vence hoy Alta | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `/dashboard` | Resultados de búsqueda | Manda tu primer reporte Min · Jair · Vence mañana Alta | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `/dashboard` | Resultados de búsqueda | Ajustar horario a 8:00 am en post de panqué de cardamomo Caf | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `/dashboard` | Resultados de búsqueda | Mandar liga de parrilla de noviembre a Elena por WhatsApp Ca | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Cerrar configuración de widgets | responde | cierra una ventana; cambia un estado; cambia el texto |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Tareas | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | 1 columna | responde | cambia un estado; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | 2 columnas | responde | intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | 3 columnas | responde | cambia un estado; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Tareas hacia arriba | deshabilitado |  |
| `/dashboard` | Configurar widgets del Dashboard | Mover Tareas hacia abajo | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Libretas Kraft | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Libretas Kraft hacia arriba | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Libretas Kraft hacia abajo | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Hoy | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Hoy hacia arriba | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Hoy hacia abajo | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Notificaciones | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Notificaciones hacia arriba | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Notificaciones hacia abajo | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Aprobaciones | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Aprobaciones hacia arriba | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Aprobaciones hacia abajo | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Gráfica de Ads | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Gráfica de Ads hacia arriba | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Gráfica de Ads hacia abajo | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Ads activos | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Ads activos hacia arriba | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Ads activos hacia abajo | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mostrar widget Proyectos críticos | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Proyectos críticos hacia arriba | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Mover Proyectos críticos hacia abajo | deshabilitado |  |
| `/dashboard` | Configurar widgets del Dashboard | Restablecer diseño original | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | Configurar widgets del Dashboard | Listo | responde | cierra una ventana; cambia un estado; cambia el texto |
| `/dashboard` | Nueva libreta Kraft | Cerrar libreta | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/dashboard` | Nueva libreta Kraft | Negrita | responde | cambia un estado |
| `/dashboard` | Nueva libreta Kraft | Cursiva | responde | cambia un estado |
| `/dashboard` | Nueva libreta Kraft | Título | responde | cambia un estado; cambia el texto |
| `/dashboard` | Nueva libreta Kraft | Lista | responde | cambia un estado; cambia el texto |
| `/dashboard` | Nueva libreta Kraft | Lista numerada | responde | cambia un estado; cambia el texto |
| `/dashboard` | Nueva libreta Kraft | Lista de tareas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | Nueva libreta Kraft | Deshacer | deshabilitado |  |
| `/dashboard` | Nueva libreta Kraft | Rehacer | deshabilitado |  |
| `/dashboard` | Nueva libreta Kraft | Cerrar | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/dashboard` | Nueva libreta Kraft | Crear libreta | sin efecto visible |  |
| `/dashboard` | TU PRIMER POST | Cerrar lector de libreta | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | Nueva | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | GUÍA DE OPERACIÓN TU PRIMER POST Actualizado: 26 oct | ya activo | estaba seleccionado |
| `/dashboard` | TU PRIMER POST | REPORTES EN VIVO REPORTES SIN POWERPOINT Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | PRODUCTIVIDAD TU DÍA EN MI ESPACIO Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | ESTRATEGIA IA NÚCLEO DE MARCA Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | Kraft clásico | responde | cambia un estado |
| `/dashboard` | TU PRIMER POST | Terracota | responde | cambia un estado |
| `/dashboard` | TU PRIMER POST | Salvia | responde | cambia un estado |
| `/dashboard` | TU PRIMER POST | Pizarra | responde | cambia un estado |
| `/dashboard` | TU PRIMER POST | Negrita | responde | cambia un estado |
| `/dashboard` | TU PRIMER POST | Cursiva | responde | cambia un estado |
| `/dashboard` | TU PRIMER POST | Título | responde | cambia un estado; cambia el texto |
| `/dashboard` | TU PRIMER POST | Lista | responde | cambia un estado; cambia el contenido |
| `/dashboard` | TU PRIMER POST | Lista numerada | responde | cambia un estado; cambia el contenido |
| `/dashboard` | TU PRIMER POST | Lista de tareas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | Deshacer | deshabilitado |  |
| `/dashboard` | TU PRIMER POST | Rehacer | deshabilitado |  |
| `/dashboard` | TU PRIMER POST | Abrir en Mi espacio | enlace | /tareas?seccion=libretas |
| `/dashboard` | TU PRIMER POST | Enviar pendientes a Tareas | responde | cambia el texto |
| `/dashboard` | TU PRIMER POST | Eliminar | responde | cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/dashboard` | TU PRIMER POST | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU PRIMER POST | Guardar cambios | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | REPORTES SIN POWERPOINT | Cerrar lector de libreta | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | Nueva | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | GUÍA DE OPERACIÓN TU PRIMER POST Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | REPORTES EN VIVO REPORTES SIN POWERPOINT Actualizado: 26 oct | ya activo | estaba seleccionado |
| `/dashboard` | REPORTES SIN POWERPOINT | PRODUCTIVIDAD TU DÍA EN MI ESPACIO Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | ESTRATEGIA IA NÚCLEO DE MARCA Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | Kraft clásico | responde | cambia un estado |
| `/dashboard` | REPORTES SIN POWERPOINT | Terracota | responde | cambia un estado |
| `/dashboard` | REPORTES SIN POWERPOINT | Salvia | responde | cambia un estado |
| `/dashboard` | REPORTES SIN POWERPOINT | Pizarra | responde | cambia un estado |
| `/dashboard` | REPORTES SIN POWERPOINT | Negrita | responde | cambia un estado |
| `/dashboard` | REPORTES SIN POWERPOINT | Cursiva | responde | cambia un estado |
| `/dashboard` | REPORTES SIN POWERPOINT | Título | responde | cambia un estado; cambia el texto |
| `/dashboard` | REPORTES SIN POWERPOINT | Lista | responde | cambia un estado; cambia el contenido |
| `/dashboard` | REPORTES SIN POWERPOINT | Lista numerada | responde | cambia un estado; cambia el contenido |
| `/dashboard` | REPORTES SIN POWERPOINT | Lista de tareas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | Deshacer | deshabilitado |  |
| `/dashboard` | REPORTES SIN POWERPOINT | Rehacer | deshabilitado |  |
| `/dashboard` | REPORTES SIN POWERPOINT | Abrir en Mi espacio | enlace | /tareas?seccion=libretas |
| `/dashboard` | REPORTES SIN POWERPOINT | Enviar pendientes a Tareas | responde | cambia el texto |
| `/dashboard` | REPORTES SIN POWERPOINT | Eliminar | responde | cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/dashboard` | REPORTES SIN POWERPOINT | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | REPORTES SIN POWERPOINT | Guardar cambios | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | TU DÍA EN MI ESPACIO | Cerrar lector de libreta | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | Nueva | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | GUÍA DE OPERACIÓN TU PRIMER POST Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | REPORTES EN VIVO REPORTES SIN POWERPOINT Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | PRODUCTIVIDAD TU DÍA EN MI ESPACIO Actualizado: 26 oct | ya activo | estaba seleccionado |
| `/dashboard` | TU DÍA EN MI ESPACIO | ESTRATEGIA IA NÚCLEO DE MARCA Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | Kraft clásico | responde | cambia un estado |
| `/dashboard` | TU DÍA EN MI ESPACIO | Terracota | responde | cambia un estado |
| `/dashboard` | TU DÍA EN MI ESPACIO | Salvia | responde | cambia un estado |
| `/dashboard` | TU DÍA EN MI ESPACIO | Pizarra | responde | cambia un estado |
| `/dashboard` | TU DÍA EN MI ESPACIO | Negrita | responde | cambia un estado |
| `/dashboard` | TU DÍA EN MI ESPACIO | Cursiva | responde | cambia un estado |
| `/dashboard` | TU DÍA EN MI ESPACIO | Título | responde | cambia un estado; cambia el texto |
| `/dashboard` | TU DÍA EN MI ESPACIO | Lista | responde | cambia un estado; cambia el contenido |
| `/dashboard` | TU DÍA EN MI ESPACIO | Lista numerada | responde | cambia un estado; cambia el contenido |
| `/dashboard` | TU DÍA EN MI ESPACIO | Lista de tareas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | Deshacer | deshabilitado |  |
| `/dashboard` | TU DÍA EN MI ESPACIO | Rehacer | deshabilitado |  |
| `/dashboard` | TU DÍA EN MI ESPACIO | Abrir en Mi espacio | enlace | /tareas?seccion=libretas |
| `/dashboard` | TU DÍA EN MI ESPACIO | Enviar pendientes a Tareas | responde | cambia el texto |
| `/dashboard` | TU DÍA EN MI ESPACIO | Eliminar | responde | cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/dashboard` | TU DÍA EN MI ESPACIO | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | TU DÍA EN MI ESPACIO | Guardar cambios | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard` | NÚCLEO DE MARCA | Cerrar lector de libreta | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | Nueva | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | GUÍA DE OPERACIÓN TU PRIMER POST Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | REPORTES EN VIVO REPORTES SIN POWERPOINT Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | PRODUCTIVIDAD TU DÍA EN MI ESPACIO Actualizado: 26 oct | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | ESTRATEGIA IA NÚCLEO DE MARCA Actualizado: 26 oct | ya activo | estaba seleccionado |
| `/dashboard` | NÚCLEO DE MARCA | Kraft clásico | responde | cambia un estado |
| `/dashboard` | NÚCLEO DE MARCA | Terracota | responde | cambia un estado |
| `/dashboard` | NÚCLEO DE MARCA | Salvia | responde | cambia un estado |
| `/dashboard` | NÚCLEO DE MARCA | Pizarra | responde | cambia un estado |
| `/dashboard` | NÚCLEO DE MARCA | Negrita | responde | cambia un estado |
| `/dashboard` | NÚCLEO DE MARCA | Cursiva | responde | cambia un estado |
| `/dashboard` | NÚCLEO DE MARCA | Título | responde | cambia un estado; cambia el texto |
| `/dashboard` | NÚCLEO DE MARCA | Lista | responde | cambia un estado; cambia el contenido |
| `/dashboard` | NÚCLEO DE MARCA | Lista numerada | responde | cambia un estado; cambia el contenido |
| `/dashboard` | NÚCLEO DE MARCA | Lista de tareas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | Deshacer | deshabilitado |  |
| `/dashboard` | NÚCLEO DE MARCA | Rehacer | deshabilitado |  |
| `/dashboard` | NÚCLEO DE MARCA | Abrir en Mi espacio | enlace | /tareas?seccion=libretas |
| `/dashboard` | NÚCLEO DE MARCA | Enviar pendientes a Tareas | responde | cambia el texto |
| `/dashboard` | NÚCLEO DE MARCA | Eliminar | responde | cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/dashboard` | NÚCLEO DE MARCA | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard` | NÚCLEO DE MARCA | Guardar cambios | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/equipo` | — | Inicio | enlace | /dashboard |
| `/dashboard/equipo` | — | Cuentas | enlace | /dashboard/salud-cuentas |
| `/dashboard/equipo` | — | Equipo | enlace | /dashboard/equipo |
| `/dashboard/equipo` | — | 7 días | sin efecto visible |  |
| `/dashboard/equipo` | — | 30 días | sin efecto visible |  |
| `/dashboard/equipo` | — | 90 días | sin efecto visible |  |
| `/dashboard/equipo` | — | Invitar | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/equipo` | — | Filtros | responde | abre una ventana; cambia un estado; cambia el texto |
| `/dashboard/equipo` | — | Editar marcas | responde | abre una ventana; cambia un estado; cambia el texto |
| `/dashboard/equipo` | — | Semana | sin efecto visible |  |
| `/dashboard/equipo` | — | Mes | responde | cambia el texto |
| `/dashboard/equipo` | — | Ver todos los logros (39) | responde | cambia el texto |
| `/dashboard/equipo` | — | Hoy | responde | cambia el texto |
| `/dashboard/equipo` | — | Semana | sin efecto visible |  |
| `/dashboard/equipo` | — | Mes | responde | cambia el texto |
| `/dashboard/equipo` | — | Ver perfil 🥇 L Lucía Ramírez Diseño y Dirección de Arte · 1 | responde | cambia el texto |
| `/dashboard/equipo` | — | Ver perfil | responde | abre una ventana; cambia el texto |
| `/dashboard/equipo` | — | Ver perfil 🥈 D Diego Morales Paid Media y Analítica · 8 tar | responde | cambia el texto |
| `/dashboard/equipo` | — | Ver perfil | responde | abre una ventana; cambia el texto |
| `/dashboard/equipo` | — | Ver perfil 🥉 J Jair (tú) Dueño · 0 tareas · 0 posts 63 pts  | sin efecto visible |  |
| `/dashboard/equipo` | — | Ver perfil | responde | abre una ventana; cambia el texto |
| `/dashboard/equipo` | — | Cómo funcionan los puntos · Se miden por esfuerzo, no por cl | responde | abre una ventana; cambia un estado; cambia el texto |
| `/dashboard/equipo` | Invitar miembro al equipo | Cerrar modal de invitación | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/equipo` | Invitar miembro al equipo | Seleccionar todas | responde | cambia un estado; cambia el texto |
| `/dashboard/equipo` | Invitar miembro al equipo | CB Café Bruma | responde | cambia un estado; cambia el texto |
| `/dashboard/equipo` | Invitar miembro al equipo | M Min | responde | cambia un estado; cambia el texto |
| `/dashboard/equipo` | Invitar miembro al equipo | CN Clínica Norte | responde | cambia un estado; cambia el texto |
| `/dashboard/equipo` | Invitar miembro al equipo | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/equipo` | Invitar miembro al equipo | Generar invitación local | responde | cambia el texto |
| `/dashboard/equipo` | hubly-dropdown | Mi vista (1) | ya activo | estaba seleccionado |
| `/dashboard/equipo` | hubly-dropdown | Todo el equipo (3) | responde | cambia un estado; cambia el texto |
| `/dashboard/equipo` | hubly-dropdown | Todas | sin efecto visible |  |
| `/dashboard/equipo` | hubly-dropdown | Café Bruma | responde | cambia el texto |
| `/dashboard/equipo` | hubly-dropdown | Min | responde | cambia el texto |
| `/dashboard/equipo` | hubly-dropdown | Clínica Norte | responde | cambia el texto |
| `/dashboard/equipo` | hubly-dropdown | Completar tarea en curso +25 XP | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/equipo` | hubly-dropdown | Registrar entrega activa +30 XP | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/equipo` | ventana | Editar marcas | responde | cambia un estado; cambia el texto |
| `/dashboard/equipo` | ventana | C Café Bruma | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/equipo` | ventana | M Min | sin efecto visible |  |
| `/dashboard/equipo` | ventana | C Clínica Norte | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/equipo` | Perfil de Lucía Ramírez | Cerrar perfil | responde | cierra una ventana; cambia el texto |
| `/dashboard/equipo` | Perfil de Diego Morales | Cerrar perfil | responde | cierra una ventana; cambia el texto |
| `/dashboard/equipo` | Perfil de Jair | Cerrar perfil | responde | cierra una ventana; cambia el texto |
| `/dashboard/equipo` | ventana | Cómo funcionan los puntos · Se miden por esfuerzo, no por cl | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Inicio | enlace | /dashboard |
| `/dashboard/salud-cuentas` | — | Cuentas | enlace | /dashboard/salud-cuentas |
| `/dashboard/salud-cuentas` | — | Equipo | enlace | /dashboard/equipo |
| `/dashboard/salud-cuentas` | — | Nueva marca | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | — | Declarar compromisos | responde | abre una ventana; cambia el texto |
| `/dashboard/salud-cuentas` | — | 7 días | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | 30 días | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Esta semana | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Este mes | ya activo | estaba seleccionado |
| `/dashboard/salud-cuentas` | — | Mes anterior | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Trimestre | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Todas 3 | ya activo | estaba seleccionado |
| `/dashboard/salud-cuentas` | — | Con pauta 2 | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Sin pauta 1 | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | En riesgo 1 | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Completas 1 | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Aplicar todas (7) | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Configurar por marca | responde | abre una ventana; cambia el texto |
| `/dashboard/salud-cuentas` | — | Ocultar | responde | cambia un estado; cambia el texto |
| `/dashboard/salud-cuentas` | — | Descartar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Aplicar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Descartar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Aplicar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Descartar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Aplicar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Descartar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Aplicar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Ver 3 más | responde | cambia el texto |
| `/dashboard/salud-cuentas` | — | Activar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Editar compromisos | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | — | Editar compromisos | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | — | Activar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | — | Editar compromisos | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Cerrar modal de nueva marca | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Cafetería & Panadería | responde | cambia un estado; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Hospitalidad & Diseño | ya activo | estaba seleccionado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Clínica Dermatológica | responde | cambia un estado; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Restaurante & Gastronomía | responde | cambia un estado; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | E-commerce & Moda | responde | cambia un estado; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Inmobiliaria & Arquitectura | responde | cambia un estado; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Tecnología / SaaS | responde | cambia un estado; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #16324F | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #C87A51 | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #2E5E4E | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #5B50D6 | ya activo | estaba seleccionado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #B88D40 | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #E11D48 | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #0EA5E9 | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #10B981 | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #7C3AED | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Seleccionar color #0F172A | responde | cambia un estado |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Disminuir Posts / mes | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Aumentar Posts / mes | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Disminuir Stories / mes | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Aumentar Stories / mes | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Disminuir Reels / mes | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Aumentar Reels / mes | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Disminuir Campañas Ads | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Aumentar Campañas Ads | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Cancelar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | Nueva marca / Cuenta de cliente | Crear marca | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Cerrar sugerencias automáticas | responde | cierra una ventana; cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Recomendaciones por marca (7) | sin efecto visible |  |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Métricas semanales de pauta | responde | cambia un estado; cambia el texto; cambia un campo |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Disminuir meta sugerida para Café Bruma | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Aumentar meta sugerida para Café Bruma | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Descartar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Aplicar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Disminuir meta sugerida para Min | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Aumentar meta sugerida para Min | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Disminuir meta sugerida para Clínica Norte | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Aumentar meta sugerida para Clínica Norte | responde | cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Cancelar | responde | cierra una ventana; cambia el texto |
| `/dashboard/salud-cuentas` | Sugerencias automáticas de compromisos | Aplicar todas las sugerencias (7) | responde | cierra una ventana; cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | hubly-salud-actions | Activar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/dashboard/salud-cuentas` | hubly-salud-actions | Cerrar edición | responde | cambia un estado; cambia el texto; cambia un campo |
| `/calendario` | — | Revisar | responde | navega a /parrillas; cambia un estado |
| `/calendario` | — | Actividad | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/calendario` | — | Anterior | responde | cambia el texto |
| `/calendario` | — | Siguiente | responde | cambia el texto |
| `/calendario` | — | Ir a hoy | sin efecto visible |  |
| `/calendario` | — | Lista | ya activo | estaba seleccionado |
| `/calendario` | — | Mes | responde | cambia un estado; cambia el texto |
| `/calendario` | — | Por marca | responde | cambia un estado; cambia el texto |
| `/calendario` | — | Filtros | responde | abre una ventana; cambia un estado; cambia el texto |
| `/calendario` | — | Exportar reporte mensual de octubre con resultados de Meta A | responde | navega a /tareas; cambia un estado |
| `/calendario` | — | Grabar 2 cápsulas de fotoprotección con la Dra. Lozano Tarea | responde | navega a /tareas; cambia un estado |
| `/calendario` | — | Conecta las redes de tu cliente Tarea · Min | responde | navega a /tareas; cambia un estado |
| `/calendario` | — | Ajustar horario a 8:00 am en post de panqué de cardamomo Tar | responde | navega a /tareas; cambia un estado |
| `/calendario` | — | Mandar liga de parrilla de noviembre a Elena por WhatsApp Ta | responde | navega a /tareas; cambia un estado |
| `/calendario` | — | Tueste de la semana · Coatepec lavado Carrusel · Café Bruma  | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo (editor: lo cubre compositor.spec) |
| `/calendario` | Nueva actividad | Cerrar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/calendario` | Nueva actividad | Junta | ya activo | estaba seleccionado |
| `/calendario` | Nueva actividad | Grabación | responde | cambia un estado |
| `/calendario` | Nueva actividad | Actividad | responde | cambia un estado |
| `/calendario` | Nueva actividad | 30 min | responde | cambia un campo |
| `/calendario` | Nueva actividad | 1 h | responde | cambia un campo |
| `/calendario` | Nueva actividad | 2 h | responde | cambia un campo |
| `/calendario` | Nueva actividad | Todo el día | responde | cambia el texto; cambia un campo |
| `/calendario` | Nueva actividad | No se repite | ya activo | estaba seleccionado |
| `/calendario` | Nueva actividad | Diario | responde | cambia un estado |
| `/calendario` | Nueva actividad | Semanal | responde | cambia un estado |
| `/calendario` | Nueva actividad | Quincenal | responde | cambia un estado |
| `/calendario` | Nueva actividad | Mensual | responde | cambia un estado |
| `/calendario` | Nueva actividad | Auto | ya activo | estaba seleccionado |
| `/calendario` | Nueva actividad | Color #E59A9A | responde | cambia un estado |
| `/calendario` | Nueva actividad | Color #F2B37A | responde | cambia un estado |
| `/calendario` | Nueva actividad | Color #9BD08F | responde | cambia un estado |
| `/calendario` | Nueva actividad | Color #94A3DD | responde | cambia un estado |
| `/calendario` | Nueva actividad | Color #C6A2DF | responde | cambia un estado |
| `/calendario` | Nueva actividad | Color #7CC4C4 | responde | cambia un estado |
| `/calendario` | Nueva actividad | Cancelar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/calendario` | Nueva actividad | Crear actividad | sin efecto visible |  |
| `/calendario` | Filtros | C Café Bruma | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | M Min | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | C Clínica Norte | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Instagram | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Facebook | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | TikTok | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | LinkedIn | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | YouTube | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | X | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Threads | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Pinterest | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Imagen | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Video | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Carrusel | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Reel | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Story | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Solo texto | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Posts | responde | cambia un estado; cambia el texto |
| `/calendario` | Filtros | Actividades | responde | cambia un estado; cambia el texto |
| `/tareas` | — | ≡ Listas | ya activo | estaba seleccionado |
| `/tareas` | — | Libretas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Contenido | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Nueva lista | responde | cambia el texto; cambia un campo |
| `/tareas` | — | Cards | ya activo | estaba seleccionado |
| `/tareas` | — | Kanban | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Tabla | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Calendario | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Timeline | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Proyectos | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Agrupar las tareas | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Cambiar orden | responde | cambia un estado |
| `/tareas` | — | Elige qué se ve en cada tarea | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Filtrar tareas | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | — | Opciones de Primeros pasos | responde | abre una ventana; cambia un estado; cambia el texto |
| `/tareas` | — | Conecta las redes de tu cliente J Hoy | responde | abre una ventana; cambia el texto; cambia un campo |
| `/tareas` | — | Completar Conecta las redes de tu cliente | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/tareas` | — | Manda tu primer reporte J Mañana | responde | abre una ventana; cambia el texto; cambia un campo |
| `/tareas` | — | Completar Manda tu primer reporte | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/tareas` | — | Nueva lista | responde | cambia el texto; cambia un campo |
| `/tareas` | ventana | Agrupar las tareas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | ventana | Cambiar orden | responde | cambia un estado |
| `/tareas` | ventana | Elige qué se ve en cada tarea | responde | abre una ventana; cambia un estado; cambia el texto |
| `/tareas` | ventana | Filtrar tareas | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/tareas` | ventana | Opciones de Primeros pasos | responde | cambia un estado; cambia el texto |
| `/tareas` | Editar tarea | Cerrar | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/tareas` | Editar tarea | Resaltar como prioridad | ya activo | estaba seleccionado |
| `/tareas` | Editar tarea | Eliminar | responde | abre una ventana; cambia el texto |
| `/tareas` | Editar tarea | Guardar | responde | cierra una ventana; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/chat` | — | Tu cuenta · en línea | responde | cambia el texto; cambia un campo |
| `/chat` | — | Nueva conversación | responde | cambia el texto; cambia un campo |
| `/chat` | — | Mensajes directos 1 | responde | cambia el texto |
| `/chat` | — | Cerrar Mensajes directos | responde | cambia el texto |
| `/chat` | — | J Jair (tú) | responde | cambia el texto; cambia un campo |
| `/chat` | — | # General Sin mensajes aún | responde | cambia el texto; cambia un campo |
| `/chat` | — | M Min 3 canales | responde | cambia el texto; cambia un campo |
| `/notificaciones` | — | Marcar todo como leído | deshabilitado |  |
| `/ia` | — | Conectar las redes | enlace | /parrillas |
| `/ia` | — | Traer mis diseños | enlace | /archivos |
| `/ia` | — | Invitar a mi equipo | enlace | /ajustes?tab=equipo |
| `/ia` | — | ¿Qué hay pendiente? | enlace | /tareas |
| `/ia` | — | Dame ideas de contenido para esta semana | responde | cambia el texto |
| `/ia` | — | Analiza qué tipo de posts funcionan mejor | responde | cambia el texto |
| `/ia` | — | Ayúdame a armar una estrategia de anuncios | responde | cambia el texto |
| `/ia` | — | Escribe un copy para Instagram | responde | cambia el texto |
| `/ia` | — | Usar una plantilla | responde | cambia el texto |
| `/ia` | — | Enviar mensaje a Hubi | deshabilitado |  |
| `/marcas` | — | Nueva marca | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/marcas` | — | Cards | ya activo | estaba seleccionado |
| `/marcas` | — | Tabla | responde | cambia un estado; cambia el texto |
| `/marcas` | — | Por usuario | responde | cambia un estado; cambia el texto |
| `/marcas` | — | Ver archivadas (0) | responde | cambia el texto |
| `/marcas` | — | Café Bruma | responde | navega a /marca; cambia un estado; intenta guardar (bloqueado) |
| `/marcas` | — | Archivar Café Bruma | responde | cambia el texto; intenta guardar (bloqueado) |
| `/marcas` | — | Min | responde | navega a /marca; cambia un estado; intenta guardar (bloqueado) |
| `/marcas` | — | Archivar Min | deshabilitado |  |
| `/marcas` | — | Clínica Norte | responde | navega a /marca; cambia un estado; intenta guardar (bloqueado) |
| `/marcas` | — | Archivar Clínica Norte | responde | cambia el texto; intenta guardar (bloqueado) |
| `/marcas` | Nueva marca / Cuenta de cliente | Cerrar modal de nueva marca | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Cafetería & Panadería | responde | cambia un estado; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Hospitalidad & Diseño | ya activo | estaba seleccionado |
| `/marcas` | Nueva marca / Cuenta de cliente | Clínica Dermatológica | responde | cambia un estado; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Restaurante & Gastronomía | responde | cambia un estado; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | E-commerce & Moda | responde | cambia un estado; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Inmobiliaria & Arquitectura | responde | cambia un estado; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Tecnología / SaaS | responde | cambia un estado; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #16324F | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #C87A51 | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #2E5E4E | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #5B50D6 | ya activo | estaba seleccionado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #B88D40 | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #E11D48 | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #0EA5E9 | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #10B981 | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #7C3AED | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Seleccionar color #0F172A | responde | cambia un estado |
| `/marcas` | Nueva marca / Cuenta de cliente | Disminuir Posts / mes | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Aumentar Posts / mes | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Disminuir Stories / mes | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Aumentar Stories / mes | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Disminuir Reels / mes | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Aumentar Reels / mes | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Disminuir Campañas Ads | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Aumentar Campañas Ads | responde | cambia el texto |
| `/marcas` | Nueva marca / Cuenta de cliente | Cancelar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `/marcas` | Nueva marca / Cuenta de cliente | Crear marca | responde | cambia el texto |
| `/marca` | — | Guardar | responde | cambia el texto; intenta guardar (bloqueado) |
| `/marca` | — | Agregar persona | responde | cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/marca` | — | Aceptada | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/marca` | — | Eliminar Fernanda Ríos | responde | abre una ventana; cambia el texto |
| `/marca` | — | Aceptada | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/marca` | — | Eliminar Rodrigo Castellanos | responde | abre una ventana; cambia el texto |
| `/marca` | — | Aceptada | responde | cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `/marca` | — | Eliminar Camila Vega | responde | abre una ventana; cambia el texto |
| `/marca` | ¿Eliminar a «Fernanda Ríos»? | Cancelar | responde | cierra una ventana; cambia el texto |
| `/marca` | ¿Eliminar a «Fernanda Ríos»? | Eliminar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/marca` | ¿Eliminar a «Rodrigo Castellanos»? | Cancelar | responde | cierra una ventana; cambia el texto |
| `/marca` | ¿Eliminar a «Rodrigo Castellanos»? | Eliminar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/marca` | ¿Eliminar a «Camila Vega»? | Cancelar | responde | cierra una ventana; cambia el texto |
| `/marca` | ¿Eliminar a «Camila Vega»? | Eliminar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/archivos` | — | Ver proyectos | responde | cambia un estado; cambia el texto; cambia un campo |
| `/archivos` | — | Inicio de la biblioteca | sin efecto visible |  |
| `/archivos` | — | Carpeta | responde | cambia el texto; cambia un campo |
| `/archivos` | — | Subir | responde | abre el selector de archivos |
| `/archivos` | — | Subir archivos | responde | abre el selector de archivos |
| `/proyectos` | — | Buscar proyecto | responde | cambia el contenido; cambia un campo |
| `/proyectos` | — | Filas | ya activo | estaba seleccionado |
| `/proyectos` | — | Kanban | responde | cambia un estado; cambia el texto |
| `/proyectos` | — | Tabla | responde | cambia un estado; cambia el texto |
| `/proyectos` | — | Nuevo proyecto | responde | cambia el texto; cambia un campo |
| `/proyectos` | — | C Campaña Botas Chelsea Edición Numerada Documental corto en | responde | abre una ventana; cambia el texto; cambia un campo |
| `/proyectos` | — | Fijar Campaña Botas Chelsea Edición Numerada | responde | cambia un estado; intenta guardar (bloqueado) |
| `/proyectos` | — | Archivar Campaña Botas Chelsea Edición Numerada | responde | cambia el texto; intenta guardar (bloqueado) |
| `/proyectos` | — | Eliminar Campaña Botas Chelsea Edición Numerada | responde | abre una ventana; cambia el texto |
| `/proyectos` | Editar Campaña Botas Chelsea Edición Numerada | Cerrar | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/proyectos` | Editar Campaña Botas Chelsea Edición Numerada | Cancelar | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/proyectos` | Editar Campaña Botas Chelsea Edición Numerada | Guardar | responde | cierra una ventana; cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/proyectos` | ¿Eliminar el proyecto «Campaña Botas Chelsea Edici | Cancelar | responde | cierra una ventana; cambia el texto |
| `/proyectos` | ¿Eliminar el proyecto «Campaña Botas Chelsea Edici | Eliminar | responde | cierra una ventana; cambia el texto; intenta guardar (bloqueado) |
| `/parrillas` | — | Calendario | ya activo | estaba seleccionado |
| `/parrillas` | — | Ideas | responde | cambia un estado; cambia el texto; cambia un campo |
| `/parrillas` | — | Mensajes | responde | cambia un estado; cambia el texto |
| `/parrillas` | — | Analytics | responde | cambia un estado; cambia el texto |
| `/parrillas` | — | Tableros | responde | cambia un estado; cambia el texto; cambia un campo |
| `/parrillas` | — | Reportes | responde | cambia un estado; cambia el texto |
| `/parrillas` | — | Links | responde | cambia un estado; cambia el texto |
| `/parrillas` | — | Cuentas | responde | cambia el texto |
| `/parrillas` | — | Traer mi mes | responde | abre una ventana; cambia el texto; cambia un campo |
| `/parrillas` | — | Instagram | responde | cambia el texto |
| `/parrillas` | — | Facebook | responde | cambia el texto |
| `/parrillas` | — | TikTok | responde | cambia el texto |
| `/parrillas` | — | LinkedIn | responde | cambia el texto |
| `/parrillas` | — | Más redes (YouTube, X, Threads, Pinterest, Reddit, Google Bu | responde | cambia el texto |
| `/parrillas` | — | Mandarle la liga a mi cliente | enlace | /share/min-nov |
| `/parrillas` | — | Ver con datos de ejemplo → | responde | cambia un estado; cambia el texto |
| `/parrillas` | — | Probar con datos de ejemplo | responde | cambia un estado; cambia el texto |
| `/parrillas` | — | Abrir el chat | enlace | /chat |
| `/parrillas` | Traer mi mes | Cerrar | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/parrillas` | Traer mi mes | Elegir archivo CSV o XLSX | responde | abre el selector de archivos |
| `/parrillas` | Traer mi mes | Continuar con lo pegado | deshabilitado |  |
| `/reportes` | — | Calendario | enlace | /parrillas?tab=calendario |
| `/reportes` | — | Ideas | enlace | /parrillas?tab=ideas |
| `/reportes` | — | Mensajes | enlace | /parrillas?tab=mensajes |
| `/reportes` | — | Analytics | enlace | /anuncios |
| `/reportes` | — | Tableros | enlace | /parrillas?tab=tableros |
| `/reportes` | — | Links | enlace | /parrillas?tab=liga |
| `/reportes` | — | Cuentas | enlace | /parrillas |
| `/reportes` | — | Vista vacía Hubi | responde | cambia un estado; cambia el texto |
| `/reportes` | — | Reporte Ejecutivo Imprimible | ya activo | estaba seleccionado |
| `/reportes` | — | Exportar PDF | responde | abre la impresión |
| `/reportes` | — | Nuevo | responde | cambia un campo |
| `/reportes` | — | Nuevo reporte | responde | cambia un campo |
| `/anuncios` | — | Tableros | sin efecto visible |  |
| `/anuncios` | — | Anuncios | sin efecto visible |  |
| `/anuncios` | — | Ideas | sin efecto visible |  |
| `/anuncios` | — | Reportes | enlace | /reportes |
| `/anuncios` | — | Buscar anuncios | responde | cambia el contenido |
| `/anuncios` | — | Cards | sin efecto visible |  |
| `/anuncios` | — | Tabla | responde | cambia el texto |
| `/anuncios` | — | Funnels | responde | cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | — | Ver ejemplo | responde | abre una ventana; cambia el texto |
| `/anuncios` | Ejemplo de diagnóstico | Cerrar | responde | cierra una ventana; cambia el texto |
| `/crm` | — | Nueva cotización | deshabilitado |  |
| `/crm` | — | Nuevo prospecto | responde | abre una ventana; cambia el texto; cambia un campo |
| `/crm` | — | Pipeline | ya activo | estaba seleccionado |
| `/crm` | — | Prospectos | responde | cambia un estado; cambia el texto |
| `/crm` | — | Cotizaciones | responde | cambia un estado; cambia el texto |
| `/crm` | Nuevo prospecto | Cerrar | responde | cierra una ventana; cambia el texto; cambia un campo |
| `/crm` | Nuevo prospecto | Guardar | sin efecto visible |  |
| `/automatizaciones` | — | Activar | responde | cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/automatizaciones` | — | Activar | responde | cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/automatizaciones` | — | Activar | responde | cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/automatizaciones` | — | Activar | responde | cambia el texto; cambia un campo; intenta guardar (bloqueado) |
| `/automatizaciones` | — | Crear regla | sin efecto visible |  |
| `/ajustes` | — | Mi perfil | responde | navega a /ajustes?tab=perfil |
| `/ajustes` | — | Mi cuenta | responde | navega a /ajustes?tab=cuenta; cambia un estado |
| `/ajustes` | — | Notificaciones | responde | navega a /ajustes?tab=notificaciones; cambia un estado |
| `/ajustes` | — | Integraciones | responde | navega a /ajustes?tab=integraciones; cambia un estado |
| `/ajustes` | — | Equipo | responde | navega a /ajustes?tab=equipo; cambia un estado |
| `/ajustes` | — | Roles | responde | navega a /ajustes?tab=roles; cambia un estado |
| `/ajustes` | — | Marcas | responde | navega a /ajustes?tab=marcas; cambia un estado |
| `/ajustes` | — | Suscripción | responde | navega a /ajustes?tab=facturacion; cambia un estado |
| `/ajustes` | — | Uso | responde | navega a /ajustes?tab=uso; cambia un estado |
| `/ajustes` | — | Recomienda Hubly | responde | navega a /ajustes?tab=recomienda; cambia un estado |
| `/ajustes` | — | Cerrar sesión | omitido | acción de sesión |
| `/ajustes` | — | Agregar foto de perfil | responde | abre el selector de archivos |
| `/ajustes` | — | Cambiar foto | responde | abre el selector de archivos |
| `/ajustes` | — | Guardar | deshabilitado |  |
| `/ajustes` | — | Claro | ya activo | estaba seleccionado |
| `/ajustes` | — | Oscuro | responde | cambia la clase de la página; cambia un estado |
| `(sidebar y Hubi)` | — | Colapsar barra lateral | responde | cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Hubly · Ir al Dashboard | enlace | /dashboard |
| `(sidebar y Hubi)` | — | Inicio | ya activo | estaba seleccionado |
| `(sidebar y Hubi)` | — | Hubi | responde | cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Chats | responde | cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Notificaciones | responde | abre una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Dashboard | enlace | /dashboard |
| `(sidebar y Hubi)` | — | Chat | enlace | /chat |
| `(sidebar y Hubi)` | — | Mi espacio 2 | enlace | /tareas |
| `(sidebar y Hubi)` | — | Calendario | enlace | /calendario |
| `(sidebar y Hubi)` | — | CRM | enlace | /crm |
| `(sidebar y Hubi)` | — | Marcas | enlace | /marcas |
| `(sidebar y Hubi)` | — | Automatizaciones | enlace | /automatizaciones |
| `(sidebar y Hubi)` | — | Cambiar marca activa (Min) | responde | abre una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Nueva marca | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | — | Núcleo de marca | enlace | /marca |
| `(sidebar y Hubi)` | — | Content Manager | enlace | /archivos |
| `(sidebar y Hubi)` | — | Proyectos | enlace | /proyectos |
| `(sidebar y Hubi)` | — | Social Media | enlace | /parrillas |
| `(sidebar y Hubi)` | — | Ads | enlace | /anuncios |
| `(sidebar y Hubi)` | — | Cambiar tema | responde | cambia la clase de la página |
| `(sidebar y Hubi)` | — | Soporte de Hubly | responde | abre una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Buscar | responde | abre una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | — | Perfil de Jair (Dueño). Clic para editar perfil o espacio de | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | — | Ir a Ajustes | enlace | /ajustes |
| `(sidebar y Hubi)` | Seleccionar marca activa | CB Café Bruma | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Seleccionar marca activa | M Min | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Seleccionar marca activa | CN Clínica Norte | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Seleccionar marca activa | Nueva marca | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Cerrar modal de nueva marca | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Cafetería & Panadería | responde | cambia un estado; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Hospitalidad & Diseño | ya activo | estaba seleccionado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Clínica Dermatológica | responde | cambia un estado; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Restaurante & Gastronomía | responde | cambia un estado; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | E-commerce & Moda | responde | cambia un estado; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Inmobiliaria & Arquitectura | responde | cambia un estado; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Tecnología / SaaS | responde | cambia un estado; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #16324F | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #C87A51 | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #2E5E4E | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #5B50D6 | ya activo | estaba seleccionado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #B88D40 | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #E11D48 | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #0EA5E9 | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #10B981 | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #7C3AED | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Seleccionar color #0F172A | responde | cambia un estado |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Disminuir Posts / mes | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Aumentar Posts / mes | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Disminuir Stories / mes | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Aumentar Stories / mes | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Disminuir Reels / mes | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Aumentar Reels / mes | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Disminuir Campañas Ads | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Aumentar Campañas Ads | responde | cambia el texto |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Cancelar | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Nueva marca / Cuenta de cliente | Crear marca | responde | cambia el texto |
| `(sidebar y Hubi)` | Hubi | Expandir el panel de Hubi | responde | cambia un estado |
| `(sidebar y Hubi)` | Hubi | Cerrar Hubi | responde | cierra una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | Hubi | Conectar las redes | responde | cambia el texto |
| `(sidebar y Hubi)` | Hubi | Traer mis diseños y programarlos | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo (editor: lo cubre compositor.spec) |
| `(sidebar y Hubi)` | Hubi | Invitar a mi equipo | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Hubi | Estatus del proyecto | responde | cambia el texto |
| `(sidebar y Hubi)` | Hubi | Enviar consulta a Hubi | deshabilitado |  |
| `(sidebar y Hubi)` | Resultados de búsqueda | Crear o programar post Abre el compositor de posts, Reels y  | responde | abre una ventana; cambia un estado; cambia el texto; cambia un campo (editor: lo cubre compositor.spec) |
| `(sidebar y Hubi)` | Resultados de búsqueda | Crear marca Configura identidad y compromisos mensuales | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Resultados de búsqueda | Invitar al equipo Genera una invitación con rol y marcas asi | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Resultados de búsqueda | Revisar sugerencias Compromisos propuestos según el cumplimi | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | Resultados de búsqueda | Configurar widgets Mostrar, ocultar, cambiar columna o reord | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | Resultados de búsqueda | Pregúntale a Hubi Consulta tareas vencidas, salud de cuentas | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | Resultados de búsqueda | Dashboard · Inicio Resumen operativo, tareas, libretas y apr | responde | cierra una ventana; cambia un estado; cambia el texto |
| `(sidebar y Hubi)` | Resultados de búsqueda | Dashboard · Salud de cuentas Cumplimiento de entregas, presu | responde | navega a /dashboard/salud-cuentas; cierra una ventana; cambia un estado |
| `(sidebar y Hubi)` | Resultados de búsqueda | Dashboard · Equipo Carga operativa, actividad semanal e invi | responde | navega a /dashboard/equipo; cierra una ventana; cambia un estado |
| `(sidebar y Hubi)` | Resultados de búsqueda | Mi espacio · Tareas y libretas Entregables y notas de estrat | responde | navega a /tareas; cierra una ventana; cambia un estado |
| `(sidebar y Hubi)` | Resultados de búsqueda | Calendario Planeación mensual de posts | responde | navega a /calendario; cierra una ventana; cambia un estado |
| `(sidebar y Hubi)` | Resultados de búsqueda | Social Media · Parrillas Parrilla de posts y flujo de aproba | responde | navega a /parrillas; cierra una ventana; cambia un estado |
| `(sidebar y Hubi)` | Resultados de búsqueda | CB Café Bruma (@cafebruma) Cafetería de especialidad y tosta | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Resultados de búsqueda | M Min (@min) minerales y cristales decorativos al mayoreo ·  | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Resultados de búsqueda | CN Clínica Norte (@clinicanorte.derma) Dermatología clínica  | responde | cierra una ventana; cambia un estado; cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Resultados de búsqueda | TU PRIMER POST N° 01 · OCT 26 Guía de operación | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Resultados de búsqueda | REPORTES SIN POWERPOINT N° 02 · OCT 26 Reportes en vivo | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Resultados de búsqueda | TU DÍA EN MI ESPACIO N° 03 · OCT 26 Productividad | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Resultados de búsqueda | NÚCLEO DE MARCA N° 04 · OCT 26 Estrategia IA | responde | abre una ventana; cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Resultados de búsqueda | Conecta las redes de tu cliente Min · Jair · Vence hoy Alta | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Resultados de búsqueda | Manda tu primer reporte Min · Jair · Vence mañana Alta | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Resultados de búsqueda | Ajustar horario a 8:00 am en post de panqué de cardamomo Caf | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Resultados de búsqueda | Mandar liga de parrilla de noviembre a Elena por WhatsApp Ca | responde | navega a /tareas; cierra una ventana; cambia un estado; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Editar perfil y espacio de trabajo | Cerrar menú de perfil | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Editar perfil y espacio de trabajo | Guardar perfil | responde | cambia el texto; intenta guardar (bloqueado) |
| `(sidebar y Hubi)` | Editar perfil y espacio de trabajo | Mi Agencia (Principal) | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
| `(sidebar y Hubi)` | Editar perfil y espacio de trabajo | Agencia Norte (Workspace B) | responde | cierra una ventana; cambia un estado; cambia el texto; cambia un campo |
