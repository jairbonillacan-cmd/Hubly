# Entrega del agente E — GLM (lógica y pruebas)

Rama: `agente/glm-logica` (worktree `C:\Users\jairb\Desktop\Hubly-wt\glm-logica`, base `4bb99df`).
Servidor propio: `localhost:3023`, quedó encendido. No se tocó el de 3000 ni los puertos 3002/3006/3007/3017/3022.
Alcance del commit: solo `web/lib/{date,calculator,reporting,domain-selectors,notebook-content,network-catalog}.test.ts` (nuevos), `web/lib/{calculator,reporting}.ts` (arreglos mínimos) y este informe. El comando de propiedad del plan no imprimió nada.

## Punto de partida (en `4bb99df`, antes de cambiar nada)

- `npm run check:ui` → `Chequeo de UI correcto. Deuda heredada sin empeorar: 1484 hallazgos.`
- `npx tsc --noEmit` → sin salida (0 errores).
- `npm test` → `ℹ tests 58 / ℹ pass 58 / ℹ fail 0`.
- `http://localhost:3023/dashboard` → HTTP 200 (`Ready in 1008ms`, Next.js 16.4.3 Turbopack).

## E1 — Pruebas de lógica pura y defectos corregidos ✅

Archivos de prueba nuevos (38 pruebas; ningún caso repetido de `tests/unit.test.ts`):

- `lib/date.test.ts`: cruce de año en `addDays`, bisiestos (2024, 2000 y 2026 no bisiesto), `localIsoDate` justo antes y después de medianoche, y `dueLabelFor` pasando a fecha fija tras una semana.
- `lib/reporting.test.ts`: mes sin datos propios (no hereda de otros meses ni de posts sin fecha), alcance en cero → tasa nula en vez de división entre cero, posts del primer y último día del mes, y métricas corruptas (NaN/Infinity) sin contaminar el reporte.
- `lib/calculator.test.ts`: todo en cero, valores negativos, valores vacíos (NaN) y redondeo de horas/jornadas; precios por tramos no retroactivos, plan base, marcas negativas/vacías y `formatCurrency`.
- `lib/notebook-content.test.ts`: contenido vacío/corrupto, inyección de `<script>` y `<img onerror>` al convertir a HTML (queda escapado), entidades en los pendientes de las listas de tareas.
- `lib/network-catalog.test.ts`: límites coherentes y sin ids duplicados en las 10 redes, red desconocida cae al respaldo sin romper, disparo del aviso justo al 90 %, corte de feed por el límite más cercano.
- `lib/domain-selectors.test.ts`: zona horaria inválida → respaldo, día en America/Mexico_City que cambia exactamente a medianoche (05:59 UTC sigue siendo 31 de octubre; 06:00 UTC ya es 1 de noviembre), `dateTitleCase`, `addDaysToIsoDate` (mes/año/bisiesto), reparto de tareas por vencimiento sin cruzar marcas, posts de hoy sin dejar pasar otra marca ni borradores, posts sin fecha que sí aparecen en aprobación, salud de cuentas con marca sin datos y con compromisos en cero (porcentajes finitos, sin NaN), resumen en ceros sin marcas, recomendaciones y onboarding con estado vacío.

Defectos que las pruebas destaparon y se corrigieron (diff mínimo, firmas y tipos de retorno intactos):

1. `calculator.ts` — `calculateHoursSaved` con entradas negativas devolvía horas y jornadas negativas, y con NaN propagaba NaN a todo el resultado; `calculateVolumePricing` con `totalBrands` negativo daba `count: -5` en el tramo base. Arreglo: helper interno `nonNegative()` (fuera de rango cuenta como cero). Con entradas dentro del rango documentado el resultado no cambia; la única UI que llama a estas funciones usa sliders `min={1}`.
2. `reporting.ts` — `buildMonthlyReport` devolvía `reach: NaN`/`Infinity` e `interactions: NaN` cuando una métrica venía corrupta, y por red acumulaba `Infinity`. Arreglo: helper interno `finite()` en la suma y en el acumulado por red; la tasa ya caía en `null`.

Sobre `dateTitleCase`: el defecto («Domingo, 19 De Abril») ya había sido corregido en el ancestro `e6abc1e`, así que en esta base ya da «Sábado, 31 de octubre». Quedó fijado con la prueba «dateTitleCase da el día con mayúscula y el mes en minúscula». Verificado en vivo: el HTML del `/dashboard` del 3023 muestra «Sábado, 31 de octubre» y respondió 200 (ver Cola: el `.replace` del plan ya no existe).

