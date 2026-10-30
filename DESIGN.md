# Design

Sistema visual de Hubly, tal como está construido en `web/app/globals.css`.

## Color

Paleta completa de cuatro papeles sobre un fondo claro. El color llena regiones enteras (paneles de funciones y bandas), no solo detalles.

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#10291f` | Texto principal, banda de código abierto |
| `--ink-soft` | `#456256` | Texto secundario |
| `--ground` | `#f7f9f3` | Fondo de página |
| `--surface` | `#ffffff` | Ventanas y hojas |
| `--line` | `#dde5da` | Separadores |
| `--green` / `--green-deep` / `--green-pale` | `#0a7a55` / `#075a3f` / `#dcf5e6` | Acción principal, estado aprobado |
| `--yellow` | `#ffd23f` | Marcador del titular, panel, acción sobre tinta |
| `--coral` | `#ff5a3c` | Panel, barras, foco |
| `--lilac` | `#d8ccff` | Panel |

## Tipografía

- **Bricolage Grotesque** (700-800) para titulares, con tracking de -0.03em.
- **Figtree** para el texto y la interfaz.

## Componentes

- **Logo:** mosaico verde con una pieza amarilla y el nombre «hubly», elegido y adjuntado por el usuario. Se usa en el encabezado y el pie, a 120–154px de ancho, sin deformarlo. Archivo web: `web/public/brand/hubly-logo.webp`; original conservado en `output/branding/hubly-selected-original.png`. Procedencia: imagen generada durante la exploración de marca y devuelta por el usuario como selección final. La versión web solo recorta márgenes transparentes y reduce el tamaño, conservando el diseño y el canal alfa.
- **Botones:** alto de 52px (42px en pequeño), radio de 14px (11px en pequeño), primario verde.
- **Ventanas de app:** blancas, radio de 18-24px, sombra suave con desplazamiento.
- **Etiquetas de estado:** por aprobar en amarillo, aprobada en verde, con cambios en coral.
- **Portadas de ejemplo:** ilustraciones SVG planas (`web/components/Cover.tsx`).

## App autenticada

- **Acento único:** azul `#6C77C1` (hover `#5A65AF`, borde 3D `#4C56A0`). No se usa naranja ni ámbar; el verde y el rojo solo indican estado.
- **Tipografía:** Bricolage Grotesque en toda la interfaz.
- **Barra lateral:** 228px, estática; solo se desplaza el contenido, sin barras de scroll visibles. Iconos en gris y el activo en azul.
- **Mascota:** el gato se llama **Hubi**.

## Reglas

- **Honestidad visual:** lo que aún no existe lleva «Función prevista» o «Datos de ejemplo».
- **Un solo momento de movimiento:** el texto del problema se enfoca al hacer scroll; el resto solo responde a la interacción, y se respeta `prefers-reduced-motion`.
- **Sin pretítulos sobre los encabezados:** el encabezado se sostiene solo.
