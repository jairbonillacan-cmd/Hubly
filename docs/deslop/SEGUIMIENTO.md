# Seguimiento

Cada PR actualiza su fila. **Estados:** Pendiente · En curso · En revisión · Hecha · Bloqueada.

## Medidas

| Medida | Partida (`f96c42e`) | Actual | Meta |
|---|---:|---:|---:|
| Líneas de `lib/store.ts` | 2,303 | 2,303 | < 150 |
| Archivos sobre 400 líneas, CSS incluido | 44 | 44 | 0 |
| Componentes con `view` | 31 | 31 | 0 |
| `style={{` | 1,730 | 1,730 | < 150 |
| Deuda de `check:ui` | 812 | 812 | < 100 |
| `!important` en CSS de la app | 137 | 137 | < 10 |
| Líneas con `eslint-disable` | 79 | 79 | < 25 |
| `as unknown as` fuera de pruebas | 7 | 7 | ≤ 2 |

La cifra de 44 archivos viene de `check-size-baseline.json`, que incluye CSS.

## Decisiones del dueño

| ID | Decisión | Respuesta |
|---|---|---|
| D1 | Cifras de ejemplo de `/anuncios` | Pendiente |
| D2 | Logros y XP | Pendiente |
| D3 | Modo demo público | Pendiente |

## Tareas

| Tarea | Depende de | Archivos principales | Estado | Agente | PR |
|---|---|---|---|---|---|
| F0-1 Medición | — | `scripts/` | Pendiente | | |
| F0-2 Capas | F0-1 | `scripts/`, CI | Pendiente | | |
| F0-3 Reglas `check:ui` | F0-1 | `scripts/`, docs | Pendiente | | |
| F0-4 Flujos críticos | — | `e2e/`, CI | Pendiente | | |
| F1-1 Sincronización y ventanas | F0 | `lib/store*` | Pendiente | | |
| F1-2 Dominios simples | F1-1 | `lib/store*` | Pendiente | | |
| F1-3 Tareas | F1-2 | `lib/store*` | Pendiente | | |
| F1-4 Equipo y tablero | F1-3 | `lib/store*` | Pendiente | | |
| F1-5 Marcas | F1-4 | `lib/store*` | Pendiente | | |
| F1-6 Posts y chat | F1-5 | `lib/store*` | Pendiente | | |
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
| F4-1 Tokens | F0 | CSS | Pendiente | | |
| F4-2 Tokens de estado | F4-1 | CSS, guía | Pendiente | | |
| F4-3 `dashboard-polish.css` | F4-1 | CSS | Pendiente | | |
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

## Registro

Lo que un agente descubra y otro deba saber: fecha, tarea y nota.

| Fecha | Tarea | Nota |
|---|---|---|
| | | |
