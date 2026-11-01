# Entrega del agente D — Auditoría de Backend y Seguridad

Rama: `agente/gemini-api`, desde `4bb99df`.
Servidor propio: http://localhost:3022 (encendido y verificado en modo demo).

---

## 1. Mapa de Rutas de la API (12 rutas de `web/app/api`)

| Ruta | Método | Quién puede llamarla | Qué valida | Archivo o tabla que toca | Relación con políticas Supabase / Migraciones |
|---|---|---|---|---|---|
| `/api/agency` | POST | Autenticado | `backendEnabled` (404), `auth.user` (401), `name` no vacío (400) y longitud `<= 120` (400), reutiliza existente si no pide `another` | `agency_members`, RPC `create_agency` (`agencies`, `agency_members`, `agency_workspaces`) | `create_agency` es `security definer`, exige `auth.uid() is not null` y asigna rol `owner` al creador. |
| `/api/ai/caption` | POST | Miembro con rol `owner`, `admin` o `editor` en modo Supabase; en desarrollo local modo demo | `ANTHROPIC_API_KEY` (503), rol no-viewer en live (403), `brief` no vacío y `<= 2000` caracteres (400), tamaño de body `<= 64 KB` (413) | `agency_members` (select rol en live), cliente SDK Anthropic | `agency_members` select protegido por RLS `members_select`. En producción con demo deshabilitado responde 503. |
| `/api/invitations/[token]` | GET | Público (anónimo o autenticado) | `backendEnabled` (404), token vigente no revocado ni aceptado (404 si inválido) | RPC `invitation_preview` (`agency_invitations`, `agencies`) | `invitation_preview` es `security definer` con grant a `anon, authenticated`. |
| `/api/invitations/[token]` | POST | Autenticado con correo verificado | `backendEnabled` (404), token vigente no revocado, correo del usuario coincide con invitación o correo verificado si es link genérico | RPC `accept_invitation` (`agency_invitations`, `agency_members`) | `accept_invitation` es `security definer` con grant a `authenticated`. Asocia al usuario a la agencia con el rol fijado. |
| `/api/media` | GET | Demo: anónimo. Live: autenticado miembro de la agencia | `brandId` (400), en live `agencyId` (400) y sesión `auth.user` (401) | Demo: `.data/media/index.json`. Live: `media_assets` y bucket Storage `media` | RLS `media_assets_select` requiere ser miembro. Purga archivos pendientes obsoletos (`stale`). |
| `/api/media` | POST | Demo: anónimo. Live: autenticado rol `owner`, `admin` o `editor` | `brandId`, `name`, `mime`, `sizeBytes` (entero positivo), límite por tipo (20/100 MB), en live `agencyId` y sesión `auth.user` | Demo: `.data/media/index.json`. Live: `media_assets` (insert), bucket Storage `media` (`createSignedUploadUrl`) | `media_assets_insert` requiere `member_role in ('owner', 'admin', 'editor')`. Storage privado genera URL firmada de subida. |
| `/api/media/[id]` | PATCH | Demo: anónimo. Live: autenticado rol `owner`, `admin` o `editor` | `id` existente (404), en live sesión (401), campos `status="ready"`, `folder`, `name` | Demo: `.data/media/index.json`. Live: `media_assets` (update) | `media_assets_update` requiere `member_role in ('owner', 'admin', 'editor')`. |
| `/api/media/[id]` | DELETE | Demo: anónimo. Live: autenticado rol `owner`, `admin` o `editor` | `id` existente (404), en live sesión (401) | Demo: `.data/media/index.json`, archivo en `.data/media/`. Live: `media_assets` (delete), Storage `media` (remove) | `media_assets_delete` requiere `member_role in ('owner', 'admin', 'editor')`. Storage delete requiere igual rol. |
| `/api/media/[id]/file` | GET | Demo: anónimo. Live: autenticado miembro o visitante de portal con token | `id` existente (404), en live sesión (401) | Demo: binario en `.data/media/[id]`. Live: `media_assets` (select `path`), Storage `media` (`createSignedUrl`) | RLS en `storage.objects` permite acceso a miembros y a través de `share_media_allowed`. Redirección temporal a URL firmada. |
| `/api/media/[id]/file` | PUT | Solo demo (en live 404) | `id` en demo store (404), tamaño exacto declarado (422), límite máximo por tipo (413), magic bytes frente a MIME declarado (422) | Archivo binario en `.data/media/[id]` | N/A (en live la subida es directa al almacenamiento firmado de Supabase). |
| `/api/members` | GET, POST | Autenticado miembro de la agencia | `backendEnabled` (404), sesión `auth.user` (401), GET requiere `agencyId` (400), POST requiere `action` válida y parámetros correspondientes | RPCs `list_members`, `create_invitation`, `create_invite_link`, `revoke_invitation`, `revoke_share_link`, `update_member_role`, `remove_member`, tablas `agency_invitations`, `share_links` | RLS y funciones con permisos granulares: `list_members` (miembros), `create_invitation`/`create_invite_link`/`revoke_invitation` (owner/admin), `update_member_role`/`remove_member` (owner, protege último dueño). |
| `/api/share` | POST | Autenticado con rol `owner`, `admin` o `editor` | `backendEnabled` (404), sesión `auth.user` (401), `brandId` (400), `agencyId` (400) | RPC `create_share_link` (`share_links`) | `create_share_link` requiere `member_role in ('owner', 'admin', 'editor')`. Genera token de 30 días. |
| `/api/share/[token]` | GET, POST | Público con token de enlace de revisión válido y no revocado | `backendEnabled` (404), token vigente no revocado (404). En POST: `decision in ('approved', 'changes')`, `comment` obligatorio si `changes` | RPC `get_share_portal`, RPC `submit_share_decision` (`agency_workspaces`, `share_links`) | `get_share_portal` y `submit_share_decision` son `security definer` con grant a `anon, authenticated`. Entregan solo marca y posts públicos, actualizan estado e insertan notificación y firma en actividad. |
| `/api/share/[token]/media/[id]` | GET | Público con token de enlace de revisión válido | `backendEnabled` (404), token vigente y asset perteneciente a post visible del enlace | RPC `share_media_path`, Storage `media` (`createSignedUrl`) | `share_media_path` y `storage.objects` validan que el archivo pertenezca a un post no borrador de la marca del enlace. |
| `/api/waitlist` | POST | Anónimo (público) | Payload JSON (400), límite de tamaño `<= 16 KB` (413), honeypot `website`, formato y longitud de `email` `<= 254` (400), variable `WAITLIST_WEBHOOK_URL` (503) | Reenvío HTTP a webhook externo con timeout 8s | N/A |
| `/api/workspace` | GET, POST | Demo: anónimo. Live: autenticado miembro (GET) o editor+ (POST) | Demo: `workspaceId` saneado, estructura `brands` y `posts` en arrays (400), límite 8 MB (413), JSON válido (400). Live: sesión (401), `agencyId`, `version`, arrays `brands` y `posts`, tamaño `<= 8 MB` (413) | Demo: `.data/workspaces/workspace-[safeId].json` con escrituras atómicas y serializadas. Live: `agency_members`, `agency_workspaces`, RPC `save_workspace`, RPC `list_members` | `save_workspace` exige rol `owner`/`admin`/`editor` y control optimista de versión (`version = expected_version`). |

