# Arquitectura de Hubly

Una sola aplicación Next.js sobre Supabase ([ADR 0004](adr/0004-monolito-modular.md)). Decisiones en [adr/](adr/); trabajo pendiente en [ROADMAP.md](ROADMAP.md).

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Rutas de la app | `web/app/(app)/` |
| Rutas de servidor | `web/app/api/` |
| Protección de API, origen y límites | `web/proxy.ts`, `web/lib/api-guard.ts` |
| Interfaz de la app | `web/components/app/`, agrupada por dominio |
| Estado del cliente | `web/lib/store.ts` |
| Sincronización del documento | `web/lib/live-workspace.ts`, `web/lib/workspace-repository.ts` |
| Chat en tablas (patrón a seguir) | `web/lib/chat-live.ts`, `supabase/migrations/0008_chat.sql` |
| Lógica pura | `web/lib/*.ts` con su `*.test.ts` |
| Permisos en base de datos | `supabase/migrations/`, probados en `web/tests/db-permisos.test.mjs` |

## Reglas de dependencia
- `components/` y `app/` usan `lib/`; `lib/` no importa de `components/` ni de `app/`.
- La autorización se decide en el servidor (RLS y rutas), nunca solo en la interfaz.
- El navegador nunca recibe secretos; solo la clave publicable de Supabase.

## Estado de transición
Casi todo el contenido sigue en el documento JSONB `agency_workspaces`, y existe un modo demo con disco local. Ambos se retiran dominio por dominio. No agregues datos nuevos al documento: crea tablas siguiendo el patrón del chat.
