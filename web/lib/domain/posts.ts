import type { SocialPost } from "../types";

/** Añade una entrada al historial del post. No guarda: eso lo hace la acción del store. */
export function withPostLog(post: SocialPost, text: string, author: string): SocialPost {
  const at = new Date().toISOString();
  const entry = { id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, author, text, at };
  return { ...post, activity: [entry, ...(post.activity || [])] };
}

/** Copia de un post como borrador: sin fecha, sin resultados ni actividad previa. */
export function duplicatePostAsDraft(source: SocialPost, id: string, author: string): SocialPost {
  return withPostLog(
    {
      ...source,
      id,
      title: `${source.title} (copia)`,
      status: "draft",
      statusLabel: "Borrador",
      scheduledDate: "",
      scheduledTime: "",
      comments: [],
      metrics: undefined,
      metricsSource: undefined,
      publishedUrl: undefined,
      chat: [],
      activity: [],
    },
    `Duplicó «${source.title}»`,
    author
  );
}
