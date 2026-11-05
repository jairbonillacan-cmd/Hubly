"use client";

import "./notebooks/notebooks.css";
import { Modal } from "@/components/app/ui/Modal";
import { LibretaCabecera } from "./notebooks/LibretaCabecera";
import { LibretaLista } from "./notebooks/LibretaLista";
import { LibretaFormulario } from "./notebooks/LibretaFormulario";
import { LibretaPie } from "./notebooks/LibretaPie";
import {
  openNotebookModal,
  useNotebookReaderModal,
  type NotebookReaderModalProps,
} from "./notebooks/useNotebookReaderModal";

export { openNotebookModal };

export function NotebookReaderModal(props: NotebookReaderModalProps = {}) {
  const {
    titleId,
    titleInputRef,
    notebooks,
    brands,
    isOpen,
    currentNotebook,
    isCreatingNew,
    setIsCreatingNew,
    setActiveNotebookId,
    title,
    setTitle,
    subtitle,
    setSubtitle,
    category,
    setCategory,
    brandId,
    setBrandId,
    accentColor,
    setAccentColor,
    savedNotice,
    taskNotice,
    errorMsg,
    setErrorMsg,
    handleClose,
    handleSave,
    sendPendingToTasks,
    handleDeleteCurrent,
    handleContentChange,
  } = useNotebookReaderModal(props);

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      labelledBy={titleId}
      className="hubly-sheet hubly-notebooks-modal"
    >
      <LibretaCabecera
        titleId={titleId}
        title={currentNotebook?.title || ""}
        category={category}
        accentColor={accentColor}
        isCreatingNew={isCreatingNew}
        savedNotice={savedNotice}
        onClose={handleClose}
      />

      <div className="hubly-notebooks-grid">
        <LibretaLista
          notebooks={notebooks}
          currentNotebookId={currentNotebook?.id ?? null}
          isCreatingNew={isCreatingNew}
          onSelectNotebook={(id) => {
            setIsCreatingNew(false);
            setActiveNotebookId(id);
          }}
          onStartNew={() => setIsCreatingNew(true)}
        />

        <LibretaFormulario
          values={{
            title,
            subtitle,
            category,
            brandId,
            accentColor,
            editorKey: isCreatingNew ? "nueva" : currentNotebook?.id || "vacia",
            initialContent: isCreatingNew ? "" : currentNotebook?.content || "",
          }}
          brands={brands}
          errorMsg={errorMsg}
          titleInputRef={titleInputRef}
          onChangeField={(patch) => {
            if (patch.title !== undefined) {
              setTitle(patch.title);
              if (errorMsg) setErrorMsg(null);
            }
            if (patch.subtitle !== undefined) setSubtitle(patch.subtitle);
            if (patch.category !== undefined) setCategory(patch.category);
            if (patch.brandId !== undefined) setBrandId(patch.brandId);
            if (patch.accentColor !== undefined) setAccentColor(patch.accentColor);
          }}
          onContentChange={handleContentChange}
          onSubmit={handleSave}
        />
      </div>

      <LibretaPie
        isCreatingNew={isCreatingNew}
        canDelete={!isCreatingNew && Boolean(currentNotebook) && notebooks.length > 1}
        taskNotice={taskNotice}
        onSendPendingToTasks={sendPendingToTasks}
        onDelete={handleDeleteCurrent}
        onClose={handleClose}
      />
    </Modal>
  );
}
