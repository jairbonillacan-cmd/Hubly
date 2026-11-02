# Arquitectura de Hubly

Una sola aplicación Next.js sobre Supabase ([ADR 0004](adr/0004-monolito-modular.md)). Decisiones en [adr/](adr/); trabajo pendiente en [ROADMAP.md](ROADMAP.md). La estructura objetivo y el orden para llegar a ella están en [docs/deslop/02-ARQUITECTURA-OBJETIVO.md](deslop/02-ARQUITECTURA-OBJETIVO.md); este documento dice cómo se comprueba.

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Rutas de la app | `web/app/(app)/` |
| Rutas públicas y de sesión | `web/app/share`, `reporte`, `cotizacion`, `invitacion`, `login`, `register`, `recuperar`, `nueva-clave`, `onboarding` y `web/app/page.tsx` |
| Rutas de servidor | `web/app/api/` |
| Protección de API, origen y límites | `web/proxy.ts`, `web/lib/api-guard.ts` |
| Interfaz de la app | `web/components/app/`, una carpeta por dominio; lo compartido en `ui/` e `icons/` |
| Estilos | `web/app/tokens.css` para los tokens y un `<dominio>.css` por dominio, importados en `(app)/layout.tsx` |
| Estado del cliente | `web/lib/store/` por dominio; `web/lib/store.ts` solo compone |
| Sincronización del documento | `web/lib/live-workspace.ts`, `web/lib/workspace-repository.ts` |
| Reglas puras | `web/lib/domain/`, con sus pruebas |
| Tipos y datos de ejemplo | `web/lib/types/` y `web/lib/seed/` |
| Código solo de servidor | `web/lib/server/` |
| Chat en tablas (patrón a seguir) | `web/lib/chat-live.ts`, `supabase/migrations/0008_chat.sql` |
| Permisos en base de datos | `supabase/migrations/`, probados en `web/tests/db-permisos.test.mjs` |

Hoy `web/lib/store.ts` todavía concentra todos los dominios y `components/app/` mezcla secciones con pantallas. F1 y F3 los reparten sin cambiar las URL ni el import de `useHublyStore`.

## Capas

```text
app/  ──> components/ ──> lib/store ──> lib/domain ──> lib/types
                │                            ▲
                └────────────────────────────┘
app/api ──> lib/server ──> lib/domain
```

1. `lib/` nunca importa de `components/` ni de `app/`.
2. `lib/domain/` es puro: sin React, sin store, sin red ni `window`. Todo con pruebas.
3. `components/app/<a>/` no importa de `components/app/<b>/` salvo su archivo público de pantalla. Lo compartido sube a `ui/` o `icons/`.
4. Un slice no importa otro slice. Lo que cruza dominios usa `get()`.
5. `lib/server/` solo se importa desde `app/api/` y componentes de servidor.

Además, la autorización se decide en el servidor (RLS y rutas), nunca solo en la interfaz, y el navegador nunca recibe secretos: solo la clave publicable de Supabase.

`npm run check:capas` comprueba las cinco primeras con la API de TypeScript. Lo que ya las viola está en `web/scripts/check-capas-baseline.json`, que solo baja.

## Reglas de la interfaz

Las escribe [GUIA-UX-UI-AGENTES.md](GUIA-UX-UI-AGENTES.md) y las comprueba `npm run check:ui`:

- Un color, un tamaño o un radio salen de un token y su escala.
- `style={{ }}` solo para un valor calculado, como el color de una marca. Para maquetar, una clase con tokens.
- `!important` solo con un comentario que diga contra qué pelea.
- Una sección recibe props explícitas; no recibe un `view` con todo el estado de la pantalla.
- `useHublyStore` siempre con selector: `useHublyStore()` suscribe a todo el store y está prohibido.

## Controles

| Comando | Qué impide |
|---|---|
| `npm run lint` | Avisos de ESLint; el tope de `--max-warnings` solo baja |
| `npm run check:muerto` | Código y exportaciones sin uso |
| `npm run check:ui` | Color, tamaño, radio, estilos en línea, `!important`, `view` y selectores del store |
| `npm run check:size` | Archivos de más de 400 líneas, o que crecen por encima de su tope |
| `npm run check:capas` | Las cinco reglas de dependencia de arriba |
| `node scripts/check-deuda.mjs origin/main` | Que un PR suba cualquiera de esas bases, o el total de `ui-ok:` y `eslint-disable` |
| `npx tsc --noEmit`, `npm test`, `npm run test:db`, `npm run build` | Tipos, pruebas y compilación |

`check:ui` guarda la deuda por archivo en dos bases, porque no es lo mismo lo que ya estaba medido que lo que se sumó después:

| Base | Qué mide |
|---|---|
| `scripts/check-ui-baseline.json` | `app/(app)` y `components/app` |
| `scripts/check-ui-rutas-baseline.json` | `app/share`, `reporte`, `cotizacion`, `invitacion`, `login`, `register`, `recuperar`, `nueva-clave`, `onboarding` y `app/page.tsx` |

Las reglas de siempre y las que llegaron en F0-3 (`style-inline`, `important`, `view-prop`, `use-store-sin-selector`) se miden por separado con `node scripts/medir-deslop.mjs`, y quien coordina registra las dos cifras en [SEGUIMIENTO.md](deslop/SEGUIMIENTO.md). Ningún archivo puede empeorar y uno nuevo debe salir limpio: mover un archivo con deuda sigue el protocolo de [03-REGLAS-PARA-AGENTES.md](deslop/03-REGLAS-PARA-AGENTES.md).

## Estado de transición

Casi todo el contenido sigue en el documento JSONB `agency_workspaces`, y existe un modo demo con disco local. Ambos se retiran dominio por dominio. No agregues datos nuevos al documento: crea tablas siguiendo el patrón del chat.
