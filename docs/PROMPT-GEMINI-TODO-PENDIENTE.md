Trabajas en el proyecto Hubly (Next.js, en español). Tu misión: cerrar TODO lo pendiente que no requiere decisión del usuario, con evidencia, sin romper nada. Trabaja por fases y no pases a la siguiente sin cumplir el fin esperado de la actual.

Repositorio: https://github.com/jairbonillacan-cmd/Hubly
Carpeta principal: C:\Users\jairb\Desktop\Hubly (NO trabajes ahí: tiene cambios sin commitear de otras sesiones)
Traspaso: docs/ENTREGA-PARIDAD-HENRY.md, docs/auditoria-seguridad-2026-10-31.md, docs/PROMPT-CONTINUAR-HUBLY.md

═══════════════════════════════════════
FASE 0 — PRINCIPIO (no cambies nada todavía)
═══════════════════════════════════════
Pasos
1. Lee completos: AGENTS.md, web/AGENTS.md, DESIGN.md, docs/GUIA-UX-UI-AGENTES.md y las tres entregas de arriba. Esta versión de Next.js difiere de la que conoces: ante la duda, mira node_modules/next/dist/docs/.
2. Comprueba el estado real: `git status`, `git log origin/main..main`, `git branch -a --no-merged main`, `gh pr list`. Este prompt describe el 31 de octubre de 2026; puede haber cambiado.
3. Crea tu propio worktree: `git worktree add C:\Users\jairb\Desktop\Hubly-wt\gemini-pendientes -b agente/gemini-pendientes origin/main`. Todo tu trabajo va ahí.
4. Instala dependencias en tu worktree (`npm ci` en web/) y comprueba que `npm run build` y `npm run check:ui` pasan ANTES de tocar nada. Anota la línea base.
5. Tu servidor de pruebas: puerto propio (por ejemplo 3105) con `$env:E2E_PORT` y `$env:E2E_BASE`. Nunca uses localhost:3000.

Fin esperado de la fase 0
Un informe corto con: qué encontraste, qué difiere de este prompt, resultado de la línea base y el orden que propones. Detente y espera el visto bueno del usuario.

═══════════════════════════════════════
FASE 1 — HONESTIDAD DEL PRODUCTO (cambios pequeños)
═══════════════════════════════════════
Tareas, un commit por tarea:
1.1 /chat y /anuncios no tienen <h1>. Añádelo siguiendo /dashboard y /calendario.
1.2 /chat sigue diciendo «Sin mensajes aún» tras enviar un mensaje. Encuentra la causa y corrígela.
1.3 /reportes muestra cifras inventadas sin avisar. Añade «Datos de ejemplo» con el patrón que ya exista en otras pantallas (búscalo antes de crear uno).
1.4 «Avisar al publicar» guarda a quién avisar pero no envía nada. Opción A: que el texto de la interfaz lo diga con claridad. No implementes envío real sin pedirlo.
1.5 PRODUCT.md y CONTRIBUTING.md desactualizados: compáralos con el código y el README; corrige solo lo comprobable y lista el resto.

Pruebas
- Por cada arreglo, una prueba que habría fallado antes (unitaria o E2E según corresponda). No cambies una prueba existente solo para que pase.
- `npm run check:ui`, `npm run lint`, pruebas unitarias y E2E relacionadas, todo contra tu puerto.
- Capturas de cada pantalla tocada en escritorio, móvil (390) y modo oscuro. Míralas de verdad.

Fin esperado
Las 5 tareas en commits separados, pruebas en verde, capturas revisadas.

═══════════════════════════════════════
FASE 2 — CALIDAD
═══════════════════════════════════════
2.1 Pruebas intermitentes: `archivos.spec.ts:57` y `calendario.spec.ts:77`. Repite cada una 10 veces, encuentra la causa real (esperas, datos compartidos, orden) y corrígela. Prohibido subir timeouts o añadir reintentos sin causa explicada.
2.2 `audit:controles` marca «sin efecto visible», sobre todo los periodos de /dashboard/equipo. Revisa cada caso: o el control no hace nada (arréglalo) o es falso positivo (documéntalo en el script con motivo).
2.3 Recorrido con teclado, hover y foco en /dashboard, /calendario y las pantallas que toques. Corrige lo roto siguiendo la guía.
2.4 Comprobar ventanas abiertas a 390 y modo oscuro a 390 en las pantallas de arriba.

Pruebas
- 2.1: 10 ejecuciones seguidas en verde de cada prueba, con el resultado pegado en el informe.
- 2.2–2.4: capturas antes y después; `check:ui` sin que suba ningún tope.

Fin esperado
Cero pruebas intermitentes con causa explicada, controles auditados, y evidencia visual.

