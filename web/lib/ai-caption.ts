export interface CaptionBrandContext {
  name?: string;
  whatTheySell?: string;
  toneOfVoice?: string;
  pillars?: string[];
  doWords?: string[];
  dontWords?: string[];
}

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const list = (value: unknown) =>
  Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 20).map((v) => v.slice(0, 80)).join(", ") : "";

export function buildCaptionSystemPrompt(brand?: CaptionBrandContext, network?: string, format?: string): string {
  const lines = [
    "Redactas textos para redes sociales en español, para una agencia de marketing.",
    "Responde solo con el texto listo para publicar, sin comillas, títulos ni opciones alternativas.",
    "No inventes precios, datos, promociones ni testimonios que no estén en la indicación o en el perfil de la marca.",
    `Red: ${clip(network, 40) || "sin especificar"}. Formato: ${clip(format, 40) || "sin especificar"}.`,
  ];
  if (brand?.name) lines.push(`Marca: ${clip(brand.name, 120)}.`);
  if (brand?.whatTheySell) lines.push(`Qué vende: ${clip(brand.whatTheySell, 500)}.`);
  if (brand?.toneOfVoice) lines.push(`Tono de voz: ${clip(brand.toneOfVoice, 500)}.`);
  if (list(brand?.pillars)) lines.push(`Pilares de contenido: ${list(brand?.pillars)}.`);
  if (list(brand?.doWords)) lines.push(`Palabras que usa: ${list(brand?.doWords)}.`);
  if (list(brand?.dontWords)) lines.push(`Palabras que evita: ${list(brand?.dontWords)}.`);
  return lines.join("\n");
}
