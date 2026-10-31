# Design

Sistema visual de Hubly, tal como está construido en `web/app/globals.css`. Para trabajar en la interfaz de la app, las reglas operativas están en [docs/GUIA-UX-UI-AGENTES.md](docs/GUIA-UX-UI-AGENTES.md).

## Identidad de marca aprobada

Paleta indicada por el usuario el 31 de octubre de 2026 para el logo y Hubi:

| Color | Valor | Uso |
|---|---|---|
| Marino | `#16324F` | Color principal, cuerpo de Hubi, carita del logo en modo claro |
| Marino claro | `#24496E` | Patas de Hubi |
| Celeste de marca | `#7CC8EE` | Pieza del logo, oreja de Hubi |
| Celeste pálido | `#DCEFF9` | Ojos y boca de Hubi; fondos suaves |
| Tinta | `#111C27` | Nombre «hubly» |
| Blanco | `#FFFFFF` | Fondo |

Hubi conserva su silueta de gato sentado. Imagen activa: `web/public/brand/hubly-gato.png`; versiones vectoriales: `HublyCatInlineSvg` y `HublyAvatarIcon` en `web/components/app/icons/HublyIcons.tsx`. La identidad elegida para el logo usa solo su carita y el lettering «hubly». Carpeta canónica para implementación: `web/public/brand/logos/`; contiene seis SVG (isologo, isotipo y logotipo en variantes `light` y `dark`), sus PNG en `png/` y una guía en `README.md`. Las propuestas anteriores en `output/branding/` son históricas.

## Color

Fondo blanco, marino como protagonista y celeste como secundario. En la landing el color llena regiones enteras; en la app se reserva para acción, estado activo y detalles. Los nombres de algunos tokens (`--green`, `--yellow`) son históricos.

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#111c27` | Texto principal, banda de código abierto |
| `--ink-soft` | `#4a5a6a` | Texto secundario |
| `--ground` / `--surface` | `#ffffff` | Fondo de página, ventanas y hojas |
| `--line` | `#e3e9ef` | Separadores |
| `--green` / `--green-deep` / `--green-pale` | `#16324f` / `#0f2539` / `#dceff9` | Acción principal; `#16324f` da 13.1:1 con blanco |
| `--yellow` | `#7cc8ee` | Marcador del titular, panel, acción sobre tinta |
| `--coral` / `--coral-deep` | `#d9483b` / `#b3261e` | Solo errores |
| `--lilac` | `#dceff9` | Panel |

El marino no se distingue sobre fondos oscuros: nunca se escribe como color fijo en la interfaz. Se usa `--hb-accent` (botones y rellenos), `--hb-accent-text` (texto de acento) y `rgb(var(--hb-accent-rgb) / alfa)`, definidos en `globals.css`. En modo oscuro, `--hb-accent` es `#2A76B0` (4.86:1 con blanco) y `--hb-accent-text` es `#9AD4F1`. Las pantallas de acceso y la landing se ven siempre en claro.

## Tipografía

- **Bricolage Grotesque** (700-800) para titulares, con tracking de -0.03em.
- **Figtree** para el texto y la interfaz.

## Componentes

- **Logo:** carita de Hubi con lettering «hubly», siempre mediante `HublyBrandLogo` (`web/components/brand/HublyBrandLogo.tsx`), que elige la variante según el fondo y el tema. Admite `kind` isologo, isotipo o logotipo, y `on` auto, light o dark. Los SVG contienen los trazados del lettering: no recrearlo con una fuente ni aplicar filtros. El favicon es el isotipo claro. Ver `web/public/brand/logos/README.md`.
- **Botones:** alto de 52px (42px en pequeño), radio de 14px (11px en pequeño), primario azul.
- **Ventanas de app:** blancas, radio de 18-24px, sombra suave con desplazamiento.
- **Etiquetas de estado:** por aprobar en celeste, aprobada en marino, con cambios en coral.
- **Portadas de ejemplo:** ilustraciones SVG planas (`web/components/Cover.tsx`).

## App autenticada

- **Acción:** `--hb-accent`, marino `#16324F` (hover `#0F2539`, borde 3D `#0B1C2E`). El verde y el rojo solo indican estado.
- **Acento celeste:** `--ui-sky*`, con texto marino sobre `#DCEFF9` (11.08:1). Marca el ítem activo y el botón destacado. Nunca lleva texto blanco.
- **Tipografía:** Bricolage Grotesque en toda la interfaz.
- **Barra lateral:** flotante, 256px (68px colapsada); solo se desplaza el contenido, sin barras de scroll visibles. Iconos propios a dos tonos (`web/components/app/icons/DuotoneIcons.tsx`): gris azulado en reposo y marino con celeste en el activo, controlados con `--hi-soft` y `--hi-strong`.
- **Nuevo post:** al abrir, el modal crece desde su centro con un resorte (`scale(0.96)` y 20px abajo hasta su lugar, 500ms) y el sidebar se retrae a la vez. Las capas van en este orden: velo, sidebar y modal, para que la retracción se vea sin tapar el modal. Al cerrar, el sidebar vuelve a su estado anterior.
- **Mascota:** el gato se llama **Hubi**. Es marino: va sobre blanco o celeste pálido, nunca directamente sobre marino o fondos oscuros. `HublyCatAvatar` ya le da una base blanca.
- **Acceso:** `AuthShell` (`web/components/auth/AuthShell.tsx`) une formulario y panel celeste con Hubi.

## Iconos

Todo icono que nombra una sección, una función o un origen debe seguir el estilo del sidebar. Esta regla aplica a pestañas, navegación, acciones principales, títulos de widgets y opciones de un modal.

- **Fuente:** `web/components/app/icons/DuotoneIcons.tsx`. Si falta uno, se dibuja ahí con `createDuotoneIcon`; no se usan iconos de Henry ni de otro producto.
- **Forma:** dos capas rellenas en una rejilla de 24px, sin trazo fino ni contorno. La base usa `--hi-soft` y el detalle `--hi-strong`. Las formas son redondeadas y simples.
- **Color:** nunca fijo. Heredan el color del texto, así que sirven sobre botones oscuros, estados y modo oscuro. El sidebar y las pestañas los fijan con `--hi-soft` y `--hi-strong`; en un control activo pasan a marino y celeste con `aria-current`, `aria-selected` o `.hubly-hi-on`.
- **Tamaño:** 18–20px en pestañas y acciones, 22px en tarjetas de opción. Sin filtros CSS.
- **Excepción:** solo los logos de terceros (Google, Canva, redes), que conservan su forma, y las marcas tipográficas del editor de texto (negrita, cursiva, títulos, listas numeradas), que son letras.
- **Controles pequeños:** cerrar, agregar, chevrons y check son una sola forma gruesa y redondeada en `--hi-strong`; flechas y demás usan las dos capas. Se dibujan igual que el resto, nunca con trazo fino.

## Reglas

- **Honestidad visual:** lo que aún no existe lleva «Función prevista» o «Datos de ejemplo».
- **Un solo momento de movimiento:** el texto del problema se enfoca al hacer scroll; el resto solo responde a la interacción, y se respeta `prefers-reduced-motion`.
- **Sin pretítulos sobre los encabezados:** el encabezado se sostiene solo.
