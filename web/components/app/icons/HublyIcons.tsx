"use client";

import React, { useState } from "react";

/* ==========================================================================
   TYPES & INTERFACES
   ========================================================================== */

export interface HublyIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  /** Apply #henry-rough / #rough-paper organic displacement filter (default: true for illustrated icons) */
  rough?: boolean;
  /** Optional accessible title */
  title?: string;
  /** Stroke width for line/vector icons (default: 1.9) */
  strokeWidth?: number | string;
  /** Optional active state flag for navigation icons */
  active?: boolean;
}

export type HenryIconProps = HublyIconProps;

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
  /** Apply #henry-rough SVG filter when rendering inline SVG */
  rough?: boolean;
  /** Accessible label / title */
  title?: string;
  alt?: string;
}

export interface HublyLogoWordmarkProps {
  /** Collapsed sidebar state (`h.` / cat mark) vs expanded (`hubly.` wordmark) */
  collapsed?: boolean;
  /** Visual mode: "default" (vector mark + display wordmark), "image" (/brand/hubly-logo.webp), "cat" (cat avatar + wordmark) */
  variant?: "default" | "image" | "cat";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Show HublyCatAvatar when collapsed instead of `h.` monogram */
  showCatWhenCollapsed?: boolean;
  /** Show characteristic dot at the end of wordmark */
  showDot?: boolean;
  className?: string;
  style?: React.CSSProperties;
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
 * - `#henry-rough` & `#rough-paper`: fractalNoise (baseFrequency="0.04 0.06", numOctaves=2, seed=3, scale=0.55)
 * - `#henry-rough-subtle` & `#rough-edges`: fractalNoise (baseFrequency="0.05", numOctaves=1, seed=7, scale=0.55)
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
        <filter id="henry-rough">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04 0.06"
            numOctaves={2}
            seed={3}
          />
          <feDisplacementMap in="SourceGraphic" scale={0.55} />
        </filter>
        <filter id="henry-rough-subtle">
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

export const HenryRoughFilterDefs = RoughPaperSvgDefs;
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
        ? { cover: "#B48B5B", spine: "#866036", tab: "#6C77C1", stamp: "#FBF3E4" }
        : variant === "brand"
          ? { cover: "#9E7446", spine: "#704D27", tab: "#FFD23F", stamp: "#0A7A55" }
          : { cover: "#B99260", spine: "#8C653A", tab: "#6C77C1", stamp: "#FBF3E4" };

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
 * Exact 1:1 inline SVG reconstruction of `output/branding/hubly-gato-v2.png` (`/brand/hubly-gato.png`).
 * - Forest green body, head, left ear, and curled tail (`#0a7a55`)
 * - Golden yellow right ear (`#ffd23f`)
 * - Deep pine vertical oval eyes and cute `w` cat mouth (`#10291f`)
 * - Slightly lighter green front paws (`#0d8a61`) with `#086646` center division
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
        filter: rough ? "url(#henry-rough)" : undefined,
        ...style,
      }}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {/* Soft warm-white circular backdrop */}
      <circle cx="60" cy="60" r="58" fill="#FFFFFF" />

      {/* Curled right tail in forest green (#0a7a55) */}
      <path
        d="M78 93C94 93 103 82 103 70C103 61 97 56 91 58C86 59.5 85 65.5 89 68.5C92 70.8 91 76.5 85 79.5C81 81.5 76 82 73 82"
        stroke="#0A7A55"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Torso / sitting body in forest green (#0a7a55) */}
      <path
        d="M35 66C33 78 33 93 39 98C44 102 72 102 77 98C83 93 83 78 81 66C79 56 37 56 35 66Z"
        fill="#0A7A55"
      />

      {/* Left ear in forest green (#0a7a55) */}
      <path
        d="M27 44L25 19C24.8 15.8 28.2 14 30.8 16L48 29Z"
        fill="#0A7A55"
      />

      {/* Right ear in golden yellow (#ffd23f) */}
      <path
        d="M68 29L85.2 16C87.8 14 91.2 15.8 91 19L89 44Z"
        fill="#FFD23F"
      />

      {/* Rounded head in forest green (#0a7a55) */}
      <ellipse cx="58" cy="46" rx="33" ry="26" fill="#0A7A55" />

      {/* Eyes in deep pine (#10291f) */}
      <ellipse cx="45.5" cy="45.5" rx="4.2" ry="5.6" fill="#10291F" />
      <ellipse cx="70.5" cy="45.5" rx="4.2" ry="5.6" fill="#10291F" />

      {/* Cute rounded 'w' mouth in deep pine (#10291f) */}
      <path
        d="M51 54.5C52.5 57.8 56.2 57.8 58 54.8C59.8 57.8 63.5 57.8 65 54.5"
        stroke="#10291F"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Front paws in slightly lighter emerald (#0d8a61) with subtle division */}
      <rect x="42" y="84" width="15" height="17" rx="7.5" fill="#0D8A61" />
      <rect x="59" y="84" width="15" height="17" rx="7.5" fill="#0D8A61" />
      <line
        x1="58"
        y1="86"
        x2="58"
        y2="99"
        stroke="#086646"
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
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderRadius,
        background: "#FFFFFF",
        border: bordered ? "1.5px solid rgba(10, 122, 85, 0.22)" : undefined,
        boxShadow: bordered ? "0 1px 3px rgba(16, 41, 31, 0.08)" : undefined,
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
            src="/brand/hubly-gato.png"
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

/**
 * Hubly 2x2 Organic Petal Isotype (matches `/brand/hubly-logo.webp` left icon mark).
 * 3 forest green (`#0a7a55`) organic petals + 1 golden yellow (`#ffd23f`) top-right squircle.
 */
export function HublyPetalMarkSvg({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      {/* Top-left forest green petal */}
      <path
        d="M5 12C5 7.58172 8.58172 4 13 4H15C17.2091 4 19 5.79086 19 8V15C19 17.2091 17.2091 19 15 19H8C5.79086 19 5 16.4183 5 12Z"
        fill="#0A7A55"
      />
      {/* Top-right golden yellow larger squircle */}
      <rect x="21" y="3" width="16" height="16" rx="5.5" fill="#FFD23F" />
      {/* Bottom-left forest green petal */}
      <path
        d="M5 25C5 22.7909 6.79086 21 9 21H15C17.2091 21 19 22.7909 19 25V32C19 34.2091 17.2091 36 15 36H13C8.58172 36 5 32.4183 5 28V25Z"
        fill="#0A7A55"
      />
      {/* Bottom-right forest green petal */}
      <path
        d="M21 25C21 22.7909 22.7909 21 25 21H31C33.2091 21 35 22.7909 35 25V28C35 32.4183 31.4183 36 27 36H25C22.7909 36 21 34.2091 21 32V25Z"
        fill="#0A7A55"
      />
    </svg>
  );
}

/**
 * Hubly Logo & Wordmark component for Expanded (`hubly` / `/brand/hubly-logo.webp`)
 * and Collapsed (`h.` or `HublyCatAvatar`) Sidebar states.
 */
export function HublyLogoWordmark({
  collapsed = false,
  variant = "default",
  size = "md",
  showCatWhenCollapsed = false,
  showDot = true,
  className = "",
  style,
}: HublyLogoWordmarkProps) {
  const [logoImgError, setLogoImgError] = useState(false);

  const dimensions =
    size === "sm"
      ? { height: 22, fontSize: 19, iconSize: 22, catSize: 28 }
      : size === "lg"
        ? { height: 32, fontSize: 26, iconSize: 30, catSize: 36 }
        : { height: 26, fontSize: 22, iconSize: 25, catSize: 32 };

  if (collapsed) {
    if (showCatWhenCollapsed || variant === "cat") {
      return (
        <span
          className={`inline-flex items-center justify-center ${className}`.trim()}
          style={style}
        >
          <HublyCatAvatar size={dimensions.catSize} rounded="xl" />
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-baseline justify-center select-none ${className}`.trim()}
        style={{
          fontFamily:
            "var(--font-fraunces), var(--font-young-serif), var(--font-bricolage), Georgia, serif",
          fontWeight: 800,
          fontSize: dimensions.fontSize + 2,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: "var(--tinta-primary, #0C2E1F)",
          ...style,
        }}
        aria-label="hubly"
      >
        <span>h</span>
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "9999px",
            backgroundColor: "#0A7A55",
            boxShadow: "0 0 0 1.5px #FFD23F",
            marginLeft: 1.5,
            transform: "translateY(-1px)",
          }}
        />
      </span>
    );
  }

  if (variant === "image" && !logoImgError) {
    return (
      <span
        className={`inline-flex items-center gap-2 select-none ${className}`.trim()}
        style={style}
      >
        <img
          src="/brand/hubly-logo.webp"
          alt="hubly"
          height={dimensions.height}
          onError={() => setLogoImgError(true)}
          style={{
            height: dimensions.height,
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 select-none ${className}`.trim()}
      style={style}
      aria-label="hubly"
    >
      {variant === "cat" ? (
        <HublyCatAvatar size={dimensions.iconSize + 3} rounded="lg" />
      ) : (
        <HublyPetalMarkSvg size={dimensions.iconSize} />
      )}
      <span
        style={{
          fontFamily:
            "var(--font-bricolage), var(--font-fraunces), -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 800,
          fontSize: dimensions.fontSize,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          color: "var(--tinta-primary, #0C2E1F)",
          display: "inline-flex",
          alignItems: "baseline",
        }}
      >
        <span>hubly</span>
        {showDot ? (
          <span
            style={{
              display: "inline-block",
              width: 5.5,
              height: 5.5,
              borderRadius: "9999px",
              backgroundColor: "#FFD23F",
              border: "1.5px solid #0A7A55",
              marginLeft: 1.5,
              transform: "translateY(-1px)",
            }}
          />
        ) : null}
      </span>
    </span>
  );
}

/* ==========================================================================
   4. ILLUSTRATED MODULE 21224 ICONS (28x28 viewBox with #henry-rough filter)
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
        filter: rough ? "url(#henry-rough)" : undefined,
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
 * 1. HublyAvatarIcon / HenryAvatarIcon (28x28 illustrated vector icon of the Hubly cat `#0a7a55` + `#ffd23f`)
 */
export function HublyAvatarIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      {/* Tail */}
      <path
        d="M19.5 22.5C22.8 22.5 24.8 19.8 24.8 16.8C24.8 14.8 23.4 13.8 22 14.2C20.8 14.6 20.6 16 21.5 16.8"
        stroke="#0A7A55"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Sitting Body */}
      <path
        d="M8.5 15.8C8 18.8 8 22.2 9.5 23.5C11 24.5 17 24.5 18.5 23.5C20 22.2 20 18.8 19.5 15.8Z"
        fill="#0A7A55"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Left Ear (Forest Green #0A7A55) */}
      <path
        d="M6.5 11.2L6 4.5C6 3.8 6.8 3.4 7.4 3.9L11.8 7.4Z"
        fill="#0A7A55"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Right Ear (Golden Yellow #FFD23F) */}
      <path
        d="M16.2 7.4L20.6 3.9C21.2 3.4 22 3.8 22 4.5L21.5 11.2Z"
        fill="#FFD23F"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Head */}
      <ellipse
        cx="14"
        cy="11.4"
        rx="8"
        ry="6.4"
        fill="#0A7A55"
        stroke={INK}
        strokeWidth="1.4"
      />
      {/* Eyes (#10291F) */}
      <ellipse cx="11" cy="11.2" rx="1.15" ry="1.5" fill="#10291F" />
      <ellipse cx="17" cy="11.2" rx="1.15" ry="1.5" fill="#10291F" />
      {/* Cute 'w' mouth */}
      <path
        d="M12.2 13.5C12.7 14.4 13.5 14.4 14 13.6C14.5 14.4 15.3 14.4 15.8 13.5"
        stroke="#10291F"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Front paws (#0D8A61) */}
      <rect
        x="10.2"
        y="20"
        width="3.8"
        height="4.2"
        rx="1.9"
        fill="#0D8A61"
        stroke={INK}
        strokeWidth="1.1"
      />
      <rect
        x="14"
        y="20"
        width="3.8"
        height="4.2"
        rx="1.9"
        fill="#0D8A61"
        stroke={INK}
        strokeWidth="1.1"
      />
    </IconSvg>
  );
}

export const HenryAvatarIcon = HublyAvatarIcon;
export const HenryCatIcon = HublyCatAvatar;

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

/**
 * 2. Home / Inicio
 */
export function HublyHomeIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <ellipse cx="14" cy="24.5" rx="9" ry="1.1" fill={INK} opacity="0.12" />
      <rect
        x="18.2"
        y="5.5"
        width="2.8"
        height="5.5"
        rx="0.5"
        fill="#D66853"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path
        d="M5.5 13 L14 6 L22.5 13 V23 Q22.5 24 21.5 24 H6.5 Q5.5 24 5.5 23 Z"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6.3 13.5 H21.7 V15 H6.3 Z" fill="#EDE4CE" opacity="0.7" />
      <path
        d="M3.2 13.8 L14 4.8 L24.8 13.8 L23.2 15.6 L14 8 L4.8 15.6 Z"
        fill="#E2725B"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 24 V17.8 Q11.5 16 14 16 Q16.5 16 16.5 17.8 V24 Z"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="15.2" cy="20.2" r="0.6" fill={INK} />
      <circle
        cx="14"
        cy="11.5"
        r="1.6"
        fill="#FFF5D6"
        stroke={INK}
        strokeWidth="1.3"
      />
    </IconSvg>
  );
}
export const HenryHomeIcon = HublyHomeIcon;

