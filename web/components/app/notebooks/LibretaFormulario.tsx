"use client";

import React, { type RefObject } from "react";
import type { BrandWorkspace } from "@/lib/types";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { NOTEBOOK_COLORS } from "@/lib/domain/notebooks";

interface NotebookFormValues {
  title: string;
  subtitle: string;
  category: string;
  brandId: string;
  accentColor: string;
  editorKey: string;
  initialContent: string;
}

interface LibretaFormularioProps {
  values: NotebookFormValues;
  brands: BrandWorkspace[];
  errorMsg: string | null;
  titleInputRef: RefObject<HTMLInputElement | null>;
  onChangeField: (patch: Partial<NotebookFormValues>) => void;
  onContentChange: (html: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LibretaFormulario({
  values,
  brands,
  errorMsg,
  titleInputRef,
  onChangeField,
  onContentChange,
  onSubmit,
}: LibretaFormularioProps) {
  return (
    <form
      id="notebook-reader-form"
      onSubmit={onSubmit}
      className="hubly-notebooks-form"
    >
      {errorMsg && (
        <div role="alert" className="hubly-notebooks-alert">
          {errorMsg}
        </div>
      )}

      <div className="hubly-notebooks-row-primary">
        <div>
          <label htmlFor="nb-title-input" className="hubly-notebooks-label">
            Título de la libreta *
          </label>
          <input
            ref={titleInputRef}
            autoFocus
            id="nb-title-input"
            type="text"
            value={values.title}
            onChange={(e) => onChangeField({ title: e.target.value })}
            placeholder="Ej. Guía de onboarding y tono de marca"
            className="hubly-notebooks-input-title"
          />
        </div>

        <div>
          <label htmlFor="nb-brand-select" className="hubly-notebooks-label">
            Marca vinculada
          </label>
          <select
            id="nb-brand-select"
            value={values.brandId}
            onChange={(e) => onChangeField({ brandId: e.target.value })}
            className="hubly-notebooks-select"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.handle})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hubly-notebooks-row-secondary">
        <div>
          <label htmlFor="nb-subtitle-input" className="hubly-notebooks-label">
            Subtítulo / Resumen
          </label>
          <input
            id="nb-subtitle-input"
            type="text"
            value={values.subtitle}
            onChange={(e) => onChangeField({ subtitle: e.target.value })}
            placeholder="Resumen corto para la portada Kraft"
            className="hubly-notebooks-input-sub"
          />
        </div>

        <div>
          <label htmlFor="nb-badge-input" className="hubly-notebooks-label">
            Etiqueta
          </label>
          <input
            id="nb-badge-input"
            type="text"
            value={values.category}
            onChange={(e) => onChangeField({ category: e.target.value })}
            className="hubly-notebooks-input-badge"
          />
        </div>
      </div>

      <div className="hubly-notebooks-cover-row">
        <span className="hubly-notebooks-cover-label">
          Cubierta del cuaderno:
        </span>
        <div className="hubly-notebooks-cover-options">
          {NOTEBOOK_COLORS.map((c) => {
            const active = values.accentColor === c.bg;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChangeField({ accentColor: c.bg })}
                aria-pressed={active}
                aria-label={c.label}
                className="hubly-notebooks-cover-btn"
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hubly-notebooks-editor-wrap">
        <span className="hubly-notebooks-label">
          Contenido y notas operativas *
        </span>
        <NotebookEditor
          key={values.editorKey}
          initialContent={values.initialContent}
          onChange={onContentChange}
        />
      </div>
    </form>
  );
}
