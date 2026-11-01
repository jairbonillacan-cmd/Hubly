Continúas la revisión de seguridad de Hubly (Next.js 16 + Supabase; agencias, marcas, portal de clientes, archivos e IA). Ya hiciste una revisión y escribiste su informe. Ahora tienes tres objetivos: corregir lo confirmado, revisar lo que aún no se ha mirado, y dejar el proyecto listo para que el usuario aplique la migración 0007 sin sorpresas. El proyecto es del usuario y todas las pruebas ofensivas son locales.

Repositorio: https://github.com/jairbonillacan-cmd/Hubly
Carpeta principal: C:\Users\jairb\Desktop\Hubly (solo lectura para ti: tiene cambios sin commitear)
Informes: docs/revision-seguridad-glm.md y docs/auditoria-seguridad-2026-10-31.md (están sin commitear en la carpeta principal)
PR de seguridad: https://github.com/jairbonillacan-cmd/Hubly/pull/1 (rama `seguridad/endurecimiento`, abierto, sin fusionar)
Worktree de tu revisión: C:\Users\jairb\Desktop\Hubly-wt\rev-seg, con web/tests/rev-seg-adversarial.mjs sin commitear

LÍMITES
- Solo local: nada contra el proyecto real de Supabase, producción, el puerto 3000 ni datos reales.
- Nunca imprimas, copies ni commitees el valor de un secreto. Si encuentras uno, indica archivo y línea y avisa al usuario.
- Comprueba antes de afirmar. Marca cada hallazgo como «confirmado» o «sin confirmar».

FASE 0: PRINCIPIO (no cambies nada)
1. Lee AGENTS.md, web/AGENTS.md, los dos informes y la guía de CSP de node_modules/next/dist/docs/. Si tocas interfaz, lee también docs/GUIA-UX-UI-AGENTES.md.
2. Comprueba el estado con git y `gh pr view 1`, y mira si el PR avanzó.
3. Vuelve a ejecutar rev-seg-adversarial.mjs, `npm test` y `npm run test:db`. Anota la línea base.
4. Revisa estos puntos de tu informe, porque las correcciones propuestas pueden romper cosas o tienen errores:
   - H1: borrar todo `hubly:` al cerrar sesión puede destruir trabajo. `hubly:conflicto:` es una copia de recuperación y los chats de Hubi quizá solo existan en ese navegador. Averigua qué se perdería con cada prefijo. Evalúa guardar por cuenta o avisar antes de borrar, y tampoco borres preferencias sin motivo.
   - H3: comprueba si Next 16 da acceso a la «IP del socket» en el proxy; puede que no exista. Comprueba también que un `host` interno tras un proxy no provoque 403 en todas las escrituras. El valor por defecto no puede dejar sin servicio un despliegue en Vercel.
   - H4: se titula «pasa el control», pero concluye que no es explotable. Corrige el título.
   - H6: `secure: true` no debe romper el desarrollo por http ni `dev:live`. Aplícalo solo donde corresponda y pruébalo.
   - H7: SRI protege archivos externos, pero no autoriza scripts en línea. Comprueba si Next sigue necesitando esos scripts sin `unsafe-inline`, y si `unsafe-inline` queda anulado de verdad con esta política. Decide con una prueba en `next build`, no por la documentación.
   - H8: la auditoría marca B4 como corregido y tú reprodujiste el mismo hueco. Aclara quién tiene razón.
   - H9: el CHECK nuevo puede fallar al aplicarse si hay filas antiguas que no lo cumplen. Da una consulta previa para detectarlas y valora `NOT VALID` más `VALIDATE`.
   - Sección 5, punto 4: comprueba si el repositorio es público y si ese id de asset está realmente en el historial.
5. Prepara tu rama, sin commitear en la rama del PR:
   `git worktree add C:\Users\jairb\Desktop\Hubly-wt\seg-glm -b seguridad/correcciones-glm origin/seguridad/endurecimiento`
   Usa un puerto propio, por ejemplo 3210, con `$env:E2E_PORT` y `$env:E2E_BASE`.

