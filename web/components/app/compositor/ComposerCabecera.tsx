"use client";

import { networkSpec } from "@/lib/network-catalog";
import { POST_STATUS_LABEL } from "@/lib/labels";
import {
  postColorText,
} from "@/lib/post-draft";
import {
  HublyCloseIcon as X,
  HublyCopyIcon as Copy,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";
import { networkInk } from "./PostComposerModal-shared";
import type { PostComposerModalModel } from "./usePostComposerModal";

export function ComposerCabecera({ view }: { view: PostComposerModalModel }) {
  const { duplicatePost, openComposer, setComposerDirty, readOnly, editingPost, draft, dirty, requestClose, update, brand, locked, workflowStatus, remove } = view;

  return (
    <header className="hubly-composer-head">
      <div style={{ minWidth: 0, flex: 1 }}>
        <input
          className="hubly-composer-title"
          value={draft.title}
          disabled={locked}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Sin título"
          aria-label="Título del post"
          style={draft.color ? { color: postColorText(draft.color) } : undefined}
        />
        <div className="hubly-composer-badges">
          <span title="Marca del post">{brand.name}</span>
          <span>{POST_STATUS_LABEL[draft.status]}</span>
          {workflowStatus && <em style={{ color: workflowStatus.color }}>{workflowStatus.name}</em>}
          <span className="hubly-composer-dots" aria-label={`Redes: ${draft.networks.join(", ")}`}>
            {draft.networks.map((n) => <i key={n} style={{ background: networkInk(networkSpec(n).color) }} />)}
          </span>
        </div>
      </div>
      {editingPost && !readOnly && (
        <button type="button" className="hubly-cal-icon" aria-label="Duplicar post" title="Duplicar post" onClick={() => { const copyId = duplicatePost(editingPost.id); if (copyId) { setComposerDirty(false); openComposer(copyId); } }}>
          <Copy size={17} />
        </button>
      )}
      {!readOnly && (editingPost || dirty) && (
        <button type="button" className="hubly-cal-icon is-danger" aria-label="Eliminar post" title="Eliminar post" onClick={() => void remove()}>
          <Trash2 size={17} />
        </button>
      )}
      <button type="button" className="hubly-cal-icon" aria-label="Cerrar" title="Cerrar; tus cambios quedan guardados en este navegador" onClick={() => void requestClose()}>
        <X size={18} />
      </button>
    </header>
  );
}