/**
 * 3. Dashboard / Bento Grid
 */
export function HublyBentoIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <rect
        x="4"
        y="4.5"
        width="9"
        height="19"
        rx="2.4"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.6"
      />
      <path
        d="M6 7 H10"
        stroke="#FFF5D6"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <rect
        x="15.2"
        y="4.5"
        width="8.8"
        height="8.5"
        rx="2.2"
        fill="#8FA6CB"
        stroke={INK}
        strokeWidth="1.6"
      />
      <circle cx="19.6" cy="8.8" r="1.8" fill="#FBF6EA" opacity="0.85" />
      <rect
        x="15.2"
        y="15"
        width="8.8"
        height="8.5"
        rx="2.2"
        fill="#E8A598"
        stroke={INK}
        strokeWidth="1.6"
      />
      <path
        d="M17.5 20.5 L19.2 18.5 L20.6 19.8 L22 17.5"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}
export const HenryBentoIcon = HublyBentoIcon;

/**
 * 4. Chat / Speech Bubbles
 */
export function HublyChatIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <path
        d="M11 6.5 H22 Q24.5 6.5 24.5 9 V15.5 Q24.5 18 22 18 H20 L21.2 21 L17.2 18 H11 Q8.5 18 8.5 15.5 V9 Q8.5 6.5 11 6.5 Z"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 9.5 H17.5 Q20 9.5 20 12 V18.5 Q20 21 17.5 21 H10.5 L6.2 24 L7.2 21 H6 Q3.5 21 3.5 18.5 V12 Q3.5 9.5 6 9.5 Z"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="15.3" r="1.2" fill={INK} />
      <circle cx="11.8" cy="15.3" r="1.2" fill={INK} />
      <circle cx="15.1" cy="15.3" r="1.2" fill={INK} />
    </IconSvg>
  );
}
export const HenryChatIcon = HublyChatIcon;

