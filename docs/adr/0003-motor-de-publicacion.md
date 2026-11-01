# ADR 0003: Motor de publicación propio

Estado: aceptada, 1 de noviembre de 2026. Vía de licencia pendiente de la etapa 1.

## Decisión
La publicación vive en nuestro stack (TypeScript, Supabase y un worker pequeño). De Postiz se toma y mejora la lógica útil; no se ejecuta su backend. No se adoptan NestJS, Prisma, Temporal ni Redis salvo que una prueba demuestre que hacen falta.

## Consecuencias
- Cola en Postgres con `for update skip locked`, y claves idempotentes por post y red.
- Cada cambio de las APIs de las redes es trabajo propio: se empieza con Instagram y Facebook.
- Copiar código de Postiz exige confirmar su licencia y registrar la procedencia. Si Hubly se mantiene bajo AGPL (ADR 0002) la combinación es más sencilla, aunque debe validarse con revisión legal.
