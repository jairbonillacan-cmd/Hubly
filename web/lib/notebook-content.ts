const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Las libretas antiguas guardan texto plano; el editor trabaja con HTML. */
export function notebookToHtml(content: string): string {
  if (!content) return "";
  if (/^\s*<(p|h[1-6]|ul|ol|blockquote)[\s>]/i.test(content)) return content;
  return content
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export function notebookPlainText(content: string): string {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&lt;|&gt;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

/** Pendientes sin marcar de las listas de tareas de una nota. */
export function notebookTasks(content: string): string[] {
  const out: string[] = [];
  for (const m of content.matchAll(/<li\b[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/g)) {
    const text = decodeEntities(m[1].replace(/<label[\s\S]*?<\/label>/, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (text) out.push(text);
  }
  return out;
}