/**
 * 5. Mi Espacio / Notebook
 */
export function HublyNotebookIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <g transform="rotate(-3 14 14)">
        <path
          d="M19 4.5 V10 L17.5 8.8 L16 10 V4.5 Z"
          fill="#E2725B"
          stroke={INK}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <rect
          x="6"
          y="4.5"
          width="16"
          height="19.5"
          rx="2.2"
          fill="#D89A5B"
          stroke={INK}
          strokeWidth="1.6"
        />
        <path
          d="M8.2 4.5 H6.8 Q6 4.5 6 5.5 V23 Q6 24 6.8 24 H8.2 Z"
          fill="#8E5B32"
          stroke={INK}
          strokeWidth="1.4"
        />
        <rect
          x="10.5"
          y="9"
          width="8.5"
          height="5"
          rx="1"
          fill="#FBF6EA"
          stroke={INK}
          strokeWidth="1.3"
        />
        <line
          x1="12"
          y1="11.5"
          x2="17.5"
          y2="11.5"
          stroke={INK}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M20.5 2.5 L21.8 4 L19.2 4.5 Z"
          fill="#6C77C1"
          opacity="0.9"
        />
      </g>
    </IconSvg>
  );
}
export const HenryNotebookIcon = HublyNotebookIcon;

/**
 * 6. Calendario / Tear-off Calendar
 */
