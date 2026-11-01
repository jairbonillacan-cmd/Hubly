# Plan: Ideas con reels (versión gratis)

**Estado:** preparado, sin construir. Ningún archivo de `web/` cambió por este plan.
**Fecha:** 31 de octubre de 2026.
**Diseño:** [prototipo navegable](diseno-ideas/prototipo.html), con claro, oscuro, móvil y estados.

## 1. Objetivo

Convertir la pestaña Ideas de `/parrillas` en una galería de reels de referencia. Cada reel se ve con su reproductor oficial, trae un análisis de IA y se puede convertir en un post de la parrilla.

**Restricción:** costo de operación de $0. Sin scraper y sin guardar videos de terceros.

## 2. Qué existe hoy

| Pieza | Dónde | Estado |
|---|---|---|
| Pestaña Ideas | `web/app/(app)/parrillas/page.tsx:1455` | Existe. No tiene `h1` propio |
| Formulario manual | `web/components/app/social/IdeasBoard.tsx` | Se reemplaza. Tiene estilos en línea y deuda de `check:ui` |
| Tipo `ContentIdea` | `web/lib/types.ts:159` | Se amplía con campos opcionales |
| `addIdea`, `removeIdea` | `web/lib/store.ts` | Se conservan |
| `convertIdeaToPost` | `web/lib/store.ts:1432` | Se ajusta: hoy fija `format: "Carrusel"` y copia `notes` al caption |

## 3. Alcance

### Incluye

- Pegar un link de Instagram o TikTok y guardarlo como idea.
- Biblioteca compartida con cuentas elegidas a mano por nicho (Instagram).
- Análisis de IA guardado: por qué puede funcionar y cómo adaptarlo a la marca.
- «Crear post», que lleva la idea a la parrilla como borrador.

### No incluye

- Descubrir tendencias de cuentas que nadie eligió.
- Métricas automáticas de TikTok.
- Cuentas personales de Instagram: Business Discovery solo cubre empresa y creador.
- Anuncios y feed personalizado.
- Descargar o alojar videos.

## 4. Servicios

| Necesidad | Servicio | Costo | Requisito |
|---|---|---|---|
| Reproductor de Instagram | oEmbed | $0 | Sin token desde el 15 de mayo de 2026, según el changelog de Meta |
| Datos de cuentas de Instagram | Business Discovery | $0 | App de Meta, revisión y cuenta profesional propia. 1,000 consultas por usuario y hora |
| Reproductor de TikTok | Embed público | $0 | Por confirmar |
| Análisis | Cupo gratis de un proveedor de IA | $0 dentro del cupo | Por elegir |
| Datos | Base actual de Supabase | Sin costo extra mientras quepa en el plan | Migración nueva |

## 5. Verificar antes de construir

Estos puntos pueden cambiar el diseño. Se resuelven con una prueba real, en este orden.

| # | Pregunta | Si la respuesta es no |
|---|---|---|
| 1 | ¿oEmbed sin token devuelve portada, autor y caption? | La tarjeta usa la variante sin portada, y el link pegado pide esos datos al usuario o los omite |
| 2 | ¿Business Discovery devuelve portada de reels ajenos? ¿Esa URL caduca? | Si caduca, no se guarda la URL: se pide de nuevo al mostrarla, o se usa la variante sin portada |
| 3 | ¿Las condiciones de Meta y TikTok permiten este uso en un producto comercial? | Se limita a pegar links o se quita esa red |
| 4 | ¿Qué proveedor de IA tiene cupo gratis suficiente y permite este uso? | Análisis solo a petición, con su límite diario visible |
| 5 | ¿`next.config.ts` y `web/proxy.ts` permiten los iframes de Instagram y TikTok? | Añadir solo esos orígenes a `frame-src` |

Las portadas también pueden tener derechos de autor: consultar antes de guardarlas en Hubly. Por defecto, **no se guardan archivos**.

## 6. Datos

Migración nueva en `supabase/migrations/`. Revisar el número libre al construir: `0007` está sin confirmar en git.

### `inspiration_items`: biblioteca compartida

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | |
| `network` | text | `instagram` o `tiktok` |
| `url` | text, único | Link canónico sin parámetros |
| `external_id` | text | Identificador de la red |
| `author_handle`, `author_name` | text | |
| `caption` | text | Solo para análisis y referencia |
| `view_count`, `like_count`, `comment_count` | integer, opcional | Nulo si la red no lo da. Nunca 0 inventado |
| `published_at`, `fetched_at` | timestamptz | `fetched_at` se muestra como antigüedad del dato |
| `niche` | text | Sector de la cuenta curada |
| `analysis` | jsonb, opcional | Resultado guardado |
| `analysis_status` | text | `pending`, `done` o `failed` |