---

## 2. Hallazgos por Gravedad

### Crítico

#### [C-1] Recorrido de rutas (Path Traversal) en nombres de archivo y marcas de Storage
- **Archivo y línea:** `web/lib/media.ts:62-68` y `web/app/api/media/route.ts:103`
- **Descripción:** La función `safeFileName` normalizaba caracteres pero permitía secuencias de puntos consecutivos (`..` o `../..`). Al construir la ruta de almacenamiento `${body.agencyId}/${safeFileName(body.brandId)}/${randomUUID()}-${safeFileName(name)}`, un valor como `brandId = ".."` generaba un path `${body.agencyId}/../uuid-archivo`, permitiendo escapar de la carpeta de la agencia hacia la raíz del bucket de Storage.
- **Reproducción:**
  ```ts
  safeFileName(".."); // Devolvía ".."
  safeFileName("../.."); // Devolvía "..-.."
  ```
- **Estado:** Corregido. `safeFileName` ahora reemplaza secuencias de puntos múltiples `\.{2,}` por `-` y recorta puntos o guiones al inicio y fin `^[-.]+|[-.]+$`, devolviendo `"archivo"` si la cadena queda vacía.

#### [C-2] Subida de binarios con tipo real discordante (MIME Spoofing / Magic Bytes)
- **Archivo y línea:** `web/app/api/media/[id]/file/route.ts:47-56` y `web/lib/media.ts`
- **Descripción:** En `PUT /api/media/[id]/file` (modo demo), el servidor solo comparaba el tamaño de bytes con `record.sizeBytes`. No existía ninguna validación de tipo real contra tipo declarado. Un atacante podía declarar `image/png` y subir un script ejecutable, HTML con `<script>`, o cualquier archivo arbitrario.
- **Reproducción:**
  `POST /api/media` con `{ mime: "image/png", sizeBytes: 10 }` seguido de `PUT /api/media/<id>/file` enviando 10 bytes de texto plano `"0123456789"` respondía 200 OK y se servía como `Content-Type: image/png`.
