"use client";

import { useParrillasPage } from "./_vista/useParrillasPage";
import { ParrillasNav } from "./_vista/ParrillasNav";
import { ParrillasCalendario } from "./_vista/ParrillasCalendario";
import { ParrillasDemo } from "./_vista/ParrillasDemo";
import { ParrillasLinks } from "./_vista/ParrillasLinks";
import { ParrillasIdeas } from "./_vista/ParrillasIdeas";

export default function ParrillasPage() {
  const view = useParrillasPage();

  return (
    <div
      className="hubly-touch"
      style={{
        color: "var(--ui-text)",
        minHeight: "calc(100vh - 64px)",
        position: "relative",
        paddingBottom: 60,
      }}
    >
      <ParrillasNav view={view} />
      <ParrillasCalendario view={view} />
      <ParrillasDemo view={view} />
      <ParrillasLinks view={view} />
      <ParrillasIdeas view={view} />
    </div>
  );
}
