"use client";

import { Button } from "@/components/app/ui/Button";
import {
  HublySaveIcon,
} from "@/components/app/icons/DuotoneIcons";
import type { PostComposerModalModel } from "./usePostComposerModal";

export function ComposerPie({ view }: { view: PostComposerModalModel }) {
  const { editingPost, draft, errorMsg, publishMode, dirty, requestClose, locked, save, askToPublish, pastSchedule, noNetworks, scheduleButton } = view;

  return (
    <footer className="hubly-composer-foot">
      {errorMsg ? (
        <span role="alert">{errorMsg}</span>
      ) : (
        <small>{editingPost?.activity?.length ? `Creado ${new Date(editingPost.activity[editingPost.activity.length - 1].at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}` : dirty ? "Cambios guardados en este navegador" : ""}</small>
      )}
      <Button variant="ghost" onClick={() => void requestClose()}>{locked ? "Cerrar" : "Cancelar"}</Button>
      {!locked && publishMode === "guardar" && (
        <>
          <Button variant="secondary" onClick={() => save("pending")}>Enviar a revisión</Button>
          <Button variant="primary" onClick={() => save(editingPost ? draft.status : "draft")}>
            {editingPost ? "Guardar" : "Guardar borrador"}
          </Button>
        </>
      )}
      {!locked && publishMode !== "guardar" && (
        <>
          <Button variant="secondary" title="Guarda el post sin programarlo" onClick={() => save(editingPost ? draft.status : "draft")}>
            <HublySaveIcon size={15} /> Guardar
          </Button>
          {publishMode === "programar" ? (
            <Button
              variant="primary"
              disabled={!draft.scheduledDate || pastSchedule || noNetworks}
              title={pastSchedule ? "Esa hora ya pasó: elige una fecha futura para programar" : noNetworks ? "Selecciona al menos una red" : undefined}
              onClick={() => void askToPublish("programar")}
            >
              {scheduleButton}
            </Button>
          ) : (
            <Button variant="primary" disabled={noNetworks} onClick={() => void askToPublish("publicar")}>Marcar como publicado</Button>
          )}
        </>
      )}
    </footer>
  );
}
