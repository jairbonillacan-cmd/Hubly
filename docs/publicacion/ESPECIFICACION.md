# Motor de publicación: especificación

Proceso del [ADR 0003](../adr/0003-motor-de-publicacion.md). Una sesión aparte estudió Postiz (AGPL-3.0, commit `4d13c6a`, 1 de noviembre de 2026) y entregó solo conceptos. Quien implementa no vio su código. No es asesoría legal.

## Estados de un trabajo

| Estado | Significa |
|---|---|
| `queued` | Espera su hora |
| `publishing` | Reservado por un worker |
| `published` | La red confirmó; guarda id y URL externos |
| `retry` | Fallo recuperable antes de la aceptación; espera su próximo intento |
| `failed` | Definitivo; guarda un mensaje claro |
| `unconfirmed` | Resultado desconocido. **Nunca se repite solo**: lo revisa una persona |

## Reglas contra duplicados

1. Un solo trabajo por post y red: restricción única.
2. La reserva es atómica, con `for update skip locked`.
3. Un trabajo se guarda como «publicando» antes de llamar a la red.
4. Un tiempo agotado, o un 500 en el paso de publicar, pasa a `unconfirmed`.
5. Solo se repite una escritura ante un 429 claro. Preparar contenedores sí se puede repetir, porque son invisibles.
6. Si el worker muere, un trabajo atascado en `publishing` pasa a `unconfirmed`.
7. Tras la aceptación de la red, ningún fallo posterior vuelve a publicar. Obtener el enlace permanente nunca hace fallar el trabajo.

## Errores

| Categoría | Efecto |
|---|---|
| Límite de tasa | `retry` con espera creciente y aleatoria |
| Contenido, permisos, cuota | `failed` con mensaje claro |
| Autenticación | `failed`, y el canal queda «requiere reconexión» |
| Desconocido al publicar | `unconfirmed` |

## Cuentas

- Los tokens se guardan cifrados y solo los lee el servidor.
- Un canal que requiere reconexión deja de publicar y avisa una vez.
- Hay que avisar antes de que venza un token. La duración real se confirma con la documentación de Meta.

## Por qué no hay orquestador

Para una agencia basta una tabla con reserva atómica y un barrido por minuto. No se adoptan flujos durables, reparto entre servidores ni más redes hasta necesitarlos.

## Pendiente de verificar con Meta

Nada de lo anterior sobre Instagram y Facebook se ha probado contra su API: flujo por contenedores, límites y duración de tokens. Requiere cuenta de desarrollador, página y cuenta profesional de prueba.
