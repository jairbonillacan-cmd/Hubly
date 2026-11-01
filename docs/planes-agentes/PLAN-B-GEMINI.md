# Plan B: Gemini 3.8 Flash High con subagentes

Alcance: auditoría de controles, botones muertos y móvil en 11 rutas. Pega el bloque completo en el agente.

## Prompt

```text
Eres el ORQUESTADOR B del proyecto Hubly. Modelo: Gemini 3.8 Flash High. Tus subagentes usan ese mismo modelo y nivel. Hay otros dos agentes trabajando a la vez en otras carpetas; este plan está hecho para no pisarlos. Sigue los pasos en orden y no amplíes el alcance.

== INICIO (hazlo tú, en este orden, en PowerShell) ==
git -C C:\Users\jairb\Desktop\Hubly fetch origin
git -C C:\Users\jairb\Desktop\Hubly worktree add -b agente/gemini-flujos C:\Users\jairb\Desktop\Hubly-wt\gemini 73bf591
Desde C:\Users\jairb\Desktop\Hubly-wt\gemini\web: npm ci
Enciende tu servidor en segundo plano, desde esa misma carpeta: npm run dev -- --port 3002
Comprueba que http://localhost:3002/dashboard responde.
Lee completos: AGENTS.md, web/AGENTS.md, docs/GUIA-UX-UI-AGENTES.md y las secciones 2 y 3 del traspaso en docs/ENTREGA-PARIDAD-HENRY.md.
Si tu entorno no permite subagentes, haz las tareas tú mismo en el mismo orden y dilo en tu entrega. No cambies de modelo en silencio.

== REGLAS QUE NO SE NEGOCIAN ==
1. Trabaja solo en C:\Users\jairb\Desktop\Hubly-wt\gemini. No edites nada en C:\Users\jairb\Desktop\Hubly.
2. El servidor de localhost:3000 es del usuario: nunca lo apagues, reinicies ni uses. No uses taskkill ni Stop-Process por nombre sobre node. AGENTS.md dice «si 3000 responde, úsalo»: en esta tarea no aplica, usa siempre 3002.
3. Ejecuta todo con tu puerto: $env:E2E_BASE="http://localhost:3002" y $env:E2E_PORT="3002". Sin eso, la auditoría pulsaría botones sobre los datos reales del usuario.
4. Solo puedes commitear estos archivos:
   web/app/(app)/{crm,tareas,chat,notificaciones,automatizaciones,reportes,marcas,marca,estrategia,archivos,proyectos,ajustes}/,
   web/components/app/{ajustes,tasks,reports,gemini}/,
   web/components/app/{ArchivosYProyectosView,WidgetConfigModal,AccessPanel,KanbanDropSlot,KraftNotebookCard,NotebookEditor,NotebookReaderModal,NewBrandModal,InviteTeamModal}.tsx,
   web/e2e/auditoria-controles.mjs, docs/MATRIZ-CONTROLES.md, docs/planes-agentes/entregas/B.md.
5. Todo lo demás no se toca, aunque veas un defecto. En especial:
   - dashboard-polish.css, app-base.css, hubly-saas.css, globals.css y layout.tsx. La guía (línea 579) dice que los estilos van al final de dashboard-polish.css; en esta tarea NO. Si necesitas CSS, crea un CSS Module junto a tu componente, en tu carpeta de ruta o en web/components/app/gemini/, solo con tokens --ui-* y --hb-*.
   - web/lib/ (store.ts, types.ts y demás), web/app/api/, supabase/, package.json, web/scripts/, icons/, los *.spec.ts.
   - web/components/app/marca/BuyerPersonas.tsx y web/components/app/projects/ProjectEditModal.tsx: son de otro agente.
   Si un arreglo necesita algo de esa lista, no lo hagas: anótalo en «Cola» de tu entrega, con archivo y cambio exacto.
6. Nunca: git add ., git add -A, git stash, git reset --hard, git clean, git push --force, git merge, git rebase, fusionar a main o paridad-henry, ni check:ui -- --update. Nunca commitees web/AGENTS.md aunque aparezca modificado.
7. Añade cada archivo por su nombre. Mensajes de commit en español.
8. No sustituyas un botón roto por un aviso de éxito falso ni por datos de ejemplo. Conserva roles, nombres accesibles y data-testid: las pruebas existentes los usan.
9. A cada subagente pásale estas reglas completas y su lista exacta de archivos. No commitean: commiteas tú tras revisar.

== PASOS ==

--- Tarea G1. Auditoría (subagente 1; termina antes de empezar G2, G3 y G4) ---
1. En web/, con E2E_BASE apuntando a 3002: npm run audit:controles. Tarda unos 13 minutos con 4 en paralelo; ejecútala en segundo plano.
2. Esto reescribe docs/MATRIZ-CONTROLES.md. Filtra las filas «sin efecto visible», «no se pudo pulsar» y «no reproducible».
3. Clasifica cada una en una tabla: ruta, control, categoría (botón muerto / correcto / defecto del script / sin diagnosticar), evidencia de cómo lo comprobaste y dueño.
4. Antes de llamarlo defecto, repítelo a mano con una sola acción limpiando localStorage. Ya se sabe que son correctos:
   - «Archivar» en /marcas y «Enviar mensaje a Hubi» en /ia
   - Crear regla, Crear actividad, Guardar en Nuevo prospecto (formularios vacíos)
   - Exportar PDF, Nuevo y Reporte Ejecutivo Imprimible en /reportes (confírmalos)
   - «Subir» en /archivos y las pestañas ya seleccionadas
5. Si un fallo es del propio script, corrígelo en auditoria-controles.mjs. Investiga también si las ventanas de las tarjetas de bienvenida del Dashboard no se reabren por el script.
6. Hallazgos en rutas ajenas (/dashboard, /dashboard/equipo, /dashboard/salud-cuentas, /calendario, /parrillas, /ia, /anuncios, sidebar, buscador, compositor): no se arreglan, van a la Cola.
Resultado: tabla completa y lista de arreglos dividida entre G2, G3 y G4.

--- Tareas G2, G3 y G4. Arreglos (pueden correr en paralelo; ninguno toca archivos del otro) ---
G2: web/app/(app)/{crm,automatizaciones,reportes}/ y web/components/app/reports/.
G3: web/app/(app)/{tareas,chat,notificaciones}/, web/components/app/tasks/, KanbanDropSlot.tsx, KraftNotebookCard.tsx, NotebookEditor.tsx, NotebookReaderModal.tsx.
G4: web/app/(app)/{marcas,marca,estrategia,archivos,proyectos,ajustes}/, web/components/app/ajustes/, ArchivosYProyectosView.tsx, WidgetConfigModal.tsx, AccessPanel.tsx, NewBrandModal.tsx, InviteTeamModal.tsx.
G4 además diagnostica el timeout de «Mover … hacia arriba» en Configurar widgets (WidgetConfigModal.tsx:539): ¿deshabilitado, tapado u otro? Corrígelo si es un defecto.
Para cada botón muerto: si la función existe, conéctala. Si no existe y no se puede hacer sin archivos congelados, quita el control o márcalo como función prevista, igual que hace web/components/app/ajustes/PrevistoPanel.tsx. Nunca dejes un control que parece funcionar y no hace nada. Si un elemento no es acción, quítale el role="button".
Resultado: cada fila de botón muerto queda arreglada o en la Cola, con motivo.

--- Tarea G5. Móvil (subagente 5; después de G2, G3 y G4) ---
Rutas: /tareas, /chat, /notificaciones, /marcas, /marca, /archivos, /proyectos, /reportes, /crm, /automatizaciones, /ajustes.
A 390 px y haciendo scroll hasta el final, revisa: desborde horizontal, texto cortado, objetivos menores a 44 px, tablas sin scroll localizado y modales que no caben. Prueba también al menos un modal de cada ruta. Toma capturas y MÍRALAS. Comprueba cada arreglo en modo oscuro.
Si el arreglo necesita CSS global, usa un CSS Module o anótalo en la Cola.
Resultado: tabla de 11 rutas con estado, defecto, arreglo y captura revisada.

--- Tarea G1, segunda vuelta ---
Vuelve a correr npm run audit:controles y confirma que los botones arreglados ya tienen efecto. Commitea docs/MATRIZ-CONTROLES.md con este resultado. Debe indicar que es previo a la integración.

== TU REVISIÓN ==
Tras cada tarea: lee el diff, corre npx tsc --noEmit, repite a mano un caso y commitea nombrando los archivos. Un informe de subagente no es prueba.

== PRUEBAS FINALES (desde web/, con servidor en 3002) ==
$env:E2E_PORT="3002"; $env:E2E_BASE="http://localhost:3002"
npm run check:ui     -> ningún archivo tuyo falla. Son esperados los fallos de dashboard-polish.css, BuyerPersonas.tsx y ProjectEditModal.tsx
npx tsc --noEmit     -> sin errores
npm run build        -> compila. Si choca con tu servidor, para solo TU proceso del 3002 por su PID y vuelve a encenderlo después
npm test             -> pasa
npm run test:db      -> pasa
npx playwright test  -> pasa. No edites specs: si un cambio tuyo rompe uno, corrige tu cambio
Desde la raíz de tu carpeta: node C:\Users\jairb\Desktop\Hubly\docs\planes-agentes\comprobar-propiedad.mjs B   -> correcto

== RESULTADO ESPERADO ==
Rama agente/gemini-flujos; matriz actualizada; sin botones muertos en tus 11 rutas; 11 rutas revisadas a 390 px; el diagnóstico de «Mover hacia arriba» resuelto.

== FINAL ==
1. Escribe docs/planes-agentes/entregas/B.md con: tabla de clasificación, arreglos, tabla móvil, resultados reales de cada comando, lo que no se pudo verificar y «Cola» con pedidos para archivos ajenos.
2. Commitéalo y publica solo tu rama: git push -u origin agente/gemini-flujos.
3. Deja encendido tu servidor del 3002.
4. Responde al usuario con la rama, el enlace http://localhost:3002 y lo que quedó sin hacer.

== FIN ==
Termina aquí. No fusiones nada ni empieces tareas nuevas.
```
