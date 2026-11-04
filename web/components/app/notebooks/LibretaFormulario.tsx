"use client";

import React, { type RefObject } from "react";
import type { BrandWorkspace } from "@/lib/types";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { NOTEBOOK_COLORS } from "./useNotebookReaderModal";

export interface NotebookFormValues {
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
      style={{
        padding: "18px 22px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            background: "var(--ui-danger-soft)",
            border: "1px solid var(--ui-danger-border)",
            color: "var(--ui-danger-text)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 10,
        }}
      >
        <div>
          <label
            htmlFor="nb-title-input"
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#5C3D22",
              marginBottom: 4,
            }}
          >
            Título de la libreta *
          </label>
          <input
            ref={titleInputRef}
            id="nb-title-input"
            type="text"
            value={values.title}
            onChange={(e) => onChangeField({ title: e.target.value })}
            placeholder="Ej. Guía de onboarding y tono de marca"
            style={{
              width: "100%",
              height: 36,
              padding: "0 11px",
              borderRadius: 9,
              border: "1px solid #D6C2A5",
              background: "var(--ui-surface)",
              fontSize: 13.5,
              fontWeight: 700,
              color: "#2C1A0B",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="nb-brand-select"
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#5C3D22",
              marginBottom: 4,
            }}
          >
            Marca vinculada
          </label>
          <select
            id="nb-brand-select"
            value={values.brandId}
            onChange={(e) => onChangeField({ brandId: e.target.value })}
            style={{
              width: "100%",
              height: 36,
              padding: "0 10px",
              borderRadius: 9,
              border: "1px solid #D6C2A5",
              background: "var(--ui-surface)",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#2C1A0B",
            }}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.handle})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px",
          gap: 10,
        }}
      >
        <div>
          <label
            htmlFor="nb-subtitle-input"
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#5C3D22",
              marginBottom: 4,
            }}
          >
            Subtítulo / Resumen
          </label>
          <input
            id="nb-subtitle-input"
            type="text"
            value={values.subtitle}
            onChange={(e) => onChangeField({ subtitle: e.target.value })}
            placeholder="Resumen corto para la portada Kraft"
            style={{
              width: "100%",
              height: 34,
              padding: "0 10px",
              borderRadius: 9,
              border: "1px solid #D6C2A5",
              background: "var(--ui-surface)",
              fontSize: 12.5,
              color: "#2C1A0B",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="nb-badge-input"
            style={{
              display: "block",
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#5C3D22",
              marginBottom: 4,
            }}
          >
            Etiqueta
          </label>
          <input
            id="nb-badge-input"
            type="text"
            value={values.category}
            onChange={(e) => onChangeField({ category: e.target.value })}
            style={{
              width: "100%",
              height: 34,
              padding: "0 10px",
              borderRadius: 9,
              border: "1px solid #D6C2A5",
              background: "var(--ui-surface)",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#2C1A0B",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#5C3D22",
          }}
        >
          Cubierta del cuaderno:
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {NOTEBOOK_COLORS.map((c) => {
            const active = values.accentColor === c.bg;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChangeField({ accentColor: c.bg })}
                aria-pressed={active}
                aria-label={c.label}
                style={{
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: active
                    ? "1.5px solid #2C1A0B"
                    : "1px solid #D6C2A5",
                  background: active ? c.bg : "var(--ui-surface)",
                  color: active ? "#FFFFFF" : "#3A2210",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <span
          style={{
            display: "block",
            fontSize: 10.5,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#5C3D22",
            marginBottom: 4,
          }}
        >
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
