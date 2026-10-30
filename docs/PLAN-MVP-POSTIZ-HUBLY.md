# Plan de MVP: código de Postiz integrado en Hubly

Estado: propuesta de arquitectura e implementación; no se han integrado dependencias ni modificado la aplicación con este documento.

## 1. Decisiones del producto

- Incorporar el código fuente de Postiz al proyecto y adaptarlo. No limitar el trabajo a consumir una instancia externa mediante una API key.
- Mantener el frontend de Hubly y su objetivo de fidelidad visual a la referencia de Henry, sustituyendo nombre, logo y personaje por los de Hubly.
- Utilizar Supabase Auth para correo/contraseña, verificación, recuperación y Google. Una sola identidad y un solo acceso para el usuario.
- Utilizar PostgreSQL de Supabase para los datos de negocio y Supabase Storage para archivos privados.
- Cada agencia tiene equipo y marcas. Un usuario puede pertenecer a varias agencias y disponer de permisos distintos en cada una.
- La colaboración comparte los datos autorizados de una agencia; perfil, preferencias, notificaciones y vistas personales pertenecen al usuario.
- Mantener Postiz como backend y orquestador adaptados, ejecutados en procesos propios del producto. Incorporar su código no elimina la necesidad de ejecutar Redis, Temporal y sus dependencias de infraestructura.
- Priorizar un recorrido real completo antes de ampliar módulos. Facturación, anuncios pagados conectados, IA generativa y la reconstrucción completa de todos los módulos no son requisitos de la primera entrega funcional.

## 2. Estado actual comprobado

- El frontend ya tiene vistas separadas de Inicio, Salud de Cuentas y Equipo, selectores de dominio y repositorio de workspace. Estas piezas son candidatas a conservar, después de verificar su comportamiento.
- Login y registro todavía navegan al dashboard sin autenticar.
- La API selecciona archivos JSON por un workspaceId suministrado por el cliente. Esa separación de archivos no verifica propiedad ni membresía.
- El navegador persiste y puede enviar el workspace completo. Hay semillas y fixtures que no deben convertirse en datos reales de nuevas cuentas.
- El portal público busca un token y, si no coincide, utiliza la primera marca. Este comportamiento debe desaparecer antes de admitir usuarios reales.
- Existen dos hojas de estilos de aplicación y recursos antiguos de Henry junto a los de Hubly. Debe consolidarse el contrato visual sin romper la landing.

## 3. Base de código y responsabilidades

### Incorporación del fork

1. Seleccionar una versión estable de Postiz, fijar tag y commit y registrar el resultado de sus pruebas base.
2. Incorporar el árbol fuente necesario en `engine/postiz`, conservando su estructura de paquetes, historial de procedencia, licencia y una referencia upstream. Mantener `web` como frontend principal.
3. Conservar backend NestJS, bibliotecas de dominio/integraciones y orquestador Temporal. No activar el frontend original, marketplace, facturación ni funciones ajenas al MVP como entradas públicas del producto.
4. Mantener inicialmente separados los entornos de dependencias del frontend y del motor para evitar que la integración fuerce una actualización o degradación innecesaria de Next.js y React.
5. Compilar los ejecutables de producción desde ese código incorporado. No sustituirlos por una instancia remota estándar y afirmar que se ha integrado el código.
6. Agrupar extensiones propias en módulos Hubly y mantener un registro de parches sobre upstream. Evitar renombrar masivamente símbolos internos solo por apariencia.

### Reparto

| Pieza | Responsabilidad |
|---|---|
| Frontend Next.js de Hubly | Interfaz, navegación, formularios, previews y estados de interacción. |
| Backend Postiz adaptado | Sesión validada, membresías, permisos, servicios sociales y nuevos módulos de negocio de Hubly. |
| Orquestador Postiz/Temporal | Programación, ejecución de publicación, renovación de credenciales y reintentos. |
| Supabase Auth | Identidades y flujos de acceso. |
| PostgreSQL de Supabase | Modelos de negocio gestionados mediante Prisma y migraciones revisadas. |
| Supabase Storage | Archivos privados y acceso temporal autorizado. |
| Redis e infraestructura Temporal | Dependencias del motor; no se intentará alojarlas como funciones de Supabase. |

Las rutas API de Next.js actuarán como frontera de servidor cuando sea necesario. La autorización también se ejecutará en el backend: acceder directamente a un endpoint no podrá eludir los controles del frontend.

