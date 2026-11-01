# Estándares de código

La interfaz se rige por [GUIA-UX-UI-AGENTES.md](GUIA-UX-UI-AGENTES.md). Aquí va lo demás. Lo que se puede comprobar lo hace CI.

## Antes de crear
- Busca una función, componente o clase parecida. Si existe y sirve, se usa.
- Extrae lo compartido al tercer uso, no antes, y solo si cambia por las mismas razones.
- Una dependencia nueva se justifica en el PR: mantenimiento, licencia, seguridad y solape con lo que ya hay.

## Tamaño
- Hasta 400 líneas por archivo. Los que ya pasan no pueden crecer (`npm run check:size`).
- Al dividir: primero mover sin cambiar lógica, con su propio commit. Después simplificar.

## Tipos y errores
- Sin `any` ni `as unknown as` para callar al compilador.
- Sin `catch {}` vacío: maneja el error, muéstralo, o escribe por qué se ignora.
- Toda omisión (`eslint-disable`, `ui-ok`, `ts-expect-error`) lleva su motivo.
- Datos externos se validan en la frontera, con tope de tamaño (`readJson`, `readBodyText`).

## Deuda
Las bases de `check:ui` y `check:size` y el tope de avisos de `lint` solo bajan. CI lo verifica en cada PR (`scripts/check-deuda.mjs`).

## Terminado
Cumple lo pedido, reutiliza lo existente, valida en servidor, pasa las comprobaciones y su entrega dice qué se verificó y qué no. Que compile no significa que funcione.
