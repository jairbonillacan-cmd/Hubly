# Seguimiento

**Solo quien coordina edita este archivo**, en commits propios sobre `main` o en su PR. Los agentes reportan al entregar: si cada PR lo tocara, chocarían entre sí. **Estados:** Pendiente · En curso · En revisión · Hecha · Bloqueada.

Antes de iniciar una tarea, quien coordina la marca **En curso** con su agente. Esa fila es la reserva de sus archivos.

## Medidas

Se obtienen con `node scripts/medir-deslop.mjs`, desde `web/`.

| Medida | Partida (`aa4a1d3`) | Actual | Meta |
|---|---:|---:|---:|
| Líneas de `lib/store.ts` | 2,304 | 2,304 | < 150 |
| Archivos sobre 400 líneas, sin simuladores ni iconos | 35 | 35 | 0 |
| `page.tsx` sobre 80 líneas | 17 | 17 | 0 |
| Archivos con prop `view` | 33 | 33 | 0 |
| `style={{` sin simuladores | 1,475 | 1,475 | < 150 |
| Deuda en la base de `check:ui` | 812 | 812 | < 100 |
| `!important` en CSS | 157 | 157 | < 10 |
| Líneas con `eslint-disable` | 79 | 79 | < 25 |
| Exenciones `ui-ok:` | 21 | 21 | No sube |
| `as unknown as` | 7 | 7 | ≤ 2 |
| Archivos que leen `backendEnabled` | 39 | 39 | ≤ 3, tras D3 |

Los simuladores e iconos sobre 400 líneas (9) son excepción del ADR 0005.

## Decisiones del dueño

| ID | Decisión | Respuesta |
|---|---|---|
| D1 | Cifras de ejemplo de `/anuncios` | Pendiente |
| D2 | Logros y XP | Pendiente |
| D3 | Modo demo público | Pendiente |
| D4 | Hacer obligatorio `flujos-con-cuentas` en `main` | Pendiente |

## Tareas

| Tarea | Depende de | Archivos principales | Estado | Agente | PR |
|---|---|---|---|---|---|
| F0-1 Medición | — | `scripts/` | Hecha | | este plan |
| F0-2 Capas | — | `scripts/`, CI | Pendiente | | |
| F0-3 Reglas `check:ui` | — | `scripts/`, docs | Pendiente | | |
| F0-4 Flujos críticos | — | `e2e/`, CI | Pendiente | | |
| F0-5 Contrato del store | — | `lib/store.contract.test.ts` | Pendiente | | |
| F0-6 Compuerta de F1 | F0-4, D4 | Ajuste en GitHub | Bloqueada | | |
| F1-1 Armazón, sesión y ventanas | F0 | `lib/store*`, `lib/domain/` | Pendiente | | |
| F1-2 Dominios simples | F1-1 | `lib/store*` | Pendiente | | |
| F1-3 Tareas | F1-2 | `lib/store*` | Pendiente | | |
| F1-4 Equipo y tablero | F1-3 | `lib/store*` | Pendiente | | |
| F1-5 Marcas | F1-4 | `lib/store*` | Pendiente | | |
| F1-6 Posts y chat | F1-5 | `lib/store*`, `useInicioView` | Pendiente | | |
| F1-7 Reglas fuera del store | F1-6 | `lib/store/`, `lib/domain/` | Pendiente | | |
| F2-1 Selectores | F1 | `lib/domain*` | Pendiente | | |
| F2-2 Tipos | F1 | `lib/types*` | Pendiente | | |
| F2-3 Datos de ejemplo | F1 | `lib/seed*` | Pendiente | | |
| F2-4 Servidor | F1 | `app/api/`, `lib/server/` | Pendiente | | |
| F3-1 Equipo | F1, F2-2 | `dashboard/team/` | Pendiente | | |
| F3-2 Inicio | F1, F2-2 | `dashboard/inicio/` | Pendiente | | |
| F3-3 Parrillas | F1, F2-2 | `parrillas/_vista/` | Pendiente | | |
| F3-4 Anuncios | F1, F2-2, D1 | `anuncios/_vista/` | Bloqueada | | |
| F3-5 Editor de post | F1, F2-2 | `compositor/` | Pendiente | | |
| F3-6 Libreta y sugerencias | F1, F2-2 | `NotebookReaderModal`, `sugerencias/` | Pendiente | | |
| F3-7 Salud | F1, F2-2 | `SaludCuentasView` | Pendiente | | |
| F3-8 Calendario | F1, F2-2 | `calendario/page` | Pendiente | | |
| F3-9 Chat | F1, F2-2 | `chat/page` | Pendiente | | |
| F3-10 Layout | F1, F2-2 | `(app)/layout` | Pendiente | | |
| F3-11 Rutas sueltas | F1, F2-2 | `crm`, `reportes`, `marca`, `marcas`, `ajustes`, `tareas` | Pendiente | | |
| F3-12 Componentes grandes | F1, F2-2 | Ver lista en la tarea | Pendiente | | |
| F3-13 Rutas restantes | F1, F2-2 | `ia`, `automatizaciones`, `notificaciones`, `onboarding`, `register`, `cotizacion`, `invitacion` | Pendiente | | |
| F3-14 Vistas públicas | F1, F2-2 | `share`, `reporte` | Pendiente | | |
| F3-15 Landing y chat en vivo | F1, F2-2 | `app/page`, `lib/chat-live` | Pendiente | | |
| F4-1 Tokens | F0 | CSS | Pendiente | | |
| F4-2 Tokens de estado | F4-1 | CSS, guía | Pendiente | | |
| F4-3 `dashboard-polish.css` | F4-1 | CSS, `(app)/layout` | Pendiente | | |
| F4-4 `hubly-saas.css` | F4-3 | CSS | Pendiente | | |
| F4-5 `!important` y oscuro | F4-4 | CSS | Pendiente | | |
| F4-6 `style={{}}` | F4-1 | Ver lotes | Pendiente | | |
| F4-7 Emojis y restos | F4-1, D2 | Varios | Bloqueada | | |
| F5-1 Anuncios | D1 | `anuncios` | Bloqueada | | |
| F5-2 Logros | D2 | `equipo` | Bloqueada | | |
| F5-3 Modo demo | D3, F2 | `backendEnabled` | Bloqueada | | |
| F6-1 Excepciones | F1 a F5 | Varios | Pendiente | | |
| F6-2 Topes | F6-1 | `scripts/` | Pendiente | | |
| F6-3 Documentación | F6-2 | `docs/` | Pendiente | | |
| F6-4 Auditoría | F6-3 | Solo lectura | Pendiente | | |

F4-3 y F3-10 tocan `(app)/layout.tsx`: no pueden ir a la vez.

## Registro

Lo que un agente descubra y otro deba saber: fecha, tarea y nota. Incluye aquí cada PR revertido y su causa.

| Fecha | Tarea | Nota |
|---|---|---|
| 2026-11-01 | Plan | Comprobado contra el código: inventario del store, topes al mover archivos, carga de CSS y puertos de prueba |