Sobre «/chat sigue diciendo “Sin mensajes aún”»: la causa NO está en mis archivos (el chat no consume ninguno de los seis). El hilo central sí muestra los mensajes enviados; lo que nunca cambia son dos textos fijos. Va a la Cola con archivo, líneas y cambio exacto.

`npm test` final: **96 tests, 96 pasan, 0 fallan** (58 de partida + 38 nuevos).
Commit `0143029`.

## E2 — Prueba inestable de calendario ✅ (no se reprodujo; prueba no tocada)

Prueba identificada por el síntoma: «las cuatro vistas comparten posts, filtros y período» (`e2e/calendario.spec.ts:50`; la aserción de columnas de semana quedó en la línea 77). Comandos con `$env:E2E_PORT="3023"; $env:E2E_BASE="http://localhost:3023"` (equivalente export en la sesión):

1. `npx playwright test e2e/calendario.spec.ts -g "las cuatro vistas comparten posts, filtros y período" --repeat-each=20` → **20 pasaron (1.1m), 0 fallos**, exit 0.
2. Recompilación forzada: se agregó un comentario temporal a `web/lib/date.ts` (archivo propio), el servidor recompiló, y se revirtió al estado commiteado; `/dashboard` siguió en 200.
3. Mismo comando con `--repeat-each=10` → **10 pasaron (33.8s), 0 fallos**, exit 0.

**Total: 30 corridas, 30 pasaron, 0 fallos.** No se encontró la causa (el síntoma «post duplicado» de 2/5 no reapareció) y, como indica el plan, la prueba no se tocó. Hipótesis etiquetada como tal (sin evidencia directa): la colisión de ids por milisegundo de E3 puede producir posts fantasma/duplicados ante creaciones muy rápidas; ver Cola.

## E3 — Auditoría de `web/lib/store.ts` (solo lectura) ✅

Revisadas las 2130 líneas. Hallazgos por gravedad (ninguno editado en `store.ts`):

**ALTA — ids que pueden repetirse (demostrado con prueba, no commitada).** Las entidades usan `Date.now()` sin sufijo aleatorio: `post-` (savePost, línea 1130; duplicatePost, 1351), `task-` (addTask, 1501), `msg-` (sendChatMessage, 2063), `notif-` (2004), `asset-` (2019), `proj-` (2031), `list-` (1642 y 1655), `brand-` (713) y `tm-` (1780). Dos creaciones en el mismo milisegundo comparten id: borrar o actualizar uno toca todos; React recibe claves duplicadas. Repro sin trucos: dos `savePost` síncronos seguidos. Esperado: 2 ids únicos; obtenido: `new Set(ids).size === 1` (los dos posts con el mismo id). Igual para `addTask` y `sendChatMessage` — las tres pruebas de `store.test.ts` fallaron (3/3), así que el archivo **no se commitó** según lo instruido y el caso queda aquí. Curiosamente otras partes del mismo archivo ya evitan el problema con sufijo aleatorio (`createActivityItem` en 431, `withPostLog` en 366, `addNotebook` en 1674, la invitación en 1762) y `hubi-chats.ts:47` usa `crypto.randomUUID()`. Cambio exacto sugerido: helper `const freshId = (p: string) => \`${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}\`;` aplicado en los diez puntos anteriores.

**MEDIA — actualizaciones perdidas en la carga inicial.** `syncFromServer` modo demo (líneas 592-611): si el GET del servidor tarda, todo lo que la persona cree durante esa ventana se descarta cuando llega la respuesta, porque `set({ ...normalizedServer, ... })` reemplaza el estado completo. Repro: `syncFromServer` con el GET pendiente + `savePost` antes de resolver → el post desaparece al resolver. Esperado: conservar lo creado local (fusión o descartar la respuesta si hubo escritura); obtenido: estado pisado.

**BAJA — datos que cruzan de marca o quedan huérfanos.**
- `inviteTeamMember` (1756-1759): sin marca activa, `brandIds` queda `[activeBrandId]` con un id vacío y `brandsCount: 1` cuenta una marca inexistente.
- `updatePostStatus` (1167 y 1195-1200): si el postId no existe, igual registra un evento de actividad atribuido a la marca activa.
- `addBrand` (859): dos marcas con el mismo nombre generan el mismo slug y dos canales `ch-${slug}` con el mismo id.

**BAJA — inconsistencia de guardado.** `switchWorkspace` (614-627) guarda localmente la data rebasada pero no la empuja al API, a diferencia de `syncFromServer` (577-580).

