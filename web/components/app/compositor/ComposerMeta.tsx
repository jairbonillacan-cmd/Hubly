"use client";

import { PeopleMenu, } from "@/components/app/social/ComposerPanels";
import type { CustomFieldDefinition, } from "@/lib/types";
import {
  HublyBellIcon,
  HublyCheckIcon,
  HublyCloseIcon as X,
  HublyPersonIcon,
  HublyPlusIcon as Plus,
} from "@/components/app/icons/DuotoneIcons";
import { POST_PALETTE, FIELD_TYPES, } from "./PostComposerModal-shared";
import type { PostComposerModalModel } from "./usePostComposerModal";

export function ComposerMeta({ view }: { view: PostComposerModalModel }) {
  const { team, draft, popover, setPopover, fieldName, setFieldName, fieldType, setFieldType, newStatus, setNewStatus, update, workflow, fields, locked, workflowStatus, selectedAssignees, notifyMembers, photoFor, selectedPalette, addWorkflowStatus, removeWorkflowStatus, removeField, addField, addFieldOption } = view;

  return (
    <div className="hubly-composer-meta">
      <div className="hubly-composer-pop">
        <button type="button" aria-expanded={popover === "assignee"} disabled={locked} onClick={() => setPopover(popover === "assignee" ? null : "assignee")}>
          <HublyPersonIcon size={17} />
          <span>{selectedAssignees.length ? selectedAssignees.map((m) => m.name.split(" ")[0]).join(", ") : draft.assignee || "Sin asignar"}</span>
        </button>
        {popover === "assignee" && (
          <PeopleMenu
            label="Responsables"
            team={team}
            selected={draft.assigneeIds}
            photoFor={photoFor}
            onToggle={(id) => {
              const next = draft.assigneeIds.includes(id) ? draft.assigneeIds.filter((x) => x !== id) : [...draft.assigneeIds, id];
              update({ assigneeIds: next, assignee: team.find((m) => m.id === next[0])?.name ?? "" });
            }}
          />
        )}
      </div>
      <div className="hubly-composer-pop">
        <button type="button" className={draft.notifyOnPublish ? "is-on" : undefined} title="Se guarda en el post como referencia; aún no envía avisos automáticos" aria-expanded={popover === "notify"} disabled={locked} onClick={() => setPopover(popover === "notify" ? null : "notify")}>
          <HublyBellIcon size={17} />
          <span>{notifyMembers.length ? `Avisar a ${notifyMembers.map((m) => m.name.split(" ")[0]).join(", ")}` : "Avisar al publicar"}</span>
        </button>
        {popover === "notify" && (
          <PeopleMenu
            label="Avisar al publicar"
            note="Se guarda en el post como referencia; aún no envía avisos automáticos."
            team={team}
            selected={draft.notifyMemberIds}
            photoFor={photoFor}
            onToggle={(id) => {
              const next = draft.notifyMemberIds.includes(id) ? draft.notifyMemberIds.filter((x) => x !== id) : [...draft.notifyMemberIds, id];
              update({ notifyMemberIds: next, notifyOnPublish: next.length > 0 });
            }}
            clearLabel="Quitar aviso"
            onClear={() => {
              update({ notifyMemberIds: [], notifyOnPublish: false });
              setPopover(null);
            }}
          />
        )}
      </div>
      <div className="hubly-composer-pop">
        <button type="button" aria-label="Color del post" aria-expanded={popover === "color"} disabled={locked} onClick={() => setPopover(popover === "color" ? null : "color")}>
          {draft.color ? <i style={{ background: draft.color }} /> : <i className="is-none" />}
          <span>{selectedPalette ? selectedPalette.name : "Color"}</span>
        </button>
        {popover === "color" && (
          <div className="hubly-composer-menu is-colors" role="group" aria-label="Color del post">
            <button type="button" aria-pressed={!draft.color} onClick={() => { update({ color: "" }); setPopover(null); }}>
              <i className="is-none" /> Sin color
              {!draft.color && <HublyCheckIcon size={14} />}
            </button>
            {POST_PALETTE.map(({ name, color }) => (
              <button key={color} type="button" aria-pressed={draft.color === color} onClick={() => { update({ color }); setPopover(null); }}>
                <i style={{ background: color }} /> {name}
                {draft.color === color && <HublyCheckIcon size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hubly-composer-pop">
        <button type="button" aria-expanded={popover === "workflow"} disabled={locked} onClick={() => setPopover(popover === "workflow" ? null : "workflow")}>
          <i style={{ background: workflowStatus?.color ?? "var(--ui-border-strong)" }} />
          <span>{workflowStatus?.name ?? "Sin estatus"}</span>
        </button>
        {popover === "workflow" && (
          <div className="hubly-composer-menu" role="group" aria-label="Estatus editorial">
            <button type="button" onClick={() => { update({ workflowStatusId: null }); setPopover(null); }}>Sin estatus</button>
            {workflow.map((w) => (
              <div key={w.id} className="hubly-composer-menurow">
                <button type="button" aria-pressed={draft.workflowStatusId === w.id} onClick={() => { update({ workflowStatusId: w.id }); setPopover(null); }}>
                  <i style={{ background: w.color }} /> {w.name}
                </button>
                <button type="button" aria-label={`Eliminar el estatus ${w.name}`} title="Eliminar" onClick={() => void removeWorkflowStatus(w)}><X size={12} /></button>
              </div>
            ))}
            {newStatus ? (
              <form className="hubly-composer-newstatus" onSubmit={(e) => { e.preventDefault(); addWorkflowStatus(); }}>
                <input className="hubly-cal-input" autoFocus value={newStatus.name} onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })} placeholder="Nombre del estatus" aria-label="Nombre del estatus" />
                <div role="group" aria-label="Color del estatus">
                  {POST_PALETTE.map(({ name, color }) => (
                    <button key={color} type="button" title={name} aria-label={name} aria-pressed={newStatus.color === color} style={{ background: color }} onClick={() => setNewStatus({ ...newStatus, color })} />
                  ))}
                </div>
                <button type="submit" className="is-create" disabled={!newStatus.name.trim()}>Crear</button>
              </form>
            ) : (
              <button type="button" className="is-create" onClick={() => setNewStatus({ name: "", color: POST_PALETTE[0].color })}><Plus size={13} /> Agregar estatus</button>
            )}
          </div>
        )}
      </div>
      {fields.map((field) => {
        const value = draft.customFields[field.id];
        const set = (next: string | number | boolean | null) => update({ customFields: { ...draft.customFields, [field.id]: next } });
        return (
          <label key={field.id} className="hubly-composer-field">
            <small>{field.name}</small>
            {!locked && <button type="button" className="hubly-composer-fielddel" aria-label={`Eliminar el campo ${field.name}`} title="Eliminar campo" onClick={(e) => { e.preventDefault(); void removeField(field); }}><X size={11} /></button>}
            {field.type === "checkbox" ? (
              <input type="checkbox" disabled={locked} checked={value === true} onChange={(e) => set(e.target.checked)} />
            ) : field.type === "select" ? (
              <select
                disabled={locked}
                value={String(value ?? "")}
                onChange={(e) => {
                  if (e.target.value === "__nueva") void addFieldOption(field);
                  else set(e.target.value || null);
                }}
              >
                <option value="">Vacío</option>
                {field.options?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                <option value="__nueva">+ Nueva opción</option>
              </select>
            ) : (
              <input
                disabled={locked}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
                value={String(value ?? "")}
                onChange={(e) => set(field.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
              />
            )}
          </label>
        );
      })}
      <div className="hubly-composer-pop">
        <button type="button" aria-label="Agregar campo" title="Agregar campo" aria-expanded={popover === "field"} disabled={locked} onClick={() => setPopover(popover === "field" ? null : "field")}>
          <Plus size={14} />
        </button>
        {popover === "field" && (
          <form className="hubly-composer-menu" onSubmit={(e) => { e.preventDefault(); addField(); }}>
            <input className="hubly-cal-input" autoFocus value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Nombre del campo" aria-label="Nombre del campo" />
            <select className="hubly-cal-input" value={fieldType} aria-label="Tipo de campo" onChange={(e) => setFieldType(e.target.value as CustomFieldDefinition["type"])}>
              {FIELD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button type="submit" className="is-create">Agregar campo</button>
          </form>
        )}
      </div>
    </div>
  );
}