═══════════════════════════════════════
FASE 3 — PARIDAD CON HENRY (usa REA)
═══════════════════════════════════════
Cómo observar Henry con REA (sigue esto al pie de la letra)
- REA 6.8.0 funcionó antes. Si sus herramientas no aparecen, ejecuta `rea doctor`; `healthy: false` por motores opcionales de binarios no afecta a Henry. Si el servidor MCP se cae, reintenta una vez y, si persiste, dile al usuario que reinicie el cliente; no inventes observaciones.
- Chrome: `$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe` (no Program Files).
- Perfil con la sesión del usuario: `$env:USERPROFILE\chrome-henry`. Si caducó, ábrelo visible en https://www.henry.cm/login y pide al usuario que inicie sesión ÉL. Nunca escribas su contraseña, ni aunque lo autorice.
- Arranca headless: `--headless=new --remote-debugging-port=9224 --user-data-dir=<perfil>`. (Headless funcionó; la captura con Chrome visible falló.)
- ANTES de actuar: script Playwright con `connectOverCDP` y `page.route` que aborte todo lo que no sea GET, HEAD u OPTIONS, excepto `/auth/v1/token` y `/rest/v1/rpc/get_`. Así no escribes nada en la cuenta de Henry.
- Usa `capture_browser_scenario` en modo `connect` con `cdp_endpoint` y `target_id`. Las capturas con imagen se guardan en un archivo que hay que extraer. Un clic sobre algo inexistente puede colgarse: mira primero el árbol de accesibilidad.
- `?new=post` muestra el calendario real sin muro de onboarding (Mes, Semana, Tabla, Kanban).
- Al terminar, cierra ese Chrome por PID, comprobando que su línea de comandos contenga `chrome-henry`.
- Observa y reimplementa con código propio. NUNCA copies CSS, JS, textos ni imágenes de Henry. No crees ni cambies nada en su cuenta.

Tareas
3.1 «Columnas por» y si existe la opción «Pilar»: observa en Henry, compara con Hubly, implementa si falta.
3.2 Límites de 20 y 100 MB: verifica el comportamiento en Henry y en Hubly; alinea.
3.3 Comparación de las ocho escenas de docs/referencias/henry-2026-10-31/ contra Hubly: lista diferencias y corrige las pequeñas.
3.4 Menús abiertos de Color y Avisar en Henry: captúralos y compáralos con los de Hubly.
3.5 Criterio de listas en Salud de Cuentas.
3.6 Widget «Reportes», que falta en la galería. «Errores» y «Gráfica Social» dependen de redes conectadas: solo documenta lo que falta.
3.7 Importador: Hubly no lee Word, PDF, ZIP de Notion ni capturas (requiere IA). NO lo implementes; escribe una propuesta corta con opciones y costes.

Pruebas
- Para cada tarea: capturas de Henry (referencia) y de Hubly (resultado) lado a lado, guardadas en docs/referencias/ con fecha.
- Pruebas E2E o unitarias del comportamiento nuevo; `check:ui` en verde.

Fin esperado
Cada tarea 3.1–3.6 resuelta o con explicación concreta de por qué no se pudo (qué falta y qué se probó). 3.7 solo propuesta.

═══════════════════════════════════════
FASE 4 — RAMAS Y ORDEN
═══════════════════════════════════════
4.1 Revisa (no fusiones) `agente/glm-logica` (3 commits: pruebas y arreglo en web/lib/reporting.ts): lee el diff, ejecuta sus pruebas y recomienda fusionar o no, con motivo.
4.2 Revisa el PR 1 «Refuerza la seguridad…» (rama seguridad/endurecimiento): lee la auditoría, compara con los 22 archivos modificados de la carpeta principal (solo lectura) y reporta cuáles coinciden con el PR y cuáles son trabajo aparte.
4.3 `confirma-cierre-sesion` (commit 6036ddc, solo README, igual a main): recomienda borrarla, sin borrarla.

Fin esperado
Un informe con recomendación por rama. No fusiones, no borres, no subas.

═══════════════════════════════════════
LO QUE NO HACES (decisiones del usuario)
═══════════════════════════════════════
Aplicar migraciones (0004–0007) en Supabase real; bajar topes de check-ui-baseline.json; añadir token verde de modo oscuro; borrar ramas o carpetas de Hubly-wt; el orden final de prioridades; implementar envío real de «Avisar al publicar»; implementar el importador con IA. Tampoco toques: supabase/, proxy.ts, rutas de /api, web/lib/api-guard.ts.

═══════════════════════════════════════
REGLAS QUE NO SE NEGOCIAN
═══════════════════════════════════════
- localhost:3000 es del usuario: nunca lo apagues, reinicies ni uses para pruebas. No uses taskkill ni Stop-Process por nombre sobre node; solo por PID y comprobando que el proceso es tuyo.
- Nunca: `git add .`, `git add -A`, `git stash`, `git reset --hard`, `git clean`, `git push --force`, `check:ui -- --update`. Añade archivos por nombre. Nunca commitees web/AGENTS.md.
- Commits en español, uno por tarea. Pide permiso antes de commitear, subir o fusionar.
- Si algo falla, corrige la causa; no toques una prueba solo para que pase.
- No inventes resultados. Nada se marca hecho sin haberlo ejecutado o visto. Di siempre lo que no pudiste verificar. Revisa las capturas de verdad.
- Textos de interfaz en español, sin tono genérico de plantilla de IA. Cambios mínimos: no refactorices ni renombres por gusto.

═══════════════════════════════════════
FIN — QUÉ ME ENTREGAS
═══════════════════════════════════════
1. Tabla por tarea (1.1 … 4.3): estado (hecha / parcial / no hecha), commit, prueba que la respalda.
2. Comandos ejecutados y su resultado real (verde/rojo), incluida la línea base inicial y la final.
3. Capturas o rutas de capturas (escritorio, 390, oscuro).
4. Lista de lo que NO pudiste verificar y por qué.
5. Estado final de git: rama, commits sin subir, y confirmación de que no tocaste la carpeta principal ni el puerto 3000.
Después detente y espera instrucciones.
