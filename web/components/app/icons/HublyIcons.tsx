"use client";

import React, { useState } from "react";
import {
  HublyHomeIcon,
  HublyBentoIcon,
  HublyChatIcon,
  HublyNotebookIcon,
  HublyCalendarIcon,
  HublyBrainIcon,
  HublyFolderIcon,
  HublyLayersIcon,
  HublyHashIcon,
  HublyTargetIcon,
  HublyClipboardIcon,
  HublyBellIcon,
  HublySunWeatherIcon,
  HublyPeopleIcon,
  HublyPulseIcon,
} from "./DuotoneIcons";

/* ==========================================================================
   TYPES & INTERFACES
   ========================================================================== */

interface HublyIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  /** Apply #hb-rough / #rough-paper organic displacement filter (default: true for illustrated icons) */
  rough?: boolean;
  /** Optional accessible title */
  title?: string;
  /** Stroke width for line/vector icons (default: 1.9) */
  strokeWidth?: number | string;
  /** Optional active state flag for navigation icons */
  active?: boolean;
}


interface HublyCatAvatarProps {
  /** Pixel dimension (width & height). Default: 28 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Border radius preset. Default: "full" */
  rounded?: "full" | "2xl" | "xl" | "lg" | "md" | "none";
  /** Show subtle border ring around the avatar. Default: true */
  bordered?: boolean;
  /** Optional presence/status badge */
  status?: "online" | "busy" | "away" | "offline" | null;
  /** Force inline SVG rendering instead of /brand/hubly-gato.png (or used automatically on img error) */
  useSvgFallback?: boolean;
  /** Apply #hb-rough SVG filter when rendering inline SVG */
  rough?: boolean;
  /** Accessible label / title */
  title?: string;
  alt?: string;
}


/* ==========================================================================
   1. SVG DISPLACEMENT FILTERS (Módulo 69334 + #rough-paper / #rough-edges)
   ========================================================================== */

/**
 * Global SVG `<defs>` providing organic hand-drawn displacement filters:
 * - `#hb-rough` & `#rough-paper`: fractalNoise (baseFrequency="0.04 0.06", numOctaves=2, seed=3, scale=0.55)
 * - `#hb-rough-subtle` & `#rough-edges`: fractalNoise (baseFrequency="0.05", numOctaves=1, seed=7, scale=0.55)
 */
function RoughPaperSvgDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="hb-rough">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04 0.06"
            numOctaves={2}
            seed={3}
          />
          <feDisplacementMap in="SourceGraphic" scale={0.55} />
        </filter>
        <filter id="hb-rough-subtle">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves={1}
            seed={7}
          />
          <feDisplacementMap in="SourceGraphic" scale={0.55} />
        </filter>
        <filter id="rough-paper" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04 0.06"
            numOctaves={2}
            seed={3}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={0.65}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="rough-edges" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves={1}
            seed={7}
            result="edgeNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="edgeNoise"
            scale={0.55}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export const HublyRoughFilterDefs = RoughPaperSvgDefs;

/* ==========================================================================
   2. KRAFT NOTEBOOK SILHOUETTE SVG
   ========================================================================== */


/* ==========================================================================
   3. HUBLY CAT IDENTITY: HublyCatInlineSvg, HublyCatAvatar & HublyLogoWordmark
   ========================================================================== */

/**
 * Native SVG fallback for Hubi, using the approved navy / sky-blue brand palette.
 * - Navy body, head, left ear, and curled tail (`#16324F`)
 * - Sky-blue right ear (`#7CC8EE`)
 * - Pale sky-blue vertical oval eyes and cute `w` cat mouth (`#DCEFF9`)
 * - Light navy front paws (`#24496E`) with `#16324F` center division
 */