export function HublyCalendarIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <rect
        x="4.2"
        y="6"
        width="19.6"
        height="18"
        rx="2.6"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.6"
      />
      <path
        d="M4.2 8.6 Q4.2 6 6.8 6 H21.2 Q23.8 6 23.8 8.6 V11.5 H4.2 Z"
        fill="#E2725B"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect
        x="8.2"
        y="3.8"
        width="2.2"
        height="4.4"
        rx="1.1"
        fill="#D6D1C4"
        stroke={INK}
        strokeWidth="1.4"
      />
      <rect
        x="17.6"
        y="3.8"
        width="2.2"
        height="4.4"
        rx="1.1"
        fill="#D6D1C4"
        stroke={INK}
        strokeWidth="1.4"
      />
      <circle cx="9" cy="15" r="1" fill={INK} opacity="0.55" />
      <circle cx="14" cy="15" r="1" fill={INK} opacity="0.55" />
      <circle
        cx="19"
        cy="15"
        r="1.8"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.2"
      />
      <circle cx="9" cy="19.5" r="1" fill={INK} opacity="0.55" />
      <circle cx="14" cy="19.5" r="1" fill={INK} opacity="0.55" />
      <circle cx="19" cy="19.5" r="1" fill={INK} opacity="0.55" />
    </IconSvg>
  );
}
export const HenryCalendarIcon = HublyCalendarIcon;