- **Estado:** Corregido. Se implementó `validateMediaMagicBytes` en `web/lib/media.ts` y se integró en `PUT /api/media/[id]/file`. Si los magic bytes no coinciden con la firma del MIME declarado, responde 422 `{ error: "mime_mismatch" }`.

### Alto

#### [A-1] Rutas autenticadas sin verificación de sesión en modo Supabase (`auth.getUser()`)
- **Archivos y líneas:**
  - `web/app/api/workspace/route.ts:161` (`livePost`)
  - `web/app/api/members/route.ts:7, 24` (GET y POST)
  - `web/app/api/share/route.ts:5` (POST)
  - `web/app/api/media/[id]/route.ts:10, 32` (PATCH y DELETE)
  - `web/app/api/media/[id]/file/route.ts:13` (GET)
- **Descripción:** En modo Supabase (`backendEnabled = true`), estas rutas delegaban la comprobación de sesión enteramente a las funciones RPC o tablas de Postgres. Peticiones no autenticadas (anónimas) no eran rechazadas con 401 `not_authenticated` en la capa de la API, sino que provocaban errores de RLS o permisos SQL, devolviendo 403 `forbidden`, 404 `not_found` o 400 `failed`.
- **Reproducción:** Petición HTTP sin cabecera de sesión o cookies a `POST /api/workspace` o `POST /api/members` devolvía 403 o 400 en vez de 401.
- **Estado:** Corregido. Se añadió la verificación explícita de `const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });` en cada una de estas rutas.

#### [A-2] Riesgo de pérdida y corrupción de datos por escrituras simultáneas y lecturas parciales en demo
- **Archivo y línea:** `web/app/api/workspace/route.ts:57-77`
- **Descripción:** `writeWorkspaceDb` utilizaba `fs.writeFile` directo sobre el archivo de base de datos sin control de concurrencia ni escritura atómica. Escrituras simultáneas podían entrelazarse, y lecturas concurrentes podían leer un JSON truncado. Si `readWorkspaceDb` fallaba al parsear el JSON corrupto, el bloque `catch` sobreescribía todo el espacio con datos iniciales (`createSeedWorkspaceData`), borrando todo el trabajo del usuario.
- **Reproducción:** Escritura concurrente sobre `.data/workspaces/workspace-default.json` mientras se ejecutan lecturas.
- **Estado:** Corregido. Se agregó serialización de escrituras con cola exclusiva (`exclusiveWorkspaceWrite`) y escritura atómica a archivo temporal con `fs.rename`.

