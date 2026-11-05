"use client";

import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyNotebookIcon as BookOpen,
} from "@/components/app/icons/DuotoneIcons";
import { resolveNotebookColorSpec } from "@/lib/domain/notebooks";

interface LibretaCabeceraProps {
  titleId: string;
  title: string;
  category: string;
  accentColor: string;
  isCreatingNew: boolean;
  savedNotice: boolean;
  onClose: () => void;
}

export function LibretaCabecera({
  titleId,
  title,
  category,
  accentColor,
  isCreatingNew,
  savedNotice,
  onClose,
}: LibretaCabeceraProps) {
  const colorSpec = resolveNotebookColorSpec(accentColor);

  return (
    <>
      <div
        aria-hidden="true"
        className="hubly-notebooks-spine"
        style={{ background: colorSpec.spine }}
      />

      <div className="hubly-notebooks-header">
        <div className="hubly-notebooks-header-left">
          <div
            className="hubly-notebooks-header-icon"
            style={{ background: colorSpec.bg }}
          >
            <BookOpen size={17} />
          </div>
          <div>
            <div className="hubly-notebooks-badges">
              <span className="hubly-notebooks-category-badge">
                {category || "LIBRETA KRAFT"}
              </span>
              {savedNotice && (
                <span role="status" className="hubly-notebooks-saved-badge">
                  <Check size={11} /> Guardado en Mi espacio
                </span>
              )}
            </div>
            <h2 id={titleId} className="hubly-notebooks-title">
              {isCreatingNew
                ? "Nueva libreta Kraft"
                : title || "Lector de Libretas Kraft"}
            </h2>
          </div>
        </div>

        <div className="hubly-notebooks-header-right">
          <HublyCatAvatar size={26} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar lector de libreta"
            className="hubly-notebooks-close"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
