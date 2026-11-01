# ADR 0003: Motor de publicación propio

Estado: aceptada, 1 de noviembre de 2026.

## Decisión
La publicación vive en nuestro stack (TypeScript, Supabase y un worker pequeño). Postiz se usa solo como inspiración: no se copia ni se adapta su código, y no se ejecuta su backend. Así queda abierta la opción de cerrar el código más adelante. No se adoptan NestJS, Prisma, Temporal ni Redis salvo que una prueba demuestre que hacen falta.

## Consecuencias
- Cola en Postgres con `for update skip locked`, y claves idempotentes por post y red.
- Cada cambio de las APIs de las redes es trabajo propio: se empieza con Instagram y Facebook.
- Sumar una red nueva cuesta más que con Postiz.

## Proceso obligatorio
1. Una sesión lee Postiz y escribe en `docs/publicacion/` una especificación de conceptos, sin código: estados, reintentos, errores recuperables, renovación de tokens y límites por red.
2. Otra sesión, sin acceso al código de Postiz, implementa desde esa especificación y la documentación oficial de cada red.
3. Ningún agente traduce, adapta ni reescribe archivos de Postiz.

Esto reduce el riesgo, pero no es una garantía legal. Si el motor se vuelve central para el negocio, conviene una revisión legal.
