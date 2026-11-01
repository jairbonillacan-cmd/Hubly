# ADR 0005: Estructura del deslop

Estado: propuesta para ejecutar, 1 de noviembre de 2026.

## Decisión
La limpieza sigue [docs/deslop/](../deslop/README.md):

- `lib/store.ts` se compone de slices de Zustand por dominio, sin cambiar su import.
- Las reglas de negocio viven en `lib/domain/`, puras y con pruebas.
- Una carpeta por dominio en `components/app/`, con props explícitas y un `<dominio>.css`.
- Los colores se definen solo en `tokens.css`.

## Por qué
Partir archivos por tamaño no bastó: las secciones siguen acopladas por un objeto `view`, y el store y el CSS no tienen dueño. Conservar Zustand y el import actual evita tocar 66 archivos, y permite avanzar en cambios pequeños y reversibles.

## Alternativas descartadas
- **Reescribir:** alto riesgo, sin beneficio frente a la migración gradual.
- **Cambiar de librería de estado, o adoptar TanStack Query ahora:** el problema es de organización. Se revisa al llegar el guardado por fila.
- **CSS Modules o Tailwind en toda la app:** hay miles de líneas que migrar sin que cambie el problema real, que es no tener dueño ni tokens únicos.

## Consecuencias
- `components/previews/` queda fuera de las metas de color y `style`, porque imita a otras apps.
- Durante F1 a F4 conviven ambas formas; `check:capas` y las bases impiden retroceder.
- El guardado por fila y el modo demo se deciden aparte, porque su riesgo es de datos, no de orden.
