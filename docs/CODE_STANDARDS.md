# Estándares de código

La interfaz se rige por [GUIA-UX-UI-AGENTES.md](GUIA-UX-UI-AGENTES.md). Aquí va lo demás. Lo que se puede comprobar lo hace CI, y las reglas de la estructura objetivo están en [docs/deslop/02-ARQUITECTURA-OBJETIVO.md](deslop/02-ARQUITECTURA-OBJETIVO.md).

## Antes de crear
- Busca una función, componente o clase parecida. Si existe y sirve, se usa.
- Extrae lo compartido al tercer uso, no antes, y solo si cambia por las mismas razones.
- Una dependencia nueva se justifica en el PR: mantenimiento, licencia, seguridad y solape con lo que ya hay.

## Componentes
Usa `web/components/app/ui/` antes de escribir marcado propio. Si un patrón se repite tres veces y no está, se añade ahí.

- Una sección recibe props explícitas, no un objeto `view` con todo el estado de la pantalla. Más de 7 props suele significar que hace demasiado.
- La pantalla lee del store y reparte datos; la sección no conoce el store, salvo para evitar pasar props por más de dos niveles.
- `useHublyStore` siempre con selector. `useHublyStore()` suscribe a todo el store y está prohibido.

## Estilos
- Un color, un tamaño o un radio salen de un token y su escala ([§3 a §5](GUIA-UX-UI-AGENTES.md)).
- `style={{ }}` solo para un valor calculado, como el color de una marca o el ancho de una barra. Para maquetar, una clase con tokens.
- `!important` solo con un comentario que diga contra qué pelea, y una regla `html.dark` solo si el token no alcanza.
- Cada `<dominio>.css` se importa en `(app)/layout.tsx`, en orden fijo: no desde la pantalla, para que la cascada no cambie al navegar.

## Store y datos
- Un slice compone; las reglas de negocio van a `lib/domain/`, con pruebas.
- La marca activa sale de `selectActiveBrand` (`lib/active-brand.ts`): ninguna pantalla la busca por su cuenta ni recurre a un id de ejemplo.
- No cambies la forma de los datos guardados ni el nombre de sus campos en un refactor.

## Tamaño
- Hasta 400 líneas por archivo. Los que ya pasan no pueden crecer (`npm run check:size`).
- Al dividir: primero mover sin cambiar lógica, con su propio commit. Después simplificar.

## Tipos y errores
- Sin `any` ni `as unknown as` para callar al compilador.
- Sin `catch {}` vacío: maneja el error, muéstralo, o escribe por qué se ignora.
- Toda omisión (`eslint-disable`, `ui-ok`, `ts-expect-error`) lleva su motivo.
- Datos externos se validan en la frontera, con tope de tamaño (`readJson`, `readBodyText`).

## Deuda
Las bases de `check:ui`, `check:capas` y `check:size`, y el tope de avisos de `lint`, solo bajan. CI lo verifica en cada PR con `scripts/check-deuda.mjs`, que compara por regla y también frena cualquier exención nueva de `ui-ok:` o `eslint-disable`.

- `check:ui` mide `app/(app)` y `components/app` con `scripts/check-ui-baseline.json`, y las rutas fuera de `(app)` con `scripts/check-ui-rutas-baseline.json`. Son dos bases: no mezcles una con otra.
- Las reglas que llegaron en F0-3 (`style-inline`, `important`, `view-prop`, `use-store-sin-selector`) miden deuda ya existente; `node scripts/medir-deslop.mjs` imprime su total aparte del de las reglas de siempre.
- Mover o partir un archivo con deuda sigue el protocolo de [03-REGLAS-PARA-AGENTES.md](deslop/03-REGLAS-PARA-AGENTES.md): commit de movimiento, `--update` y `check-deuda` en verde.

## Terminado
Cumple lo pedido, reutiliza lo existente, valida en servidor, pasa las comprobaciones y su entrega dice qué se verificó y qué no. Que compile no significa que funcione.
