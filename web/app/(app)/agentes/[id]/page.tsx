import { AgentBuilder } from "@/components/app/agents/AgentBuilder";

// El layout lee la ruta en cliente y los agentes viven en el store: nada de esto se prerenderiza.
export const instant = false;

export default async function AgentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentBuilder key={id} agentId={id} />;
}