#### [A-3] Excepción no capturada en `POST /api/ai/caption` (`throw err`)
- **Archivo y línea:** `web/app/api/ai/caption/route.ts:64`
- **Descripción:** Si el cliente de Anthropic arrojaba un error que no fuera instancia de `Anthropic.APIError` (por ejemplo, errores de red, DNS, validación interna o abortos), la ruta ejecutaba `throw err;`, causando una excepción no controlada en el servidor Next.js (500) y potencialmente exponiendo trazas internas.
- **Reproducción:** Provocar fallo de inicialización o red en el cliente de IA.
- **Estado:** Corregido. El bloque `catch` ahora maneja cualquier excepción no esperada devolviendo `{ error: "failed" }, { status: 500 }` de forma segura.

### Medio

#### [M-1] JSON inválido en `POST /api/workspace` provocaba error 500
- **Archivo y línea:** `web/app/api/workspace/route.ts:208, 234`
- **Descripción:** En modo demo, `POST /api/workspace` ejecutaba `await request.json()` dentro de un bloque que capturaba cualquier error y respondía status 500 con el mensaje de error de sintaxis del motor de V8 (`{"error":"Unexpected token 'o'..."}`). La entrada malformada de un cliente debe responder 400 Bad Request.
- **Reproducción:**
  `Invoke-WebRequest -Uri "http://localhost:3022/api/workspace" -Method POST -Body "not-json" -ContentType "application/json"`
  Devolvía status 500.
- **Estado:** Corregido. Captura el fallo de parseo y responde 400 `{ error: "invalid_payload" }`.

#### [M-2] Ausencia de límite de tamaño de cuerpo en modo demo para `POST /api/workspace`
- **Archivo y línea:** `web/app/api/workspace/route.ts:204`
- **Descripción:** Mientras que en modo Supabase (`livePost`) existía `MAX_BODY_BYTES = 8 * 1024 * 1024`, en modo demo no se limitaba el tamaño de la petición, permitiendo enviar peticiones arbitrariamente grandes.
- **Reproducción:**
  Enviar payload de 9 MB a `http://localhost:3022/api/workspace` respondía 200 OK.
- **Estado:** Corregido. Se aplica la restricción de 8 MB (`MAX_BODY_BYTES`) en modo demo y se devuelve 413 `{ error: "too_large" }`.

#### [M-3] `DELETE /api/media/[id]` respondía 200 OK para IDs inexistentes en modo demo
- **Archivo y línea:** `web/app/api/media/[id]/route.ts:34`
- **Descripción:** En modo demo, `DELETE /api/media/[id]` ejecutaba `demoRemove(id)` y devolvía `{ ok: true }` (status 200) incluso si el archivo nunca existió en el índice.
- **Reproducción:**
  `DELETE http://localhost:3022/api/media/00000000-0000-0000-0000-000000000000` devolvía 200.
- **Estado:** Corregido. Verifica si el recurso existe con `demoGet(id)`; si no existe, devuelve 404 `{ error: "not_found" }`.

#### [M-4] Falta de límite de cuerpo en `POST /api/waitlist` y `POST /api/ai/caption`
- **Archivos y líneas:** `web/app/api/waitlist/route.ts:4`, `web/app/api/ai/caption/route.ts:9`
- **Descripción:** Ambas rutas leían el cuerpo JSON sin restringir el tamaño en bytes entrante.
- **Reproducción:** Enviar cuerpos mayores a 64 KB en peticiones repetidas.
- **Estado:** Corregido. Se aplicó límite de 16 KB en `waitlist` y 64 KB en `ai/caption`, respondiendo 413 `{ error: "too_large" }`.

### Bajo

