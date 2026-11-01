# Segunda revisión de seguridad de Hubly

Fecha: 31 de octubre de 2026. Revisión ofensiva independiente sobre la rama `seguridad/endurecimiento` (PR #1, sin fusionar), en un worktree propio (`Hubly-wt/rev-seg`). No repito la auditoría anterior: verifico sus afirmaciones y busco lo que se le escapó.

Método: análisis estático del código y las 7 migraciones, pruebas contra el esquema real en PGlite con un script adversarial propio (`web/tests/rev-seg-adversarial.mjs`, 31 comprobaciones), pruebas HTTP contra `dev:live` en `localhost:3200`, verificación de la librería instalada (`@supabase/ssr`, Next 16.4.3 y su documentación incluida) y de la documentación pública de Supabase. No se tocó el proyecto real de Supabase, el puerto 3000 ni datos reales. Nada de esto se sube al repositorio.

## 1. Resumen (3 líneas)

El plano de seguridad de la rama aguanta lo probado: aislamiento entre agencias, muros de roles, portal público y anti-CSRF resistieron todas las pruebas locales, y la migración 0010 no rompe los flujos reales de subida en lo que el simulado puede cubrir. Lo que bloquea publicar hoy es el **estado de despliegue**, no el código: sin 0010 aplicada siguen abiertos el bucket sin lista de tipos, la cuota de IA solo en memoria y los listings de avatares. Hay dos huecos que 0010 no cierra (expulsión incompleta y admin-crea-admin), ninguno grave, más una fuga de datos de la cuenta anterior en `localStorage` al cerrar sesión en equipos compartidos.

## 2. Lo que sigue abierto en producción y conviene tener arriba

1. **La 0010 no está aplicada y con ella caen 5 hallazgos de la auditoría anterior** (A3 cuota de IA, A4 lista de tipos del bucket, M1 permisos de `media_assets`, M2 listings de avatares, M3/M4 invitaciones). Además, mientras no exista `consume_ai_quota`, la ruta de IA ignora el error `PGRST202` a propósito (`web/app/api/ai/caption/route.ts:25`): el único freno es el contador por IP del proxy, que se evade cambiando `x-forwarded-for` en cualquier despliegue donde el proxy no la reescriba (confirmado en local; ver H3).
2. **H1: cerrar sesión deja el documento de la agencia y los chats de Hubi en `localStorage`** (abierto en producción, con o sin 0010).

## 3. Hallazgos

Convención: «confirmado» = reproducido en local o verificado en el código instalado; «sin confirmar» = razonado pero dependiente del entorno real.

### H1 — Cerrar sesión no borra los datos de la agencia del navegador (medio, confirmado)

- **Dónde:** `web/components/app/ajustes/page.tsx:88-93` (solo llama a `clearAllRecovery`), `web/lib/post-draft.ts:166-175` (solo limpia `hubly:borrador:*`), `web/lib/live-workspace.ts:50` (`hubly:conflicto:<agencyId>` guarda el documento completo), `web/lib/hubi-chats.ts:43-62` (`hubly:chats-hubi:*` guarda conversaciones enteras).
- **Reproducción:** (1) con una cuenta real, provocar un conflicto de guardado (editar sin conexión o dos pestañas) y escribir en el chat de Hubi; (2) cerrar sesión; (3) en el mismo navegador, otra persona abre DevTools → Application → localStorage: `hubly:conflicto:<id>` contiene posts, copys, notas y tareas de la agencia anterior, y `hubly:chats-hubi:*` las conversaciones. También sobrevive `hubly:marca-activa:<id>`.
- **Impacto real:** fuga del contenido de una agencia a la siguiente cuenta en el mismo navegador (equipos compartidos, ordenadores de agencia). El token de sesión sí se borra; esto es el contenido, no la credencial.
- **Corrección propuesta:** en el logout, limpiar por prefijo `hubly:` entero (o como mínimo `hubly:conflicto:` y `hubly:chats-hubi:`) antes del `signOut()`; lo mismo al detectar cambio de cuenta en `syncFromServer`.
- **Estado:** confirmado por código; la persistencia de esos prefijos está verificada en las rutas de escritura citadas.

### H2 — Expulsar a alguien no revoca sus invitaciones por correo pendientes (medio, confirmado)

- **Dónde:** `supabase/migrations/0010_endurecimiento_de_seguridad.sql:128-129` — `remove_member` solo revoca invitaciones con `email is null`. La tabla lo permite: `0001:41-52` guarda invitaciones con `accepted_at is null` hasta 7 días.
- **Reproducción (PGlite, script adversarial, apartado 12):** el dueño crea una invitación por correo para `ed@x.com` con rol viewer; expulsa al editor sin usar la invitación; el expulsado la acepta y **vuelve a entrar con el rol de la invitación**. Con una invitación `admin` volvería como admin.
- **Impacto real:** un miembro expulsado con una invitación aún viva (hasta 7 días, y mientras nadie la revoque a mano) reentra por sí mismo. La afirmación de la auditoría «eliminar a alguien revoca los links abiertos de la agencia» es cierta pero incompleta: solo cubre los links sin correo.
- **Corrección propuesta:** en `remove_member`, revocar también `agency_invitations` con `accepted_at is null and lower(email) = lower(email del expulsado)`. Hace falta el correo del expulsado: un `select email from auth.users where id = target_user`.
- **Estado:** confirmado.

### H3 — `rateLimitWait` y `isCrossOriginWrite` confían en cabeceras que el cliente controla (medio en despliegues no-Vercel; confirmado en local, sin confirmar en producción)

- **Dónde:** `web/proxy.ts:16-21` (`x-forwarded-host`, `x-forwarded-for` primera posición), `web/lib/api-guard.ts:75-82`.
- **Reproducción (contra `dev:live`, verificado):** POST a `/api/waitlist` con `Origin: http://atacante.ejemplo` → 403 ✓. El mismo POST añadiendo `x-forwarded-host: atacante.ejemplo` → **pasa el control de origen** (503 de «webhook no configurado», es decir, llegó al handler). Rate limit: agotado el cupo de una IP, repetir con `x-forwarded-for: 9.9.9.9` distinto cada vez → pasa siempre.
- **Matiz importante:** en un navegador real el atacante no puede fijar esas cabeceras en una petición cross-origin (CORS/preflight lo impide) y las cookies van `SameSite=Lax`, así que no es un CSRF práctico. Y en Vercel la plataforma reescribe ambas cabeceras. El problema es cualquier otro despliegue (self-host, proxies que reenvían lo que les mandan): ahí el anti-CSRF secundario y todos los límites por IP (`waitlist`, IA, share, media) son decorativos.
- **Corrección propuesta:** no leer `x-forwarded-host`/`x-forwarded-for` sin una variable de entorno que declare «estoy detrás de un proxy de confianza»; por defecto, usar `request.headers.get("host")` y la IP del socket. Para el primer elemento de `XFF` en cadenas de proxies, usar el último salto confiable, no `split(",")[0]`.
- **Estado:** confirmado en local. En producción depende del hosting: sin confirmar (falta saber dónde se despliega).

### H4 — `Origin: null` pasa el control de origen (bajo, confirmado)

- **Dónde:** `web/lib/api-guard.ts:76` — `!origin` devuelve false; un `Origin: null` literal no es `null`, pero `new URL("null")` lanza y el `catch` devuelve `true` → bloqueado. Revertido: **no es explotable**. Lo confirmo en local: POST con `Origin: null` → 403. La ausencia total de `Origin` (curl) sí pasa, por diseño («sin Origin no hay navegador que engañar»). Sin acción.
- **Estado:** verificado, no es hallazgo. Se documenta para que nadie lo «arregle» rompiendo clientes no-navegador.

### H5 — Un admin puede crear más admins por correo (medio-bajo, confirmado; probablemente diseño)

- **Dónde:** `supabase/migrations/0010:95-112` (`create_invitation` exige correo válido y caller owner/admin, pero no limita `invite_role`), restricción de tabla `0001:45` (`role in ('admin','editor','viewer')`), UI `web/lib/invitaciones.ts:7-13` (ofrece «Administración» a cualquier caller).
- **Reproducción (script adversarial, apartado 1):** un admin crea `create_invitation(ag, 'nuevo@x.com', 'admin')` → se crea. Quien controle ese correo entra como admin. Comprobado además que: editor no puede invitar, admin no puede cambiar roles ni expulsar (`update_member_role`/`remove_member` exigen owner), y aceptar una invitación no cambia el rol de quien ya es miembro.
- **Impacto real:** la regla «solo el dueño administra» tiene una puerta trasera de provisionamiento: un admin comprometido siembra otro admin que sobrevive a su propia expulsión (combinable con H2). Si el producto quiere que solo el dueño cree admins, esto es una escalada; si no, es una decisión a documentar.
- **Corrección propuesta:** exigir `member_role = 'owner'` cuando `invite_role = 'admin'` en `create_invitation`, o quitar «Administración» de `INVITE_ROLES` para callers no-owner.
- **Estado:** confirmado; gravedad según intención del producto.

### H6 — Cookie de sesión sin `HttpOnly` ni `Secure` (medio-bajo, confirmado)

- **Dónde:** `node_modules/@supabase/ssr/dist/main/utils/constants.js` — `DEFAULT_COOKIE_OPTIONS = { path: "/", sameSite: "lax", httpOnly: false, maxAge: 400 días }`; ni `web/proxy.ts` ni `lib/supabase/server.ts` pasan `cookieOptions`. No hay `secure` en los valores por defecto.
- **Impacto real:** el token de sesión es legible con `document.cookie`. Es un diseño de `@supabase/ssr` (el cliente de navegador lo gestiona), así que no se puede «arreglar» con HttpOnly sin romper auth; lo que lo convierte en riesgo es la combinación con una CSP que permite `'unsafe-inline'` (H7): cualquier XSS roba la sesión entera. Falta `Secure`: la cookie viaja también por http plano si el dominio es alcanzable así.
- **Corrección propuesta:** pasar `cookieOptions: { secure: true }` en los dos clientes (es compatible con el flujo SSR; el login ya ocurre en https). HttpOnly no es viable con esta librería; la mitigación real es cerrar la CSP (H7).
- **Estado:** confirmado en la librería instalada.

### H7 — CSP con `'unsafe-inline'`: la afirmación de que no hay alternativa es falsa (medio, confirmado)

- **Dónde:** `web/next.config.ts:6-10`; afirmación previa en `docs/auditoria-seguridad-2026-10-31.md` (P1).
- **Evidencia:** la guía CSP incluida en el propio `next` 16.4.3 (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`, secciones «CSP configuration with SRI» y «Benefits of SRI over nonces») documenta `experimental: { sri: { algorithm: 'sha256' } }`, que añade `integrity` a los assets **en build time**, es compatible con generación estática/CDN (y por tanto con el prerender parcial), y puede combinarse con nonces generados en el proxy para lo dinámico. La limitación declarada es que es experimental y no cubre scripts generados en runtime. La auditoría anterior descartó la alternativa («los nonces son incompatibles con el prerender parcial») sin mencionar SRI; con `script-src 'self'` + SRI, el `unsafe-inline` inline queda inerte en navegadores modernos (si hay hash/nonce en la política, `unsafe-inline` se ignora).
- **Impacto real:** hoy cualquier inyección de HTML ejecuta script (no hay sumideros encontrados, pero la red de seguridad es cero). Además `img-src https:` permite píxeles de rastreo desde el portal del cliente hacia cualquier dominio (un editor puede poner un `mediaUrl` externo; verificado en `from-social-post.ts:41-43`: cae en `<img src>`/`<video src>`).
- **Corrección propuesta:** probar en una rama `experimental.sri` + `script-src 'self'` (sin `unsafe-inline`) y validar dashboard, calendario y portal; restringir `img-src`/`media-src` a `self` + origen de Supabase si el producto puede vivir sin URLs externas de imagen.
- **Estado:** confirmado (documentación de la versión instalada); falta validar empíricamente que ninguna pantalla rompe — eso es parte del trabajo de corrección.

### H8 — El `matcher` del proxy excluye rutas `…​.png` (bajo, confirmado)

- **Dónde:** `web/proxy.ts:62` — excluye `.*\.(png|webp|svg|jpg|jpeg|woff2?)$`.
- **Reproducción:** `GET /api/share/abc.png` responde 404 desde la ruta `[token]` (el token es «abc.png») **sin pasar por el proxy**: sin rate limit ni control de origen. Verificado en `dev:live`.
- **Impacto real:** casi nulo hoy: el token falso no abre nada y las respuestas siguen sin datos. Es un hueco estructural: cualquier ruta futura con punto en un segmento dinámico hereda «sin proxy». El redirect de `/api/...` a login que hace el proxy para rutas API no ocurre aquí (daría 401 la ruta misma). Nada de lo actual filtra datos.
- **Corrección propuesta:** cambiar la exclusión a `^(?!api/)` o excluir solo bajo `_next/` y rutas estáticas conocidas.
- **Estado:** confirmado.

### H9 — CHECK de 0010 admite rutas sin prefijo UUID (bajo, confirmado; sin explotación conocida)

- **Dónde:** `supabase/migrations/0010:15-16` con `0004:38-46` (`media_path_agency` devuelve NULL si el primer segmento no es un UUID). En Postgres un CHECK con resultado NULL **pasa**.
- **Reproducción (script adversarial, apartado 3):** `insert into media_assets … path='sin-uuid/x.png'` **se acepta** aunque `agency_id` sea otro valor cualquiera de agencia. El objeto correspondiente en Storage sigue inaccesible (la política evalúa `member_role(NULL)` → no miembro; verificado), así que no encontré forma de convertirlo en lectura.
- **Corrección propuesta:** `check (public.media_path_agency(path) is not null and public.media_path_agency(path) = agency_id)`.
- **Estado:** confirmado; impacto práctico no encontrado.

### H10 — Robustez del documento compartido (bajo, confirmado)

- **Dónde:** `web/app/share/[token]/page.tsx:371` (`post.comments.length`, `.map`), `get_share_portal` pasa `comments` tal cual.
- Un documento con `comments` u objeto inesperado (no array) rompe el render del portal (React lanza «map is not a function»); en la base, `submit_share_decision` con `comments` como objeto **no revienta** (lo coerciona a array; verificado). Un JSON de 50 000 niveles de anidamiento se guarda sin rechazo (verificado; solo limita 8 MB), y al recorrerlo el cliente de los miembros puede quedarse sin pila. Solo lo puede causar un editor contra su propia agencia o el portal de su marca: caída de página, no fuga.
- **Corrección propuesta:** normalizar `comments`/`networks` al proyectar en `get_share_portal` (devolver `[]` si no es array) y limitar profundidad del payload en `save_workspace`.
- **Estado:** confirmado.

### Verificado sin hallazgos (muestra de lo probado)

- **Rutas raras contra el proxy:** `//dashboard`, `//api/workspace`, `/DASHBOARD`, `/Api/workspace`, `/api/workspace/`, `/%2F%2F…`, sufijos, `x-middleware-subrequest` (el bypass de CVE-2025-29927 no existe en 16.4.3: no queda rastro de esa cabecera en `next/dist`). Next normaliza `//` y barra final con 308 antes de enrutar; nada saltó el proxy de autenticación.
- **Aislamiento y roles (PGlite, 31 pruebas adversariales + 97 del proyecto):** ajeno no lee/escribe/lista; viewer no guarda ni crea enlaces; editor no invita; admin no cambia roles ni expulsa; dueño no se autodegrada siendo el último; `accept_invitation` no escala a quien ya es miembro; invitación usada no reentra. `npm run test:db` (97 ok) y `npm test` (63 ok) en verde en el worktree.
- **`x-hubly-share-token`:** solo lo fija el servidor (`share/[token]/media/[id]/route.ts:15`), llega como GUC JSON y se usa hasheado como parámetro; cinco payloads maliciosos (comillas, `} or 1=1--`, comillas dobles extra) no abrieron nada.
- **Flujos reales con los permisos por columna de 0010:** `insert … returning *` (lo que hace PostgREST), `update` de `folder/name/status`, `delete` y el ciclo POST→URL firmada→PATCH ready funcionan; el upload del navegador manda exactamente `file.type` (sin parámetros) y la lista del bucket es idéntica a `lib/media.ts`. El upsert con `ON CONFLICT` también funciona (no lo usa la app; dentro de la agencia no da nada que el editor ya no tenga).
- **Avatares con la política nueva de 0010:** `upsert: true` necesita INSERT+UPDATE (la doc oficial de Storage lo confirma) y ambas políticas existen; `remove` tiene DELETE propio; el resto de avatares se ven por URL pública. No se rompe nada.
- **`safeNextPath`/`safeLinkHref`:** tabuladores, `%09` codificado, `//host`, `\`, mayúsculas en esquemas, `data:` — todos caen en el fallback; el `%09` codificado ya no se decodifica a tabulador antes de la comparación de origen.
- **Caché:** todas las respuestas con datos personales van `no-store`; el redirect interno a URL firmada es `private`; el del portal `no-store`; no hay `use cache`/`revalidate` en ningún sitio; el proxy copia las cabeceras anticaché de la renovación de sesión.
- **Cadena de suministro:** 217 paquetes, todos de `registry.npmjs.org` con `integrity`, **cero scripts de instalación** en el árbol, `@anthropic-ai/sdk` fijado a 1.3.0, CI con `contents: read`, sin `pull_request_target`, `npm ci`. Nada sospechoso encontrado (eso no es una garantía; sugiero activar Dependabot + secret scanning como ya dice la auditoría).

## 4. La migración 0010, ¿es segura de aplicar tal como está?

**No tal como está: hay que verificar dos sentencias antes y confirmar el resultado después. El resto es seguro.**

- **Seguro (probado en PGlite con los privilegios simulados de Supabase):** revokes/grants por columna de `media_assets`, el CHECK (con el matiz de H9), las cinco funciones re-creadas, `ai_usage` y su cuota. No borra ni reescribe datos, y los flujos reales de la app (insert+select, patch, delete, subida firmada, confirmación ready) siguen funcionando con los permisos nuevos.
- **Riesgo 1 — `update storage.buckets … allowed_mime_types` (línea 19).** Las tablas de `storage` son de `supabase_storage_admin`. Según la base de conocimiento de Supabase, postgres **sí** puede gestionar políticas en esas tablas, pero no es dueño; si la ejecución como postgres no tiene privilegio UPDATE, o si el RLS de `storage.buckets` filtra filas para postgres, el UPDATE **termina «Success» tocando 0 filas**: la migración parecerá aplicada y el bucket seguirá sin lista de tipos (el hueco A4 seguirá abierto sin aviso). No pude comprobarlo contra el proyecto real.
- **Riesgo 2 — `drop policy avatars_select on storage.objects` (línea 35).** La documentación dice que postgres puede crear/tirar políticas en `storage.*`, pero hay reportes de 2025 de fallos «must be owner of table objects» en proyectos tras cambios de plataforma. Si falla, el script se detiene ahí con la mitad aplicada (los grants de `media_assets` ya habrían corrido; no rompen nada, pero el hardening queda a medias y hay que re-ejecutar).
- **Cómo aplicar con seguridad:** en el SQL Editor, antes de la 0010 ejecutar

  ```sql
  select has_table_privilege('postgres','storage.buckets','UPDATE') as puede_update,
         has_table_privilege('postgres','storage.objects','UPDATE') as policy_dda,
         (select rolsuper or rolbypassrls from pg_roles where rolname='postgres') as super;
  select count(*) from storage.buckets where id='media' and allowed_mime_types is null;
  ```

  y tras aplicarla verificar que de verdad tocó filas:

  ```sql
  select id, allowed_mime_types is not null as tiene_lista from storage.buckets where id in ('media','avatars');
  select count(*) from pg_policies where tablename='objects' and policyname='avatars_select';
  ```

  Si `puede_update` es falso o el bucket sigue sin lista, hacer el cambio desde el dashboard de Storage (editar bucket → MIME types) en vez de por SQL. Hacerlo, como ya dice la auditoría, sin subidas en curso y con copia de seguridad.

## 5. Errores o afirmaciones sin sustento en la auditoría anterior

1. **P1 («la CSP necesita `unsafe-inline` porque los nonces son incompatibles con el prerender parcial»): incompleto y desactualizado.** La versión de Next instalada documenta `experimental.sri`, hecho para generación estática y combinable con nonces del proxy para lo dinámico. La conclusión «riesgo acotado» se apoyaba en que no hay HTML sin escapar — cierto hoy — pero descartó la mitigación sin probarla. (Ver H7.)
2. **M3 («eliminar a alguien revoca los links abiertos»): incompleto.** Solo revoca los de `email is null`; las invitaciones por correo pendientes dejan volver al expulsado (H2). La palabra «links» era literal, pero la conclusión de seguridad («quien salió no vuelve») no se sostiene.
3. **M4 («exige correo válido» como cierre de la puerta admin): incompleto.** Con correo válido, `create_invitation` sigue aceptando `role='admin'` de un admin (H5). La restricción «los links no dan administración» solo existe en `create_invite_link`.
4. **«Sin comprobar: la subida directa a Storage real» — y sin embargo la matriz de controles ya documenta assets reales.** `docs/MATRIZ-CONTROLES.md` incluye un id de asset (`/api/media/a607d…/file`) y un nombre de archivo de una demo con backend, subido al repo público. No es explotable sin sesión de esa agencia, pero conviene regenerar la matriz desde el modo demo para no filtrar ids internos en público.
5. **Menor:** el informe dice «tokens de ~244 bits»; `new_token` son 64 caracteres hex (256 bits) menos ~4 bits fijos de versión/variante de los UUIDv4 — irrelevante, solo precisión.
6. Lo demás verificado volvió a cuadrar: A1/A2/A5/M5/M6/M7/B1-B7 siguen corregidos en esta rama (revisé cada fix en el código), P2/P3/P4 siguen abiertos y bien razonados, y «npm audit 0» es cierto aunque no concluyente (ver cadena de suministro arriba).

## 6. Lo que no pude comprobar y por qué

- **Storage real de Supabase:** el simulado no reproduce storage-api. Todo lo de Storage (enforcement de `allowed_mime_types` —comparación exacta del Content-Type, según el comportamiento reportado—, políticas de `objects`, `update storage.buckets`, URLs firmadas, upsert real) queda como análisis de código + documentación oficial, no como prueba. El proyecto real no se tocó, como pediste.
- **Comportamiento del `postgres` del proyecto real** (dueños/grants/RLS de `storage.*`): varía por versión de plataforma; de ahí las verificaciones pre/post de la sección 4.
- **Carreras de concurrencia real** (`accept_invitation` vs `remove_member`, doble degradación de dueños, `consume_ai_quota` en paralelo): PGlite es single-conexión. Análisis: la cuota es segura (lock de fila + recheck del `WHERE` en `ON CONFLICT`); las otras dos tienen ventanas de milisegundos y ya estaban anotadas como P8; la de `remove_member`+link la cierro como teórica (requiere disparar aceptar y expulsar en el mismo instante).
- **CSP/SRI en build real:** no hice `next build` con `experimental.sri` para validar que ninguna pantalla rompe (es trabajo de la corrección, no del informe).
- **Flujo OAuth de Google y correos reales:** fuera del simulado, como ya decía la auditoría anterior.
- **`npm audit`:** no lo ejecuté contra la red; me basé en el lockfile (integridad y procedencia) y en la afirmación previa.

## 7. Las tres correcciones más urgentes

1. **Aplicar la 0010 con el protocolo de verificación de la sección 4** (y en particular confirmar que la lista de tipos del bucket `media` quedó puesta y que la política `avatars_select` es la nueva). Mientras no se aplique: bucket abierto de tipos, avatares listables y cuota de IA solo en memoria.
2. **Cerrar la expulsión y la puerta admin (H2 + H5):** revocar en `remove_member` también las invitaciones por correo del expulsado, y exigir owner para invitar con rol admin. Es un parche pequeño en la misma 0010 antes de aplicarla.
3. **Limpiar `localStorage` al cerrar sesión (H1)** y de paso pasar `secure: true` a las cookies (H6): el documento de la agencia y los chats no deben sobrevivir a la sesión en el navegador.

Pendiente de tu confirmación antes de tocar código. El script adversarial quedó en `web/tests/rev-seg-adversarial.mjs` dentro del worktree `Hubly-wt/rev-seg` (sin commitear) por si quieres re-ejecutarlo.
