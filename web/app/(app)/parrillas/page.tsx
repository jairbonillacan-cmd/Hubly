"use client";

import { useParrillasPage } from "@/components/app/parrillas/useParrillasPage";
import { ParrillasNav } from "@/components/app/parrillas/ParrillasNav";
import { ParrillasCalendario } from "@/components/app/parrillas/ParrillasCalendario";
import { ParrillasDemo } from "@/components/app/parrillas/ParrillasDemo";
import { ParrillasLinks } from "@/components/app/parrillas/ParrillasLinks";
import { ParrillasIdeas } from "@/components/app/parrillas/ParrillasIdeas";

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
