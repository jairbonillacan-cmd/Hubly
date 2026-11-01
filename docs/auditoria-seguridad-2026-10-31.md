# Auditoría de seguridad de Hubly

Fecha: 31 de octubre de 2026. Alcance: `web/`, `supabase/migrations/`, historial de git y dependencias.

**Importante:** la migración `0010_endurecimiento_de_seguridad.sql` está escrita y probada contra un Postgres local, pero **no se aplicó** al proyecto real. Los hallazgos marcados «con 0010» siguen abiertos en producción hasta aplicarla. La app funciona con o sin ella.

## Hallazgos

Las rutas y líneas son las del código antes de corregir.

### Gravedad alta

| # | Hallazgo | Dónde | Estado |
|---|---|---|---|
| A1 | **Redirección abierta.** `safeNextPath` aceptaba `/<tab>/evil.com`; el navegador quita el tabulador y va a otro dominio. Un enlace `/login?next=/%09/evil.com` llevaba a una página falsa justo después de iniciar sesión. Comprobado con `new URL`. | `web/lib/supabase/config.ts:8` | Corregido. Prueba en `tests/unit.test.ts` |
| A2 | **Sin cabeceras de seguridad.** Ni CSP, ni protección contra clickjacking, ni HSTS, ni `nosniff`. El portal y las invitaciones se podían incrustar en otro sitio. | `web/next.config.ts` | Corregido, con el límite de P1 |
| A3 | **Gasto de IA sin freno.** Cualquiera con una cuenta crea su agencia, queda como dueño y puede llamar a Opus sin límite. Tampoco había límite en la lista de espera. | `web/app/api/ai/caption/route.ts`, `web/app/api/waitlist/route.ts` | Corregido: límite por IP en `proxy.ts` y cuota de 100 al día por persona **con 0010** |
| A4 | **Filtro de archivos saltable.** `image/svg+xml; x=1` e `image/SVG+XML` pasaban por imagen, y el bucket `media` no tenía lista de tipos, así que la subida directa admitía cualquier cosa. En modo demo el archivo se servía desde el mismo dominio de la app (XSS guardado). | `web/lib/media.ts:33`, `supabase/migrations/0004_archivos_y_medios.sql:33` | Corregido: lista cerrada en la app; el bucket **con 0010** |
| A5 | **Modo demo abierto en producción.** Publicar sin las claves de Supabase dejaba `/api/workspace` y `/api/media` escribiendo en el disco del servidor, sin cuentas. | `web/app/api/workspace/route.ts:204`, `web/app/api/media/[id]/file/route.ts:47` | Corregido: en producción solo lectura y respuesta 503 o 404 |

### Gravedad media

| # | Hallazgo | Dónde | Estado |
|---|---|---|---|
| M1 | **`media_assets` con permisos de más.** Un editor podía cambiar `path`, `agency_id` o `created_by`, o registrar una ruta de otra agencia. El portal abre lo que diga esa ruta. No era explotable en la práctica porque `path` es único e impredecible, pero era la única barrera. | `0004_archivos_y_medios.sql:20` | Corregido **con 0010**: permisos por columna y restricción de ruta |
| M2 | **Avatares listables.** La política de lectura dejaba a cualquiera listar el bucket y obtener los ids de todas las cuentas. | `0005_fotos_de_perfil.sql:8` | Corregido **con 0010**. Las URLs públicas siguen funcionando |
| M3 | **Quien salía podía volver.** Un miembro eliminado que conservara el link de invitación entraba otra vez hasta 7 días después. | `0006_link_de_invitacion.sql`, `remove_member` | Corregido **con 0010**: eliminar a alguien revoca los links abiertos de la agencia |
| M4 | **Link abierto con rol de administración.** `create_invitation` con correo nulo creaba un link sin correo con rol `admin`, saltándose la regla de los links. Solo podían hacerlo dueños o administradores. | `0001_agencias_y_espacios.sql:167` | Corregido **con 0010**: exige correo válido |
| M5 | **Límite de tamaño saltable.** Solo se miraba `Content-Length`, que puede faltar. Llamar directo a `save_workspace` no tenía ningún límite ni validación. | `web/app/api/workspace/route.ts:162` | Corregido: tope real al leer, en todas las rutas; en la base **con 0010** |
| M6 | **Un enlace filtrado podía inflar el documento.** Cada decisión añadía comentario y notificación sin tope, hasta impedir que la agencia guardara. | `submit_share_decision` | Corregido **con 0010**: 200 comentarios por post y 200 notificaciones |
| M7 | **Sin comprobación de origen.** Las cookies `Lax` ya frenan CSRF; faltaba una segunda barrera. | `web/proxy.ts` | Corregido: escrituras en `/api/` desde otro origen reciben 403 |

### Gravedad baja

| # | Hallazgo | Dónde | Estado |
|---|---|---|---|
| B1 | El texto de error de la base llegaba al cliente. | `web/app/api/workspace/route.ts:182,236` | Corregido |
| B2 | Enlaces escritos a mano sin filtrar el protocolo. React 19 ya bloquea `javascript:`, pero no `data:`. | `ComposerExtras.tsx:67`, `PostComposerModal.tsx:948`, `notificaciones/page.tsx:98` | Corregido con `safeLinkHref` y `safeNextPath` |
| B3 | Agencias ilimitadas por cuenta. | `create_agency` | Corregido **con 0010**: 20 por cuenta |
| B4 | El `matcher` del proxy se saltaba rutas `/api/` que acaban en `.png`, y las cabeceras anticaché de la sesión no se copiaban. | `web/proxy.ts:44` | Corregido |
| B5 | El `.gitignore` de la raíz no cubría `.env*` ni `.data/`. | `.gitignore` | Corregido |
| B6 | `sanitizeWorkspaceId` no limitaba la longitud del nombre de archivo (solo demo). | `web/app/api/workspace/route.ts:17` | Corregido |
| B7 | Sin relación con seguridad: `export const toRecord` en una ruta rompía `next build`, y por tanto el CI. | `web/app/api/media/route.ts:23` | Corregido |

