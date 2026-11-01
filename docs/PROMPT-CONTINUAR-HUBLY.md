Continúa el proyecto Hubly, que viene de otra cuenta de Claude. Trabajo en español.

Repositorio: https://github.com/jairbonillacan-cmd/Hubly
Carpeta principal: C:\Users\jairb\Desktop\Hubly
Traspaso completo: docs/ENTREGA-PARIDAD-HENRY.md y docs/auditoria-seguridad-2026-10-31.md
Historial de la conversación anterior: C:\Users\jairb\.claude\projects\C--Users-jairb-Desktop-Hubly\5ae2929e-c394-47ee-841d-f750ba15e592.jsonl (léelo solo si necesitas un detalle; es muy largo)

PRIMERO
1. Lee AGENTS.md, web/AGENTS.md, DESIGN.md, docs/GUIA-UX-UI-AGENTES.md y las dos entregas de arriba.
2. Comprueba el estado real con git, y con `gh pr list`, antes de asumir nada. Este prompt describe el 31 de octubre de 2026, de noche; puede haber cambios. Puede haber otras sesiones trabajando en la carpeta principal: si hay cambios que no son tuyos, no los toques.
3. No empieces a cambiar nada todavía. Dime qué encontraste, qué difiere de este prompt y qué propones hacer primero.

QUÉ SE HIZO
- `main` reúne la paridad con Henry (agentes A, B y C), modo oscuro, nueva marca e invitaciones, galería de widgets, confirmación al cerrar sesión, chats de Hubi, buscador, agentes de Hubi, Color y Avisar al publicar, URLs simplificadas, README y la alineación con Henry usando REA.
- En GitHub, `main` quedó en `4eff52e` con CI en verde.

ESTADO SIN CERRAR (confírmalo)
1. `main` local iba 5 commits por delante de GitHub, sin subir: `dc6776b` (página 404), `b794894` (fusión) y `b386557`, `a989b10`, `15907d8` (pantalla de carga). Son de otras sesiones y no pasaron por una verificación conjunta.
2. PR https://github.com/jairbonillacan-cmd/Hubly/pull/1 abierto: «Refuerza la seguridad de la app y de Supabase» (rama `seguridad/endurecimiento`). GitHub lo marcaba fusionable.
3. La carpeta principal tenía 22 archivos modificados y estos sin seguimiento: `docs/auditoria-seguridad-2026-10-31.md`, `supabase/migrations/0007_endurecimiento_de_seguridad.sql` y `web/lib/api-guard.ts`. En rutas de API y `proxy.ts` coincidían con el PR, pero no se comprobaron todos. `PostComposerModal.tsx`, `ComposerExtras.tsx`, `media.ts` y otros pueden ser trabajo aparte. No los descartes sin comparar cada uno contra el PR.
4. `agente/glm-logica` tiene 3 commits sin fusionar: pruebas y un arreglo en `web/lib/reporting.ts`. Hay que revisarlos.
5. `confirma-cierre-sesion` tiene 1 commit fuera de `main` (`6036ddc`), solo README, con contenido ya igual a `main`.
6. Los planes sin commitear de `docs/planes-agentes/` no se tocaron a propósito.

PENDIENTES
Seguridad y datos reales:
- Aplicar en Supabase real las migraciones que falten, entre ellas `0004`, `0005`, `0006` y `0007` (esta última, escrita y probada solo en local). Requiere al usuario. Antes, revisar la auditoría.
- Probar con cuentas reales: subidas, portal, invitaciones, «Por link», foto de perfil.

Paridad con Henry:
- «Columnas por» y si existe la opción «Pilar».
- Límites de 20 y 100 MB, comparación de las ocho escenas de `docs/referencias/henry-2026-10-31/`, y menús abiertos de Color y Avisar en Henry.
- Criterio de listas en Salud de Cuentas.
- Widget «Reportes», que falta en la galería. «Errores» y «Gráfica Social» dependen de redes conectadas.