function HublyCatInlineSvg({
  size = 28,
  className = "",
  rough = false,
  title,
  style,
  ...rest
}: HublyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`.trim()}
      style={{
        filter: rough ? "url(#hb-rough)" : undefined,
        ...style,
      }}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {/* Soft warm-white circular backdrop */}
      <circle cx="60" cy="60" r="58" fill="#FFFFFF" />

      {/* Curled right tail in navy (#16324F) */}
      <path
        d="M78 93C94 93 103 82 103 70C103 61 97 56 91 58C86 59.5 85 65.5 89 68.5C92 70.8 91 76.5 85 79.5C81 81.5 76 82 73 82"
        stroke="#16324F"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Torso / sitting body in navy (#16324F) */}
      <path
        d="M35 66C33 78 33 93 39 98C44 102 72 102 77 98C83 93 83 78 81 66C79 56 37 56 35 66Z"
        fill="#16324F"
      />

      {/* Left ear in navy (#16324F) */}
      <path
        d="M27 44L25 19C24.8 15.8 28.2 14 30.8 16L48 29Z"
        fill="#16324F"
      />

      {/* Right ear in brand sky blue (#7CC8EE) */}
      <path
        d="M68 29L85.2 16C87.8 14 91.2 15.8 91 19L89 44Z"
        fill="#7CC8EE"
      />

      {/* Rounded head in navy (#16324F) */}
      <ellipse cx="58" cy="46" rx="33" ry="26" fill="#16324F" />

      {/* Eyes in pale sky blue (#DCEFF9) */}
      <ellipse cx="45.5" cy="45.5" rx="4.2" ry="5.6" fill="#DCEFF9" />
      <ellipse cx="70.5" cy="45.5" rx="4.2" ry="5.6" fill="#DCEFF9" />

      {/* Cute rounded 'w' mouth in pale sky blue (#DCEFF9) */}
      <path
        d="M51 54.5C52.5 57.8 56.2 57.8 58 54.8C59.8 57.8 63.5 57.8 65 54.5"
        stroke="#DCEFF9"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Front paws in light navy (#24496E) with subtle division */}
      <rect x="42" y="84" width="15" height="17" rx="7.5" fill="#24496E" />
      <rect x="59" y="84" width="15" height="17" rx="7.5" fill="#24496E" />
      <line
        x1="58"
        y1="86"
        x2="58"
        y2="99"
        stroke="#16324F"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Primary Hubly Cat Avatar component (`/brand/hubly-gato.png` with automatic 1:1 inline SVG fallback).
 * Supports custom `size`, circular or squircle border, and status indicator badge.
 */
export function HublyCatAvatar({
  size = 28,
  className = "",
  style,
  rounded = "full",
  bordered = true,
  status = null,
  useSvgFallback = false,
  rough = false,
  title,
  alt = "Hubly",
}: HublyCatAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const radiusMap: Record<NonNullable<HublyCatAvatarProps["rounded"]>, string> = {
    full: "9999px",
    "2xl": "16px",
    xl: "12px",
    lg: "10px",
    md: "8px",
    none: "0px",
  };

  const statusColorMap: Record<NonNullable<Exclude<HublyCatAvatarProps["status"], null>>, string> = {
    online: "#0A7A55",
    busy: "#E87171",
    away: "#FFD23F",
    offline: "#94A3B8",
  };

  const borderRadius = radiusMap[rounded] ?? "9999px";
  const badgeSize = Math.max(7, Math.round(size * 0.28));

  return (
    <span
      className={`hubly-cat-avatar relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderRadius,
        background: "#FFFFFF",
        border: bordered ? "1.5px solid rgba(22, 50, 79, 0.16)" : undefined,
        boxShadow: bordered ? "0 1px 3px rgba(17, 28, 39, 0.08)" : undefined,
        overflow: status ? "visible" : "hidden",
        ...style,
      }}
      title={title ?? alt}
    >
      <span
        style={{
          width: "100%",
          height: "100%",
          borderRadius,
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {useSvgFallback || imgError ? (
          <HublyCatInlineSvg size={size} rough={rough} title={title ?? alt} />
        ) : (
          <img // eslint-disable-line @next/next/no-img-element -- logo local con respaldo SVG si falla
            src="/brand/hubly-gato.png?v=marino-celeste"
            alt={alt}
            width={size}
            height={size}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
      </span>

      {status ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: badgeSize,
            height: badgeSize,
            borderRadius: "9999px",
            backgroundColor: statusColorMap[status],
            border: "2px solid var(--bg-surface, #FFFFFF)",
          }}
        />
      ) : null}
    </span>
  );
}

/* ==========================================================================
   4. ILLUSTRATED MODULE 21224 ICONS (28x28 viewBox with #hb-rough filter)
   ========================================================================== */



/**
 * 1. HublyAvatarIcon / HublyAvatarIcon (28x28 illustrated vector icon of the Hubly cat `#16324F` + `#7CC8EE`)
 */


/**
 * Legacy orange tabby icon preserved for backwards reference if needed
 */

export {
  HublyHomeIcon,
  HublyNotebookIcon,
  HublyCalendarIcon,
  HublyClipboardIcon,
  HublyBellIcon,
  HublySunWeatherIcon,
};



/* ==========================================================================
   5. VECTOR UI ICONS (44 Lucide-compatible stroke icons from Module 61371)
   ========================================================================== */














































// Additional convenient aliases for Sidebar & DashboardSubNav
export const BentoIcon = HublyBentoIcon;
export const BentoNavIcon = HublyBentoIcon;
export const ChatBubbleIcon = HublyChatIcon;
export const NotebookIcon = HublyNotebookIcon;
export const CalendarFilledIcon = HublyCalendarIcon;
export const BrainFilledIcon = HublyBrainIcon;
export const FolderFilledIcon = HublyFolderIcon;
export const LayersFilledIcon = HublyLayersIcon;
export const HashBoldIcon = HublyHashIcon;
export const BullseyeFilledIcon = HublyTargetIcon;
export const PulseNavIcon = HublyPulseIcon;
export const TeamNavIcon = HublyPeopleIcon;

