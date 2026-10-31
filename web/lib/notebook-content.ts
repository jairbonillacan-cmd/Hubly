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
