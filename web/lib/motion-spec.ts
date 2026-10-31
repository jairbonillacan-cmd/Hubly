"use client";

import { useEffect, useState, type CSSProperties } from "react";

/* ==========================================================================
   1. TOLERANCE & SAMPLING CONSTANTS (SECTION 3.D & SECTION 5 QA CONTRACT)
   ========================================================================== */

export const MOTION_TOLERANCE = {
  /** 1 frame at 60fps in milliseconds (1000 / 60) */
  MIN_FRAME_MS: 16.67,
  /** 5% relative duration tolerance for animations > 333.4ms */
  DURATION_RATIO: 0.05,
  /** Maximum permitted Mean Absolute Error (MAE <= 1%) across t = 0%, 25%, 50%, 75%, 100% */
  MAX_NORMALIZED_MAE: 0.01,
  /** Maximum permitted spatial transition duration (ms) when prefers-reduced-motion: reduce is active */
  REDUCED_MOTION_MAX_MS: 1,
  /** Nominal CSS duration (ms) applied under prefers-reduced-motion: reduce (.01ms in 04a360cf13b862b2.css) */
  REDUCED_MOTION_NOMINAL_MS: 0.01,
  /** Canonical normalized sampling instants (0%, 25%, 50%, 75%, 100%) */
  SAMPLE_POINTS: [0, 0.25, 0.5, 0.75, 1] as const,
} as const;

export type NormalizedSamplePoint = (typeof MOTION_TOLERANCE.SAMPLE_POINTS)[number];
export type CubicBezierTuple = readonly [number, number, number, number];
export type QuartileSampleTuple = readonly [number, number, number, number, number];

/* ==========================================================================
   2. TYPED DURATIONS & DELAYS (MILLISECONDS)
   ========================================================================== */

export const MOTION_DURATIONS = {
  REDUCED_MOTION_MS: 0.01,
  HBTN_PRESS_MS: 90,
  HBTN_RELEASE_MS: 90,
  KRAFT_NOTEBOOK_ACTIVE_MS: 90,
  DROPDOWN_OUT_MS: 100,
  CMDK_ROW_HIGHLIGHT_MS: 100,
  DROPDOWN_IN_MS: 120,
  SIDEBAR_LABEL_OUT_MS: 120,
  CHECK_TOGGLE_MS: 130,
  SIDEBAR_LABEL_IN_MS: 140,
  SIDEBAR_COLLAPSE_BTN_MS: 140,
  HBTN_HOVER_MS: 150,
  SUBNAV_PILL_MS: 150,
  MODAL_BACKDROP_IN_MS: 150,
  MODAL_BACKDROP_OUT_MS: 150,
  MODAL_CARD_OUT_MS: 150,
  DESCUBRE_WIDGET_OUT_MS: 150,
  DESCUBRE_CARET_MS: 150,
  ROW_HOVER_MS: 150,
  DROPDOWN_KEYFRAME_IN_MS: 150,
  SUBNAV_PANEL_IN_MS: 160,
  AI_DRAWER_OUT_MS: 160,
  AI_FAB_HOVER_MS: 160,
  KRAFT_NOTEBOOK_HOVER_MS: 160,
  MODAL_CARD_IN_MS: 180,
  DESCUBRE_WIDGET_IN_MS: 180,
  SIDEBAR_DESKTOP_MS: 200,
  SIDEBAR_MOBILE_OUT_MS: 200,
  AI_DRAWER_IN_MS: 200,
  CARD_HOVER_MS: 200,
  PROGRESS_BAR_MS: 200,
  SIDEBAR_MOBILE_IN_MS: 220,
  TABLERO_MODAL_MS: 220,
  MOBILE_ROW_APPEAR_MS: 240,
  AI_MSG_IN_MS: 280,
  CM_TILE_IN_MS: 280,
  MOBILE_BOTTOM_SHEET_MS: 320,
  AI_USER_MSG_IN_MS: 340,
  CELEBRATION_BADGE_MS: 460,
  WIZARD_MASCOT_JUMP_MS: 650,
  HBTN_SPIN_MS: 700,
  TYPING_DOT_MS: 1200,
  AI_THINKING_PULSE_MS: 1500,
} as const;

export const MOTION_DELAYS = {
  NONE_MS: 0,
  MOBILE_BOTTOM_SHEET_MS: 34,
  SIDEBAR_LABEL_IN_MS: 60,
} as const;

/* ==========================================================================
   3. CUBIC-BEZIER CURVES & NORMALIZED SAMPLES (t = 0%, 25%, 50%, 75%, 100%)
   ========================================================================== */

export interface MotionCurveDefinition {
  readonly id: string;
  readonly css: string;
  readonly tuple: CubicBezierTuple;
  readonly samples: QuartileSampleTuple;
  readonly sampleMap: Readonly<Record<"0" | "0.25" | "0.5" | "0.75" | "1", number>>;
}

export const MOTION_EASINGS = {
  /** Core & Material standard curve — .hbtn (90ms), Sidebar (200ms), Subnav (150ms/160ms), KraftNotebookCard (160ms), .hq-card-i (200ms) */
  STANDARD: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Spring-like fast out curve — Modal card enter (180ms), AI Drawer enter (200ms), Descubre Widget enter (180ms), Dropdown open (120ms) */
  SPRING_OUT: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Deceleration curve — Backdrop fade-in (150ms), .tablero-fondo (200ms), .hg-velo-anclado */
  EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
  /** Acceleration exit curve — Modal exit (150ms), Mobile drawer exit (200ms), Dropdown close (100ms) */
  EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
  /** Default CSS ease — .hbtn color/background hover (150ms), CommandPalette row highlight (100ms) */
  CSS_EASE: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  /** iOS drawer & message sheet curve — Mobile sidebar drawer in (220ms), .hg-msg-sube (340ms) */
  IOS_SHEET: "cubic-bezier(0.32, 0.72, 0, 1)",
  /** Mobile bottom sheet curve — @keyframes hg-hoja-sube (320ms + 34ms delay) */
  BOTTOM_SHEET: "cubic-bezier(0.33, 1, 0.68, 1)",
  /** Snappy message & mobile row entrance — .hg-msg-llega (280ms), .hg-aparece (240ms) */
  SNAP_OUT: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** Quintic out — Video modal (220ms), .lp-rise (700ms), .lp-pop (600ms) */
  QUINT_OUT: "cubic-bezier(0.23, 1, 0.32, 1)",
  /** Mascot wizard jump — NewBrandModal mascot (650ms) */
  MASCOT_JUMP: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Constant velocity — .hbtn-spin (700ms), video progress bar */
  LINEAR: "cubic-bezier(0, 0, 1, 1)",
} as const;

