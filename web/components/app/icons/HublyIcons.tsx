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
  HublyMemoIcon,
  HublyBellIcon,
  HublySunWeatherIcon,
  HublyPeopleIcon,
  HublyPulseIcon,
} from "./DuotoneIcons";

/* ==========================================================================
   TYPES & INTERFACES
   ========================================================================== */

export interface HublyIconProps extends React.SVGProps<SVGSVGElement> {
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


export interface HublyCatAvatarProps {
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

export interface KraftNotebookShapeSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  variant?: "post" | "report" | "space" | "brand";
  rough?: boolean;
  title?: string;
}

/* ==========================================================================
   1. SVG DISPLACEMENT FILTERS (Módulo 69334 + #rough-paper / #rough-edges)
   ========================================================================== */

/**
 * Global SVG `<defs>` providing organic hand-drawn displacement filters:
 * - `#hb-rough` & `#rough-paper`: fractalNoise (baseFrequency="0.04 0.06", numOctaves=2, seed=3, scale=0.55)
 * - `#hb-rough-subtle` & `#rough-edges`: fractalNoise (baseFrequency="0.05", numOctaves=1, seed=7, scale=0.55)
 */
export function RoughPaperSvgDefs() {
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

export function KraftNotebookShapeSvg({
  size,
  width = 160,
  height = 204,
  variant = "post",
  rough = true,
  className = "",
  style,
  title,
  ...rest
}: KraftNotebookShapeSvgProps) {
  const w = size ?? width;
  const h = size ?? height;
  const palette =
    variant === "report"
      ? { cover: "#A97E4E", spine: "#7D5830", tab: "#0A7A55", stamp: "#FFD23F" }
      : variant === "space"
        ? { cover: "#B48B5B", spine: "#866036", tab: "var(--hb-accent)", stamp: "#FBF3E4" }
        : variant === "brand"
          ? { cover: "#9E7446", spine: "#704D27", tab: "#FFD23F", stamp: "#0A7A55" }
          : { cover: "#B99260", spine: "#8C653A", tab: "var(--hb-accent)", stamp: "#FBF3E4" };

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 160 204"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`.trim()}
      style={{
        filter: rough ? "url(#rough-paper)" : undefined,
        ...style,
      }}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {/* Page stack bottom edge */}
      <rect
        x="10"
        y="12"
        width="142"
        height="186"
        rx="12"
        fill="#EFECE6"
        stroke="#C5B49E"
        strokeWidth="1.2"
      />
      {/* Top index tab */}
      <path
        d="M110 6H138C141.3 6 144 8.7 144 12V16H104V12C104 8.7 106.7 6 110 6Z"
        fill={palette.tab}
        stroke="#3A2210"
        strokeWidth="1.2"
      />
      {/* Main Kraft cover */}
      <rect
        x="6"
        y="8"
        width="142"
        height="186"
        rx="12"
        fill={palette.cover}
        stroke={palette.spine}
        strokeWidth="1.5"
      />
      {/* Left spine binding strip */}
      <path
        d="M6 20C6 13.3726 11.3726 8 18 8H24V194H18C11.3726 194 6 188.627 6 182V20Z"
        fill={palette.spine}
      />
      {/* Stitched thread dashed line */}
      <line
        x1="15"
        y1="16"
        x2="15"
        y2="186"
        stroke="#FFF8EB"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      {/* Center medallion ring */}
      <circle
        cx="84"
        cy="82"
        r="28"
        fill={palette.stamp}
        stroke="#3A2210"
        strokeWidth="1.4"
      />
      {/* Label plate at bottom */}
      <rect
        x="34"
        y="136"
        width="100"
        height="34"
        rx="6"
        fill="#FBF7EE"
        fillOpacity="0.92"
        stroke="#8C653A"
        strokeWidth="1.1"
      />
      <line
        x1="46"
        y1="149"
        x2="122"
        y2="149"
        stroke="#3A2210"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="58"
        y1="160"
        x2="110"
        y2="160"
        stroke="#3A2210"
        strokeOpacity="0.3"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
export function HublyCatInlineSvg({
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
          <img
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

const INK = "#26241E";

function IconSvg({
  size = 22,
  className = "",
  rough = true,
  title,
  style,
  active: _active,
  children,
  ...rest
}: HublyIconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
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
      {children}
    </svg>
  );
}

/**
 * 1. HublyAvatarIcon / HublyAvatarIcon (28x28 illustrated vector icon of the Hubly cat `#16324F` + `#7CC8EE`)
 */
export function HublyAvatarIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      {/* Tail */}
      <path
        d="M19.5 22.5C22.8 22.5 24.8 19.8 24.8 16.8C24.8 14.8 23.4 13.8 22 14.2C20.8 14.6 20.6 16 21.5 16.8"
        stroke="#16324F"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Sitting Body */}
      <path
        d="M8.5 15.8C8 18.8 8 22.2 9.5 23.5C11 24.5 17 24.5 18.5 23.5C20 22.2 20 18.8 19.5 15.8Z"
        fill="#16324F"
        stroke="#111C27"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Left Ear (Navy #16324F) */}
      <path
        d="M6.5 11.2L6 4.5C6 3.8 6.8 3.4 7.4 3.9L11.8 7.4Z"
        fill="#16324F"
        stroke="#111C27"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Right Ear (Brand Sky Blue #7CC8EE) */}
      <path
        d="M16.2 7.4L20.6 3.9C21.2 3.4 22 3.8 22 4.5L21.5 11.2Z"
        fill="#7CC8EE"
        stroke="#111C27"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Head */}
      <ellipse
        cx="14"
        cy="11.4"
        rx="8"
        ry="6.4"
        fill="#16324F"
        stroke="#111C27"
        strokeWidth="1.4"
      />
      {/* Eyes (#DCEFF9) */}
      <ellipse cx="11" cy="11.2" rx="1.15" ry="1.5" fill="#DCEFF9" />
      <ellipse cx="17" cy="11.2" rx="1.15" ry="1.5" fill="#DCEFF9" />
      {/* Cute 'w' mouth */}
      <path
        d="M12.2 13.5C12.7 14.4 13.5 14.4 14 13.6C14.5 14.4 15.3 14.4 15.8 13.5"
        stroke="#DCEFF9"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Front paws (#24496E) */}
      <rect
        x="10.2"
        y="20"
        width="3.8"
        height="4.2"
        rx="1.9"
        fill="#24496E"
        stroke="#111C27"
        strokeWidth="1.1"
      />
      <rect
        x="14"
        y="20"
        width="3.8"
        height="4.2"
        rx="1.9"
        fill="#24496E"
        stroke="#111C27"
        strokeWidth="1.1"
      />
    </IconSvg>
  );
}


/**
 * Legacy orange tabby icon preserved for backwards reference if needed
 */
export function LegacyOrangeTabbyAvatarIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <path
        d="M5.5 13 L5 5.2 Q5 4 6.2 4.8 L10.8 8.8 Z"
        fill="#E88B3A"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M22.5 13 L23 5.2 Q23 4 21.8 4.8 L17.2 8.8 Z"
        fill="#E88B3A"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse
        cx="14"
        cy="15.8"
        rx="9.2"
        ry="8"
        fill="#F49D49"
        stroke={INK}
        strokeWidth="1.6"
      />
      <circle cx="10.5" cy="15" r="1.4" fill={INK} />
      <circle cx="17.5" cy="15" r="1.4" fill={INK} />
    </IconSvg>
  );
}

export {
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
  HublyMemoIcon,
  HublyBellIcon,
  HublySunWeatherIcon,
};

export const HUBLY_ICONS = {
  avatar: HublyAvatarIcon,
  hubly: HublyAvatarIcon,
  home: HublyHomeIcon,
  bento: HublyBentoIcon,
  dashboard: HublyBentoIcon,
  chat: HublyChatIcon,
  notebook: HublyNotebookIcon,
  todos: HublyNotebookIcon,
  calendar: HublyCalendarIcon,
  brain: HublyBrainIcon,
  nucleo: HublyBrainIcon,
  folder: HublyFolderIcon,
  content: HublyFolderIcon,
  layers: HublyLayersIcon,
  proyectos: HublyLayersIcon,
  hash: HublyHashIcon,
  social: HublyHashIcon,
  target: HublyTargetIcon,
  ads: HublyTargetIcon,
  clipboard: HublyClipboardIcon,
  memo: HublyMemoIcon,
  bell: HublyBellIcon,
  sun_weather: HublySunWeatherIcon,
} as const;

export type HublyIconKey = keyof typeof HUBLY_ICONS;

/* ==========================================================================
   5. VECTOR UI ICONS (44 Lucide-compatible stroke icons from Module 61371)
   ========================================================================== */

function createStrokeIcon(
  displayName: string,
  renderPaths: () => React.ReactNode
) {
  const Component = ({
    size = 18,
    strokeWidth = 1.9,
    className = "",
    style,
    title,
    active: _active,
    ...rest
  }: HublyIconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`.trim()}
      style={style}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {renderPaths()}
    </svg>
  );
  Component.displayName = displayName;
  return Component;
}

export const Home = createStrokeIcon("Home", () => (
  <>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.5" />
    <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
  </>
));

export const ClipboardList = createStrokeIcon("ClipboardList", () => (
  <>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </>
));

export const BarChart2 = createStrokeIcon("BarChart2", () => (
  <>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </>
));

export const Lightbulb = createStrokeIcon("Lightbulb", () => (
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>
));

export const UserCircle = createStrokeIcon("UserCircle", () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </>
));

export const Calendar = createStrokeIcon("Calendar", () => (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>
));

export const Megaphone = createStrokeIcon("Megaphone", () => (
  <>
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </>
));

export const CheckSquare = createStrokeIcon("CheckSquare", () => (
  <>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </>
));

export const Bookmark = createStrokeIcon("Bookmark", () => (
  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
));

export const Users = createStrokeIcon("Users", () => (
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
));

export const BookOpen = createStrokeIcon("BookOpen", () => (
  <>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>
));

export const Bell = createStrokeIcon("Bell", () => (
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>
));

export const Settings = createStrokeIcon("Settings", () => (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
));

export const Plus = createStrokeIcon("Plus", () => (
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
));

export const Sparkles = createStrokeIcon("Sparkles", () => (
  <>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </>
));

export const Search = createStrokeIcon("Search", () => (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>
));

export const ChevronDown = createStrokeIcon("ChevronDown", () => (
  <path d="m6 9 6 6 6-6" />
));

export const ChevronUp = createStrokeIcon("ChevronUp", () => (
  <path d="m18 15-6-6-6 6" />
));

export const ChevronLeft = createStrokeIcon("ChevronLeft", () => (
  <path d="m15 18-6-6 6-6" />
));

export const ChevronRight = createStrokeIcon("ChevronRight", () => (
  <path d="m9 18 6-6-6-6" />
));

export const PanelLeft = createStrokeIcon("PanelLeft", () => (
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </>
));

export const SlidersHorizontal = createStrokeIcon("SlidersHorizontal", () => (
  <>
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </>
));

export const LayoutGrid = createStrokeIcon("LayoutGrid", () => (
  <>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </>
));

export const Check = createStrokeIcon("Check", () => (
  <path d="M20 6 9 17l-5-5" />
));

export const X = createStrokeIcon("X", () => (
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>
));

export const ExternalLink = createStrokeIcon("ExternalLink", () => (
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>
));

export const RefreshCw = createStrokeIcon("RefreshCw", () => (
  <>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </>
));

export const ArrowUpDown = createStrokeIcon("ArrowUpDown", () => (
  <>
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </>
));

export const Eye = createStrokeIcon("Eye", () => (
  <>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const AlertCircle = createStrokeIcon("AlertCircle", () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>
));

export const Clock = createStrokeIcon("Clock", () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </>
));

export const MoreHorizontal = createStrokeIcon("MoreHorizontal", () => (
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>
));

export const Send = createStrokeIcon("Send", () => (
  <>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </>
));

export const Paperclip = createStrokeIcon("Paperclip", () => (
  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
));

export const Trash2 = createStrokeIcon("Trash2", () => (
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </>
));

export const Edit3 = createStrokeIcon("Edit3", () => (
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>
));

export const Copy = createStrokeIcon("Copy", () => (
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>
));

export const Shield = createStrokeIcon("Shield", () => (
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
));

export const Smartphone = createStrokeIcon("Smartphone", () => (
  <>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </>
));

export const Filter = createStrokeIcon("Filter", () => (
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
));

export const TrendingUp = createStrokeIcon("TrendingUp", () => (
  <>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </>
));

export const Award = createStrokeIcon("Award", () => (
  <>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </>
));

export const Flame = createStrokeIcon("Flame", () => (
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
));

export const Zap = createStrokeIcon("Zap", () => (
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
));

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