## 4. Identidad, agencias y permisos

### Identidad única

- Integrar Supabase SSR en Next.js conforme a la versión instalada. Validar tokens en servidor y conservar correctamente los cookies y encabezados de renovación.
- Adaptar el middleware/guard del backend de Postiz para verificar los tokens del proyecto Supabase: firma, emisor, audiencia y caducidad. Resolver después el usuario de negocio y sus membresías actuales.
- Añadir una relación única entre el subject de Supabase y el usuario del dominio Postiz. El alta del perfil de negocio debe ser idempotente.
- Desactivar los endpoints de login/registro heredados como alternativa pública. No generar una segunda contraseña o sesión Postiz para el usuario.
- El usuario nuevo entra a crear su agencia o a aceptar una invitación. No recibe acceso al workspace default ni a marcas de ejemplo.
- Gestionar acceso con Google y correo mediante las identidades de Supabase; no fusionar cuentas mediante reglas caseras basadas únicamente en un email recibido del cliente.
- Logout limpia estado y cachés privados del cliente. El cambio de agencia cancela solicitudes anteriores y carga solo el contexto autorizado nuevo.

### Entidades canónicas

| Concepto Hubly | Base Postiz a adaptar |
|---|---|
| Perfil de negocio | User enlazado con Supabase Auth. |
| Agencia | Organization. |
| Membresía | UserOrganization. |
| Marca | Customer ampliado con núcleo de marca y configuración de Hubly. |
| Cuenta social | Integration vinculada a organización y marca. |
| Publicación técnica por canal | Post y servicios de publicación existentes. |
| Medio | Media adaptado al almacenamiento privado. |

No crear dos sistemas independientes de agencias, usuarios y marcas. Las tablas nuevas de tareas, libretas, compromisos y otros módulos referenciarán las mismas entidades canónicas.

### Roles iniciales

| Rol | Facultades |
|---|---|
| Propietario | Agencia completa, equipo, asignaciones y transferencia de propiedad. |
| Administrador | Administración operativa de equipo, marcas y contenidos; sin transferir propiedad ni eliminar al último propietario. |
| Editor | Crear y editar contenido/tareas de marcas asignadas, enviar a revisión y programar versiones autorizadas. |
| Lector | Consultar las marcas asignadas sin modificar sus datos. |

Diseñador, copywriter y trafficker serán inicialmente cargos descriptivos; no strings libres que otorguen privilegios. El cliente externo utilizará permisos limitados del portal de revisión, sin convertirse en administrador de agencia.

Ampliar la autorización existente de Postiz para estos roles y permisos por marca. Nunca equiparar al propietario de una agencia con el superadministrador global del sistema.

### Aislamiento efectivo

- Toda entidad de negocio tendrá organización propietaria y, cuando corresponda, marca propietaria. Validar también que las relaciones entre entidades pertenecen a la misma organización.
- El identificador enviado en URL, cookie o body selecciona contexto, pero nunca concede acceso. Cada operación comprueba membresía activa y permisos en servidor.
- Acotar consultas, búsquedas, contadores, exportaciones, cachés, eventos y archivos. Revisar especialmente endpoints heredados y operaciones por ID.
- Usar una membresía por usuario/agencia y asignaciones explícitas para las marcas de editores y lectores.
- Consultar permisos actuales para que revocar acceso tenga efecto sin depender de información de roles obsoleta en el navegador.
- El rol de base de datos de la aplicación no será el superusuario de Supabase.

## 5. Base de datos y archivos

- Alojar los modelos Prisma del motor y las extensiones Hubly en un esquema privado del PostgreSQL de Supabase. No exponer ese esquema mediante la Data API ni conceder acceso directo a los roles anónimo/autenticado.
- El backend será la entrada de negocio autorizada. No se asumirá que las consultas Prisma reciben automáticamente el contexto de usuario o las políticas RLS de un cliente Supabase.
- Aplicar RLS a las superficies que se expongan mediante Supabase, especialmente Storage. Si se añade acceso directo a tablas en el futuro, será obligatorio diseñar y probar sus políticas antes de exponerlas.
- Las migraciones del negocio tendrán un único propietario: Prisma. Las de infraestructura y políticas estarán versionadas por separado; ninguna debe recrear o modificar indiscriminadamente los esquemas auth y storage.
- Guardar archivos en buckets privados. Servir vistas previas y descargas solo después de autorizar al usuario o al token de revisión, mediante acceso temporal.
- Adaptar el servicio de medios de Postiz para trabajar con referencias privadas de almacenamiento. La publicación futura debe obtener acceso válido al archivo cuando se ejecuta, sin depender de una URL temporal expirada.
- No publicar una carpeta completa de uploads sin autorización. Los tokens de las redes y las claves privilegiadas solo estarán disponibles para servicios del servidor que las necesiten.