export const MOTION_CURVES: Readonly<Record<keyof typeof MOTION_EASINGS, MotionCurveDefinition>> = {
  STANDARD: {
    id: "STANDARD",
    css: MOTION_EASINGS.STANDARD,
    tuple: [0.4, 0, 0.2, 1],
    samples: [0.0, 0.2366, 0.7756, 0.9594, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.2366, "0.5": 0.7756, "0.75": 0.9594, "1": 1.0 },
  },
  SPRING_OUT: {
    id: "SPRING_OUT",
    css: MOTION_EASINGS.SPRING_OUT,
    tuple: [0.16, 1, 0.3, 1],
    samples: [0.0, 0.8256, 0.9718, 0.9977, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.8256, "0.5": 0.9718, "0.75": 0.9977, "1": 1.0 },
  },
  EASE_OUT: {
    id: "EASE_OUT",
    css: MOTION_EASINGS.EASE_OUT,
    tuple: [0, 0, 0.2, 1],
    samples: [0.0, 0.5776, 0.8392, 0.9642, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.5776, "0.5": 0.8392, "0.75": 0.9642, "1": 1.0 },
  },
  EASE_IN: {
    id: "EASE_IN",
    css: MOTION_EASINGS.EASE_IN,
    tuple: [0.4, 0, 1, 1],
    samples: [0.0, 0.0986, 0.3248, 0.6301, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.0986, "0.5": 0.3248, "0.75": 0.6301, "1": 1.0 },
  },
  CSS_EASE: {
    id: "CSS_EASE",
    css: MOTION_EASINGS.CSS_EASE,
    tuple: [0.25, 0.1, 0.25, 1],
    samples: [0.0, 0.4085, 0.8024, 0.9605, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.4085, "0.5": 0.8024, "0.75": 0.9605, "1": 1.0 },
  },
  IOS_SHEET: {
    id: "IOS_SHEET",
    css: MOTION_EASINGS.IOS_SHEET,
    tuple: [0.32, 0.72, 0, 1],
    samples: [0.0, 0.7791, 0.9548, 0.9923, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.7791, "0.5": 0.9548, "0.75": 0.9923, "1": 1.0 },
  },
  BOTTOM_SHEET: {
    id: "BOTTOM_SHEET",
    css: MOTION_EASINGS.BOTTOM_SHEET,
    tuple: [0.33, 1, 0.68, 1],
    samples: [0.0, 0.5773, 0.8722, 0.9834, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.5773, "0.5": 0.8722, "0.75": 0.9834, "1": 1.0 },
  },
  SNAP_OUT: {
    id: "SNAP_OUT",
    css: MOTION_EASINGS.SNAP_OUT,
    tuple: [0.2, 0.8, 0.2, 1],
    samples: [0.0, 0.7673, 0.9461, 0.9911, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.7673, "0.5": 0.9461, "0.75": 0.9911, "1": 1.0 },
  },
  QUINT_OUT: {
    id: "QUINT_OUT",
    css: MOTION_EASINGS.QUINT_OUT,
    tuple: [0.23, 1, 0.32, 1],
    samples: [0.0, 0.7754, 0.966, 0.9974, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.7754, "0.5": 0.966, "0.75": 0.9974, "1": 1.0 },
  },
  MASCOT_JUMP: {
    id: "MASCOT_JUMP",
    css: MOTION_EASINGS.MASCOT_JUMP,
    tuple: [0.22, 1, 0.36, 1],
    samples: [0.0, 0.7649, 0.9614, 0.9969, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.7649, "0.5": 0.9614, "0.75": 0.9969, "1": 1.0 },
  },
  LINEAR: {
    id: "LINEAR",
    css: MOTION_EASINGS.LINEAR,
    tuple: [0, 0, 1, 1],
    samples: [0.0, 0.25, 0.5, 0.75, 1.0],
    sampleMap: { "0": 0.0, "0.25": 0.25, "0.5": 0.5, "0.75": 0.75, "1": 1.0 },
  },
} as const;

/* ==========================================================================
   4. CSS UTILITY CLASSES FROM REFERENCE BUNDLES
   ========================================================================== */

export const MOTION_CLASSES = {
  HBTN: "hbtn",
  HBTN_PRIMARY: "hbtn hbtn-primary",
  HBTN_SECONDARY: "hbtn hbtn-secondary",
  HBTN_HB: "hbtn hbtn-hb",
  HBTN_DANGER: "hbtn hbtn-danger",
  HBTN_GHOST: "hbtn hbtn-ghost",
  HBTN_LG: "hbtn-lg",
  HBTN_SM: "hbtn-sm",
  HBTN_XS: "hbtn-xs",
  HBTN_SPIN: "hbtn-spin",
  SIDEBAR: "hb-sidebar",
  SIDEBAR_COLLAPSED: "hb-sidebar is-collapsed",
  SIDEBAR_COLLAPSE_BTN: "hb-sidebar-collapse-btn",
  SUBNAV_BAR: "hb-pill-tabs",
  SUBNAV_TAB: "hb-pill-tab",
  SUBNAV_PANEL_ENTER: "tablero-aparece",
  MODAL_BACKDROP: "saas-modal-backdrop",
  MODAL_CARD: "saas-modal",
  TABLERO_FONDO: "tablero-fondo",
  TABLERO_MODAL: "tablero-modal",
  TABLERO_TARJETA: "tablero-tarjeta",
  HQ_CARD: "hq-card",
  HQ_CARD_INTERACTIVE: "hq-card hq-card-i",
  HQ_SOFT_INTERACTIVE: "hq-soft hq-soft-i",
  HG_PRESS: "hg-press",
  HG_ROW: "hg-row",
  HG_VELO_ANCLADO: "hg-velo-anclado",
  HG_HB_PIENSA: "hg-hb-piensa",
  HG_MSG_LLEGA: "hg-msg-llega",
  HG_MSG_SUBE: "hg-msg-sube",
  CM_TILE_IN: "cm-tile-in",
  DROPDOWN_IN: "hubly-dropdown",
  MOTION_REDUCE_NONE: "motion-reduce:transition-none",
} as const;

/* ==========================================================================
   5. MASTER SPECIFICATION CATALOG (M1 – M7)
   ========================================================================== */

export type MotionSpecId =
  | "M1.hbtn-hover"
  | "M1.hbtn-press"
  | "M2.sidebar-desktop"
  | "M2.sidebar-mobile-drawer"
  | "M2.sidebar-mobile-backdrop"
  | "M3.subnav-pill"
  | "M3.subnav-panel"
  | "M4.modal-backdrop"
  | "M4.modal-card"
  | "M5.ai-drawer"
  | "M5.ai-fab"
  | "M5.descubre-widget"
  | "M6.kraft-notebook"
  | "M6.interactive-row"
  | "M7.dropdown-menu";

export type ModalSurfaceId =
  | "nuevo-post"
  | "nueva-marca"
  | "invitar-equipo"
  | "buscar-cmdk"
  | "configurar-widgets"
  | "sugerencias-automaticas"
  | "lector-libreta";

export type DropdownSurfaceId = "selector-marca" | "filtro-periodo" | "ordenar";

export interface MotionPhaseSpec {
  readonly durationMs: number;
  readonly delayMs: number;
  readonly easing: string;
  readonly bezierTuple: CubicBezierTuple;
  readonly normalizedCurveSamples: QuartileSampleTuple;
  readonly from: Readonly<Record<string, string | number>>;
  readonly to: Readonly<Record<string, string | number>>;
  readonly interpolatedValuesAtQuartiles?: Readonly<Record<string, readonly (string | number)[]>>;
}

export interface MotionInteractionSpec {
  readonly id: MotionSpecId;
  readonly group: "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7";
  readonly title: string;
  readonly selector: string;
  readonly trigger: string;
  readonly animatedProperties: readonly string[];
  readonly transformOrigin: string;
  readonly enter: MotionPhaseSpec;
  readonly exit: MotionPhaseSpec;
  readonly interruptionBehavior: string;
  readonly viewportVariants: {
    readonly desktop1440: string;
    readonly tablet768: string;
    readonly mobile375: string;
  };
  readonly reducedMotion: {
    readonly durationMs: number;
    readonly cssOverride: string;
    readonly functionalAlternative: string;
  };
}

