# Entrega del agente A

Rama: `agente/opus-diseno`, desde `73bf591`. Servidor: http://localhost:3001. Sin fusionar.

## Qué quedó hecho

| Tarea | Resultado |
|---|---|
| S1, `check:ui` del CSS | `dashboard-polish.css` ya no falla. Cambiaron tres valores a la escala de la guía |
| S2, buscador | Destinos directos, textos unificados y `e2e/buscador.spec.ts` (24 pruebas). `verificar-buscador.cjs` borrado |
| S3, `/anuncios` e `/ia` | Avisos y etiquetas «Ejemplo». «Programar en parrilla» eliminado. `/ia` solo repite datos reales de la marca y sus cuatro tarjetas son enlaces |
| S4, comparación visual | `e2e/capturas-henry.mjs`, dos rondas de capturas y defectos corregidos en el editor y el calendario |
| S5, móvil y oscuro | 9 rutas revisadas: las 7 pedidas y los alias `/equipo` y `/salud` |

**Fallo de Ctrl+K a 375 px:** era del script, no del componente. El atajo se registra en un `useEffect`, así que no existe hasta que la página hidrata, y el script pulsaba antes. Se midió en 3 recargas: 2 de las 3 primeras pulsaciones no abrieron nada, y tras hidratar abrieron las 3. Para el usuario queda una ventana de unos cientos de milisegundos tras cargar en la que el atajo no responde. La prueba espera la hidratación y reintenta.

**Destinos del buscador:** `/dashboard?tab=cuentas` y `/dashboard?tab=equipo` sí funcionaban, pero con una redirección de cliente. Ahora van directo a `/dashboard/salud-cuentas` y `/dashboard/equipo`.

## Decisiones delegadas

Se pueden revertir:

- **a.** El periodo «Custom» de Salud de cuentas sigue fuera, porque no dejaba elegir fechas.
- **b.** En `/ia`, las cuatro tarjetas son enlaces reales: `/parrillas`, `/archivos`, `/ajustes?tab=equipo` y `/tareas`.
- **c.** `/anuncios` sigue visible, con datos marcados como ejemplo. No se oculta.

Otras decisiones de diseño:

- En el editor, el formato pasó de un `select` al final a cinco opciones visibles bajo los archivos.
- En móvil, el aviso «Descubre Hubly» empieza plegado.
- «Buscar (⌘K)» pasó a «Buscar».

## Resultados de los comandos

Ejecutados desde `web/` sobre el último commit de código (`ccc78e6`), con `E2E_PORT=3001` y `E2E_BASE=http://localhost:3001`.

| Comando | Resultado |
|---|---|
| `npm run check:ui` | Falla solo lucide en `BuyerPersonas.tsx` y `ProjectEditModal.tsx`, los dos aceptados |
| `npx tsc --noEmit` | Sin errores |
| `npm run build` | Compila, sin chocar con el servidor del 3001 |
| `npm test` | 33 pasan, 0 fallan |
| `npm run test:db` | 69 correctas, 0 fallos |
| `npx playwright test` | 88 pasan con la configuración del repo (Chrome). Antes, 2 corridas con Edge: 88 pasan en cada una |
| `comprobar-propiedad.mjs A` | Correcto: 157 archivos, todos de A. Se vuelve a correr antes de publicar |

**Navegador:** al empezar, esta máquina no tenía Chrome y `playwright.config.ts` lo pide, así que el trabajo se probó con una configuración temporal fuera del repo que solo cambia el canal a `msedge`. Chrome apareció instalado a las 14:48 del 31 de octubre, sin intervención de este agente, y la corrida final ya usa la configuración del repo. `capturas-henry.mjs` usa Edge por defecto y acepta `E2E_CHANNEL`.

**Prueba inestable:** `calendario.spec.ts:77` falló 2 de 5 corridas combinadas durante S4, con 2 coincidencias de `getByLabel('Formato de E2E calendario …')` por un post duplicado. No se encontró la causa y no se modificó el spec. No falló en las corridas completas finales.

## Las 8 escenas

Compara capturas, no comportamiento en vivo: **no es una declaración de paridad.** Las rutas son relativas a `capturas-A/`. Las capturas de `ronda-2/` se tomaron antes de los ajustes de S5, que después cambiaron el resalte del formato activo y los tamaños táctiles del editor.

| # | Escena | Estado | Diferencia | Evidencia |
|---|---|---|---|---|
| 01 | Editor, subida en curso | Defectos corregidos e intencionales | Corregido: diálogo sin nombre, insignias blancas en oscuro, contraste y flechas sin uso. Intencional: aviso «Hubly planifica; tú publicas», pestaña «Resultados», «Enviar a revisión» | `ronda-2/01-compositor-carga__esc-oscuro.png` |
| 02 | Selector Content Manager | Igual en composición | Hubly muestra el vacío porque la demo no tiene carpetas | `ronda-2/02-selector-content-manager__esc-claro.png` |
| 03 | Formatos y vista previa | Defecto corregido | Formato visible con línea por red. No existen «Descargar archivo» ni «Agregar música», y no se inventaron | `ronda-2/03-formatos-vista-previa__esc-claro.png` |
| 04 | Kanban | Defectos corregidos | Select truncado, contador pegado y texto de 8.5 px. «Agregar columna» sigue al final de la fila, no arriba a la derecha | `ronda-2/04-calendario-kanban__esc-claro-con-datos.png` |
| 05 | Tabla | Igual en estructura | Hubly añade «Responsables» y la fila «Nuevo post» | `ronda-2/05-calendario-tabla__esc-claro-con-datos.png` |
| 06 | Semana | Defectos corregidos e intencional | El domingo salía cortado y la insignia también. Sin el aviso de arrastre descartable | `ronda-2/06-calendario-semana__esc-claro-con-datos.png` |
| 07 | Menú de opciones | Defecto corregido | Interruptor real e iconos duotono | `ronda-2/07-menu-calendario__esc-claro.png` |
| 08 | Editor con Pinterest | Defecto corregido e intencional | La vista previa sigue a la red activada. Hubly parte con Instagram por defecto | `ronda-2/08-compositor-pinterest__esc-claro.png` |