Fin esperado: un informe breve con la línea base, lo que corriges de tu propio informe, tu plan y estas preguntas para el usuario. Detente y espera respuesta.
   a. ¿Ya se aplicó la 0007 en Supabase real? Si no, corrige dentro de la 0007. Si sí, crea una 0008 y no toques la 0007.
   b. ¿Solo el dueño puede crear administradores (H5)? Tu recomendación es que sí.
   c. ¿Dónde se despliega Hubly? Afecta a H3.
   d. ¿Se permiten URLs externas de imagen? Afecta a `img-src` en H7.
   e. ¿Autoriza commits locales en tu rama durante este trabajo? Sin esa autorización, deja los cambios sin commitear.
   f. ¿Permite usar Docker y `supabase start` en local, si están disponibles?

FASE 1: CORRECCIONES CONFIRMADAS
Un commit por hallazgo, en este orden:
1. H2: `remove_member` revoca también las invitaciones por correo del expulsado, sin distinguir mayúsculas.
2. H5: según la respuesta del usuario, en la base de datos y en la interfaz.
3. H9: CHECK que rechaza rutas sin UUID.
4. H10: normaliza `comments` y `networks` en `get_share_portal`, limita la profundidad en `save_workspace`, y haz que el portal no se rompa con datos inesperados.
5. H1: con la solución que salga de la fase 0. Incluye el cambio de cuenta en `syncFromServer`.
6. H6: `secure` en las cookies, según la fase 0.
7. H3: confianza en cabeceras declarada por configuración, con un valor por defecto seguro y documentado.
8. H8: el `matcher` nunca excluye `/api/`.
9. Si el id de asset es real, regenera docs/MATRIZ-CONTROLES.md desde el modo demo. Si el id está en el historial, avisa; no reescribas el historial.
10. H7: en un commit aparte y reversible. Si no se puede quitar `unsafe-inline` sin romper pantallas, no lo fuerces: documenta lo probado y cierra con las mejoras que sí funcionen.

Pruebas de la fase 1
- Por cada arreglo, una prueba que falle sin él y pase con él. Comprueba las dos cosas y pega ambas salidas.
- Añade los casos adversariales al conjunto versionado de pruebas, sin rutas locales ni datos reales.
- Regresión: subida de archivos, avatar, invitación y aceptación, link de invitación, portal, guardado, IA, cierre de sesión y cambio de cuenta.
- `npx tsc --noEmit`, `npm test`, `npm run test:db`, `npm run check:ui` y `next build` con `next start`, comprobando las cabeceras. Nada de `check:ui -- --update`.
- Si tocas CSP o interfaz, revisa dashboard, calendario, ajustes y portal en escritorio, móvil y oscuro, sin violaciones de CSP en la consola.

Fin esperado: H1, H2, H3, H5, H6, H8, H9 y H10 corregidos con prueba, y H7 corregido o con su límite documentado.