#### [B-1] Validación de `sizeBytes` no numérico o `NaN` en `POST /api/media`
- **Archivo y línea:** `web/app/api/media/route.ts:84` y `web/lib/media.ts:50`
- **Descripción:** Si `body.sizeBytes` venía como `NaN`, `sizeBytes <= 0` evaluaba a falso y `sizeBytes > maxBytes` a falso, omitiendo el rechazo en `mediaRejection`.
- **Reproducción:** `mediaRejection("image/png", NaN)` devolvía `null`.
- **Estado:** Corregido. Se valida `!Number.isFinite(sizeBytes) || sizeBytes <= 0` en `mediaRejection` y `Number.isInteger(body.sizeBytes) && body.sizeBytes > 0` en la ruta.

#### [B-2] Validación de longitud máxima en nombre de agencia (`POST /api/agency`)
- **Archivo y línea:** `web/app/api/agency/route.ts:13`
- **Descripción:** La tabla `agencies` en Postgres tiene una restricción `check (char_length(trim(name)) between 1 and 120)`. Si un cliente enviaba un nombre mayor a 120 caracteres, la RPC fallaba con violación de restricción y la ruta devolvía 500 `{ error: "create_failed" }`.
- **Reproducción:** `POST /api/agency` con `{ name: "A".repeat(121) }`.
- **Estado:** Corregido. Se valida `clean.length > 120` respondiendo 400 `{ error: "name_too_long" }`.

---

## 3. Salida Real de los Comandos de Verificación

Todos los comandos se ejecutaron desde `C:\Users\jairb\Desktop\Hubly-wt\gemini-api\web` con el servidor del puerto 3022 activo:

### `npm run check:ui`
```
> web@0.1.0 check:ui
> node scripts/check-ui.mjs

Chequeo de UI correcto. Deuda heredada sin empeorar: 1484 hallazgos.
```
*(Código de salida: 0)*

### `npx tsc --noEmit`
```
(Sin errores, salida limpia)
```
*(Código de salida: 0)*

### `npm test`
```
> web@0.1.0 test
> tsx --test "tests/**/*.test.ts" "components/**/*.test.ts" "lib/**/*.test.ts"

✔ calculateHoursSaved - Default baseline values match production (0.4682ms)
...
✔ seguridad: safeFileName bloquea recorrido de rutas (path traversal) (0.5496ms)
✔ seguridad: mediaRejection valida tamaños finitos positivos y límites por tipo (0.1537ms)
✔ seguridad: validateMediaMagicBytes comprueba el tipo real frente al declarado (0.1375ms)
✔ seguridad: POST /api/workspace responde 400 ante JSON inválido en vez de 500 (2.2719ms)
✔ seguridad: POST /api/workspace responde 413 ante cuerpo excesivo (0.2815ms)
✔ seguridad: POST /api/waitlist limita tamaño del cuerpo a 16 KB (0.3211ms)
✔ seguridad: POST /api/ai/caption limita tamaño del cuerpo a 64 KB (0.3703ms)
✔ seguridad: DELETE /api/media/[id] devuelve 404 si el archivo no existe (2.871ms)
✔ seguridad: PUT /api/media/[id]/file rechaza bytes que no coinciden con MIME declarado (4.0854ms)
...
ℹ tests 67
ℹ suites 0
ℹ pass 67
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4925.7683
```
*(Código de salida: 0, 67 pruebas pasadas, 9 pruebas nuevas en `web/tests/api-seguridad.test.ts`)*

### `npm run test:db`
```
> web@0.1.0 test:db
> node tests/db-permisos.test.mjs

77 ok, 0 fallos
```
*(Código de salida: 0)*