export const MOTION_SPEC: Readonly<Record<MotionSpecId, MotionInteractionSpec>> = {
  "M1.hbtn-hover": {
    id: "M1.hbtn-hover",
    group: "M1",
    title: "Botón táctil 3D (.hbtn) — Hover de superficie y texto",
    selector: ".hbtn:not(:disabled)",
    trigger: "mouseenter / mouseleave / focus-visible",
    animatedProperties: ["background-color", "color", "border-color"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.HBTN_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.CSS_EASE,
      bezierTuple: MOTION_CURVES.CSS_EASE.tuple,
      normalizedCurveSamples: MOTION_CURVES.CSS_EASE.samples,
      from: { backgroundColor: "#FFFFFF", color: "#42505E" },
      to: { backgroundColor: "#F8FAFC", color: "#111C27" },
    },
    exit: {
      durationMs: MOTION_DURATIONS.HBTN_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.CSS_EASE,
      bezierTuple: MOTION_CURVES.CSS_EASE.tuple,
      normalizedCurveSamples: MOTION_CURVES.CSS_EASE.samples,
      from: { backgroundColor: "#F8FAFC", color: "#111C27" },
      to: { backgroundColor: "#FFFFFF", color: "#42505E" },
    },
    interruptionBehavior:
      "Si el puntero abandona el botón antes de 150ms, la transición CSS revierte desde el color RGB interpolado actual de regreso al color base sin salto.",
    viewportVariants: {
      desktop1440: "Hover activo en puntero fino (height: 36px–38px).",
      tablet768: "Hover activo con puntero; tap directo en pantalla táctil.",
      mobile375: "Sin hover persistente (-webkit-tap-highlight-color: transparent); min-height: 44px.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important;",
      functionalAlternative: "Cambio de color de fondo y texto inmediato en <= 1ms al entrar/salir con el puntero.",
    },
  },

  "M1.hbtn-press": {
    id: "M1.hbtn-press",
    group: "M1",
    title: "Botón táctil 3D (.hbtn) — Active Press, Release e Interrupción",
    selector: ".hbtn:active:not(:disabled)",
    trigger: "pointerdown (:active) / pointerup / pointerleave",
    animatedProperties: ["transform", "box-shadow"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.HBTN_PRESS_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        transform: "translateY(0px)",
        boxShadow: "0 4px 0 0 var(--hbtn-edge)",
      },
      to: {
        transform: "translateY(3px)",
        boxShadow: "0 1px 0 0 var(--hbtn-edge)",
      },
      interpolatedValuesAtQuartiles: {
        translateY_px: [0.0, 0.71, 2.33, 2.88, 3.0],
        boxShadowOffsetY_px: [4.0, 3.29, 1.67, 1.12, 1.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.HBTN_RELEASE_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        transform: "translateY(3px)",
        boxShadow: "0 1px 0 0 var(--hbtn-edge)",
      },
      to: {
        transform: "translateY(0px)",
        boxShadow: "0 4px 0 0 var(--hbtn-edge)",
      },
      interpolatedValuesAtQuartiles: {
        translateY_px: [3.0, 2.29, 0.67, 0.12, 0.0],
        boxShadowOffsetY_px: [1.0, 1.71, 3.33, 3.88, 4.0],
      },
    },
    interruptionBehavior:
      "Si el puntero sale del área del botón mientras está presionado (pointerleave), :active se retira en el acto y transform/box-shadow interpolan suavemente desde su posición actual en vuelo de regreso a translateY(0px) y 0 4px 0 0 en <= 90ms sin disparar click.",
    viewportVariants: {
      desktop1440: "Altura 36px (44px en .hbtn-lg, 24px en .hbtn-xs), hundimiento translateY(3px).",
      tablet768: "Misma física de hundimiento 3D en 90ms.",
      mobile375: "Target táctil min-height: 44px; conserva el hundimiento translateY(3px) en 90ms.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: ".hbtn, .hbtn-spin { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }",
      functionalAlternative: "Estado activo instantáneo (<= 1ms) sin barrido vertical intermedio.",
    },
  },

  "M2.sidebar-desktop": {
    id: "M2.sidebar-desktop",
    group: "M2",
    title: "Colapso y expansión del Sidebar en Escritorio y Tablet",
    selector: ".hb-sidebar",
    trigger: "Click en botón circular .hb-sidebar-collapse-btn (Colapsar / Expandir menú)",
    animatedProperties: ["width", "min-width", "padding", "opacity"],
    transformOrigin: "0% 50%",
    enter: {
      // Collapse: 256px -> 68px
      durationMs: MOTION_DURATIONS.SIDEBAR_DESKTOP_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: { width: "256px", minWidth: "256px", labelOpacity: 1 },
      to: { width: "68px", minWidth: "68px", labelOpacity: 0 },
      interpolatedValuesAtQuartiles: {
        width_px: [256.0, 211.52, 110.19, 75.63, 68.0],
        mainMarginLeft_px: [280.0, 235.52, 134.19, 99.63, 92.0],
      },
    },
    exit: {
      // Expand: 68px -> 256px (labels fade in with 60ms delay + 140ms duration)
      durationMs: MOTION_DURATIONS.SIDEBAR_DESKTOP_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: { width: "68px", minWidth: "68px", labelOpacity: 0 },
      to: { width: "256px", minWidth: "256px", labelOpacity: 1 },
      interpolatedValuesAtQuartiles: {
        width_px: [68.0, 112.48, 213.81, 248.37, 256.0],
        mainMarginLeft_px: [92.0, 136.48, 237.81, 272.37, 280.0],
      },
    },
    interruptionBehavior:
      "Al invertir el colapso/expansión a mitad de recorrido (ej. t = 100ms, width = 110.19px), la transición CSS de width/min-width invierte su dirección desde el ancho actual hacia el nuevo objetivo con cubic-bezier(0.4, 0, 0.2, 1).",
    viewportVariants: {
      desktop1440: "Sidebar flotante fijo (256px <-> 68px) que desplaza el contenedor principal (margin-left: 280px <-> 92px).",
      tablet768: "Misma transición 256px <-> 68px en 200ms.",
      mobile375: "Oculto en móvil; reemplazado por M2.sidebar-mobile-drawer.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important;",
      functionalAlternative: "Conmutación inmediata entre 256px y 68px y visibilidad de etiquetas en <= 1ms.",
    },
  },

  "M2.sidebar-mobile-drawer": {
    id: "M2.sidebar-mobile-drawer",
    group: "M2",
    title: "Drawer lateral móvil del Sidebar (375px)",
    selector: "[data-mobile-sidebar-drawer]",
    trigger: "Tap en botón de menú móvil / tap en backdrop / gesto swipe-left",
    animatedProperties: ["transform"],
    transformOrigin: "0% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.SIDEBAR_MOBILE_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.IOS_SHEET,
      bezierTuple: MOTION_CURVES.IOS_SHEET.tuple,
      normalizedCurveSamples: MOTION_CURVES.IOS_SHEET.samples,
      from: { transform: "translateX(-100%)" },
      to: { transform: "translateX(0%)" },
      interpolatedValuesAtQuartiles: {
        translateX_pct: [-100.0, -22.09, -4.52, -0.77, 0.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.SIDEBAR_MOBILE_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_IN,
      bezierTuple: MOTION_CURVES.EASE_IN.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_IN.samples,
      from: { transform: "translateX(0%)" },
      to: { transform: "translateX(-100%)" },
      interpolatedValuesAtQuartiles: {
        translateX_pct: [0.0, -9.86, -32.48, -63.01, -100.0],
      },
    },
    interruptionBehavior:
      "Si se toca el backdrop durante la apertura, el drawer revierte desde su translateX en vuelo hacia translateX(-100%) sin completar el recorrido.",
    viewportVariants: {
      desktop1440: "No aplica (usa M2.sidebar-desktop).",
      tablet768: "No aplica en modo escritorio; activo debajo de 768px.",
      mobile375: "Overlay fijo (width: min(280px, 84vw), z-index: 120) sincronizado con backdrop fade de 150ms.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important; animation: none !important;",
      functionalAlternative: "Aparición y ocultamiento instantáneos en translateX(0%) sin barrido lateral.",
    },
  },

  "M2.sidebar-mobile-backdrop": {
    id: "M2.sidebar-mobile-backdrop",
    group: "M2",
    title: "Backdrop del Drawer Móvil (.hg-velo-anclado)",
    selector: ".hg-velo-anclado",
    trigger: "Apertura y cierre del drawer móvil",
    animatedProperties: ["opacity"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.MODAL_BACKDROP_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_OUT,
      bezierTuple: MOTION_CURVES.EASE_OUT.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_OUT.samples,
      from: { opacity: 0 },
      to: { opacity: 1 },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.5776, 0.8392, 0.9642, 1.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.MODAL_BACKDROP_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_IN,
      bezierTuple: MOTION_CURVES.EASE_IN.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_IN.samples,
      from: { opacity: 1 },
      to: { opacity: 0 },
      interpolatedValuesAtQuartiles: {
        opacity: [1.0, 0.9014, 0.6752, 0.3699, 0.0],
      },
    },
    interruptionBehavior: "Reversión lineal/ease desde la opacidad actual hacia 0 al cancelar la apertura.",
    viewportVariants: {
      desktop1440: "No aplica.",
      tablet768: "No aplica.",
      mobile375: "Scrim fijo inset: 0 con blur(8px) (sin blur en html[data-gama-baja]).",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important; animation: none !important;",
      functionalAlternative: "Cambio inmediato entre opacity: 0 y opacity: 1.",
    },
  },

  "M3.subnav-pill": {
    id: "M3.subnav-pill",
    group: "M3",
    title: "Cambio de pestaña en Subnavegación (Inicio, Salud de Cuentas, Equipo) — Pill activo",
    selector: ".hb-pill-tab",
    trigger: "Click / Enter / Espacio en pestaña de subnavegación",
    animatedProperties: ["background-color", "color", "border-color", "box-shadow"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.SUBNAV_PILL_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        backgroundColor: "transparent",
        color: "#64748B",
        iconTint: "#94A3B8",
        boxShadow: "none",
      },
      to: {
        backgroundColor: "#FFFFFF",
        pillHighlightTint: "#F9B431",
        color: "#4F46E5",
        iconTint: "#F9B431",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.SUBNAV_PILL_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        backgroundColor: "#FFFFFF",
        pillHighlightTint: "#F9B431",
        color: "#4F46E5",
        iconTint: "#F9B431",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
      },
      to: {
        backgroundColor: "transparent",
        color: "#64748B",
        iconTint: "#94A3B8",
        boxShadow: "none",
      },
    },
    interruptionBehavior:
      "Si el usuario cambia rápidamente de pestaña antes de 150ms, el pill intermedio interpola desde su color/sombra actual de regreso a transparente mientras el nuevo pill inicia su transición a activo.",
    viewportVariants: {
      desktop1440: "Barra segmentada inline-flex (padding: 4px, border-radius: 9999px).",
      tablet768: "Misma geometría y tiempos (150ms).",
      mobile375: "Scroll horizontal sin barra (.hg-strip) con compresión táctil scale(0.97) al presionar.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important;",
      functionalAlternative: "Conmutación instantánea del fondo activo, sombra e icono #F9B431.",
    },
  },

  "M3.subnav-panel": {
    id: "M3.subnav-panel",
    group: "M3",
    title: "Cambio de pestaña en Subnavegación — Entrada del panel de vista (.tablero-aparece)",
    selector: ".tablero-aparece",
    trigger: "Cambio de estado activo entre Inicio, Salud de Cuentas y Equipo",
    animatedProperties: ["opacity", "transform"],
    transformOrigin: "50% 0%",
    enter: {
      durationMs: MOTION_DURATIONS.SUBNAV_PANEL_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        opacity: 0,
        transform: "translateY(4px) scale(0.985)",
      },
      to: {
        opacity: 1,
        transform: "translateY(0px) scale(1)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.2366, 0.7756, 0.9594, 1.0],
        translateY_px: [4.0, 3.05, 0.9, 0.16, 0.0],
        scale: [0.985, 0.9885, 0.9966, 0.9994, 1.0],
      },
    },
    exit: {
      durationMs: 0,
      delayMs: 0,
      easing: MOTION_EASINGS.LINEAR,
      bezierTuple: MOTION_CURVES.LINEAR.tuple,
      normalizedCurveSamples: MOTION_CURVES.LINEAR.samples,
      from: { opacity: 1, transform: "translateY(0px) scale(1)" },
      to: { opacity: 0, transform: "translateY(0px) scale(1)" },
    },
    interruptionBehavior:
      "Al cambiar de pestaña a mitad de la entrada, el panel anterior se desmonta inmediatamente y el nuevo panel ejecuta tablero-aparece desde t = 0ms sin solapamiento de layout.",
    viewportVariants: {
      desktop1440: "transform-origin: top center (50% 0%), 160ms.",
      tablet768: "transform-origin: top center (50% 0%), 160ms.",
      mobile375: "transform-origin: top center (50% 0%), 160ms.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: ".tablero-aparece { animation: none !important; opacity: 1 !important; transform: none !important; }",
      functionalAlternative: "El panel de la pestaña seleccionada se muestra inmediatamente con opacity: 1 y transform: none.",
    },
  },

  "M4.modal-backdrop": {
    id: "M4.modal-backdrop",
    group: "M4",
    title: "Backdrop de Modales (Nuevo post, Nueva marca, Invitar equipo, Buscar ⌘K, Configurar widgets, Sugerencias automáticas, Lector de libreta)",
    selector: ".saas-modal-backdrop, .tablero-fondo",
    trigger: "Apertura y cierre de cualquiera de los 7 modales del sistema",
    animatedProperties: ["opacity"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.MODAL_BACKDROP_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_OUT,
      bezierTuple: MOTION_CURVES.EASE_OUT.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_OUT.samples,
      from: { opacity: 0 },
      to: { opacity: 1 },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.5776, 0.8392, 0.9642, 1.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.MODAL_BACKDROP_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_IN,
      bezierTuple: MOTION_CURVES.EASE_IN.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_IN.samples,
      from: { opacity: 1 },
      to: { opacity: 0 },
      interpolatedValuesAtQuartiles: {
        opacity: [1.0, 0.9014, 0.6752, 0.3699, 0.0],
      },
    },
    interruptionBehavior:
      "Si el usuario presiona Escape o hace click en el backdrop antes de los 150ms, la transición de opacidad se invierte desde el valor actual hacia 0 sin parpadeo.",
    viewportVariants: {
      desktop1440: "Scrim rgba(15, 23, 42, 0.36) con backdrop-filter: blur(4px–6px).",
      tablet768: "Scrim rgba(15, 23, 42, 0.36) con backdrop-filter: blur(4px).",
      mobile375: "Scrim .hg-velo-anclado (sin blur en dispositivos html[data-gama-baja]).",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: ".tablero-fondo, .saas-modal-backdrop { animation: none !important; transition-duration: 0.01ms !important; }",
      functionalAlternative: "Aparición y cierre instantáneos del scrim con opacity: 1.",
    },
  },

  "M4.modal-card": {
    id: "M4.modal-card",
    group: "M4",
    title: "Tarjeta Modal (7 modales: Nuevo post, Nueva marca, Invitar equipo, Buscar ⌘K, Configurar widgets, Sugerencias automáticas, Lector de libreta)",
    selector: ".saas-modal, .tablero-modal, [role='dialog']",
    trigger: "Apertura y cierre de modal",
    animatedProperties: ["opacity", "transform"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.MODAL_CARD_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.SPRING_OUT,
      bezierTuple: MOTION_CURVES.SPRING_OUT.tuple,
      normalizedCurveSamples: MOTION_CURVES.SPRING_OUT.samples,
      from: {
        opacity: 0,
        transform: "scale(0.96) translateY(6px)",
      },
      to: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.8256, 0.9718, 0.9977, 1.0],
        scale: [0.96, 0.993, 0.9989, 0.9999, 1.0],
        translateY_px: [6.0, 1.05, 0.17, 0.01, 0.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.MODAL_CARD_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_IN,
      bezierTuple: MOTION_CURVES.EASE_IN.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_IN.samples,
      from: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      to: {
        opacity: 0,
        transform: "scale(0.96) translateY(6px)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [1.0, 0.9014, 0.6752, 0.3699, 0.0],
        scale: [1.0, 0.9961, 0.987, 0.9748, 0.96],
        translateY_px: [0.0, 0.59, 1.95, 3.78, 6.0],
      },
    },
    interruptionBehavior:
      "Si se cierra el modal mientras aún está abriendo, interpola desde la matriz transform/opacity actual hacia scale(0.96) translateY(6px) y opacity: 0 en <= 150ms.",
    viewportVariants: {
      desktop1440: "Tarjeta centrada (scale(0.96) translateY(6px) -> scale(1) translateY(0), 180ms, cubic-bezier(0.16, 1, 0.3, 1)).",
      tablet768: "Tarjeta centrada con margen de 20px, misma curva y duración (180ms).",
      mobile375: "Hoja inferior (@keyframes hg-hoja-sube: translate 0 100% -> 0 0, 320ms, delay 34ms, cubic-bezier(0.33, 1, 0.68, 1), transform-origin: bottom center).",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: ".tablero-modal, .saas-modal { animation: none !important; transition-duration: 0.01ms !important; transform: none !important; opacity: 1 !important; }",
      functionalAlternative: "Renderizado inmediato en scale(1) translateY(0) con foco automático en el primer elemento interactivo.",
    },
  },

  "M5.ai-drawer": {
    id: "M5.ai-drawer",
    group: "M5",
    title: "Panel lateral / Drawer flotante del Asistente Hubly (FloatingAIDrawer)",
    selector: "[data-hb-panel]",
    trigger: "Click en botón circular del avatar de Hubly (56x56px) o botón X del panel",
    animatedProperties: ["opacity", "transform"],
    transformOrigin: "100% 100%",
    enter: {
      durationMs: MOTION_DURATIONS.AI_DRAWER_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.SPRING_OUT,
      bezierTuple: MOTION_CURVES.SPRING_OUT.tuple,
      normalizedCurveSamples: MOTION_CURVES.SPRING_OUT.samples,
      from: {
        opacity: 0,
        transform: "scale(0.92) translateY(12px)",
      },
      to: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.8256, 0.9718, 0.9977, 1.0],
        scale: [0.92, 0.986, 0.9977, 0.9998, 1.0],
        translateY_px: [12.0, 2.09, 0.34, 0.03, 0.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.AI_DRAWER_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      to: {
        opacity: 0,
        transform: "scale(0.92) translateY(12px)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [1.0, 0.7634, 0.2244, 0.0406, 0.0],
        scale: [1.0, 0.9811, 0.938, 0.9232, 0.92],
        translateY_px: [0.0, 2.84, 9.31, 11.51, 12.0],
      },
    },
    interruptionBehavior:
      "Al alternar rápidamente el botón del avatar, el panel invierte su escala y traslación desde el punto intermedio hacia la esquina inferior derecha (transform-origin: bottom right).",
    viewportVariants: {
      desktop1440: "Panel flotante 388x530px en right: 20px, bottom: 86px, transform-origin: bottom right.",
      tablet768: "Panel flotante 388x530px en right: 20px, bottom: 86px, transform-origin: bottom right.",
      mobile375: "Ancho adaptativo calc(100vw - 24px) en right: 12px, bottom: 80px o bottom sheet de 320ms.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important; animation: none !important; transform: none !important;",
      functionalAlternative: "Apertura y cierre inmediatos del panel; anillo .hg-hb-piensa estático (box-shadow: 0 0 0 2px #f9b431f2).",
    },
  },

  "M5.ai-fab": {
    id: "M5.ai-fab",
    group: "M5",
    title: "Botón Lanzador Circular del Asistente Hubly (FAB 56x56px)",
    selector: "[data-hb-fab]",
    trigger: "mouseenter / mouseleave / pointerdown",
    animatedProperties: ["transform", "box-shadow"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.AI_FAB_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: { transform: "scale(1)" },
      to: { transform: "scale(1.04)" },
      interpolatedValuesAtQuartiles: {
        scale: [1.0, 1.0095, 1.031, 1.0384, 1.04],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.AI_FAB_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: { transform: "scale(1.04)" },
      to: { transform: "scale(1)" },
      interpolatedValuesAtQuartiles: {
        scale: [1.04, 1.0305, 1.009, 1.0016, 1.0],
      },
    },
    interruptionBehavior: "Reversión continua de scale y sombra dorada desde el valor intermedio.",
    viewportVariants: {
      desktop1440: "Fijo 56x56px en right: 20px, bottom: 18px.",
      tablet768: "Fijo 56x56px en right: 20px, bottom: 18px.",
      mobile375: "Se oculta automáticamente cuando hay una hoja modal abierta (body[data-visor] [data-hb-fab] { display: none !important }).",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important; animation: none !important;",
      functionalAlternative: "Sin escalado en hover ni pulso infinito; mantiene el anillo dorado fijo.",
    },
  },

  "M5.descubre-widget": {
    id: "M5.descubre-widget",
    group: "M5",
    title: "Widget flotante Descubre Hubly (DescubreHublyWidget)",
    selector: "[data-mision-pildora]",
    trigger: "Click en cabecera Descubre Hubly (colapsar/expandir), check de tarea o botón cerrar X",
    animatedProperties: ["opacity", "transform", "width"],
    transformOrigin: "100% 100%",
    enter: {
      durationMs: MOTION_DURATIONS.DESCUBRE_WIDGET_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.SPRING_OUT,
      bezierTuple: MOTION_CURVES.SPRING_OUT.tuple,
      normalizedCurveSamples: MOTION_CURVES.SPRING_OUT.samples,
      from: {
        opacity: 0,
        transform: "scale(0.94) translateY(8px)",
        caretRotate: "180deg",
      },
      to: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
        caretRotate: "0deg",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.8256, 0.9718, 0.9977, 1.0],
        scale: [0.94, 0.9895, 0.9983, 0.9999, 1.0],
        translateY_px: [8.0, 1.4, 0.23, 0.02, 0.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.DESCUBRE_WIDGET_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
        caretRotate: "0deg",
      },
      to: {
        opacity: 0,
        transform: "scale(0.94) translateY(8px)",
        caretRotate: "180deg",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [1.0, 0.7634, 0.2244, 0.0406, 0.0],
        scale: [1.0, 0.9858, 0.9535, 0.9424, 0.94],
        translateY_px: [0.0, 1.89, 6.2, 7.68, 8.0],
      },
    },
    interruptionBehavior:
      "La barra de progreso (200ms) y el giro del caret (150ms) interpolan desde el ancho/ángulo en vuelo al hacer clicks rápidos.",
    viewportVariants: {
      desktop1440: "Flotante 224px en right: 84px, bottom: 88px, transform-origin: bottom right.",
      tablet768: "Flotante 224px en right: 80px, bottom: 24px.",
      mobile375: "Se oculta automáticamente cuando se abre un modal o sheet (html:has(.hg-sheet) [data-mision-pildora] { display: none }).",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition-duration: 0.01ms !important;",
      functionalAlternative: "Colapso del listado, check de tarea y avance de barra de progreso instantáneos.",
    },
  },

  "M6.kraft-notebook": {
    id: "M6.kraft-notebook",
    group: "M6",
    title: "Tarjetas de Libretas Kraft (KraftNotebookCard) — Elevación en Hover y Selección",
    selector: "[data-kraft-notebook-card]",
    trigger: "mouseenter / mouseleave / click",
    animatedProperties: ["transform", "box-shadow", "border-color"],
    transformOrigin: "50% 100%",
    enter: {
      durationMs: MOTION_DURATIONS.KRAFT_NOTEBOOK_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        transform: "translateY(0px)",
        borderColor: "#8C653A",
        boxShadow:
          "0 4px 0 #EFECE6, 0 5px 0 #C5B49E, 0 8px 16px rgba(45, 28, 12, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.32), inset -1px -2px 5px rgba(58, 35, 14, 0.25)",
      },
      to: {
        transform: "translateY(-2px)",
        borderColor: "#7A562F",
        boxShadow:
          "0 6px 0 #EFECE6, 0 7px 0 #C5B49E, 0 12px 22px rgba(45, 28, 12, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.38), inset -1px -2px 5px rgba(58, 35, 14, 0.25)",
      },
      interpolatedValuesAtQuartiles: {
        translateY_px: [0.0, -0.47, -1.55, -1.92, -2.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.KRAFT_NOTEBOOK_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: {
        transform: "translateY(-2px)",
        borderColor: "#7A562F",
        boxShadow:
          "0 6px 0 #EFECE6, 0 7px 0 #C5B49E, 0 12px 22px rgba(45, 28, 12, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.38), inset -1px -2px 5px rgba(58, 35, 14, 0.25)",
      },
      to: {
        transform: "translateY(0px)",
        borderColor: "#8C653A",
        boxShadow:
          "0 4px 0 #EFECE6, 0 5px 0 #C5B49E, 0 8px 16px rgba(45, 28, 12, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.32), inset -1px -2px 5px rgba(58, 35, 14, 0.25)",
      },
      interpolatedValuesAtQuartiles: {
        translateY_px: [-2.0, -1.53, -0.45, -0.08, 0.0],
      },
    },
    interruptionBehavior:
      "Si el cursor sale antes de 160ms, la libreta invierte su desplazamiento vertical desde el translateY intermedio de regreso a 0px.",
    viewportVariants: {
      desktop1440: "Elevación translateY(-2px) en hover dentro de estantería recortada (248px).",
      tablet768: "Elevación translateY(-2px) con puntero; tap abre el Lector de libreta.",
      mobile375: "Sin hover persistente; compresión táctil translateY(1px) en 90ms al tocar.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "transition: none !important; transform: none !important;",
      functionalAlternative: "Sin elevación espacial; cambio inmediato de color de borde en hover.",
    },
  },

  "M6.interactive-row": {
    id: "M6.interactive-row",
    group: "M6",
    title: "Filas interactivas y tarjetas Bento (.hg-row, .hq-card-i, .tablero-tarjeta)",
    selector: ".hg-row, .hq-card-i, .tablero-tarjeta",
    trigger: "mouseenter / mouseleave / :active",
    animatedProperties: ["background-color", "border-color", "box-shadow", "transform", "opacity"],
    transformOrigin: "50% 50%",
    enter: {
      durationMs: MOTION_DURATIONS.ROW_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: { backgroundColor: "#FFFFFF", borderColor: "#E3E9EF" },
      to: { backgroundColor: "#F8FAFC", borderColor: "#D6DFE7" },
    },
    exit: {
      durationMs: MOTION_DURATIONS.ROW_HOVER_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.STANDARD,
      bezierTuple: MOTION_CURVES.STANDARD.tuple,
      normalizedCurveSamples: MOTION_CURVES.STANDARD.samples,
      from: { backgroundColor: "#F8FAFC", borderColor: "#D6DFE7" },
      to: { backgroundColor: "#FFFFFF", borderColor: "#E3E9EF" },
    },
    interruptionBehavior: "Interpolación continua de color y sombra al recorrer filas consecutivas.",
    viewportVariants: {
      desktop1440: "Hover de fondo (#F8FAFC) en 150ms y sombra de tarjeta (.hq-card-i) en 200ms.",
      tablet768: "Misma transición de 150ms–200ms.",
      mobile375: "Feedback táctil :active { scale: 0.97; background: #F5F8FB } en 150ms.",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: ".tablero-tarjeta, .hq-card-i, .hg-row { transition: none !important; }",
      functionalAlternative: "Cambio de color de fondo y borde instantáneo en <= 1ms.",
    },
  },

  "M7.dropdown-menu": {
    id: "M7.dropdown-menu",
    group: "M7",
    title: "Dropdowns y menús contextuales (Selector de marca, Filtro de periodo, Ordenar)",
    selector: "[data-dropdown-menu], .hubly-dropdown",
    trigger: "Click en botón disparador / click exterior / tecla Escape / selección de ítem",
    animatedProperties: ["opacity", "transform"],
    transformOrigin: "0% 0%",
    enter: {
      durationMs: MOTION_DURATIONS.DROPDOWN_IN_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.SPRING_OUT,
      bezierTuple: MOTION_CURVES.SPRING_OUT.tuple,
      normalizedCurveSamples: MOTION_CURVES.SPRING_OUT.samples,
      from: {
        opacity: 0,
        transform: "scale(0.95) translateY(-4px)",
      },
      to: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [0.0, 0.8256, 0.9718, 0.9977, 1.0],
        scale: [0.95, 0.9913, 0.9986, 0.9999, 1.0],
        translateY_px: [-4.0, -0.7, -0.11, -0.01, 0.0],
      },
    },
    exit: {
      durationMs: MOTION_DURATIONS.DROPDOWN_OUT_MS,
      delayMs: MOTION_DELAYS.NONE_MS,
      easing: MOTION_EASINGS.EASE_IN,
      bezierTuple: MOTION_CURVES.EASE_IN.tuple,
      normalizedCurveSamples: MOTION_CURVES.EASE_IN.samples,
      from: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      to: {
        opacity: 0,
        transform: "scale(0.95) translateY(-4px)",
      },
      interpolatedValuesAtQuartiles: {
        opacity: [1.0, 0.9014, 0.6752, 0.3699, 0.0],
        scale: [1.0, 0.9951, 0.9838, 0.9685, 0.95],
        translateY_px: [0.0, -0.39, -1.3, -2.52, -4.0],
      },
    },
    interruptionBehavior:
      "Al cerrar antes de 120ms, el menú contrae su escala actual hacia scale(0.95) y opacity: 0 en <= 100ms mientras el icono ChevronDown revierte a rotate(0deg).",
    viewportVariants: {
      desktop1440: "Popover flotante (top left para Selector de marca; top right para Filtro de periodo y Ordenar), 120ms.",
      tablet768: "Popover flotante anclado al disparador, 120ms.",
      mobile375: "En modo teléfono/app (:is(.top-full, .bottom-full):not([data-sin-hoja])) se promueve a Action Sheet inferior (hg-hoja-sube, 320ms, delay 34ms).",
    },
    reducedMotion: {
      durationMs: MOTION_DURATIONS.REDUCED_MOTION_MS,
      cssOverride: "animation: none !important; transition-duration: 0.01ms !important; transform: none !important; opacity: 1 !important;",
      functionalAlternative: "Apertura y cierre inmediatos del menú con opacity: 1 y scale(1).",
    },
  },
} as const;