Permisos: lectura para miembros autenticados; escritura solo desde el servidor.

### `inspiration_accounts`: cuentas curadas

`handle`, `niche`, `active`, `last_synced_at`. Solo las administra el equipo de Hubly.

### `ContentIdea`: campos nuevos, todos opcionales

```ts
sourceUrl?: string;
sourceNetwork?: "instagram" | "tiktok";
sourceAuthor?: string;
inspirationId?: string;
analysis?: IdeaAnalysis;
```

```ts
interface IdeaAnalysis {
  hook: string;         // Gancho
  whyItWorks: string;   // Hipótesis, no un hecho
  adaptation: string;   // Cómo adaptarlo a la marca
  tags: string[];
  basedOn: "caption_and_metrics";
  model: string;
  createdAt: string;
}
```

Las ideas manuales siguen funcionando igual porque todo es opcional.

### Análisis de IA: límite importante

Sin archivo de video, la IA **solo lee caption y métricas; no ve el reel**. Por eso:

- La interfaz dice «Basado en el caption y las métricas».
- El texto se redacta como hipótesis: «Por qué puede funcionar».
- Sin caption no se genera análisis; se muestra el estado «Sin análisis».
- Cada elemento se analiza una vez. El análisis por marca se genera solo si alguien lo pide.
- Si se agota el cupo, queda en `pending` y se reintenta después. Nunca pasa a un plan de pago sin aviso.

## 7. Rutas de API

Todas pasan por autenticación, permisos de marca y límite de frecuencia. Usar `web/lib/api-guard.ts` cuando el trabajo de seguridad en curso se confirme.

| Ruta | Función |
|---|---|
| `POST /api/ideas/from-link` | Valida el link, pide oEmbed y crea la idea |
| `GET /api/ideas/library` | Biblioteca con paginación, filtro de nicho y red |
| `POST /api/ideas/[id]/analyze` | Genera y guarda el análisis |
| `POST /api/cron/sync-inspiration` | Sincroniza cuentas curadas, protegida con secreto |

Seguridad al recibir links:

- Lista cerrada de dominios: `instagram.com`, `www.instagram.com`, `tiktok.com`, `www.tiktok.com`, `vm.tiktok.com`. Otros dominios se rechazan.
- Solo `https`. El servidor no sigue redirecciones hacia otros dominios.
- El caption ajeno es dato no confiable: se muestra como texto y nunca como HTML. Al enviarlo a la IA, va delimitado como contenido, no como instrucciones.
- El HTML de oEmbed no se inserta tal cual. Se construye el iframe con el identificador validado.
- Los tokens de Meta viven solo en el servidor.

## 8. Comportamiento

1. **Pegar link:** valida, trae datos y guarda la idea en la marca activa. Si ya existe, abre la existente.
2. **Reproductor:** en la galería no se cargan iframes de terceros. Se carga al abrir el detalle.
3. **Métricas:** muestran su fecha de obtención. Una métrica que no llegó se omite.
4. **Crear post:** usa `format: "Reel"`, deja el caption vacío o con la adaptación, y conserva el link en las notas. **No copia el caption original.**
5. **Atribución:** autor y link a la publicación original siempre visibles.
6. **Publicación borrada:** si el reproductor falla, se conserva el análisis con el aviso «Esta publicación ya no está disponible».

## 9. Diseño

### Dónde vive

Sustituye el contenido de la pestaña Ideas. Se conservan las pestañas de `/parrillas`. No hay ruta nueva. El título es de sección (16px): la pestaña no aporta otro `h1`.

### Reglas que se cruzan

| Regla | Motivo | Límite |
|---|---|---|
| §1.5 y §16 «Filas, no tarjetas» | Lo pidió el usuario, y un reel vertical no se evalúa en una fila | Solo en esta galería. Las ideas sin video siguen siendo filas |
| §8 «No inventes una tercera plantilla» | Mismo motivo | Es una variante de Agenda con cuerpo en rejilla |

### Pantallas

- **Galería:** encabezado, barra para pegar link, pestañas de texto «Biblioteca» y «Guardadas», filtros de nicho y red, y rejilla.
- **Tarjeta:** portada 9:16, título de 13px y una línea de meta de 11px con autor y vistas. Sin sombra ni elevación al pasar el cursor.
- **Detalle:** panel en la misma pantalla con «Regresar», reproductor a la izquierda y texto a la derecha. Las métricas van en **una línea de texto**, no en cuatro tarjetas (§15).
- **Móvil:** dos columnas en galería. En detalle, una columna con el reproductor arriba.

### Clases nuevas

Declararlas al final de `web/app/(app)/dashboard-polish.css`: `.hubly-idea-grid`, `.hubly-idea-card`, `.hubly-idea-cover`, `.hubly-idea-detail`, `.hubly-idea-analysis`.