## Las rutas

Capturas en `capturas-A/rutas/`, a 390 px y en 1440 oscuro. La medición dio 0 controles bajo 44 px a 390 en las 9 rutas y en las 8 vistas del editor.

| Ruta | Estado | Qué se corrigió |
|---|---|---|
| `/dashboard` | Bien | Táctiles, aviso que tapaba «Aprobaciones» en móvil, contraste de HOY y MAÑANA, formato de la fecha |
| `/dashboard/equipo` | Bien | Táctiles y logros lavanda ilegibles en oscuro (1.07:1) |
| `/dashboard/salud-cuentas` | Bien | Botones ya sin desbordar, comprobado en captura. Contraste del contador |
| `/calendario` | Bien | Táctiles y chip «Tarea» lavanda |
| `/parrillas` | Corregida | A 390 estaba rota: dos columnas fijas desbordaban. Banner ilegible en oscuro, TikTok invisible y pasos lavanda |
| `/ia` | Bien | Táctiles y aviso que tapaba el compositor |
| `/anuncios` | Bien | Rejillas de una columna en móvil y subnavegación con scroll interno |
| `/equipo` | Bien | Alias, mismas correcciones que `/dashboard/equipo` |
| `/salud` | Bien | Alias, mismas correcciones que `/dashboard/salud-cuentas` |

**Correcciones sin confirmar, ya verificadas:**

- **Popover de perfil:** no estaba resuelto. Lo tapaban el botón de colapsar y, en móvil, el aviso. Ahora hay 0 puntos tapados con `elementFromPoint` en 5 variantes.
- **«Mi vista» y «Todo el equipo»:** exponen `aria-pressed`, y el valor cambia al pulsar. Leído del DOM a 390 y en 1440 oscuro.

**Regresión propia corregida:** el formato de fechas de S2 leía la fecha actual en el render del servidor y rompía las 42 pruebas de `rutas.spec.ts`. S5 la encontró y se corrigió en `b2b9531`.

## Lo que no se pudo verificar

- Recorrido completo solo con teclado de las rutas y del editor, más allá de lo que cubre `buscador.spec.ts`.
- Hover, foco, estados vacío, de error y de mucho contenido en las rutas de S5. Tampoco 1440 claro ni tablet en esa ronda.
- El editor a 390 con el borrador lleno o con errores.
- Subida real: las capturas simulan `/api/media`. La barra solo se vio detenida en 0 %.
- Henry en vivo: solo se compararon las 8 imágenes.
- Las capturas de `dashboard`, `equipo` y `salud` regeneradas en la última ronda no se abrieron de nuevo. El cambio de fecha y de animación se comprobó leyendo el DOM.

**Defectos vistos y no corregidos:**

- El aviso desplegado sigue tapando «Aprobaciones» en `/dashboard` a 1440.
- Los chips del mes se truncan porque los puntos de red ocupan el ancho. Tienen `title`.
- Contraste: la inicial del avatar en `/salud` (4.28:1, color de marca) y el verde `#059669` en `/anuncios` (3.77:1 en claro).
- Quedan hex fijos en `dashboard-polish.css`, `EquipoView` y el arte de `/anuncios`, ya en la línea base.
- Con la lista vacía, el buscador solo muestra 6 de las 10 páginas. Se dejó así: es una decisión de producto.

## Cola

Pedidos para archivos ajenos:

1. **`web/playwright.config.ts`:** conviene `channel: process.env.E2E_CHANNEL || "chrome"`, porque sin Chrome instalado `npx playwright test` no arranca.
2. **`web/lib/domain-selectors.ts`:** corregir `dateTitleCase` para que dé «31 de octubre» y quitar el `.replace` de `web/components/app/dashboard/InicioView.tsx`.
3. **`web/lib/motion-spec.ts`:** sigue documentando `tablero-aparece`, que ahora solo usa `/calendario`. El §7 de la guía prohíbe animaciones de entrada: decidir si también se quita ahí.
4. **`web/scripts/check-ui-baseline.json`:** bajar los topes, porque `PostComposerModal.tsx` y `SocialCalendar.tsx` ya no usan lucide. Hacerlo en la integración, con `--update` solo después de reducir deuda.
5. **`docs/GUIA-UX-UI-AGENTES.md`:** falta un token de verde legible en oscuro para valores correctos.
6. **Textos del sidebar en `web/app/(app)/layout.tsx`:** «Mi Espacio» y «Núcleo de Marca» chocan con el §14 y ahora difieren del buscador. Ningún spec usa «Mi Espacio» como nombre accesible. No se cambiaron, y la integración debe comprobar que ninguna rama ajena dependa de ellos.
