"use client";

import React from "react";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";

export type KraftNotebookVariant = "post" | "report" | "space" | "brand";

export interface KraftNotebookCardProps {
  title: string;
  stamp: string;
  variant?: KraftNotebookVariant;
  subtitle?: string;
  category?: string;
  isPinned?: boolean;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

function HublyCatMedallion({
  variant = "post",
  accentColor,
}: {
  variant?: KraftNotebookVariant;
  accentColor?: string;
}) {
  const badgeColor = accentColor || "var(--hb-accent)";

  return (
    <span
      style={{
        position: "relative",
        width: 48,
        height: 48,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FDF8EE", // ui-ok: ilustración de libreta kraft
      }}
    >
      <HublyCatAvatar
        size={46}
        bordered={false}
        rounded="full"
        alt="Hubi"
        style={{
          background: "#FDF8EE", // ui-ok: ilustración de libreta kraft
        }}
      />
      {variant === "report" && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: badgeColor,
            border: "1.5px solid #FDF8EE", // ui-ok: ilustración de libreta kraft
            color: "var(--on-accent)",
            fontSize: 10,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      )}
    </span>
  );
}

export function KraftNotebookCard({
  title,
  stamp,
  variant = "post",
  subtitle,
  isPinned,
  accentColor,
  onClick,
  className = "",
}: KraftNotebookCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={subtitle ? `${title} — ${subtitle}` : title}
      className={`hubly-kraft ${className}`.trim()}
      style={{
        position: "relative",
        width: "100%",
        height: 204,
        borderRadius: "4px 14px 14px 4px",
        border: "1px solid #8C653A", // ui-ok: ilustración de libreta kraft
        background:
          "radial-gradient(circle at 30% 22%, rgba(255,245,225,0.16) 0%, transparent 55%), linear-gradient(160deg, #B99260 0%, #A88050 52%, #976F40 100%)", // ui-ok: ilustración de libreta kraft
        boxShadow:
          "0 4px 0 #EFECE6, 0 5px 0 #C5B49E, 0 8px 16px rgba(45, 28, 12, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.32), inset -1px -2px 5px rgba(58, 35, 14, 0.25)", // ui-ok: ilustración de libreta kraft
        padding: "20px 12px 15px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle Kraft paper noise overlay */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(60, 35, 12, 0.08) 1px, transparent 0), radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 0)", // ui-ok: ilustración de libreta kraft
          backgroundSize: "12px 12px, 18px 18px",
          backgroundPosition: "0 0, 6px 6px",
          pointerEvents: "none",
        }}
      />

      {/* Left Spine Crease Groove */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 11,
          width: 2,
          background: "linear-gradient(90deg, rgba(48,28,10,0.28) 0%, rgba(255,255,255,0.16) 100%)", // ui-ok: ilustración de libreta kraft
          pointerEvents: "none",
        }}
      />

      {/* Vertical Stitched Thread Dashed Line along left spine */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 6,
          bottom: 6,
          left: 5.5,
          borderLeft: "1.5px dashed rgba(255, 248, 235, 0.55)", // ui-ok: ilustración de libreta kraft
          pointerEvents: "none",
        }}
      />

      {/* Optional top-right bookmark ribbon when pinned */}
      {isPinned && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 12,
            width: 8,
            height: 16,
            background: accentColor || "var(--hb-accent-hover)",
            borderRadius: "0 0 3px 3px",
            boxShadow: "0 1px 2px rgba(44, 26, 11, 0.25)", // ui-ok: ilustración de libreta kraft
            pointerEvents: "none",
          }}
        />
      )}

      {/* Top Bold Dark-Brown Title */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 10.5,
          fontWeight: 700,
          lineHeight: 1.22,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "#2C1A0B", // ui-ok: ilustración de libreta kraft
          textShadow: "0 1px 0 rgba(255,255,255,0.18)", // ui-ok: ilustración de libreta kraft
          maxWidth: 112,
          minHeight: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {title}
      </span>

      {/* Center Circular Medallion */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#FDF8EE", // ui-ok: ilustración de libreta kraft
          border: "2.5px solid #8B572A", // ui-ok: ilustración de libreta kraft
          boxShadow:
            "0 2px 6px rgba(44, 26, 11, 0.26), inset 0 0 0 2px #DFC39D", // ui-ok: ilustración de libreta kraft
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <HublyCatMedallion variant={variant} accentColor={accentColor} />
      </span>

      {/* Bottom Stamp */}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontVariantNumeric: "tabular-nums",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(44, 26, 11, 0.68)", // ui-ok: ilustración de libreta kraft
        }}
      >
        {stamp}
      </span>
    </button>
  );
}
