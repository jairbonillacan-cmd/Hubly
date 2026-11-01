"use client";

import { Modal } from "@/components/app/ui/Modal";
import { useAutoSuggestionsModal, buildAutoSuggestionsModal } from "./sugerencias/useAutoSuggestionsModal";
import { SugerenciasCabecera } from "./sugerencias/SugerenciasCabecera";
import { SugerenciasCuerpo } from "./sugerencias/SugerenciasCuerpo";
import { SugerenciasPie } from "./sugerencias/SugerenciasPie";

export function AutoSuggestionsModal(props: Parameters<typeof useAutoSuggestionsModal>[0]) {
  const base = useAutoSuggestionsModal(props);
  const { presence } = base;
  if (!presence.mounted) return null;
  const view = buildAutoSuggestionsModal(base);
  const { titleId, dialogRef, isOpen, handleClose } = view;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      labelledBy={titleId}
      className="hubly-sheet"
      surfaceRef={dialogRef}
      style={{
        width: "100%",
        maxWidth: 680,
        maxHeight: "90vh",
        background: "var(--ui-surface)",
        borderRadius: 20,
        border: "1px solid var(--ui-border)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "var(--ui-text)",
      }}
    >
      <SugerenciasCabecera view={view} />
      <SugerenciasCuerpo view={view} />
      <SugerenciasPie view={view} />
    </Modal>
  );
}
