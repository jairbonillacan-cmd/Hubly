"use client";

import { useRef, useState, type KeyboardEvent } from "react";

const ROLES = [
  {
    id: "community",
    label: "Community manager",
    title: "Todo el mes de cada marca, a la vista",
    tasks: [
      "Planea el calendario de cada cliente sin cambiar de herramienta.",
      "Deja las publicaciones programadas y olvídate de la hora.",
      "Ve de un vistazo qué falta por aprobar.",
    ],
  },
  {
    id: "design",
    label: "Diseño",
    title: "Saber qué piezas faltan y para cuándo",
    tasks: [
      "Encuentra el formato y la fecha de cada pieza en el calendario.",
      "Recibe los comentarios del cliente sobre la publicación correcta.",
      "Ve la pieza como quedará antes de publicarla.",
    ],
  },
  {
    id: "accounts",
    label: "Cuentas",
    title: "Menos seguimiento, mejores conversaciones",
    tasks: [
      "Envía un solo enlace en lugar de perseguir respuestas.",
      "Consulta qué aprobó el cliente y cuándo.",
      "Llega a la reunión mensual con el reporte listo.",
    ],
  },
  {
    id: "client",
    label: "Cliente",
    title: "Revisar sin instalar nada",
    tasks: [
      "Abre el enlace, sin cuenta ni contraseña.",
      "Aprueba o comenta cada publicación desde el teléfono.",
      "Recibe resultados claros cada mes.",
    ],
  },
];

export function RoleTabs() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const role = ROLES[active];

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowRight: (active + 1) % ROLES.length,
      ArrowLeft: (active - 1 + ROLES.length) % ROLES.length,
      Home: 0,
      End: ROLES.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="roles-tabs">
      <div role="tablist" aria-label="Roles del equipo" className="roles-list" onKeyDown={handleKeyDown}>
        {ROLES.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`role-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls="role-panel"
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="role-panel" aria-labelledby={`role-tab-${role.id}`} className="roles-panel" key={role.id}>
        <h3>{role.title}</h3>
        <ul>
          {role.tasks.map((task) => (
            <li key={task}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m4 10.5 4 4 8-9" />
              </svg>
              {task}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
