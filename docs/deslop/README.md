# Plan de deslop de Hubly

Medido el 1 de noviembre de 2026. Es el plan vigente para dejar de ser código vibecodeado. Lo ejecutan agentes, una tarea a la vez, y cada tarea termina en un PR.

**Meta:** que cualquier persona o agente pueda cambiar una función tocando pocos archivos, entendiendo de dónde vienen sus datos, sin miedo a romper otra pantalla.

**Esto no es una reescritura.** La app se conserva y cambia por dentro. Salvo donde una tarea lo indique, nada cambia para quien la usa.

## Cómo usarlo

| Si eres… | Lee, en este orden |
|---|---|
| Quien coordina | Este archivo → [SEGUIMIENTO.md](SEGUIMIENTO.md) → [05-PROMPTS.md](05-PROMPTS.md) |
| Agente con una tarea | [03-REGLAS-PARA-AGENTES.md](03-REGLAS-PARA-AGENTES.md) → tu tarea en [04-TAREAS.md](04-TAREAS.md) → [02-ARQUITECTURA-OBJETIVO.md](02-ARQUITECTURA-OBJETIVO.md) |
| Quien quiere entender por qué | [01-ESTADO-ACTUAL.md](01-ESTADO-ACTUAL.md) |

## Documentos

| Archivo | Contenido |
|---|---|
| [01-ESTADO-ACTUAL.md](01-ESTADO-ACTUAL.md) | Diagnóstico y cifras de partida |
| [02-ARQUITECTURA-OBJETIVO.md](02-ARQUITECTURA-OBJETIVO.md) | Carpetas, capas, patrones y nombres |
| [03-REGLAS-PARA-AGENTES.md](03-REGLAS-PARA-AGENTES.md) | Flujo obligatorio, comprobaciones y cuándo detenerse |
| [04-TAREAS.md](04-TAREAS.md) | Cada tarea: archivos, pasos y criterio de aceptación |
| [05-PROMPTS.md](05-PROMPTS.md) | Texto listo para pegar a cada agente |
| [SEGUIMIENTO.md](SEGUIMIENTO.md) | Tablero de estado y medidas |

La guía de interfaz sigue siendo [GUIA-UX-UI-AGENTES.md](../GUIA-UX-UI-AGENTES.md). Si este plan y `docs/ARCHITECTURE.md` se contradicen, manda este plan hasta que la tarea F0-3 los alinee.

## Fases

```text
F0 Controles ──> F1 Store ──> F2 Lógica y tipos ──> F3 Vistas desacopladas ──┐
       │                                                                     ├──> F6 Cierre
       └──────> F4 CSS y estilos en línea (en paralelo con F1 a F3) ─────────┘
                F5 Fachadas y modo demo: requiere decisiones del dueño
```

| Fase | Objetivo | Riesgo | ¿En paralelo? |
|---|---|---|---|
| **F0** | Controles que impiden volver atrás | Bajo | Va primero y solo |
| **F1** | Partir `lib/store.ts` por dominio | Alto | Un solo agente |
| **F2** | Partir selectores, tipos y datos de ejemplo | Medio | Un agente por tarea, tras F1 |
| **F3** | Secciones con props explícitas | Medio | Un agente por dominio |
| **F4** | CSS ordenado y sin `style={{}}` de maquetación | Medio | Un agente por lote de archivos |
| **F5** | Fachadas y modo demo | Alto | Tras decisiones del dueño |
| **F6** | Quitar excepciones, bajar topes, auditoría final | Bajo | Va al final |

**Fuera de este plan:** guardado por fila, tope de 8 MB, portal fuera del documento, motor de publicación, hosting y monitoreo. Siguen en [ROADMAP.md](../ROADMAP.md).

## Decisiones que solo toma el dueño

Ningún agente las decide. Si una tarea las necesita, se detiene y pregunta.

| ID | Decisión | Bloquea |
|---|---|---|
| D1 | ¿Las cifras de ejemplo de `/anuncios` se quedan, o se quita la pantalla hasta tener backend? | F5-1 |
| D2 | ¿Los logros y XP se implementan, se ocultan o se eliminan? | F5-2 |
| D3 | ¿Se conserva un modo demo público, o solo el simulador para desarrollo? | F5-3 |
| D4 | ¿`flujos-con-cuentas` pasa a ser obligatorio en `main`? Recomendado | F1 |

## Compuertas entre fases

Una fase no empieza sin la compuerta de la anterior. La revisa quien coordina, con evidencia.

| Antes de | Debe cumplirse |
|---|---|
| **F1** | F0 hecha. `store.contract.test.ts` y `critico-live.spec.ts` pasan en CI. D4 respondida. Capturas estables en dos corridas seguidas |
| **F2** | `store.ts` bajo 150 líneas. Contrato sin editar desde F0-5. Las medidas bajaron |
| **F3** | F2-2 hecha |
| **F5** | D1, D2 y D3 respondidas |
| **F6** | `medir-deslop` en metas, salvo lo que F6 cierra. El dueño usó la app con su cuenta sin hallar regresiones |

**Punto de control:** al terminar F1 y F3, el dueño prueba en `localhost:3000` con dos cuentas. Las pruebas no sustituyen este paso, porque trabajan con datos de prueba y no con los suyos.

## Definición de terminado de todo el plan

Se cumple cuando [SEGUIMIENTO.md](SEGUIMIENTO.md) muestra todas las metas alcanzadas, medidas con `node scripts/medir-deslop.mjs`, la auditoría F6-4 no deja hallazgos confirmados sin atender, y el dueño confirma su prueba. La tabla de metas está en [SEGUIMIENTO.md](SEGUIMIENTO.md).