**INFO (en `domain-selectors.ts`, no tocable por la regla 7 de firmas).** `selectTeamProductivity` devuelve `activeMember: undefined` si `members` viene vacía (1446-1447), con tipo que promete no anulable. Arreglarlo exige cambiar la firma; queda documentado.

Verificaciones que pasaron (sin prueba nueva que commitear): el lector `viewer` no muta datos (ya cubierto en `unit.test.ts`), `approveAllBrandPosts` no duplica eventos al repetirse (ya cubierto), `savePost` de edición conserva id y comentarios, `updateBrand` sincroniza `connectedNetworks`/`Networks` en ambas direcciones.

## Pruebas finales (todas desde `web/`, sobre el commit final)

| Comando | Resultado |
| --- | --- |
| `npm run check:ui` | `Chequeo de UI correcto. Deuda heredada sin empeorar: 1484 hallazgos.` (igual al punto de partida) |
| `npx tsc --noEmit` | sin salida, 0 errores |
| `npm test` | `ℹ tests 96 / ℹ pass 96 / ℹ fail 0` |
| `npm run test:db` | `77 ok, 0 fallos` |
| `npx playwright test` | `93 passed (2.5m)`, exit 0 |
| `npm run build` | exit 0 (tabla de rutas completa; no chocó con el servidor del 3023, no hubo que apagarlo) |
| Propiedad (`git -c core.quotepath=off diff --name-only 4bb99df...HEAD \| Where-Object { ... }` en PowerShell) | no imprimió nada |

Ningún fallo nuevo respecto al punto de partida.

## Lo no verificado

- La causa del fallo histórico 2/5 de la prueba de calendario: no se reprodujo en 30 corridas y no se inventó.
- Solo se corrieron las pruebas con el canal Chrome configurado por el proyecto; otros navegadores no se probaron.
- El modo backend real (`backendEnabled`) queda sin ejercitar: la carpeta corre en modo demo (no se leyó `web/.env.local`).

## Cola

1. **`app/(app)/chat/page.tsx:93` y `:508` — «Sin mensajes aún» fijo tras enviar mensajes.** El hilo (líneas 751-789) sí muestra lo enviado; los dos subtítulos son literales: en la línea 93 `subtitle: "Canal general de la agencia · Sin mensajes aún"` del encabezado de `ch-general`, y en la línea 508 el `<span>` del canal «# General» de la barra lateral. Repro: `/chat` → abrir «# General» → enviar un mensaje → el mensaje aparece en el hilo, pero el encabezado y la lista siguen diciendo «Sin mensajes aún». Cambio exacto (fuera de mi alcance, es pantalla): derivar ambos textos de `storeMessages.some((m) => m.channelId === "ch-general") || localMessages.some((m) => m.targetId === "ch-general")` y usar «Sin mensajes aún» solo cuando sea falso.
2. **`web/lib/store.ts` — colisión de ids por `Date.now()` (ALTA).** Detalle, repro, esperado/obtenido y cambio exacto en E3. Con la prueba que lo demuestra lista para rescatar de este informe (3 pruebas que fallan: posts, tareas y mensajes creados en el mismo milisegundo comparten id).
3. **`web/lib/store.ts:592-611` — carrera de `syncFromServer` que pisa cambios locales (MEDIA).** Detalle en E3.
4. **Hallazgos BAJA de `store.ts`** (invitación sin marca activa, evento de actividad atribuido a la marca activa cuando el post no existe, canales duplicados por slug repetido, `switchWorkspace` sin push al API): detalle en E3.
5. **`web/lib/domain-selectors.ts:1446-1447` — `activeMember` `undefined` con lista de miembros vacía (INFO).** Requiere cambiar la firma de retorno; prohibido por la regla 7 de esta tarea.
6. **Premisa obsoleta del plan sobre `InicioView.tsx` y `dateTitleCase`.** El plan pedía «anotar que ese `.replace` sobra», pero en `4bb99df` no existe tal `.replace`: `web/components/app/dashboard/InicioView.tsx:1403` ya renderiza `greetingInfo.dateTitleCase` directo, y los únicos `.replace` del archivo (líneas 54 y 404-405) son del mes abreviado del mini calendario y de las iniciales, ajenos a la fecha. El arreglo real ya estaba en el ancestro `e6abc1e` (`dateTitleCase` pasaba de «…, 19 De Abril» a «…, 19 de abril»). Verificado que hoy se ve bien: el HTML del dashboard muestra «Sábado, 31 de octubre». Nada que quitar.