/**
 * 7. Núcleo de Marca / Brain
 */
export function HublyBrainIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <path
        d="M13.6 7 C10 6 7 8 7.2 11 C5 11.6 4.2 14.2 5.8 16 C4.8 18.2 6.5 20.8 9.2 20.6 C10.2 22.2 13.6 22 13.6 19.8 Z"
        fill="#F2A7B5"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14.4 7 C18 6 21 8 20.8 11 C23 11.6 23.8 14.2 22.2 16 C23.2 18.2 21.5 20.8 18.8 20.6 C17.8 22.2 14.4 22 14.4 19.8 Z"
        fill="#F7BAC6"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line
        x1="14"
        y1="6.8"
        x2="14"
        y2="20.8"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.5 11.2 Q11.5 12.2 11.2 14"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8.5 16.5 Q10.8 16 11.5 17.8"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18.5 11.2 Q16.5 12.2 16.8 14"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M19.5 16.5 Q17.2 16 16.5 17.8"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22.5 4 L23 5.5 L24.5 6 L23 6.5 L22.5 8 L22 6.5 L20.5 6 L22 5.5 Z"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}
export const HenryBrainIcon = HublyBrainIcon;

/**
 * 8. Content Manager / Manila Folder
 */
export function HublyFolderIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <path
        d="M4 8 Q4 6.2 5.8 6.2 H11 L13 8.5 H22.2 Q24 8.5 24 10.2 V21 Q24 22.5 22.2 22.5 H5.8 Q4 22.5 4 21 Z"
        fill="#DF9A2B"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="7.5"
        width="10.5"
        height="8"
        rx="1.2"
        transform="rotate(-4 12 11)"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.3"
      />
      <rect
        x="11.5"
        y="8"
        width="10"
        height="8"
        rx="1.2"
        transform="rotate(5 16 12)"
        fill="#DCE8F5"
        stroke={INK}
        strokeWidth="1.3"
      />
      <path
        d="M3.6 12.5 Q3.6 11 5.2 11 H22.8 Q24.4 11 24.2 12.5 L23.4 21.2 Q23.2 22.5 21.8 22.5 H6.2 Q4.8 22.5 4.6 21.2 Z"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line
        x1="8.5"
        y1="19.5"
        x2="14.5"
        y2="19.5"
        stroke="#FFF5D6"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </IconSvg>
  );
}
export const HenryFolderIcon = HublyFolderIcon;

