import { notebookPlainText, notebookTasks } from "../notebook-content";
import type { AgencyTask, NotebookItem } from "../types";

export const NOTEBOOK_COLORS = [
  { id: "kraft", label: "Kraft clásico", bg: "#C59B6D", spine: "#3A2210" },
  { id: "terracotta", label: "Terracota", bg: "#C87A51", spine: "#4A2511" },
  { id: "sage", label: "Salvia", bg: "#4A7862", spine: "#1E382B" },
  { id: "slate", label: "Pizarra", bg: "#475569", spine: "#1E293B" },
] as const;

interface NotebookFormDraft {
  title: string;
  subtitle: string;
  category: string;
  brandId: string;
  accentColor: string;
  content: string;
}

export function resolveNotebookColorSpec(accentColor: string) {
  return NOTEBOOK_COLORS.find((c) => c.bg === accentColor) || NOTEBOOK_COLORS[0];
}

export function buildNotebookFormDraft(
  notebook: NotebookItem | null,
  isCreatingNew: boolean,
  activeBrandId = ""
): NotebookFormDraft {
  if (isCreatingNew || !notebook) {
    return {
      title: "",
      subtitle: "Notas operativas y acuerdos de cuenta",
      category: "ESTRATEGIA",
      brandId: activeBrandId,
      accentColor: NOTEBOOK_COLORS[0].bg,
      content: "",
    };
  }
  return {
    title: notebook.title,
    subtitle: notebook.subtitle || "Guía operativa de agencia",
    category: notebook.category || notebook.stamp || "LIBRETA KRAFT",
    brandId: notebook.brandId || activeBrandId,
    accentColor: notebook.accentColor || NOTEBOOK_COLORS[0].bg,
    content: notebook.content,
  };
}

type NotebookValidationResult =
  | {
      ok: true;
      payload: {
        brandId: string;
        title: string;
        subtitle: string;
        category: string;
        accentColor: string;
        content: string;
      };
    }
  | {
      ok: false;
      field: "title" | "content";
      error: string;
    };

export function validateAndBuildNotebookInput(
  draft: NotebookFormDraft
): NotebookValidationResult {
  const cleanTitle = draft.title.trim();
  const cleanContent = notebookPlainText(draft.content) ? draft.content.trim() : "";

  if (!cleanTitle) {
    return {
      ok: false,
      field: "title",
      error: "Escribe un título para esta libreta Kraft.",
    };
  }

  if (!cleanContent) {
    return {
      ok: false,
      field: "content",
      error: "Agrega contenido o notas a la libreta antes de guardar.",
    };
  }

  return {
    ok: true,
    payload: {
      brandId: draft.brandId,
      title: cleanTitle,
      subtitle: draft.subtitle.trim() || "Notas operativas",
      category: draft.category.trim().toUpperCase() || "LIBRETA KRAFT",
      accentColor: draft.accentColor,
      content: cleanContent,
    },
  };
}

export function extractFreshNotebookTasks(
  content: string,
  existingTasks: Pick<AgencyTask, "brandId" | "title">[],
  brandId: string
): string[] {
  const existing = new Set(
    existingTasks.filter((t) => t.brandId === brandId).map((t) => t.title)
  );
  return notebookTasks(content).filter((title) => !existing.has(title));
}

export function resolveNextNotebookIdAfterDelete(
  notebooks: Pick<NotebookItem, "id">[],
  deletedId: string
): string | null {
  const remaining = notebooks.filter((n) => n.id !== deletedId);
  return remaining.length > 0 ? remaining[0].id : null;
}
