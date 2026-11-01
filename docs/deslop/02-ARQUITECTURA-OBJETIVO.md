# Arquitectura objetivo

Sigue siendo una sola aplicación Next.js sobre Supabase ([ADR 0004](../adr/0004-monolito-modular.md)). No se introducen microservicios, ni `src/`, ni una librería de estado nueva.

## Estructura

Solo se muestra lo que cambia. Las rutas de `app/` no cambian de URL.

```text
web/
├── app/
│   ├── tokens.css                  # Único lugar con definiciones de color
│   ├── (app)/
│   │   ├── layout.tsx              # Armazón y lista ordenada de CSS: menos de 150 líneas
│   │   ├── app-base.css            # Reinicio y elementos base
│   │   └── <ruta>/page.tsx         # Menos de 80 líneas: compone y nada más
│   └── api/<recurso>/route.ts      # Valida, autoriza y llama a lib/server
├── components/
│   ├── app/
│   │   ├── ui/                     # Piezas sin dominio
│   │   ├── shell/                  # Sidebar, barras, superficies
│   │   └── <dominio>/              # Una carpeta por dominio
│   │       ├── <Pantalla>.tsx      # Reúne datos y compone
│   │       ├── <Seccion>.tsx       # Recibe props explícitas
│   │       ├── use<Algo>.ts        # Estado de pantalla, si hace falta
│   │       └── <dominio>.css       # Estilos del dominio
│   └── previews/                   # Simuladores de redes; colores propios
├── lib/
│   ├── store.ts                    # Compone los slices; mismo import de siempre
│   ├── store/                      # <dominio>.slice.ts, ui.slice.ts, sync.ts
│   ├── domain/                     # Reglas puras por dominio, con pruebas
│   ├── types/                      # <dominio>.ts e index.ts
│   ├── seed/                       # Datos de ejemplo por dominio
│   └── server/                     # Código solo de servidor
└── scripts/, e2e/, tests/
```

### Dominios

Los nombres son fijos. Una carpeta nueva requiere ADR.

| Dominio | `components/app/` | `lib/store/` | `lib/domain/` |
|---|---|---|---|
| Sesión | — | `session.slice.ts` | — |
| Marcas | `marca/` | `brands.slice.ts`, `brandStrategy.slice.ts` | `brands.ts` |
| Posts y calendario | `social/`, `compositor/`, `parrillas/` | `posts.slice.ts` | `posts.ts`, `activity.ts` |
| Anuncios | `anuncios/` | — | — |
| Ajustes | `ajustes/` | — | — |
| Reportes | `reports/` | — | el actual `lib/reporting.ts` |
| Tareas | `tasks/` | `tasks.slice.ts` | `tasks.ts` |
| Libretas | `notebooks/` | `notebooks.slice.ts` | — |
| Proyectos | `projects/` | `projects.slice.ts` | — |
| Archivos | `media/` | `assets.slice.ts` | — |
| CRM | `crm/` | `crm.slice.ts` | — |
| Equipo | `equipo/` | `team.slice.ts` | `team.ts` |
| Tablero | `dashboard/` | `dashboard.slice.ts` | `greeting.ts`, `onboarding.ts` |
| Salud de cuentas | `salud/` | dentro de `brands.slice.ts` | `account-health.ts` |
| Agentes | `agents/` | `agents.slice.ts` | — |
| Chat | `chat/` | `chat.slice.ts` | el actual `lib/chat.ts` |
| Automatizaciones | `automatizaciones/` | `automations.slice.ts` | `automations.ts` |
| Ventanas y modos | `shell/` | `ui.slice.ts` | — |
| Sincronización | — | `sync.ts` | — |

Las carpetas `_vista/` de `parrillas` y `anuncios`, `dashboard/team/` y `dashboard/inicio/` se mueven a su dominio dentro de F3. `sugerencias/` pasa a `marca/`. `icons/` es compartida, como `ui/`. Los archivos sueltos en la raíz de `components/app/` se mueven a su dominio cuando una tarea los toca; los globales, como `AppDialogHost` o `CommandPaletteModal`, van a `shell/`.

## Reglas de dependencia

```text
app/  ──> components/ ──> lib/store ──> lib/domain ──> lib/types
                │                            ▲
                └────────────────────────────┘
app/api ──> lib/server ──> lib/domain
```