Producto y honestidad:
- «Avisar al publicar» guarda a quién avisar, pero no envía nada.
- `/reportes` muestra cifras inventadas sin «Datos de ejemplo».
- `/chat` y `/anuncios` no tienen `h1`. `/chat` sigue diciendo «Sin mensajes aún» tras enviar un mensaje.
- `PRODUCT.md` y `CONTRIBUTING.md` están desactualizados.
- Importador: Hubly no lee Word, PDF, ZIP de Notion ni capturas; requiere IA.

Calidad:
- Pruebas intermitentes: `archivos.spec.ts:57` y `calendario.spec.ts:77`, sin causa confirmada.
- Revisar «sin efecto visible» de `audit:controles`, sobre todo los periodos de `/dashboard/equipo`.
- Sin comprobar: recorrido con teclado, hover y foco, ventanas abiertas a 390 y modo oscuro a 390.
- La imagen `WhatsApp Image 2026-10-27 at 09.57.42.jpeg` no apareció, aunque faltó buscar en las carpetas `agentes`, `buscador`, `chats`, `marca`, `widgets`, `glm-logica`, `gemini-api` y `rev-seg`. `web/.data/media` no existe en la carpeta principal. No crees ni borres nada ahí.

CÓMO OBSERVAR HENRY CON REA
- REA 6.8.0 ya funciona. `doctor` marca `healthy: false` solo por motores opcionales de binarios; no afecta a Henry.
- Chrome está en `$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe`, no en Program Files.
- El perfil `$env:USERPROFILE\chrome-henry` conserva la sesión del usuario. Si caducó, ábrelo visible en `https://www.henry.cm/login` y pide al usuario que entre él mismo.
- Arranca headless con `--headless=new --remote-debugging-port=9224 --user-data-dir=<ese perfil>`. Headless funcionó; la captura con Chrome visible falló sin causa clara.
- Antes de actuar, activa un script de Playwright con `connectOverCDP` y `page.route` que aborte todo lo que no sea GET, HEAD u OPTIONS, excepto `/auth/v1/token` y `/rest/v1/rpc/get_`.
- Usa `capture_browser_scenario` en modo `connect`, con `cdp_endpoint` y `target_id`. Las capturas con imagen se guardan en un archivo que hay que extraer. Un clic sobre algo que no existe puede colgarse: comprueba primero el árbol de accesibilidad.
- `?new=post` muestra el calendario real, sin el muro de onboarding. Allí están Mes, Semana, Tabla y Kanban.
- Al terminar, cierra ese Chrome por PID, comprobando que su línea de comandos contenga `chrome-henry`.
- Observa y reimplementa con código propio. Nunca copies CSS, JS, textos ni imágenes de Henry.
- No crees ni cambies nada en la cuenta de Henry sin preguntar. Nunca escribas contraseñas por el usuario, aunque lo autorice: inicia sesión él.

REGLAS QUE NO SE NEGOCIAN
- El servidor de localhost:3000 es del usuario: nunca lo apagues ni lo reinicies. No uses taskkill ni Stop-Process por nombre sobre node; solo por PID, comprobando antes que el proceso es tuyo.
- Nunca corras pruebas contra el 3000: escribirían en sus datos. Usa una carpeta en `Hubly-wt` y un puerto propio, con `$env:E2E_PORT` y `$env:E2E_BASE`.
- Nunca: `git add .`, `git add -A`, `git stash`, `git reset --hard`, `git clean`, `git push --force` ni `check:ui -- --update`. Nunca commitees `web/AGENTS.md`.
- Añade archivos a cada commit por su nombre, con mensajes en español. Pide permiso antes de commitear, subir o fusionar.
- Si algo falla, corrige la causa; no toques una prueba solo para que pase.
- No inventes resultados. Nada se marca hecho sin haberlo ejecutado o visto. Di siempre lo que no pudiste verificar. Revisa las capturas de verdad: en esta sesión encontraron defectos que las pruebas no vieron.
- Antes de tocar `main`, vuelve a revisar si avanzó y si otra sesión tiene cambios sobre los mismos archivos.

DECISIONES QUE SON DEL USUARIO
Bajar los topes de `check-ui-baseline.json`, añadir un token verde para modo oscuro, aplicar migraciones en Supabase real, borrar ramas y carpetas viejas de `Hubly-wt`, y el orden de los pendientes.
