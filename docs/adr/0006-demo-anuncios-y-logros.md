# ADR 0006: Demo pública, `/anuncios` y logros (D1, D2 y D3)

Estado: aceptada, 4 de noviembre de 2026. El dueño delegó las tres decisiones y las aprobó.

## Contexto

- **Hubly será un SaaS que opera su propio equipo** (ADR 0002). La landing ya invita a «Probar la demo» (`/dashboard`) y a ver un portal de cliente (`/share/cafe-bruma-nov`).
- **La demo hoy no se puede publicar tal cual.** Sin claves de Supabase la app guarda en el disco del servidor (`web/.data/` vía `/api/workspace`). En un despliegue público, todos los visitantes leerían y editarían el mismo espacio. Además, `backendEnabled` aparece en 39 archivos.
- **`/anuncios` muestra solo datos de ejemplo** (`SAMPLE_ADS`), con la etiqueta «Ejemplo», y no hay integración de anuncios en el plan cercano. El motor de publicación (ADR 0003) empieza por Instagram y Facebook orgánicos.
- **Los logros y el XP mezclan datos reales con inventados.**
  - El XP suma tareas, posts y eventos reales.
  - Las rachas de los demás miembros salen de `4 + idx`.
  - Medio catálogo de 39 logros calcula su progreso con una fórmula sobre el XP.
  - El catálogo ya se presenta como «Función prevista».
- **[PRODUCT.md](../../PRODUCT.md) exige honestidad:** lo previsto se dice previsto y no se inventan cifras.

## Decisión

### D3: sí hay demo pública, pero vive en el navegador de cada visitante

- La demo se conserva. Antes del lanzamiento es lo único que se puede probar, y la landing la promete.
- **Cada visitante tiene su propia copia,** sembrada con los datos de ejemplo y guardada en su navegador. Se puede reiniciar y no se comparte con nadie.
- **El servidor deja de guardar en disco.** Se retiran los caminos de disco de `/api/workspace` y `web/.data/`. Para probar la persistencia en desarrollo, se usa el simulador de Supabase (`web/tests/mock-supabase.mjs`), como ya hace `flujos-con-cuentas`.
- **El modo se decide en un solo punto.** Un repositorio de datos elige entre demo y cuentas reales, y las pantallas no saben en qué modo están: `backendEnabled` deja de leerse en las vistas.
- **Un despliegue sin claves de Supabase es la demo; el del SaaS lleva claves.** Dónde se aloja cada uno queda para la decisión de hosting, que sigue en [ROADMAP.md](../ROADMAP.md).

### D1: `/anuncios` enseña ejemplos en la demo y «Función prevista» con cuentas reales

- **En la demo** se quedan las tarjetas de ejemplo, con su etiqueta «Ejemplo», como el resto de la demo.
- **Con cuentas reales** no aparece ninguna cifra de ejemplo. La pantalla muestra un estado vacío «Función prevista» con una línea de qué hará, hasta que exista una integración real de anuncios. Esa integración no entra en este plan.
- **Mecanismo:** las cifras de ejemplo salen del repositorio de demo (D3). La pantalla solo distingue «hay datos» de «no hay fuente».

### D2: se eliminan los logros, el XP, los niveles y las rachas; se quedan las métricas reales

- **Se borran** el catálogo de 39 logros, sus medallas y emojis, el XP, los niveles y las rachas. Ocultarlos con una bandera dejaría código muerto, y mostrarlos exige cifras inventadas.
- **Se quedan las métricas que salen de datos reales:** tareas completadas, posts publicados, tiempo activo y ciclo medio. Siguen siendo útiles para una agencia. El ranking del equipo, si se conserva, se ordena por esas métricas.
- Si algún día se quiere gamificación, se diseña sobre un registro de eventos real, con su propio ADR.

## Consecuencias

- **F5-3** (modo demo) aplica D3. Es la de mayor riesgo: toca persistencia, `workspace-repository.ts` y las pruebas que leen `web/.data/`. Va después de F2, como ya marca el plan.
- **F5-1** (anuncios) aplica D1 y se apoya en el repositorio de F5-3. **F3-4** puede desacoplar ya la vista: solo hace falta el estado vacío.
- **F5-2** (logros) aplica D2. **F4-7** pierde la mayoría de sus emojis (los del catálogo) y ya no espera nada.
- **Lo que se ve distinto:**
  - Con cuentas reales, `/anuncios` deja de mostrar cifras.
  - `/dashboard/equipo` pierde el catálogo, el XP, los niveles y las rachas.
  - La demo deja de guardar en el servidor: los cambios de un visitante solo viven en su navegador.
- **`PRODUCT.md`** se actualiza al cerrar F5, con lo que la app hace entonces.