1. `lib/` nunca importa de `components/` ni de `app/`.
2. `lib/domain/` es puro: sin React, sin store, sin red ni `window`. Todo con pruebas.
3. `components/app/<a>/` no importa de `components/app/<b>/` salvo su archivo público de pantalla. Lo compartido sube a `ui/` o `icons/`.
4. Un slice no importa otro slice. Lo que cruza dominios usa `get()`.
5. `lib/server/` solo se importa desde `app/api/` y componentes de servidor.

F0-2 convierte estas reglas en un chequeo de CI.

## Patrones

### Slice del store

`useHublyStore` conserva su import y su forma: los 66 archivos que lo usan no cambian.

```ts
// lib/store/tasks.slice.ts
import type { StateCreator } from "zustand";
import type { HublyStoreState } from "../store";

export interface TasksSlice {
  addTask: (input: AddTaskInput) => void;
}

// `tasks` es dato guardado: lo aporta INITIAL_WORKSPACE_DATA, no el slice.
export const createTasksSlice: StateCreator<HublyStoreState, [], [], TasksSlice> = (set, get) => ({
  addTask: (input) => {
    set((s) => ({ tasks: [buildTask(input), ...s.tasks] })); // buildTask vive en lib/domain
    persistWorkspaceState(get());
  },
});
```

```ts
// lib/store.ts
export type HublyStoreState = HublyWorkspaceData & TasksSlice & PostsSlice & /* … */ UiSlice;
export const useHublyStore = create<HublyStoreState>()((...a) => ({
  ...INITIAL_WORKSPACE_DATA, // Siempre primero
  ...createTasksSlice(...a),
  ...createPostsSlice(...a),
}));
```

- Una acción con reglas llama a una función pura de `lib/domain/`.
- `useHublyStore()` sin selector está prohibido. Hay un uso y se elimina en F1-6.

### Pantalla y secciones

```tsx
// Mal: la sección recibe todo
function Resumen({ view }: { view: EquipoViewModel }) {}

// Bien: dice exactamente lo que necesita
interface ResumenProps {
  member: TeamMember;
  period: Period;
  onEditBrands: () => void;
}
function Resumen({ member, period, onEditBrands }: ResumenProps) {}
```

- La pantalla lee del store y pasa props.
- Una sección puede leer del store solo si evita pasar props por más de dos niveles.
- Más de 7 props suele significar que la sección hace demasiado: se parte.
- `use<Algo>` guarda estado de interfaz, no reglas de negocio. Las reglas van a `lib/domain/`.
- Sin `build*` que devuelva objetos gigantes.

### Estilos

| Necesito | Uso |
|---|---|
| Un color | Token de `tokens.css` |
| Un control de la guía | Componente de `ui/` |
| Maquetar | Clase `.hubly-<dominio>-<parte>` en `<dominio>.css` |
| Un valor calculado (color de marca, ancho de barra) | `style={{ }}` o variable CSS en línea |

- `<dominio>.css` se importa en `(app)/layout.tsx`, en orden fijo, no desde la pantalla: así la cascada no cambia al navegar. Cargarlo por ruta se evalúa después de F4-5, cuando ya no dependa del orden.
- `!important` solo con un comentario que diga contra qué pelea.
- Una regla `html.dark` solo si el token no alcanza.
- Sin `.hbtn-*`, `.saas-*` ni tokens prohibidos en la §3 de la guía.

### Tamaños

| Pieza | Máximo |
|---|---:|
| `page.tsx` | 80 líneas |
| Componente | 300 líneas |
| Cualquier archivo de código | 400 líneas |
| Función | 80 líneas |
| Props de un componente | 7 |

### Nombres

- Código y tipos en inglés si ya lo están; nada se renombra solo por idioma.
- Archivos nuevos: `PascalCase.tsx`, `useAlgo.ts`, `camelCase.ts`, `dominio.slice.ts`, `dominio.css`.
- Clases CSS: `hubly-<dominio>-<parte>`.
- Textos de interfaz en español de México, según la guía.
- Comentarios: solo el porqué, en español. Sin nombres de capturas, agentes ni chunks.
- Sin `_vista`, `partes`, `-shared`, `-polish`, `utils`, `helpers` ni `misc`.
