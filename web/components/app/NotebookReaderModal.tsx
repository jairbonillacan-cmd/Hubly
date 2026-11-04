"use client";

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
    dialogRef,
    titleInputRef,
    notebooks,
    brands,
    isOpen,
    presence,
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
    activeColorSpec,
    handleClose,
    handleSave,
    sendPendingToTasks,
    handleDeleteCurrent,
    handleContentChange,
  } = useNotebookReaderModal(props);

  if (!presence.mounted) return null;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      labelledBy={titleId}
      className="hubly-sheet"
      surfaceRef={dialogRef}
      style={{
        width: "100%",
        maxWidth: 780,
        maxHeight: "90vh",
        background: "#FAF5EC",
        borderRadius: 20,
        border: "1px solid #D6C2A5",
        boxShadow: "0 24px 60px rgba(44, 26, 11, 0.28)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#2C1A0B",
        position: "relative",
      }}
    >
      <LibretaCabecera
        titleId={titleId}
        title={currentNotebook?.title || ""}
        category={category}
        isCreatingNew={isCreatingNew}
        savedNotice={savedNotice}
        colorSpec={activeColorSpec}
        onClose={handleClose}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "210px minmax(0, 1fr)",
          flex: 1,
          minHeight: 0,
          paddingLeft: 14,
        }}
      >
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
