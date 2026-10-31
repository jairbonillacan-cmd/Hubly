# Matriz de controles de Hubly

Generada con `npm run audit:controles` en modo demo el 2026-10-31. Cubre botones, enlaces y pestañas visibles al cargar cada ruta, sin sidebar.

**Qué significa:** «responde» indica que pulsar cambió la página, sin error; no prueba que el resultado sea correcto ni que persista, porque la auditoría bloquea las escrituras. La persistencia y los permisos se prueban en `e2e/` y `tests/`. «Sin efecto visible» pide revisión manual: puede ser un botón muerto o un cambio que esta firma no detecta. No cubre controles dentro de ventanas abiertas.

**Totales:** 222 controles · 154 responden · 23 enlaces · 33 sin efecto visible · 4 deshabilitados · 0 con error · 7 sin poder probar · 1 omitidos.

Alias con la misma pantalla: `/equipo` → `/dashboard/equipo`, `/salud` → `/dashboard/salud-cuentas`, `/estrategia` → `/marca`.

| Ruta | Control | Resultado | Detalle |
|---|---|---|---|
| `/dashboard` | Inicio | enlace | /dashboard |
| `/dashboard` | Cuentas | enlace | /dashboard/salud-cuentas |
| `/dashboard` | Equipo | enlace | /dashboard/equipo |
| `/dashboard` | 3 pendientes | responde |  |
| `/dashboard` | Nuevo post | responde |  |
| `/dashboard` | Nueva marca | responde |  |
| `/dashboard` | Invitar equipo | responde |  |
| `/dashboard` | Buscar | responde |  |
| `/dashboard` | + Widget | responde |  |
| `/dashboard` | Editar | responde |  |
| `/dashboard` | Min (3) | responde |  |
| `/dashboard` | Nueva | responde |  |
| `/dashboard` | Ver completadas (1) | responde |  |
| `/dashboard` | Mi Espacio → | enlace | /tareas |
| `/dashboard` | Nota | responde |  |
| `/dashboard` | TU PRIMER POST N° 01 · OCT 26 | responde |  |
| `/dashboard` | REPORTES SIN POWERPOINT ★ N° 02 · OCT 26 | responde |  |
| `/dashboard` | TU DÍA EN MI ESPACIO N° 03 · OCT 26 | responde |  |
| `/dashboard` | NÚCLEO DE MARCA N° 04 · OCT 26 | responde |  |
| `/dashboard` | Ver libretas → | enlace | /libretas |
| `/dashboard` | Calendario → | enlace | /calendario |
| `/dashboard` | Ver todas → | enlace | /parrillas |
| `/dashboard/equipo` | Inicio | enlace | /dashboard |
| `/dashboard/equipo` | Cuentas | enlace | /dashboard/salud-cuentas |
| `/dashboard/equipo` | Equipo | enlace | /dashboard/equipo |
| `/dashboard/equipo` | 7 días | sin efecto visible |  |
| `/dashboard/equipo` | 30 días | sin efecto visible |  |
| `/dashboard/equipo` | 90 días | sin efecto visible |  |
| `/dashboard/equipo` | Invitar | responde |  |
| `/dashboard/equipo` | Filtros | responde |  |
| `/dashboard/equipo` | Editar marcas | responde |  |
| `/dashboard/equipo` | Semana | sin efecto visible |  |
| `/dashboard/equipo` | Mes | responde |  |
| `/dashboard/equipo` | Ver todos los logros (39) | responde |  |
| `/dashboard/equipo` | Hoy | responde |  |
| `/dashboard/equipo` | Ver perfil 🥇 L Lucía Ramírez Diseño y Dirección de Arte · 1 | responde |  |
| `/dashboard/equipo` | Ver perfil | responde |  |
| `/dashboard/equipo` | Ver perfil 🥈 D Diego Morales Paid Media y Analítica · 8 tar | responde |  |
| `/dashboard/equipo` | Ver perfil 🥉 J Jair (tú) Dueño · 0 tareas · 0 posts 63 pts  | no reproducible |  |
| `/dashboard/equipo` | Cómo funcionan los puntos · Se miden por esfuerzo, no por cl | responde |  |
| `/dashboard/salud-cuentas` | Inicio | enlace | /dashboard |
| `/dashboard/salud-cuentas` | Cuentas | enlace | /dashboard/salud-cuentas |
| `/dashboard/salud-cuentas` | Equipo | enlace | /dashboard/equipo |
| `/dashboard/salud-cuentas` | Revisar sugerencias 7 | responde |  |
| `/dashboard/salud-cuentas` | Empezar → | responde |  |
| `/dashboard/salud-cuentas` | Sugerencias automáticas (7) | responde |  |
| `/dashboard/salud-cuentas` | Ocultar reglas activas | responde |  |
| `/dashboard/salud-cuentas` | 7 días | responde |  |
| `/dashboard/salud-cuentas` | 30 días | responde |  |
| `/dashboard/salud-cuentas` | Esta semana | responde |  |
| `/dashboard/salud-cuentas` | Este mes | sin efecto visible |  |
| `/dashboard/salud-cuentas` | Custom | responde |  |
| `/dashboard/salud-cuentas` | Periodo: Este mes | responde |  |
| `/dashboard/salud-cuentas` | + Nueva marca | responde |  |
| `/dashboard/salud-cuentas` | Todas 3 | sin efecto visible |  |
| `/dashboard/salud-cuentas` | Con pauta 2 | responde |  |
| `/dashboard/salud-cuentas` | Sin pauta 1 | responde |  |
| `/dashboard/salud-cuentas` | En riesgo 1 | responde |  |
| `/dashboard/salud-cuentas` | Completas 1 | responde |  |
| `/dashboard/salud-cuentas` | Ordenar cuentas | responde |  |
| `/dashboard/salud-cuentas` | Aplicar todas (7) | responde |  |
| `/dashboard/salud-cuentas` | Configurador por marca | responde |  |
| `/dashboard/salud-cuentas` | Descartar | responde |  |
| `/dashboard/salud-cuentas` | Aplicar | responde |  |
| `/dashboard/salud-cuentas` | C | responde |  |
| `/dashboard/salud-cuentas` | ✏️ Editar compromisos | responde |  |
| `/dashboard/salud-cuentas` | M | responde |  |
| `/calendario` | Revisar | responde |  |
| `/calendario` | Actividad | responde |  |
| `/calendario` | Anterior | responde |  |
| `/calendario` | Siguiente | responde |  |
| `/calendario` | Ir a hoy | sin efecto visible |  |
| `/calendario` | Lista | sin efecto visible |  |
| `/calendario` | Mes | responde |  |
| `/calendario` | Por marca | responde |  |
| `/calendario` | Filtros | responde |  |
| `/calendario` | Exportar reporte mensual de octubre con resultados de Meta A | responde |  |
| `/calendario` | Grabar 2 cápsulas de fotoprotección con la Dra. Lozano Tarea | responde |  |
| `/calendario` | E2E calendario 1793471683608 Imagen · Min | responde |  |
| `/calendario` | E2E calendario 1793471671804 Imagen · Min | responde |  |
| `/calendario` | asd Tarea · Min | responde |  |
| `/calendario` | Ajustar horario a 8:00 am en post de panqué de cardamomo Tar | responde |  |
| `/calendario` | Mandar liga de parrilla de noviembre a Elena por WhatsApp Ta | responde |  |
| `/calendario` | sda Tarea · Min | responde |  |
| `/calendario` | Tueste de la semana · Coatepec lavado Carrusel · Café Bruma  | responde |  |
| `/calendario` | asd Story · Min 11:30 | responde |  |
| `/tareas` | ≡ Listas | sin efecto visible |  |
| `/tareas` | Libretas | responde |  |
| `/tareas` | Contenido | responde |  |
| `/tareas` | Nueva lista | responde |  |
| `/tareas` | Cards | sin efecto visible |  |
| `/tareas` | Kanban | responde |  |
| `/tareas` | Tabla | responde |  |
| `/tareas` | Calendario | responde |  |
| `/tareas` | Timeline | responde |  |
| `/tareas` | Proyectos | responde |  |
| `/tareas` | Agrupar las tareas | responde |  |
| `/tareas` | Cambiar orden | responde |  |
| `/tareas` | Elige qué se ve en cada tarea | responde |  |
| `/tareas` | Filtrar tareas | responde |  |
| `/tareas` | Opciones de dsa | responde |  |
| `/tareas` | asd J Hoy | responde |  |
| `/tareas` | Completar asd | responde |  |
| `/tareas` | sda J Hoy | responde |  |
| `/tareas` | Completar sda | responde |  |
| `/tareas` | Opciones de Primeros pasos | responde |  |
| `/tareas` | Conecta las redes de tu cliente J Hoy | responde |  |
| `/tareas` | Completar Conecta las redes de tu cliente | responde |  |
| `/tareas` | Manda tu primer reporte J Mañana | responde |  |
| `/tareas` | Completar Manda tu primer reporte | responde |  |
| `/chat` | Tu cuenta · en línea | responde |  |
| `/chat` | Nueva conversación | responde |  |
| `/chat` | Mensajes directos 1 | responde |  |
| `/chat` | Cerrar Mensajes directos | responde |  |
| `/chat` | J Jair (tú) | responde |  |
| `/chat` | # General Sin mensajes aún | responde |  |
| `/chat` | M Min 3 canales | responde |  |
| `/notificaciones` | Marcar todo como leído | deshabilitado |  |
| `/ia` | Conectar las redes | responde |  |
| `/ia` | Traer mis diseños y programarlos | responde |  |
| `/ia` | Invitar a mi equipo | responde |  |
| `/ia` | ¿Qué hay pendiente? | responde |  |
| `/ia` | Dame ideas de contenido para esta semana | responde |  |
| `/ia` | Analiza qué tipo de posts funcionan mejor | responde |  |
| `/ia` | Ayúdame a armar una estrategia de anuncios | responde |  |
| `/ia` | Escribe un copy para Instagram | responde |  |
| `/ia` | Usar una plantilla | responde |  |
| `/ia` | Enviar mensaje a Hubi | sin efecto visible |  |
| `/marcas` | Nueva marca | responde |  |
| `/marcas` | Cards | sin efecto visible |  |
| `/marcas` | Tabla | responde |  |
| `/marcas` | Por usuario | responde |  |
| `/marcas` | CB Café Bruma @cafebruma Cafetería de especialidad y tostado | responde |  |
| `/marcas` | Archivar Café Bruma | no se pudo pulsar | locator.click: Timeout 2500ms exceeded. |
| `/marcas` | M Min @min minerales y cristales decorativos al mayoreo · Gu | responde |  |
| `/marcas` | Archivar Min | deshabilitado |  |
| `/marcas` | CN Clínica Norte @clinicanorte.derma Dermatología clínica y  | responde |  |
| `/marcas` | Archivar Clínica Norte | no se pudo pulsar | locator.click: Timeout 2500ms exceeded. |
| `/marca` | Guardar | responde |  |
| `/marca` | Agregar persona | responde |  |
| `/marca` | Aceptada | responde |  |
| `/marca` | Eliminar Fernanda Ríos | no reproducible |  |
| `/marca` | Eliminar Rodrigo Castellanos | no reproducible |  |
| `/marca` | Eliminar Camila Vega | no reproducible |  |
| `/archivos` | Ver proyectos | responde |  |
| `/archivos` | Inicio de la biblioteca | sin efecto visible |  |
| `/archivos` | Carpeta | responde |  |
| `/archivos` | Subir | sin efecto visible |  |
| `/proyectos` | Buscar proyecto | responde |  |
| `/proyectos` | Filas | sin efecto visible |  |
| `/proyectos` | Kanban | responde |  |
| `/proyectos` | Tabla | responde |  |
| `/proyectos` | Nuevo proyecto | responde |  |
| `/proyectos` | M Mes de Mapeo Digital de Lunares Serie de cápsulas en video | responde |  |
| `/proyectos` | Fijar Mes de Mapeo Digital de Lunares | responde |  |
| `/proyectos` | Archivar Mes de Mapeo Digital de Lunares | responde |  |
| `/proyectos` | Eliminar Mes de Mapeo Digital de Lunares | no reproducible |  |
| `/parrillas` | Calendario | sin efecto visible |  |
| `/parrillas` | Ideas | responde |  |
| `/parrillas` | Mensajes | responde |  |
| `/parrillas` | Analytics | responde |  |
| `/parrillas` | Tableros | responde |  |
| `/parrillas` | Reportes | responde |  |
| `/parrillas` | Links | responde |  |
| `/parrillas` | Cuentas | responde |  |
| `/parrillas` | Traer mi mes | responde |  |
| `/parrillas` | Instagram | responde |  |
| `/parrillas` | Facebook | responde |  |
| `/parrillas` | TikTok | responde |  |
| `/parrillas` | LinkedIn | responde |  |
| `/parrillas` | Más redes (YouTube, X, Threads, Pinterest, Reddit, Google Bu | responde |  |
| `/parrillas` | Mandarle la liga a mi cliente | enlace | /share/clinica-norte-nov |
| `/parrillas` | Ver con datos de ejemplo → | responde |  |
| `/parrillas` | Probar con datos de ejemplo | responde |  |
| `/parrillas` | Abrir el chat | enlace | /chat |
| `/reportes` | Calendario | enlace | /parrillas?tab=calendario |
| `/reportes` | Ideas | enlace | /parrillas?tab=ideas |
| `/reportes` | Mensajes | enlace | /parrillas?tab=mensajes |
| `/reportes` | Analytics | enlace | /anuncios |
| `/reportes` | Tableros | enlace | /parrillas?tab=tableros |
| `/reportes` | Links | enlace | /parrillas?tab=liga |
| `/reportes` | Cuentas | enlace | /parrillas |
| `/reportes` | Vista vacía Hubi | responde |  |
| `/reportes` | Reporte Ejecutivo Imprimible | sin efecto visible |  |
| `/reportes` | Exportar PDF | sin efecto visible |  |
| `/reportes` | Nuevo | sin efecto visible |  |
| `/reportes` | Nuevo reporte | sin efecto visible |  |
| `/anuncios` | Tableros | sin efecto visible |  |
| `/anuncios` | Anuncios | sin efecto visible |  |
| `/anuncios` | Ideas | sin efecto visible |  |
| `/anuncios` | Reportes | enlace | /reportes |
| `/anuncios` | Gasto Total | sin efecto visible |  |
| `/anuncios` | Visitas al perfil | sin efecto visible |  |
| `/anuncios` | Costo por visita al perfil | sin efecto visible |  |
| `/anuncios` | CTR Promedio | sin efecto visible |  |
| `/anuncios` | Buscar anuncios | responde |  |
| `/anuncios` | Cards | sin efecto visible |  |
| `/anuncios` | Tabla | responde |  |
| `/anuncios` | Funnels | responde |  |
| `/anuncios` | Analizar | responde |  |
| `/crm` | Nueva cotización | deshabilitado |  |
| `/crm` | Nuevo prospecto | responde |  |
| `/crm` | Pipeline | sin efecto visible |  |
| `/crm` | Prospectos | responde |  |
| `/crm` | Cotizaciones | responde |  |
| `/automatizaciones` | Activar | responde |  |
| `/automatizaciones` | Crear regla | sin efecto visible |  |
| `/ajustes` | Mi Perfil | sin efecto visible |  |
| `/ajustes` | Mi Cuenta | responde |  |
| `/ajustes` | Notificaciones | responde |  |
| `/ajustes` | Integraciones | responde |  |
| `/ajustes` | Equipo | responde |  |
| `/ajustes` | Roles | responde |  |
| `/ajustes` | Marcas | responde |  |
| `/ajustes` | Suscripción | responde |  |
| `/ajustes` | Uso | responde |  |
| `/ajustes` | Recomienda Hubly | responde |  |
| `/ajustes` | Cerrar sesión | omitido | acción de sesión |
| `/ajustes` | JA | deshabilitado |  |
| `/ajustes` | Guardar | responde |  |
| `/ajustes` | Claro | sin efecto visible |  |
| `/ajustes` | Oscuro | sin efecto visible |  |