FASE 2: LO QUE AÚN NO SE HA REVISADO
Busca e intenta explotar en local:
1. Matriz completa de autorización: cada ruta de web/app/api y cada función RPC, por rol (sin sesión, ajeno, viewer, editor, admin, dueño, expulsado). Revisa los `grant execute` a `anon` y `public`, y que todas las tablas tengan RLS. Que sea un script reejecutable.
2. Sesión tras expulsión: qué conserva el expulsado mientras siga vivo su JWT (documento en memoria, URLs firmadas, Realtime si existe).
3. Archivos: `Content-Type` falso frente al contenido real, SVG y HTML, `Content-Disposition`, nombres con rutas o caracteres de control, y cómo se sirven en cada modo.
4. Filtraciones: contenido de usuarios o tokens en logs, mensajes de error, URLs, `Referer` desde el portal y cachés del navegador. Revisa todas las claves de `localStorage`, `sessionStorage` e IndexedDB.
5. Portal y tokens: fuerza bruta, enumeración, reuso tras revocar, y qué datos internos llegan al cliente en la respuesta de red aunque no se muestren.
6. Enumeración de cuentas e invitaciones: si respuestas o tiempos revelan qué correos existen.
7. XSS guardado: nombres de agencia y marca, comentarios, notas de TipTap, enlaces y notificaciones, en todos los sitios donde se muestran.
8. IA: qué datos personales se envían a Anthropic y si una inyección de prompt puede sacar datos de otra marca de la misma agencia.
9. Agotamiento y costes: tamaño y frecuencia de documentos, almacenamiento, notificaciones, cuota de IA en paralelo.
10. Datos personales: qué se guarda de cada persona, si una cuenta o agencia se puede borrar de verdad, y qué queda en Storage al borrar. Si falta, propón; no lo construyas.
11. Secretos e historial: revisa todas las ramas con gitleaks si ya está disponible, o con búsquedas equivalentes.
12. Storage real: si el usuario autorizó Docker, usa `supabase start` para probar los puntos que el simulado no cubre (lista de tipos, políticas de `objects`, `update storage.buckets`, URLs firmadas) y la concurrencia con Postgres real. Si no se puede, déjalo como «sin confirmar».

Corrige lo pequeño y confirmado igual que en la fase 1. Lo grande o de diseño se queda como propuesta (por ejemplo P2, acceso por marca).

Fin esperado: cada punto con resultado (hallazgo, sin hallazgo con qué se probó, o no comprobado con motivo) y los scripts reejecutables en el repo.

FASE 3: PREPARAR LA MIGRACIÓN (sin aplicarla)
Escribe docs/guia-aplicar-0007.md para que la siga el usuario, en lenguaje claro: copia de seguridad, consultas previas (incluidos permisos sobre `storage.*` y filas que incumplan el CHECK), aplicación, consultas posteriores que demuestren que tocó filas de verdad (lista de tipos del bucket y política `avatars_select`), qué hacer si falla a medias, cómo revertir, y qué probar después en la app.
Prueba la migración en local desde cero y sobre una base con datos anteriores a la 0007.

FUERA DE TU ALCANCE (es del usuario)
Aplicar migraciones en Supabase real, configurar Auth, CAPTCHA, hosting y GitHub, poner topes de gasto, rotar claves, fusionar o subir, y borrar ramas o worktrees. Si hace falta algo de esto, inclúyelo en la lista final.

REGLAS
- localhost:3000 es del usuario: no lo apagues, reinicies ni uses. No uses taskkill ni Stop-Process por nombre sobre node; solo por PID y comprobando que el proceso es tuyo.
- Nunca: `git add .`, `git add -A`, `git stash`, `git reset --hard`, `git clean`, `git push`, `check:ui -- --update`. Añade archivos por nombre. Nunca commitees web/AGENTS.md. Commits en español.
- Si algo falla, corrige la causa. No debilites una prueba ni una regla para que pase.
- Cambios mínimos. No hagas refactorizaciones ni actualices dependencias sin avisar.
- No inventes resultados. Si no lo ejecutaste, di que no lo ejecutaste.
- Si encuentras algo grave y explotable en producción, detente y avisa de inmediato, sin intentarlo allí.

FIN: QUÉ ENTREGAS
Actualiza docs/revision-seguridad-glm.md y deja en el chat:
1. Tabla por hallazgo: gravedad, estado (corregido, parcial, abierto, decisión del usuario), commit y prueba que lo respalda.
2. Hallazgos nuevos: reproducción, impacto real y corrección.
3. Comandos ejecutados con su resultado real, de la línea base y del final.
4. Veredicto: si la 0007 es segura de aplicar y si el PR 1 está listo para revisión, con motivos. Indica también si hay conflictos con `main`, que va por delante del PR.
5. Lista de lo que debe hacer el usuario, en orden.
6. Lo que no pudiste comprobar y por qué.
7. Estado de git: rama, commits sin subir, y confirmación de que no tocaste la carpeta principal, el puerto 3000 ni el proyecto real.
Después detente y espera instrucciones.
