# Identidad de Hubly: archivos para implementación

Esta es la carpeta canónica de las seis variantes del logo elegidas por el usuario: carita de Hubi y lettering «hubly». Sustituyen la dirección anterior del mosaico. Los archivos de `output/branding/` son exploraciones y fuentes históricas; usar los archivos de esta carpeta para implementar.

## Archivos

| Pieza | Sobre fondo claro | Sobre fondo oscuro | Uso |
|---|---|---|---|
| Isologo: carita + texto | `hubly-isologo-light.svg` | `hubly-isologo-dark.svg` | Encabezados, navegación, acceso y onboarding |
| Isotipo: solo carita | `hubly-isotipo-light.svg` | `hubly-isotipo-dark.svg` | Icono de marca, navegación compacta y favicon |
| Logotipo: solo «hubly» | `hubly-logotipo-light.svg` | `hubly-logotipo-dark.svg` | Lugares que requieren únicamente el nombre |

Los seis SVG son los originales de implementación, con trazados independientes de las fuentes instaladas y fondo transparente. Las exportaciones PNG equivalentes están en `png/`, con los mismos nombres y extensión `.png`. Cada par claro/oscuro conserva las mismas dimensiones y proporciones.

`light` significa que el archivo se usa SOBRE fondo claro; `dark`, SOBRE fondo oscuro. No aplicar filtros CSS, no recolorear ni deformar las imágenes. Conservar la relación de aspecto.

## Rutas públicas en Next.js

La carpeta `web/public` no forma parte de la URL. Por ejemplo:

```text
/brand/logos/hubly-isologo-light.svg
/brand/logos/hubly-isologo-dark.svg
/brand/logos/hubly-isotipo-light.svg
/brand/logos/hubly-isotipo-dark.svg
/brand/logos/hubly-logotipo-light.svg
/brand/logos/hubly-logotipo-dark.svg
```

Para raster: `/brand/logos/png/hubly-isologo-light.png`, etc.

La app controla el modo con `html.dark` y `useHublyTheme`; elegir la variante según el fondo real en el que se muestre. No depender únicamente de la preferencia del sistema si el usuario ha seleccionado un tema dentro de Hubly.

## Paleta

- Claro: carita y oreja izquierda `#16324F`, oreja derecha `#7CC8EE`, ojos y boca `#DCEFF9`, texto `#111C27`.
- Oscuro: carita y oreja izquierda `#DCEFF9`, oreja derecha `#7CC8EE`, ojos y boca `#16324F`, texto `#FFFFFF`.

La mascota de cuerpo completo sigue disponible en `/brand/hubly-gato.png`; es un recurso distinto del isotipo.

## Estado de integración

Esta entrega organiza y prepara los recursos. Los componentes que aún apunten a `/brand/hubly-logo.webp`, dibujen el mosaico o compongan el nombre con otra tipografía deben migrarse a estos SVG al integrar la identidad. Consultar `DESIGN.md` en la raíz del proyecto.
