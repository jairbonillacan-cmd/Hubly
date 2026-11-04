"use client";

import { useHublyStore } from "@/lib/store";
import { openNotebookModal } from "@/components/app/NotebookReaderModal";

/** Crea una libreta vacía y abre el lector. Lo usan /tareas y el widget de Inicio. */
export function useCreateNotebook() {
  const addNotebook = useHublyStore((s) => s.addNotebook);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  return () => {
    const created = addNotebook({
      title: "Nueva libreta",
      subtitle: "Notas de la marca",
      category: "Libreta",
      brandId: activeBrandId,
      content: "",
    });
    openNotebookModal(created.id);
  };
}