/**
 * 9. Proyectos / Stacked Diamond Layers
 */
export function HublyLayersIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <path
        d="M14 14.5 L24 19 L14 23.5 L4 19 Z"
        fill="#8FA6CB"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 9.5 L24 14 L14 18.5 L4 14 Z"
        fill="#E8A598"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 4.5 L24 9 L14 13.5 L4 9 Z"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 8.5 L14 6.5 L18.5 8.5"
        stroke="#FFF5D6"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </IconSvg>
  );
}
export const HenryLayersIcon = HublyLayersIcon;

/**
 * 10. Social Media / Tactile 3D Hashtag (#)
 */
export function HublyHashIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <g transform="rotate(-4 14 14)">
        <rect
          x="4.5"
          y="9"
          width="19"
          height="3.2"
          rx="1.5"
          fill="#8FA6CB"
          stroke={INK}
          strokeWidth="1.5"
        />
        <rect
          x="4.5"
          y="15.8"
          width="19"
          height="3.2"
          rx="1.5"
          fill="#8FA6CB"
          stroke={INK}
          strokeWidth="1.5"
        />
        <rect
          x="8.8"
          y="4.5"
          width="3.2"
          height="19"
          rx="1.5"
          transform="skewX(-8)"
          fill="#6C77C1"
          stroke={INK}
          strokeWidth="1.5"
        />
        <rect
          x="16.2"
          y="4.5"
          width="3.2"
          height="19"
          rx="1.5"
          transform="skewX(-8)"
          fill="#6C77C1"
          stroke={INK}
          strokeWidth="1.5"
        />
      </g>
    </IconSvg>
  );
}
export const HenryHashIcon = HublyHashIcon;

/**
 * 11. Ads / Bullseye Target with Dart
 */
export function HublyTargetIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <circle
        cx="13.2"
        cy="14.8"
        r="9.2"
        fill="#E2725B"
        stroke={INK}
        strokeWidth="1.6"
      />
      <circle
        cx="13.2"
        cy="14.8"
        r="6"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.5"
      />
      <circle
        cx="13.2"
        cy="14.8"
        r="2.8"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.4"
      />
      <line
        x1="13.5"
        y1="14.5"
        x2="22.5"
        y2="5.5"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20.5 7.5 L21.2 4.2 L24.2 3.8 L23.5 6.8 Z"
        fill="#7EB77F"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 7.5 L23.8 6.8 L24.2 3.8 L21.2 4.5 Z"
        fill="#5E9C60"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}
export const HenryTargetIcon = HublyTargetIcon;

/**
 * 12. Clipboard / Primeros Pasos
 */
export function HublyClipboardIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <rect
        x="5"
        y="5.5"
        width="18"
        height="19.5"
        rx="2.6"
        fill="#C98A4B"
        stroke={INK}
        strokeWidth="1.6"
      />
      <rect
        x="7.2"
        y="8"
        width="13.6"
        height="14.8"
        rx="1.2"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.4"
      />
      <rect
        x="10"
        y="3.5"
        width="8"
        height="4"
        rx="1.4"
        fill="#D6D1C4"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path
        d="M9.5 12.5 L11 14 L13.5 11.2"
        stroke="#4E9A51"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="15.2"
        y1="12.8"
        x2="18.8"
        y2="12.8"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 17.5 L11 19 L13.5 16.2"
        stroke="#6C77C1"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="15.2"
        y1="17.8"
        x2="18.8"
        y2="17.8"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}