### `npx playwright test`
```
Running 93 tests using 1 worker

  ok  1 e2e\archivos.spec.ts:26:5 › subir, encontrar y borrar un archivo real (4.7s)
  ok  2 e2e\archivos.spec.ts:48:5 › rechaza un archivo fuera de límite y permite quitarlo (1.2s)
  ok  3 e2e\archivos.spec.ts:57:5 › un fallo de subida ofrece reintentar (4.0s)
  ...
  ok 91 e2e\salud-cuentas.spec.ts:14:5 › Salud de cuentas: un h1, búsqueda, filtros, orden y vacío por filtro (1.2s)
  ok 92 e2e\salud-cuentas.spec.ts:36:5 › Salud de cuentas: editar y guardar compromisos recalcula el cumplimiento (1.3s)
  ok 93 e2e\salud-cuentas.spec.ts:51:5 › Salud de cuentas: aplicar y descartar sugerencias (1.2s)

  93 passed (2.3m)
```
*(Código de salida: 0)*

### `npm run build`
```
> web@0.1.0 build
> next build

▲ Next.js 16.4.3 (Turbopack)
✓ Running next.config.ts took 34ms
- Cache Components enabled
- Partial Prefetching enabled

  Creating an optimized production build ...
✓ Compiled successfully in 5.6s
  Running TypeScript ...
  Finished TypeScript in 9.0s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/43) ...
  Generating static pages using 11 workers (10/43) 
  Generating static pages using 11 workers (21/43) 
  Generating static pages using 11 workers (32/43) 
✓ Generating static pages using 11 workers (43/43) in 980ms
  Finalizing page optimization ...
```
*(Código de salida: 0)*

---

## 4. Lo No Verificado

1. **Instancia externa de Supabase real y Auth de terceros (Google OAuth):** Conforme a la regla 4, no se conectó a ningún servicio de Supabase real ni se usó `.env.local`. Todas las comprobaciones de aislamiento, permisos y RLS se auditaron contra las migraciones SQL en `supabase/migrations/` y se verificaron con PGlite en `tests/db-permisos.test.mjs` y `mock-supabase.mjs`.
2. **Servicio externo de Anthropic Claude API:** La llamada real con clave externa gasta dinero y no está configurada en local (`ANTHROPIC_API_KEY` ausente). Se probó el comportamiento defensivo de errores, tamaños y excepciones sin llamadas remotas.
3. **Webhook externo de Waitlist:** No se ejecutó reenvío real contra endpoints remotos (Zapier/Make).

---

## 5. La Cola (Elementos de solo lectura que requieren cambios fuera del alcance)

De acuerdo con la Regla 6, las siguientes mejoras detectadas no fueron implementadas por requerir modificaciones en migraciones SQL de Supabase o en componentes de cliente fuera de los archivos permitidos:

1. **Migración SQL para almacenamiento de Hash de tokens en enlaces de invitación:**
   - **Archivo:** `supabase/migrations/0006_link_de_invitacion.sql:18`
   - **Línea:** 18
   - **Cambio propuesto:** En `create_invite_link`, la función almacena `token_hash = public.hash_token(raw)` correctamente. Sin embargo, no existe un índice específico parcial para búsquedas de `token_hash` donde `email is null`. Añadir:
     ```sql
     create index if not exists agency_invitations_link_idx on public.agency_invitations (token_hash) where email is null;
     ```
2. **Revocación de enlaces de invitación desde la interfaz de equipo:**
   - **Archivo:** `web/app/api/members/route.ts:38` y `web/lib/invitaciones.ts`
   - **Descripción:** La acción `"revokeLink"` en `/api/members` llama a `revoke_share_link`, la cual revoca enlaces de revisión de marcas (`share_links`), mientras que los enlaces de invitación a la agencia viven en `agency_invitations` con `email is null`. Para revocar enlaces de invitación a la agencia se debe usar `revoke_invitation`. Si la interfaz en `components/` o `app/` envía `"revokeLink"` para enlaces de miembros, debe unificarse o crear una acción diferenciada `"revokeInviteLink"`.
3. **Manejo de estados 401 en interceptores de cliente:**
   - **Archivo:** `web/lib/store.ts` y componentes de cliente
   - **Descripción:** Actualmente varios componentes asumen que cualquier error de API es de red o 500. Al recibir 401 `not_authenticated` deberían redirigir limpiamente a `/login` en lugar de mostrar avisos genéricos de error.