## 6. Dominio editorial y motor de publicación

No utilizar un solo enum para representar revisión del cliente, cola técnica y resultado por red.

- Estado editorial: borrador, en revisión, cambios solicitados y aprobado.
- Estado de entrega por canal: sin programar, programando, programado, publicando, publicado, fallo, cancelando, cancelado y resultado pendiente de conciliación.
- Cada publicación tendrá versiones. La aprobación se vinculará a la versión revisada; cambiar texto o medios invalida esa aprobación.
- El backend solo permitirá programar una versión aprobada cuando el flujo de esa marca exija aprobación. Los borradores no se enviarán como órdenes de publicación ejecutables.
- Conservar el historial de autor, aprobación, programación y resultado de cada canal.
- Añadir idempotencia por organización/publicación/versión/canal/operación. Una respuesta perdida o un doble clic no debe duplicar órdenes.
- Registrar cambios de negocio y órdenes pendientes mediante un outbox transaccional. El ejecutor reutiliza los servicios y workflows de Postiz; no crear un segundo scheduler social independiente.
- Procesar eventos repetidos o fuera de orden de forma segura y conciliar periódicamente el estado técnico. Un timeout incierto se investiga antes de volver a publicar.
- Mostrar publicado únicamente después de la confirmación técnica correspondiente. Si el proveedor no permite asegurar el resultado, mostrarlo como pendiente de conciliación.
- Una cancelación en carrera con una publicación debe reflejar el resultado real; no prometer que contenido ya publicado fue retirado.
- No prometer exactamente una publicación ante proveedores externos: garantizar deduplicación interna y una política explícita para resultados ambiguos.

La primera integración real debe demostrar conexión, medios, aprobación, programación, ejecución, error y conciliación. Conservar los conectores upstream, pero habilitar y declarar soportados solo los que hayan sido configurados y probados.

## 7. Nuevos contratos y recorridos

Definir una API tipada/versionada del backend adaptado y generar su cliente para el frontend. No importar código de servidor de Postiz dentro del bundle del navegador.

Capacidades mínimas:

- Identidad actual, perfil y listado de agencias autorizadas.
- Crear agencia, seleccionar contexto, invitar, aceptar invitación y revocar membresías.
- CRUD de marcas con asignaciones y autorización.
- Conectar/desconectar cuentas mediante OAuth con state/PKCE cuando corresponda y callbacks bajo dominio de Hubly.
- CRUD de borradores/versiones, solicitud de revisión, decisiones, programación y cancelación.
- Medios privados, tareas, libretas, compromisos y preferencias de dashboard.
- Consultar trabajos/resultados y recibir sus eventos internos.

Reemplazar el guardado del workspace completo por operaciones sobre recursos con validación y control de versión. El frontend no podrá modificar perfil ajeno, roles, organizaciones propietarias o estados técnicos mediante un JSON arbitrario.

### Invitaciones

Crear invitaciones reales, asociadas a agencia, email y permisos. Usar token criptográfico de un solo uso, almacenado como hash, caducidad inicial de siete días y revocación. La aceptación requiere una identidad con email verificado coincidente. No añadir usuarios activos ficticios al enviar una invitación.

### Portal de revisión

Tokens aleatorios, revocables y con caducidad inicial de treinta días. Vincularlos a una marca y lote/versiones de revisión concretos. Token inválido, caducado o revocado no devuelve ninguna otra marca. El portal expone exclusivamente los datos y acciones de ese alcance; no descarga todo el workspace. Una firma introducida por el visitante no se presentará como identidad autenticada.

### Registro y primera entrada

Registro o Google → confirmación correspondiente → perfil → crear agencia o aceptar invitación → dashboard real. Las cuentas nuevas comienzan sin campañas, publicaciones, clientes o métricas inventadas. Los tutoriales pueden ser plantillas, claramente separadas de actividad realizada.

## 8. Convertir la interfaz en producto funcional