El resto usa recetas existentes: `.hbtn`, `.hubly-subnav-tab`, `.hubly-cal-input`, `.hubly-cal-pill`, `.hubly-cal-empty`, `.hb-widget-badge`.

| Clase | Valores |
|---|---|
| `.hubly-idea-grid` | `repeat(auto-fill, minmax(200px, 1fr))`, separación de 16px. En móvil, `repeat(2, 1fr)` y 12px |
| `.hubly-idea-cover` | `aspect-ratio: 9 / 16`, radio 14, borde 1px `--ui-border`, fondo `--ui-muted` |
| `.hubly-idea-detail` | Columnas `minmax(260px, 340px) 1fr`, separación de 32px |
| `.hubly-idea-analysis` | Contenedor con borde, radio 14, filas separadas por línea, interior de 16×20 |

Solo tokens de §3 de la guía. La referencia aporta la estructura; los colores siguen siendo los de Hubly.

### Textos

| Lugar | Texto |
|---|---|
| Subtítulo | Reels de referencia para tus próximos posts. |
| Campo | Pega un link de Instagram o TikTok |
| Botón | Guardar idea |
| Pestañas | Biblioteca · Guardadas |
| Análisis | Por qué puede funcionar · Cómo adaptarlo a {marca} |
| Aviso de IA | Análisis de IA. Basado en el caption y las métricas; no vio el video. |
| Acción principal | Crear post |

No usar textos ni nombres de otros productos (§14).

### Estados

| Estado | Comportamiento |
|---|---|
| Cargando | «Cargando ideas…» discreto |
| Vacío en Guardadas | «Sin ideas guardadas», y qué hacer para tener una |
| Vacío por filtro | «Sin resultados con estos filtros» y «Limpiar filtros» |
| Link no válido | Error bajo el campo, conservando el texto |
| Red no disponible | «No pudimos traer este reel. Revisa tu conexión e inténtalo otra vez.» y «Reintentar» |
| Sin portada | Fondo neutro, icono y red |
| Analizando | «Analizando…» |
| Análisis fallido o cupo agotado | «Sin análisis por ahora» y «Reintentar» |
| Publicación borrada | Aviso, con análisis conservado |
| Título o autor largos | Se truncan con `title` |
| Biblioteca sin Meta aprobado | Se oculta la pestaña hasta que exista contenido real. Nada de ejemplos presentados como reales |

## 10. Fases

### Fase 0: requisitos (los hace el dueño de la cuenta)

- [ ] Cuenta profesional de Instagram vinculada a una página de Facebook.
- [ ] App en Meta for Developers.
- [ ] Verificación del negocio, si Meta la pide.
- [ ] Solicitud de revisión de los permisos necesarios.

### Fase 1: pegar links (no depende de la revisión de Meta)

- [ ] Resolver los puntos 1, 3, 4 y 5 de §5.
- [ ] Ampliar `ContentIdea` y ajustar `convertIdeaToPost`.
- [ ] `POST /api/ideas/from-link` con sus pruebas de seguridad.
- [ ] Sustituir `IdeasBoard` por galería y detalle.
- [ ] Análisis de IA guardado.
- [ ] Pruebas e2e: pegar, guardar, abrir, crear post.

### Fase 2: biblioteca curada (requiere Meta aprobado)

- [ ] Resolver el punto 2 de §5.
- [ ] Migración de `inspiration_items` e `inspiration_accounts`, con permisos probados.
- [ ] Elegir 30–50 cuentas por nicho.
- [ ] Sincronización con cron dentro del límite de Meta.
- [ ] Pestaña Biblioteca y filtros.

### Más adelante: cuándo plantearse pagar

Solo si el uso lo justifica. Por ejemplo, si la gente guarda ideas cada semana y pide cuentas que no se pueden cubrir. Antes de añadir un scraper hace falta revisión legal.

## 11. Terminado significa

- [ ] `npm run check:ui`, `npx tsc --noEmit` y `npm test` pasan desde `web/`.
- [ ] Vista en 1440 claro, 1440 oscuro y 375, sin desbordamiento.
- [ ] Recorrido con teclado: Tab, Enter y Escape.
- [ ] Todos los estados de §9 comprobados.
- [ ] Ninguna métrica o análisis inventado se presenta como real.
- [ ] Costo de operación confirmado en $0.

## 12. Fuentes

- [Changelog de Instagram Platform](https://developers.facebook.com/documentation/instagram-platform/changelog.md): oEmbed sin token y límite de Business Discovery.
- [Guía de la API de Instagram 2026 (Phyllo)](https://www.getphyllo.com/post/instagram-api-guide) y [guía de la Graph API (bundle.social)](https://bundle.social/blog/instagram-graph-api): fuentes de terceros sobre requisitos; confirmar con Meta.
