# Plan A: Opus 5.5 (medio) con subagentes Sonnet 5.5 (alto)

Alcance: diseño, criterio de producto y todo el CSS global. Pega el bloque completo en el agente.

## Prompt

```text
Eres el ORQUESTADOR A del proyecto Hubly. Modelo: Opus 5.5, esfuerzo medio. Tú decides, delegas y revisas. El trabajo de diseño e implementación lo hacen subagentes con Sonnet 5.5, esfuerzo alto (Agent con model "sonnet" y effort "high"). Hay otros dos agentes trabajando a la vez en otras carpetas; este plan está hecho para no pisarlos.

== INICIO (hazlo tú, en este orden, en PowerShell) ==
git -C C:\Users\jairb\Desktop\Hubly fetch origin
git -C C:\Users\jairb\Desktop\Hubly worktree add -b agente/opus-diseno C:\Users\jairb\Desktop\Hubly-wt\opus 73bf591
Desde C:\Users\jairb\Desktop\Hubly-wt\opus\web: npm ci
Enciende tu servidor en segundo plano, desde esa misma carpeta: npm run dev -- --port 3001
Comprueba que http://localhost:3001/dashboard responde.
Lee completos: AGENTS.md, web/AGENTS.md, DESIGN.md, docs/GUIA-UX-UI-AGENTES.md y docs/planes-agentes/00-COORDINACION.md (este último está en C:\Users\jairb\Desktop\Hubly\docs\planes-agentes\, no en tu rama).
Si Sonnet 5.5 no está disponible como subagente, detente y dilo. No cambies de modelo en silencio.

== REGLAS QUE NO SE NEGOCIAN ==
1. Trabaja solo en C:\Users\jairb\Desktop\Hubly-wt\opus. No edites nada en C:\Users\jairb\Desktop\Hubly.
2. El servidor de localhost:3000 es del usuario: nunca lo apagues, reinicies ni uses. No uses taskkill ni Stop-Process por nombre sobre node. AGENTS.md dice «si 3000 responde, úsalo»: en esta tarea no aplica, usa siempre 3001.
3. Ejecuta las pruebas siempre con tu puerto: $env:E2E_PORT="3001" para Playwright y $env:E2E_BASE="http://localhost:3001" para scripts de auditoría. Sin eso escribirían en los datos del usuario.
4. Solo puedes commitear estos archivos:
   web/app/(app)/{anuncios,ia,parrillas,calendario,dashboard,equipo,salud}/, web/app/(app)/layout.tsx, app-base.css, dashboard-polish.css, hubly-saas.css,
   web/components/app/{CommandPaletteModal,PostComposerModal,FloatingAIDrawer,DescubreHublyWidget,DashboardSubNav,AutoSuggestionsModal,MonthDragCalendar}.tsx,
   web/components/app/{dashboard,social,media}/, web/components/previews/,
   web/e2e/{verificar-buscador.cjs,buscador.spec.ts,capturas-henry.mjs},
   docs/planes-agentes/entregas/A.md y docs/planes-agentes/capturas-A/.
5. Todo lo demás no se toca, aunque veas un defecto. En especial: web/lib/ (incluido store.ts y types.ts), web/app/api/, supabase/, package.json, los *.spec.ts existentes, web/scripts/, icons/. Si necesitas un cambio ahí, no lo hagas: anótalo en la sección «Cola» de tu entrega, con archivo y cambio exacto, y sigue con otra cosa.
6. Los *.spec.ts existentes son de otro agente. Conserva los roles, nombres accesibles y data-testid que usan. Si un cambio tuyo los rompería, busca otra solución o anótalo en la Cola.
7. Nunca: git add ., git add -A, git stash, git reset --hard, git clean, git push --force, git merge, git rebase, fusionar a main o a paridad-henry, ni check:ui -- --update. Nunca commitees web/AGENTS.md aunque aparezca modificado: lo reescribe next dev.
8. Añade los archivos a cada commit por su nombre. Mensajes en español, como los del repo.
9. No inventes datos, métricas ni mensajes de éxito. Nada se marca hecho sin haberlo ejecutado o visto.

== DECISIONES QUE TOMAS TÚ ==
El usuario te delega estas tres; regístralas en tu entrega para que pueda revertirlas:
a. El periodo «Custom» de Salud de cuentas sigue fuera, porque no dejaba elegir fechas.
b. En /ia, las cuatro tarjetas pasan a ser enlaces reales.
c. /anuncios sigue visible con datos claramente marcados como ejemplo; no se oculta.
Decide también cualquier duda de diseño de tus subagentes, siguiendo la guía. No preguntes al usuario salvo que estés bloqueado.

== ORDEN DE SUBAGENTES ==
Solo un subagente a la vez puede editar dashboard-polish.css, así que S1, S2, S4 y S5 van en serie, en ese orden. S3 no toca CSS y puede correr en paralelo a S1. A cada subagente pásale su prompt y las reglas 1 a 9 completas, y dile que trabaja en esa carpeta y que no commitea: commiteas tú tras revisar.

--- S1. check:ui del CSS (Sonnet alto) ---
Objetivo: que dashboard-polish.css deje de fallar en npm run check:ui.
Pasos: en web/, corre npm run check:ui -- --list. El archivo tiene 17 hallazgos de tamaño de texto contra 15 permitidos, y 7 de radio contra 6. Corrige las reglas hubly-personas-* y vecinas, usando los valores de escala de la guía (§4 y §5) sin cambiar la jerarquía visual. No toques el baseline. Mira /marca en 1440 claro, 1440 oscuro y 390 antes y después.
Resultado: check:ui ya no lista dashboard-polish.css. Los dos fallos de lucide (BuyerPersonas, ProjectEditModal) son de otro agente: déjalos.

--- S2. Buscador global (Sonnet alto) ---
Archivos: web/components/app/CommandPaletteModal.tsx, reglas hubly-command-* en dashboard-polish.css, web/e2e/verificar-buscador.cjs y web/e2e/buscador.spec.ts (nuevo).
Pasos:
1. El script verificar-buscador.cjs tiene localhost:3000 escrito a mano en sus líneas 8 y 35. Cámbialo a process.env.E2E_BASE || "http://localhost:3000" ANTES de ejecutarlo, y ejecútalo con E2E_BASE apuntando a 3001.
2. Investiga el fallo conocido: tras pasar a 375 px y recargar, Control+K no abre el diálogo. Determina con evidencia si es del componente o de que el script pulsa antes de que la página cargue. Corrige la causa real.
3. Pasa todos sus pasos a web/e2e/buscador.spec.ts, bloqueando escrituras a /api/ igual que las líneas 4 a 9 de web/e2e/salud-cuentas.spec.ts. Después borra verificar-buscador.cjs.
4. Corrige destinos: CommandPaletteModal.tsx usa /dashboard?tab=cuentas (línea 218) y /dashboard?tab=equipo (líneas 229 y 383). Comprueba qué hace cada uno y apunta a /dashboard/salud-cuentas y /dashboard/equipo si esos parámetros no funcionan.
5. Unifica textos según la guía (español de México, vocabulario fijo): «Ajustes del Workspace», «Libretas Kraft», «ROAS» y parecidos.
6. Revisa en 1440 claro, 1440 oscuro y 390: foco, hover, vacío y resultados.
Resultado: buscador.spec.ts pasa completo, incluido móvil; ningún destino lleva a una pantalla equivocada.

--- S3. /anuncios e /ia honestos (Sonnet alto) ---
Archivos: web/app/(app)/anuncios/page.tsx y web/app/(app)/ia/page.tsx. No uses CSS global nuevo; si hace falta, pídelo al orquestador para aplicarlo tras S1.
/anuncios:
1. Aviso arriba con role="note": «Datos de ejemplo. Aún no hay una cuenta publicitaria conectada: estas cifras y anuncios no son de tu marca.»
2. Etiqueta «Ejemplo» en cada KPI (línea 613 en adelante) y en cada anuncio.
3. El modal pasa a «Ejemplo de diagnóstico», con la nota «Hubi todavía no analiza anuncios». El botón «Analizar» pasa a «Ver ejemplo».
4. Quita el role="button" de los KPI (línea 629): no hacen nada.
/ia:
1. Aviso permanente: «Hubi todavía no responde con IA. Las respuestas son ejemplos de formato».
2. Las respuestas se titulan «Ejemplo de formato» y usan solo datos reales de la marca (nombre, personas, pilares), sin gancho ni copy inventado. Elimina el texto fijo de «piezas minerales».
3. Quita «Programar en parrilla» (línea 404): hoy crea un post real con texto fijo.
4. «Conectar las redes», «Traer mis diseños», «Invitar a mi equipo» y «¿Qué hay pendiente?» pasan a enlaces reales: /parrillas, /archivos, /ajustes?tab=equipo y /tareas. Verifica antes el parámetro tab de /parrillas si lo usas.
5. Enviar queda disabled con el campo vacío.
En ambas: conserva la rama backendEnabled que ya muestra LiveUnavailable.
Resultado: ninguna cifra o respuesta de ejemplo puede confundirse con datos reales, y ningún botón crea datos con texto inventado.

--- S4. Comparación visual con Henry (Sonnet alto) ---
Referencias: las 8 imágenes de docs/referencias/henry-2026-10-31/. No uses Henry en vivo. Conserva la identidad de Hubly: marino y celeste, Hubi, iconos propios.
Pasos:
1. Crea web/e2e/capturas-henry.mjs usando E2E_BASE. Abre /parrillas?tab=calendario, pulsa «datos de ejemplo», cambia de vista con getByRole("tab"), abre el editor con window.__hubly.getState().openComposer() como en compositor.spec.ts, y bloquea escrituras a /api/. Guarda en docs/planes-agentes/capturas-A/, nunca en web/e2e/.salida/ porque Playwright la borra.
2. Captura las 8 escenas en escritorio y móvil, claro y oscuro; también con sidebar abierto y retraído y con movimiento reducido en las escenas donde aplique.
3. MIRA cada imagen junto a su referencia. Lista diferencias: composición, jerarquía, densidad y estados. Separa las intencionales de identidad y las de «Diferencias intencionales» en docs/ENTREGA-PARIDAD-HENRY.md.
4. Corrige el lote de defectos en tus archivos (social/, media/, previews/, PostComposerModal.tsx, parrillas/, CSS). Después haz una segunda ronda solo para confirmar.
Resultado: tabla de 8 escenas con estado, diferencia y evidencia. No declares paridad total: esto compara capturas, no comportamiento en vivo.

--- S5. Móvil y modo oscuro de tus rutas (Sonnet alto) ---
Rutas: /dashboard, /dashboard/equipo, /dashboard/salud-cuentas, /calendario, /parrillas, /ia, /anuncios, más los alias /equipo y /salud.
Pasos: revisa cada una a 390 px y en 1440 oscuro, haciendo scroll hasta el final. Busca desbordes, objetivos menores a 44 px, texto cortado y contraste. Vuelve a capturar Salud de cuentas: su desbordamiento de botones se corrigió sin verificar. Verifica en esta ronda dos correcciones sin confirmar: el popover de perfil del sidebar (236 px en layout.tsx) ya no queda tapado, y «Mi vista» y «Todo el equipo» exponen aria-pressed. Corrige lo que encuentres.
Resultado: tabla ruta por ruta con estado y evidencia.

== TU REVISIÓN COMO ORQUESTADOR ==
Tras cada subagente: lee su diff, mira las capturas que afecten diseño, corre tsc, y haz el commit nombrando los archivos. Un informe de subagente no es prueba: verifícalo. Si no cumple, devuélveselo con el defecto concreto.

== PRUEBAS FINALES (desde web/, con servidor en 3001) ==
$env:E2E_PORT="3001"; $env:E2E_BASE="http://localhost:3001"
npm run check:ui      -> el único fallo aceptable es lucide en BuyerPersonas.tsx y ProjectEditModal.tsx
npx tsc --noEmit      -> sin errores
npm run build         -> compila. Si choca con tu servidor, para solo TU proceso del 3001 por su PID y vuelve a encenderlo después
npm test              -> pasa
npm run test:db       -> pasa
npx playwright test   -> pasa. Si una prueba falla por un cambio tuyo, arregla tu cambio; no toques el spec. Si es inestable, repítela y dilo
node C:\Users\jairb\Desktop\Hubly\docs\planes-agentes\comprobar-propiedad.mjs A   -> correcto (ejecútalo desde la raíz de tu carpeta)

== RESULTADO ESPERADO ==
Rama agente/opus-diseno, con commits pequeños por tema; buscador corregido y con prueba; /anuncios e /ia honestos; CSS sin fallos de check:ui; 8 escenas comparadas; 7 rutas revisadas en móvil y oscuro.

== FINAL ==
1. Escribe docs/planes-agentes/entregas/A.md con: qué quedó hecho, resultados reales de cada comando, decisiones a, b y c, tabla de escenas y de rutas, lo que no se pudo verificar, y «Cola» con pedidos para archivos ajenos.
2. Commitéalo y publica solo tu rama: git push -u origin agente/opus-diseno.
3. Deja encendido tu servidor del 3001 para que el usuario lo vea.
4. Responde al usuario con la rama, el enlace http://localhost:3001 y lo que quedó sin hacer.

== FIN ==
Termina aquí: no fusiones. La integración se hace solo cuando el usuario te avise que B y C terminaron, siguiendo la sección «Integración» de 00-COORDINACION.md.
```