- Mantener la referencia visual y las sustituciones de marca acordadas. La lógica nueva debe alimentar esos componentes, no justificar otro rediseño improvisado.
- Consolidar el tema de la aplicación y retirar duplicaciones de componentes/estilos después de verificar sus consumidores.
- Conservar selectores útiles del frontend, trasladando al servidor los cálculos que dependen de datos o permisos autoritativos.
- Saludos, iniciales y fecha provienen del perfil y zona horaria. El equipo, pendientes, actividad y recomendaciones provienen de registros reales autorizados.
- Las recomendaciones iniciales serán reglas trazables con datos de origen. No presentarlas como generación de IA si no existe integración.
- El tiempo activo y los rankings no usarán bases artificiales heredadas de las semillas. Si todavía no hay medición suficiente, mostrar ausencia de datos.
- Cada acción tendrá estados de trabajo, éxito y error. Eliminar errores de guardado silenciados y confirmaciones anteriores a la persistencia.
- Mantener navegación por URL, Atrás/Adelante, recarga, accesibilidad, foco, Escape y alternativa de movimiento reducido.
- No cachear respuestas privadas por URL compartida. Las cachés de negocio incluyen usuario, agencia, marca y permisos o se invalidan explícitamente. Las respuestas de sesión no se compartirán mediante CDN.
- Mantener fixtures y reloj fijo solo en entornos de pruebas o demo explícita aislada. Quitar los parámetros de fixture/reset del API de producción.

## 9. Fases y puertas de aceptación

### Fase 0 — Congelar referencias y auditar el código incorporado

Inventariar módulos Postiz que se reutilizan y cambios necesarios en auth, permisos, OAuth, medios y publicación. Registrar tag/commit y pruebas base. Medir el estado actual de Hubly y preservar los cambios locales existentes. REA se utiliza para contrastar la referencia de Henry; el código abierto de Postiz se estudia directamente y se valida con pruebas.

Entrega: matriz reutilizar/adaptar/desarrollar, arquitectura, contrato visual, migraciones propuestas y patch log upstream.

### Fase 1 — Incorporar y arrancar el motor desde fuente

Agregar el código y builds del backend/orquestador al proyecto. Preparar Supabase de desarrollo y Compose para las dependencias del motor, con healthchecks y volúmenes. Comprobar acceso privado al esquema de negocio y compatibilidad de conexiones/migraciones.

Puerta: frontend, backend y workers arrancan de forma reproducible; no hay frontend Postiz ni endpoints administrativos expuestos por accidente.

### Fase 2 — Usuarios y separación de datos

Implementar correo/contraseña, Google, verificación, recuperación, membresías, selector de agencia, roles y marcas asignadas. Sustituir el repositorio JSON de la app real. Activar la autorización del backend y proteger archivos.

Puerta: dos agencias y tres usuarios pasan pruebas de acceso cruzado por UI, API y archivos; revocar una membresía retira el acceso. Una cuenta nueva nunca recibe datos de demostración ajenos.

### Fase 3 — Recorrido editorial real

Conectar las vistas existentes a datos persistentes. Implementar publicación/versiones, medios, tareas, invitaciones, revisión pública y decisiones del cliente. Los datos se conservan al cambiar de dispositivo.

Puerta: un miembro crea contenido, un revisor ve solo su lote, aprueba su versión y el dashboard refleja el evento. Cambiar la versión invalida la aprobación anterior.

### Fase 4 — Publicación con el código adaptado de Postiz

Integrar OAuth, conectores, outbox, idempotencia, Temporal, cancelación, resultados y conciliación. Ejecutar primero pruebas controladas con un proveedor de prueba y después con cuentas reales destinadas a validación.

Puerta: recorrido completo confirmado en al menos una red habilitada, reinicio seguro del worker, reintentos sin duplicación interna, resultado por canal y recuperación de una conexión caducada. No declarar integración real si faltan credenciales o aprobaciones del proveedor.

### Fase 5 — Calidad, observación y piloto

Validar Inicio, Cuentas, Equipo, shell, modales y móvil contra la referencia. Corregir errores de consola/hidratación, estados incompletos y acciones sin efecto. Instrumentar errores, trabajos atascados, fallos de auth y tiempos de operación sin registrar secretos. Probar backup, restauración, actualización y rollback.

Puerta: cuentas reales del piloto completan el recorrido y se cumplen los criterios funcionales, de aislamiento y visuales. La apertura pública se decide después del piloto.

