# ADR 0004: Monolito modular y datos relacionales

Estado: aceptada, 1 de noviembre de 2026.

## Decisión
Se mantiene una sola aplicación Next.js sobre Supabase, organizada por dominios. Los datos salen del documento JSONB hacia tablas con RLS, un dominio a la vez, siguiendo `supabase/migrations/0008_chat.sql` y `web/lib/chat-live.ts`.

## Por qué
El documento único impide permisos por marca, provoca conflictos entre personas que editan cosas distintas y tiene tope de 8 MB. Una reescritura o microservicios añadirían riesgo sin resolver nada que hoy duela.

## Consecuencias
- El modo demo deja de ser una segunda arquitectura; se retira dominio por dominio.
- Zustand se queda. TanStack Query solo entra si el primer dominio migrado lo justifica, con su propio ADR.
- Los archivos gigantes se dividen al tocar cada zona, después de mover sus datos.
