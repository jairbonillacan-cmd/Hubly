# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Zustand 5, Tiptap 3, Supabase (`@supabase/ssr`, PostgreSQL con RLS y Storage privado `brand-media`) y SDK de Anthropic (`@anthropic-ai/sdk`) opcional para redacción de copy en el compositor. Funciona en modo demostración con persistencia local (`web/.data/`) o conectado a Supabase. Sin hosting oficial decidido: el código vive en el repositorio para autoalojamiento o despliegue propio.

## Users

Agencias de marketing y equipos de redes sociales de habla hispana que manejan varios clientes a la vez. Su trabajo diario: programar publicaciones, armar parrillas, conseguir aprobaciones del cliente y entregar reportes mensuales. [Inferido de la definición del proyecto; audiencia por confirmar a medida que el proyecto crezca.]

## Product Purpose

Hubly reúne en un solo lugar el trabajo repetitivo de una agencia en redes sociales para que el equipo se dedique a crear. Éxito por ahora: que las agencias interesadas se apunten a la lista de espera y sigan el proyecto.

## Positioning

Es un SaaS que aloja y opera el propio equipo de Hubly. La primera usuaria es su propia agencia. El código sigue público bajo AGPL-3.0 mientras no se decida otra cosa ([ADR 0002](docs/adr/0002-saas-y-licencia.md)). No se menciona ningún competidor por nombre en materiales públicos.

## Capabilities and Constraints

La aplicación cuenta hoy con: cuentas, agencias, marcas e invitaciones con permisos por rol (`owner`, `admin`, `editor`, `viewer`) respaldados por RLS en PostgreSQL; calendario editorial (`/calendario` con vistas de mes, semana, agenda, tabla y kanban) y compositor con vista previa móvil para 10 redes (Instagram, Facebook, TikTok, LinkedIn, YouTube, X, Threads, Pinterest, Reddit y Google Business); parrillas por marca (`/parrillas`) e importación de lotes desde CSV, Excel (`.xlsx`) o tablas pegadas; enlaces compartibles para revisión y aprobación del cliente sin cuenta (`/share/[token]`); biblioteca privada de medios (`Content Manager`, `/archivos`, límite de 20 MB en imágenes/documentos y 100 MB en videos); tareas, proyectos, CRM, salud de cuentas (`/dashboard/salud-cuentas`), equipo (`/dashboard/equipo`), chat interno (`/chat`), reportes mensuales con métricas registradas manualmente (`/reportes`, `/reporte/[brandId]`) y generación de propuestas de copy con IA en el compositor (`POST /api/ai/caption` con `ANTHROPIC_API_KEY`). Limitaciones actuales y funciones previstas: no publica automáticamente en redes sociales ni sincroniza métricas desde sus APIs (la publicación ocurre fuera de Hubly y los resultados se registran manualmente); «Avisar al publicar» guarda en el post a quién avisar como referencia pero aún no envía notificaciones automáticas; el panel de anuncios (`/anuncios`) y las cifras de ejemplo del informe ejecutivo en modo demo muestran datos demostrativos etiquetados como `Ejemplo`; el asistente integral de marca (`/ia`), la bandeja unificada de comentarios/mensajes de redes y la importación desde Canva o Drive siguen previstos. La licencia es AGPL-3.0. Sin decidir: precios, versión alojada de pago, app móvil, API pública y fecha de lanzamiento.

## Brand Commitments

Nombre: Hubly. Idioma de la landing y la aplicación: español. Tono: directo y cercano. La identidad y la marca son propias. Con el permiso registrado en el [ADR 0001](docs/adr/0001-paridad-con-henry.md) se replican diseño y funciones de Henry; nada de otros productos.

## Evidence on Hand

No hay clientes públicos, testimonios ni logos externos: no se inventan. Los datos de demostración se etiquetan como ejemplo. Enlace real: https://github.com/jairbonillacan-cmd/Hubly

## Product Principles

- Honestidad sobre el estado del proyecto: lo previsto se dice previsto.
- Los datos de la agencia son de la agencia.
- Quitar trabajo aburrido, no añadir otra herramienta que atender.