## 10. Pruebas obligatorias

- Identidad: registro, email pendiente, Google, recuperación, expiración, logout y acceso directo a rutas/API privadas.
- Tenencia: usuario A de agencia A no lee ni modifica agencia B variando IDs, bodies, consultas, cabeceras, enlaces, archivos o suscripciones.
- Roles: editor no administra miembros ni gana permisos modificando su perfil; lector no escribe; no se elimina el último propietario.
- Contexto: cambiar agencia no muestra datos tardíos de la anterior; salir y entrar con otra cuenta no reutiliza sus cachés.
- Publicación: doble clic, timeout después de aceptar una orden, eventos duplicados, reinicio, edición concurrente, publicación parcial por red y cancelación en carrera.
- Revisión: token inválido/expirado/revocado no revela una marca; aprobación de versión antigua no autoriza contenido nuevo.
- Archivos: no listar ni descargar recursos de otra agencia; acceso del worker válido a la hora programada.
- Datos: persistencia entre dispositivos, conflictos de versión, fallo real de guardado y ausencia de semillas en altas reales.
- Visual: fixtures deterministas solo para comparar; resoluciones 1440×900, 768×1024 y 375×812, más 320 px y puntos de ruptura.
- Movimiento: entradas/salidas y estados intermedios medidos; no prometer un porcentaje de similitud sin informar métrica, máscaras y cobertura.
- Despliegue: arranque reproducible, migraciones controladas, backups restaurables y rollback sin duplicar publicaciones.

## 11. Migración y despliegue

- Respaldar los JSON y almacenamiento demo actuales. No atribuirlos a una cuenta porque conozca un workspaceId.
- Separar entornos demo, desarrollo, staging y producción; permitir importación explícita y validada a una agencia controlada por su propietario.
- Mantener estados UI locales, pero retirar datos de negocio persistidos en localStorage como fuente autoritativa. El backend y la base serán la verdad compartida.
- Mantener un único dueño de cada migración. Aplicar migraciones progresivas antes de retirar interfaces antiguas.
- Publicar el frontend en un entorno Node compatible y el backend/orquestador desde imágenes construidas con nuestro fork. Postiz conserva infraestructura de ejecución aunque use Supabase para identidades y datos.
- Configurar dominios HTTPS y callbacks, SMTP para correos reales, OAuth de Google y aplicaciones de las redes elegidas. Estos accesos se configuran fuera del chat; no se incorporan secretos al repositorio.
- Conservar AGPL y atribuciones de Postiz y terceros, junto al registro de cambios. Revisar el alcance de módulos con licencias adicionales antes de incluirlos.

## 12. Organización de implementación

Un coordinador y doce encargos reales, por oleadas según capacidad: (1) auditoría del código Postiz; (2) integración del árbol/builds; (3) Supabase Auth/Google; (4) modelo de datos/migraciones; (5) permisos/aislamiento; (6) conectores/OAuth; (7) publicación/Temporal/idempotencia; (8) medios/Storage; (9) dashboard/datos reales; (10) revisión/invitaciones; (11) QA funcional y accesos; (12) QA visual/movimiento y despliegue.

No todos editan el mismo esquema o middleware. El agente de datos es dueño de las migraciones; el de autorización fija el contrato que consumen los demás. QA revisa la versión integrada, no solo la promesa de cada agente.

## 13. Resultado esperado

Un usuario se registra o entra con Google, crea su agencia, invita a otra persona, asigna marcas y trabaja con datos compartidos solo donde está autorizado. Puede cambiar de agencia sin mezclar información. Crea contenido, obtiene una aprobación y programa mediante el backend/orquestador Postiz incorporados a Hubly. El dashboard refleja datos y resultados reales. El producto conserva la interfaz acordada, tiene acciones completas y registra fallos de forma visible y recuperable.

## Fuentes contrastadas

- Código y arquitectura Postiz: https://github.com/gitroomhq/postiz-app y https://docs.postiz.com/self-host/architecture
- Esquema Prisma actual: https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/database/prisma/schema.prisma
- Middleware auth existente: https://github.com/gitroomhq/postiz-app/blob/main/apps/backend/src/services/auth/auth.middleware.ts
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
- Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Esquemas privados/Data API: https://supabase.com/docs/guides/api/using-custom-schemas
- Acceso a Storage: https://supabase.com/docs/guides/storage/security/access-control