## Pendientes, con motivo

| # | Pendiente | Motivo |
|---|---|---|
| P1 | La CSP permite `'unsafe-inline'` en scripts. | Next inyecta scripts en línea, y los nonces son incompatibles con el prerender parcial que usa Hubly. El riesgo es acotado: no hay HTML sin escapar, y solo hay un `dangerouslySetInnerHTML`, que es constante. |
| P2 | Todo miembro, incluso de solo lectura, recibe el documento completo de la agencia. `brandIds` es solo visual: no limita el acceso por marca. Un editor también puede alterar comentarios, actividad y aprobaciones del documento. | El contenido vive en un único JSON. Arreglarlo exige pasarlo a tablas con RLS; es un cambio de diseño, no un parche. **No se debe prometer acceso por marca ni un historial de aprobaciones inalterable hasta hacerlo.** |
| P3 | El límite por IP vive en la memoria de cada instancia y confía en `X-Forwarded-For`. | Frena ráfagas, no un ataque distribuido. Solo es fiable detrás de un proxy que reescriba esa cabecera, como Vercel. Lo serio es un firewall de la plataforma o un contador compartido. |
| P4 | Sin cuota de almacenamiento por agencia (solo 100 MB por archivo). | Depende de los planes del producto. |
| P5 | Inyección de prompt en la IA: aceptada. | No hay herramientas ni datos de otras agencias en el prompt, los campos van recortados y la respuesta se muestra como texto. Lo peor es un mal texto para la propia marca. |
| P6 | Las URLs firmadas siguen vivas 30 a 60 minutos tras revocar un enlace. | Es como funciona Storage; acortarlas afecta a los videos. |
| P7 | Los enlaces creados por alguien que ya salió siguen activos hasta caducar (30 días). La firma del cliente no es una identidad verificada. | Comportamiento previsto. La agencia puede revocarlos, y la firma ya se marca «sin cuenta». |
| P8 | Dos dueños que se degradan a la vez podrían dejar la agencia sin dueño. | Carrera muy improbable y sin exposición de datos. |

## Revisado sin problemas

- **Secretos:** ningún secreto en archivos versionados ni en el historial de git, en ninguna rama. `web/.env.local` solo tiene la URL y la clave publicable, que están hechas para ir al navegador. **No hace falta rotar nada.**
- **Clave de servidor:** la app no usa `service_role`, y la clave de IA no lleva `NEXT_PUBLIC_`.
- **Dependencias:** `npm audit` da 0 vulnerabilidades.
- **Aislamiento entre agencias:** las rutas no dependen del proxy, porque usan la sesión con RLS. Un usuario de otra agencia recibió 403 al guardar, listar miembros y crear enlaces.
- **Rol de lectura:** `save_workspace`, los enlaces y los medios lo rechazan en la base, no solo en la interfaz.
- **Funciones `security definer`:** todas fijan `search_path`.
- **Tokens:** generados con unos 244 bits de azar, y solo se guarda su hash.
- **Portal:** no entrega notas, chat, borradores ni otras marcas. Los comentarios de la agencia sí se muestran al cliente, por diseño.
- **XSS en libretas:** el HTML pasa por el esquema de TipTap; no se inserta sin filtrar.
- **SSRF:** el servidor no descarga URLs de usuarios. El único `fetch` externo es el webhook de la variable de entorno.
- **Inicio de sesión:** los mensajes de error no revelan si una cuenta existe.
- **CI:** sin `pull_request_target` y con permisos de solo lectura.

## Lo que debes hacer en persona

1. **Aplicar la migración.** Haz una copia de seguridad y ejecuta `supabase/migrations/0010_endurecimiento_de_seguridad.sql` en el **SQL Editor**. No borra datos. Hazlo cuando no haya gente subiendo archivos, y después prueba subir un archivo y cambiar tu foto de perfil.
2. **Authentication > Sign In / Providers:** deja activa la confirmación de correo, sube la contraseña mínima a 10 o más, activa la protección contra contraseñas filtradas y el cambio seguro de contraseña.
3. **Authentication > Rate Limits y CAPTCHA:** el login y el registro van directo a Supabase, así que el límite de intentos solo se configura ahí. Activa Cloudflare Turnstile o hCaptcha.
4. **Authentication > URL Configuration:** deja solo tu dominio real y `localhost` como Redirect URLs, sin comodines.
5. **Anthropic Console:** fija un tope de gasto mensual, y guarda la clave solo en las variables del servidor.
6. **Hosting:** confirma que producción tiene las dos claves de Supabase, y activa el firewall o límite por IP de la plataforma (P3).
7. **Supabase > Advisors > Security:** revísalo después de aplicar la migración.
8. **GitHub:** activa Dependabot, el escaneo de secretos y la protección de `main`.

## Verificación

- `npm run check:ui`, `npx tsc --noEmit`, `npm test` y `npm run test:db`: en verde.
- 22 comprobaciones de autorización contra el Supabase simulado (`dev:live`), en una copia aislada: todas correctas.
- Navegador con cuenta de prueba: dashboard, calendario, ajustes y portal sin violaciones de CSP, en claro; dashboard también en oscuro y calendario en 375 px.
- `next build` y `next start`: cabeceras correctas y modo demo de solo lectura.
- **Sin comprobar:** el proyecto real de Supabase, la subida directa a Storage real, Google OAuth y los correos reales. El simulado no los cubre.