export const HenryClipboardIcon = HublyClipboardIcon;

/**
 * 13. Memo / Pinned Note
 */
export function HublyMemoIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <g transform="rotate(-3 14 15)">
        <path
          d="M5.5 6.5 H22.5 V18.5 L18 23 H5.5 Z"
          fill="#FFE885"
          stroke={INK}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M18 23 V18.5 H22.5 Z"
          fill="#E8C547"
          stroke={INK}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <line
          x1="8.8"
          y1="12"
          x2="19.2"
          y2="12"
          stroke={INK}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.75"
        />
        <line
          x1="8.8"
          y1="15.8"
          x2="16.5"
          y2="15.8"
          stroke={INK}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>
      <line
        x1="14"
        y1="6.5"
        x2="14"
        y2="9.2"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="14"
        cy="5.2"
        r="2.4"
        fill="#E25B45"
        stroke={INK}
        strokeWidth="1.4"
      />
      <circle cx="13.3" cy="4.5" r="0.6" fill="#FFD2C9" />
    </IconSvg>
  );
}
export const HenryMemoIcon = HublyMemoIcon;

/**
 * 14. Bell / Brass Notification Bell
 */
export function HublyBellIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <path
        d="M5 7.5 Q3.2 10 4.2 13"
        stroke="#6C77C1"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M23 7.5 Q24.8 10 23.8 13"
        stroke="#6C77C1"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="14"
        cy="5"
        r="1.6"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.4"
      />
      <circle
        cx="14"
        cy="22.2"
        r="2.4"
        fill="#DF9A2B"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path
        d="M14 6.2 C9.5 6.2 7.5 9.5 7.5 14.2 C7.5 17 5.5 18.8 5 19.8 H23 C22.5 18.8 20.5 17 20.5 14.2 C20.5 9.5 18.5 6.2 14 6.2 Z"
        fill="#6C77C1"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 9.5 Q10.8 8 12.5 7.8"
        stroke="#FFF5D6"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </IconSvg>
  );
}
export const HenryBellIcon = HublyBellIcon;

/**
 * 15. Sun + Cloud Weather Icon (Greeting banner)
 */
export function HublySunWeatherIcon(props: HublyIconProps) {
  return (
    <IconSvg {...props}>
      <g stroke="#6C77C1" strokeWidth="1.7" strokeLinecap="round">
        <line x1="10.5" y1="3.2" x2="10.5" y2="5" />
        <line x1="4.8" y1="5.5" x2="6.2" y2="6.8" />
        <line x1="16.2" y1="5.5" x2="14.8" y2="6.8" />
        <line x1="2.8" y1="11.2" x2="4.6" y2="11.2" />
      </g>
      <circle
        cx="10.8"
        cy="11.5"
        r="5.2"
        fill="#9099D3"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path
        d="M10.5 21.5 H21.2 C23.2 21.5 24.6 20.1 24.6 18.2 C24.6 16.5 23.3 15.1 21.6 15 C21.1 12.4 18.8 10.6 16.1 10.6 C13.5 10.6 11.4 12.2 10.7 14.6 C8.7 14.8 7.2 16.4 7.2 18.2 C7.2 20.1 8.7 21.5 10.5 21.5 Z"
        fill="#FBF6EA"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}
export const HenrySunWeatherIcon = HublySunWeatherIcon;

export const HUBLY_ICONS = {
  avatar: HublyAvatarIcon,
  henry: HublyAvatarIcon,
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

export const HENRY_ICONS = HUBLY_ICONS;
export type HublyIconKey = keyof typeof HUBLY_ICONS;
export type HenryIconKey = HublyIconKey;

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
export const PulseNavIcon = TrendingUp;
export const TeamNavIcon = Users;