/* ==========================================================================
   6. MODAL & DROPDOWN SURFACE METADATA CATALOG
   ========================================================================== */

export const MODAL_SURFACES: Readonly<
  Record<
    ModalSurfaceId,
    {
      readonly id: ModalSurfaceId;
      readonly label: string;
      readonly maxWidthPx: number;
      readonly borderRadiusPx: number;
      readonly backdropSpecId: "M4.modal-backdrop";
      readonly cardSpecId: "M4.modal-card";
    }
  >
> = {
  "nuevo-post": {
    id: "nuevo-post",
    label: "Nuevo post (PostComposerModal)",
    maxWidthPx: 720,
    borderRadiusPx: 20,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
  "nueva-marca": {
    id: "nueva-marca",
    label: "Nueva marca (NewBrandModal)",
    maxWidthPx: 512,
    borderRadiusPx: 20,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
  "invitar-equipo": {
    id: "invitar-equipo",
    label: "Invitar equipo",
    maxWidthPx: 480,
    borderRadiusPx: 20,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
  "buscar-cmdk": {
    id: "buscar-cmdk",
    label: "Buscar ⌘K (CommandPaletteModal)",
    maxWidthPx: 672,
    borderRadiusPx: 20,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
  "configurar-widgets": {
    id: "configurar-widgets",
    label: "Configurar widgets (+ Widget / Editar)",
    maxWidthPx: 540,
    borderRadiusPx: 18,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
  "sugerencias-automaticas": {
    id: "sugerencias-automaticas",
    label: "Sugerencias automáticas (AutoSuggestionsModal)",
    maxWidthPx: 720,
    borderRadiusPx: 20,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
  "lector-libreta": {
    id: "lector-libreta",
    label: "Lector de libreta (NotebookReaderModal)",
    maxWidthPx: 480,
    borderRadiusPx: 18,
    backdropSpecId: "M4.modal-backdrop",
    cardSpecId: "M4.modal-card",
  },
} as const;

export const DROPDOWN_SURFACES: Readonly<
  Record<
    DropdownSurfaceId,
    {
      readonly id: DropdownSurfaceId;
      readonly label: string;
      readonly transformOrigin: string;
      readonly specId: "M7.dropdown-menu";
    }
  >
> = {
  "selector-marca": {
    id: "selector-marca",
    label: "Selector de marca (Sidebar)",
    transformOrigin: "top left",
    specId: "M7.dropdown-menu",
  },
  "filtro-periodo": {
    id: "filtro-periodo",
    label: "Filtro de periodo (7d / 30d / Esta semana / Este mes / Custom)",
    transformOrigin: "top right",
    specId: "M7.dropdown-menu",
  },
  ordenar: {
    id: "ordenar",
    label: "Ordenar / Filtros contextuales",
    transformOrigin: "top right",
    specId: "M7.dropdown-menu",
  },
} as const;

/* ==========================================================================
   7. REACT & DOM HELPERS FOR PREFERS-REDUCED-MOTION
   ========================================================================== */

/**
 * Checks whether the current browser environment requests reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * React hook that subscribes to `(prefers-reduced-motion: reduce)` changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Returns the effective animation/transition duration in ms, collapsing spatial motion
 * to `0.01ms` (`<= 1ms`) when `prefers-reduced-motion: reduce` is active.
 */
export function getEffectiveDurationMs(
  nominalDurationMs: number,
  isReducedMotion: boolean = prefersReducedMotion()
): number {
  return isReducedMotion ? MOTION_DURATIONS.REDUCED_MOTION_MS : nominalDurationMs;
}

/**
 * Builds inline `CSSProperties` for a given `MotionSpecId` and phase (`enter` | `exit`),
 * automatically respecting `prefers-reduced-motion: reduce`.
 */
export function getMotionTransitionStyle(
  specId: MotionSpecId,
  phase: "enter" | "exit" = "enter",
  isReducedMotion: boolean = prefersReducedMotion()
): CSSProperties {
  const spec = MOTION_SPEC[specId];
  const phaseSpec = spec[phase];
  const durationMs = getEffectiveDurationMs(phaseSpec.durationMs, isReducedMotion);
  const delayMs = isReducedMotion ? 0 : phaseSpec.delayMs;

  const transitionList = spec.animatedProperties
    .map((prop) => `${prop} ${durationMs}ms ${phaseSpec.easing} ${delayMs}ms`)
    .join(", ");

  return {
    transition: transitionList,
    transformOrigin: spec.transformOrigin,
  };
}

/* ==========================================================================
   8. MATHEMATICAL & WEB ANIMATIONS API (getAnimations()) QA HELPERS (AGENT 12)
   ========================================================================== */

/**
 * Evaluates the normalized Y progression of `cubic-bezier(x1, y1, x2, y2)` at normalized time `t` in `[0, 1]`.
 */
export function evaluateCubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (x1 === y1 && x2 === y2) return t;

  let low = 0;
  let high = 1;
  let u = t;

  for (let i = 0; i < 32; i++) {
    u = 0.5 * (low + high);
    const oneMinusU = 1 - u;
    const bx =
      3 * oneMinusU * oneMinusU * u * x1 +
      3 * oneMinusU * u * u * x2 +
      u * u * u;
    if (bx < t) {
      low = u;
    } else {
      high = u;
    }
  }

  const oneMinusU = 1 - u;
  const by =
    3 * oneMinusU * oneMinusU * u * y1 +
    3 * oneMinusU * u * u * y2 +
    u * u * u;

  return Number(by.toFixed(4));
}

/**
 * Samples a `cubic-bezier(x1, y1, x2, y2)` tuple at `t = 0%, 25%, 50%, 75%, 100%`.
 */
export function sampleCurveAtQuartiles(bezier: CubicBezierTuple): QuartileSampleTuple {
  const [x1, y1, x2, y2] = bezier;
  return [
    evaluateCubicBezier(x1, y1, x2, y2, 0),
    evaluateCubicBezier(x1, y1, x2, y2, 0.25),
    evaluateCubicBezier(x1, y1, x2, y2, 0.5),
    evaluateCubicBezier(x1, y1, x2, y2, 0.75),
    evaluateCubicBezier(x1, y1, x2, y2, 1),
  ] as const;
}

/**
 * Computes the maximum allowed duration deviation in ms:
 * `max(1 frame @ 60fps = 16.67ms, 5% of nominal duration)`.
 */
export function getAllowedDurationToleranceMs(expectedDurationMs: number): number {
  return Number(
    Math.max(
      MOTION_TOLERANCE.MIN_FRAME_MS,
      expectedDurationMs * MOTION_TOLERANCE.DURATION_RATIO
    ).toFixed(2)
  );
}

/**
 * Computes the Mean Absolute Error (MAE) between two normalized 5-point curves (`t = 0%, 25%, 50%, 75%, 100%`).
 */
export function computeNormalizedTrajectoryMAE(
  measuredSamples: readonly number[],
  expectedSamples: readonly number[]
): number {
  const count = Math.min(measuredSamples.length, expectedSamples.length);
  if (count === 0) return 1;
  let sumAbsError = 0;
  for (let i = 0; i < count; i++) {
    sumAbsError += Math.abs(measuredSamples[i] - expectedSamples[i]);
  }
  return Number((sumAbsError / count).toFixed(4));
}

/**
 * Parses a CSS `cubic-bezier(x1, y1, x2, y2)` or keyword easing string into a 4-tuple.
 */
export function parseCssEasingToTuple(easingString: string): CubicBezierTuple {
  const normalized = easingString.trim().toLowerCase();
  if (normalized === "linear") return [0, 0, 1, 1];
  if (normalized === "ease") return [0.25, 0.1, 0.25, 1];
  if (normalized === "ease-in") return [0.42, 0, 1, 1];
  if (normalized === "ease-out") return [0, 0, 0.58, 1];
  if (normalized === "ease-in-out") return [0.42, 0, 0.58, 1];

  const match = normalized.match(
    /cubic-bezier\(\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\s*\)/
  );
  if (match) {
    return [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
    ];
  }
  return [0.4, 0, 0.2, 1];
}

export interface AuditedWebAnimation {
  readonly animationNameOrProperty: string;
  readonly playState: AnimationPlayState;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly easing: string;
  readonly currentTimeMs: number | null;
  readonly progress: number | null;
  readonly keyframes: readonly ComputedKeyframe[];
}

export interface MotionAuditReport {
  readonly specId: MotionSpecId;
  readonly phase: "enter" | "exit";
  readonly reducedMotionActive: boolean;
  readonly activeAnimationsCount: number;
  readonly measuredDurationMs: number;
  readonly expectedDurationMs: number;
  readonly allowedDurationToleranceMs: number;
  readonly durationWithinTolerance: boolean;
  readonly measuredEasing: string;
  readonly expectedEasing: string;
  readonly measuredCurveSamples: QuartileSampleTuple;
  readonly expectedCurveSamples: QuartileSampleTuple;
  readonly trajectoryMAE: number;
  readonly trajectoryWithinTolerance: boolean;
  readonly pass: boolean;
  readonly animations: readonly AuditedWebAnimation[];
}

/**
 * Reads all active Web Animations (`element.getAnimations()`) on a DOM element
 * and normalizes their timing and keyframe data for Agent 12's QA harness.
 */
export function inspectElementAnimations(
  element: Element,
  options: { subtree?: boolean } = {}
): AuditedWebAnimation[] {
  if (typeof element.getAnimations !== "function") {
    return [];
  }

  return element.getAnimations({ subtree: options.subtree ?? false }).map((anim) => {
    const effect = anim.effect as KeyframeEffect | null;
    const timing = effect?.getTiming();
    const computedTiming = effect?.getComputedTiming();
    const keyframes = typeof effect?.getKeyframes === "function" ? effect.getKeyframes() : [];

    const rawDuration = computedTiming?.duration ?? timing?.duration ?? 0;
    const durationMs = typeof rawDuration === "number" ? rawDuration : parseFloat(String(rawDuration)) || 0;
    const delayMs = typeof timing?.delay === "number" ? timing.delay : 0;
    const easing = String(timing?.easing ?? "linear");

    const animWithTransition = anim as Animation & {
      transitionProperty?: string;
      animationName?: string;
    };
    const nameOrProp =
      animWithTransition.transitionProperty ||
      animWithTransition.animationName ||
      anim.id ||
      "animation";

    return {
      animationNameOrProperty: nameOrProp,
      playState: anim.playState,
      durationMs,
      delayMs,
      easing,
      currentTimeMs: typeof anim.currentTime === "number" ? anim.currentTime : null,
      progress: typeof computedTiming?.progress === "number" ? computedTiming.progress : null,
      keyframes,
    };
  });
}

/**
 * Audits an element against its canonical `MOTION_SPEC[specId]` contract using
 * `element.getAnimations()` (with fallback to `getComputedStyle(element)`).
 */
export function auditMotionSpecOnElement(
  element: Element,
  specId: MotionSpecId,
  phase: "enter" | "exit" = "enter",
  options: { reducedMotion?: boolean } = {}
): MotionAuditReport {
  const spec = MOTION_SPEC[specId];
  const phaseSpec = spec[phase];
  const isReduced = options.reducedMotion ?? prefersReducedMotion();

  const animations = inspectElementAnimations(element);
  let measuredDurationMs = phaseSpec.durationMs;
  let measuredEasing = phaseSpec.easing;

  if (animations.length > 0) {
    const primary = animations[0];
    measuredDurationMs = primary.durationMs;
    measuredEasing = primary.easing;
  } else if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    const cs = window.getComputedStyle(element);
    const rawDur = cs.transitionDuration.split(",")[0]?.trim() || cs.animationDuration.split(",")[0]?.trim() || "0s";
    if (rawDur.endsWith("ms")) {
      measuredDurationMs = parseFloat(rawDur);
    } else if (rawDur.endsWith("s")) {
      measuredDurationMs = parseFloat(rawDur) * 1000;
    }
    const rawEase =
      cs.transitionTimingFunction.split(/(?<=\)),/)[0]?.trim() ||
      cs.animationTimingFunction.split(/(?<=\)),/)[0]?.trim();
    if (rawEase) {
      measuredEasing = rawEase;
    }
  }

  const expectedDurationMs = isReduced
    ? MOTION_DURATIONS.REDUCED_MOTION_MS
    : phaseSpec.durationMs;

  const allowedDurationToleranceMs = isReduced
    ? MOTION_TOLERANCE.REDUCED_MOTION_MAX_MS
    : getAllowedDurationToleranceMs(expectedDurationMs);

  const durationWithinTolerance = isReduced
    ? measuredDurationMs <= MOTION_TOLERANCE.REDUCED_MOTION_MAX_MS
    : Math.abs(measuredDurationMs - expectedDurationMs) <= allowedDurationToleranceMs;

  const measuredTuple = parseCssEasingToTuple(measuredEasing);
  const measuredCurveSamples = sampleCurveAtQuartiles(measuredTuple);
  const expectedCurveSamples = phaseSpec.normalizedCurveSamples;

  const trajectoryMAE = isReduced
    ? 0
    : computeNormalizedTrajectoryMAE(measuredCurveSamples, expectedCurveSamples);

  const trajectoryWithinTolerance = trajectoryMAE <= MOTION_TOLERANCE.MAX_NORMALIZED_MAE;

  return {
    specId,
    phase,
    reducedMotionActive: isReduced,
    activeAnimationsCount: animations.length,
    measuredDurationMs: Number(measuredDurationMs.toFixed(2)),
    expectedDurationMs,
    allowedDurationToleranceMs,
    durationWithinTolerance,
    measuredEasing,
    expectedEasing: phaseSpec.easing,
    measuredCurveSamples,
    expectedCurveSamples,
    trajectoryMAE,
    trajectoryWithinTolerance,
    pass: durationWithinTolerance && trajectoryWithinTolerance,
    animations,
  };
}
