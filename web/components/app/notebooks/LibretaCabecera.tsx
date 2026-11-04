"use client";

import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import {
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyNotebookIcon as BookOpen,
} from "@/components/app/icons/DuotoneIcons";

interface LibretaCabeceraProps {
  titleId: string;
  title: string;
  category: string;
  isCreatingNew: boolean;
  savedNotice: boolean;
  colorSpec: { bg: string; spine: string };
  onClose: () => void;
}

export function LibretaCabecera({
  titleId,
  title,
  category,
  isCreatingNew,
  savedNotice,
  colorSpec,
  onClose,
}: LibretaCabeceraProps) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 14,
          background: colorSpec.spine,
          zIndex: 2,
        }}
      />

      <div
        style={{
          padding: "16px 22px 14px 32px",
          background: "#F4E9D8",
          borderBottom: "1px solid #DFCBB0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: colorSpec.bg,
              color: "var(--on-accent)",
              display: "grid",
              placeItems: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            <BookOpen size={17} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background: "#E8D5B7",
                  color: "#3A2210",
                }}
              >
                {category || "LIBRETA KRAFT"}
              </span>
              {savedNotice && (
                <span
                  role="status"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-success-text)",
                    background: "var(--ui-success-soft)",
                    padding: "2px 8px",
                    borderRadius: 9999,
                  }}
                >
                  <Check size={11} /> Guardado en Mi espacio
                </span>
              )}
            </div>
            <h2
              id={titleId}
              style={{
                margin: "3px 0 0",
                fontSize: 16,
                fontWeight: 800,
                color: "#2C1A0B",
              }}
            >
              {isCreatingNew
                ? "Nueva libreta Kraft"
                : title || "Lector de Libretas Kraft"}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HublyCatAvatar size={26} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar lector de libreta"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              border: "1px solid #D6C2A5",
              background: "#FAF5EC",
              color: "#5C3D22",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
