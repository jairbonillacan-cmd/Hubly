# Plan C: GLM 5.3 Flash Max con subagentes

Alcance: tareas cerradas de calidad, con un resultado que se puede comprobar con un comando. Pega el bloque completo en el agente.

## Prompt

```text
Eres el ORQUESTADOR C del proyecto Hubly. Modelo: GLM 5.3 Flash Max. Tus subagentes usan ese mismo modelo y nivel. Hay otros dos agentes trabajando a la vez en otras carpetas; este plan está hecho para no pisarlos. Haz exactamente lo que se pide, en orden. No rediseñes, no refactorices y no arregles nada que no esté en la lista.

== INICIO (hazlo tú, en este orden, en PowerShell) ==
git -C C:\Users\jairb\Desktop\Hubly fetch origin
git -C C:\Users\jairb\Desktop\Hubly worktree add -b agente/glm-calidad C:\Users\jairb\Desktop\Hubly-wt\glm 73bf591
Desde C:\Users\jairb\Desktop\Hubly-wt\glm\web: npm ci
Enciende tu servidor en segundo plano, desde esa misma carpeta: npm run dev -- --port 3003
Comprueba que http://localhost:3003/dashboard responde.
Lee completos: AGENTS.md y web/AGENTS.md. Lee también §6 (iconos) de docs/GUIA-UX-UI-AGENTES.md.
Si tu entorno no permite subagentes, haz las tareas tú mismo en el mismo orden y dilo en tu entrega. No cambies de modelo en silencio.

== REGLAS QUE NO SE NEGOCIAN ==
1. Trabaja solo en C:\Users\jairb\Desktop\Hubly-wt\glm. No edites nada en C:\Users\jairb\Desktop\Hubly.
2. El servidor de localhost:3000 es del usuario: nunca lo apagues, reinicies ni uses. No uses taskkill ni Stop-Process por nombre sobre node. AGENTS.md dice «si 3000 responde, úsalo»: en esta tarea no aplica, usa siempre 3003.
3. Ejecuta todo con tu puerto: $env:E2E_PORT="3003" y $env:E2E_BASE="http://localhost:3003". Compruébalo antes de cada corrida. Sin eso, las pruebas escribirían en los datos reales del usuario.
4. Solo puedes commitear EXACTAMENTE estos archivos:
   web/components/app/marca/BuyerPersonas.tsx
   web/components/app/projects/ProjectEditModal.tsx
   web/e2e/archivos.spec.ts, calendario.spec.ts, compositor.spec.ts, listas.spec.ts, rutas.spec.ts, salud-cuentas.spec.ts
   web/e2e/auditoria-estados.mjs
   web/lib/calendar-views.test.ts, web/lib/post-import.test.ts, web/lib/post-draft.test.ts (nuevos)
   docs/planes-agentes/entregas/C.md
5. Todo lo demás no se toca, aunque veas un defecto. En especial: cualquier otro archivo de web/app/ y web/components/, los archivos de web/lib/ que no sean esos tres .test.ts, cualquier CSS, icons/, package.json, playwright.config.ts, web/scripts/. Si una prueba revela un defecto en código de la app, NO lo arregles: anótalo en la «Cola» de tu entrega con archivo, línea y cómo reproducirlo.
6. Nunca: git add ., git add -A, git stash, git reset --hard, git clean, git push --force, git merge, git rebase, fusionar a main o paridad-henry, ni check:ui -- --update. Nunca commitees web/AGENTS.md aunque aparezca modificado.
7. Nunca debilites una prueba para que pase: no borres aserciones, no subas tiempos a ciegas, no uses test.skip ni test.only. Si no puedes hacerla pasar honestamente, anótalo.
8. Añade cada archivo por su nombre. Mensajes de commit en español. Un commit por tarea.
9. A cada subagente pásale estas reglas y solo sus archivos. Orden: C1 y C5 pueden correr en paralelo. C2 va después de C1, sin nadie más usando tu servidor, porque compara el hash de los datos demo. C3 va después de C2 porque toca los mismos archivos. C4 va al final. No commitean: commiteas tú tras revisar.

== PASOS ==

--- C1. Quitar lucide de dos archivos ---
Archivos: BuyerPersonas.tsx (línea 3: import { Check, Plus, Trash2 } from "lucide-react") y ProjectEditModal.tsx (línea 4: import { X } from "lucide-react").
Pasos:
1. Busca los equivalentes en web/components/app/icons/DuotoneIcons.tsx. Mira cómo los importan otras pantallas.
2. Sustituye import y usos, conservando tamaño y aria-label.
3. Si algún icono no existe, no lo crees (icons/ está congelado): usa el más parecido que exista y anótalo en tu entrega.
Prueba: npm run check:ui ya no lista esos dos archivos. Los fallos de dashboard-polish.css son esperados: son de otro agente. Mira /marca y /proyectos en http://localhost:3003 para confirmar que los iconos se ven y los botones responden.

--- C2. Las pruebas no deben escribir en los datos demo ---
Archivos: compositor.spec.ts, calendario.spec.ts, listas.spec.ts, rutas.spec.ts.
Contexto: las pruebas guardan vía POST /api/workspace en web/.data. Ya contaminaron los datos del usuario una vez. Modelo a copiar, de salud-cuentas.spec.ts, líneas 3 a 9:
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/workspace**", (route) =>
      route.request().method() === "GET"
        ? route.continue()
        : route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
    );
  });
Pasos:
1. Copia web/.data/workspaces/workspace-default.json a tu carpeta temporal, si ya existe, y corre una vez las pruebas para tener un resultado de partida. Anótalo.
2. Agrega el bloqueo a cada archivo, antes de cualquier page.goto. Si ya tiene beforeEach, intégralo ahí. Mantén el comentario de una línea que explica el motivo.
3. Una prueba que dependa de que el servidor guarde (por ejemplo, recargar y seguir viendo el dato) fallará. En ese caso, no borres la aserción: deja esa prueba sin bloqueo solo si comprueba persistencia a propósito, y anótala con su nombre en tu entrega.
4. No crees un archivo auxiliar compartido: el reparto no lo permite.
Prueba: corre esos 4 archivos dos veces. Mismo resultado que el de partida, y web/.data/workspaces/workspace-default.json sin cambios, salvo los casos anotados. Compara con Get-FileHash.

--- C3. archivos.spec limpia lo que sube, y prueba de Excel ---
Archivos: archivos.spec.ts y calendario.spec.ts.
Pasos:
1. archivos.spec.ts deja archivos en web/.data/media. Haz que borre, por su id o nombre, exactamente lo que subió la prueba, en test.afterEach, también si la prueba falla. No borres nada más.
2. Prueba: compara el listado de web/.data/media antes y después de correrla. Debe coincidir.
3. La prueba de Excel de calendario.spec.ts falló una vez, sin causa confirmada. Hipótesis: recompilación del servidor durante la corrida. Búscala con grep "xlsx|Excel" en ese archivo. Córrela sola: npx playwright test e2e/calendario.spec.ts -g "<nombre>" --repeat-each=10.
4. Después vuelve a correrla 10 veces justo tras hacer que el servidor recompile (guarda sin cambios o agrega y quita una línea en BuyerPersonas.tsx). Registra fallos en cada escenario, con el error exacto.
5. Solo si encuentras la causa, corrígela en la prueba, por ejemplo esperando un estado real en vez de un tiempo fijo. Si es un defecto de la app, va a la Cola. Si no falla en 20 corridas, dilo: no inventes una causa.

--- C4. Auditoría de foco (solo informe) ---
Archivo: web/e2e/auditoria-estados.mjs.
Pasos:
1. Con E2E_BASE apuntando a 3003: npm run audit:estados. Nunca se ha ejecutado, así que puede fallar.
2. Si el script falla por un defecto propio, corrígelo.
3. Copia la lista completa de controles sin indicador de foco a tu entrega, agrupada por ruta y por tema claro u oscuro. Quita duplicados.
4. NO corrijas la interfaz: esos archivos son de otros agentes. Ponlo todo en la Cola.

--- C5. Pruebas unitarias nuevas ---
Archivos nuevos: web/lib/calendar-views.test.ts, web/lib/post-import.test.ts, web/lib/post-draft.test.ts. El comando npm test ya los recoge.
Pasos:
1. Lee web/tests/unit.test.ts para copiar el estilo y no repetir lo ya cubierto.
2. Lee web/lib/calendar-views.ts, post-import.ts y post-draft.ts, y prueba sus funciones exportadas. Casos mínimos:
   - calendar-views: semana que cruza mes y año; primer día de semana; posts sin fecha.
   - post-import: columnas con otro orden; fila con fecha inválida; filas duplicadas; archivo vacío.
   - post-draft: recuperar un borrador; datos corruptos; la marca no cambia al recuperar.
3. No modifiques el código probado. Si una prueba descubre un defecto real, déjala fuera, y anota en la Cola el caso, lo esperado y lo obtenido.
Prueba: npm test pasa completo.

== TU REVISIÓN ==
Tras cada tarea: lee el diff, comprueba que solo cambió lo pedido, repite su comando de prueba y commitea nombrando los archivos. Un informe de subagente no es prueba.

== PRUEBAS FINALES (desde web/, con servidor en 3003) ==
$env:E2E_PORT="3003"; $env:E2E_BASE="http://localhost:3003"
npm run check:ui     -> el único fallo aceptable es dashboard-polish.css (tamaño de texto y radio)
npx tsc --noEmit     -> sin errores
npm run build        -> compila. Si choca con tu servidor, para solo TU proceso del 3003 por su PID y vuelve a encenderlo después
npm test             -> pasa
npm run test:db      -> pasa
npx playwright test  -> pasa
Desde la raíz de tu carpeta: node C:\Users\jairb\Desktop\Hubly\docs\planes-agentes\comprobar-propiedad.mjs C   -> correcto

== RESULTADO ESPERADO ==
Rama agente/glm-calidad; sin lucide en los dos archivos; las pruebas no ensucian los datos demo; resultado claro de la prueba de Excel; informe de foco; tres archivos de pruebas nuevos.

== FINAL ==
1. Escribe docs/planes-agentes/entregas/C.md con: resultado por tarea, salida real de cada comando, conteo de corridas de Excel, informe de foco, pruebas que siguen escribiendo y por qué, lo que no se pudo verificar y «Cola».
2. Commitéalo y publica solo tu rama: git push -u origin agente/glm-calidad.
3. Deja encendido tu servidor del 3003.
4. Responde al usuario con la rama y lo que quedó sin hacer.

== FIN ==
Termina aquí. No fusiones nada ni empieces tareas nuevas.
```
