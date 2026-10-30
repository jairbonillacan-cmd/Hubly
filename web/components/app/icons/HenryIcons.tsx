"use client";

/**
 * Compatibility barrel for legacy `@/components/app/icons/HenryIcons` imports.
 * Re-exports the complete Hubly 1:1 icon system, SVG paper filters, Kraft notebook
 * silhouettes, and Hubly cat identity components (`HublyCatAvatar`, `HublyLogoWordmark`)
 * from `./HublyIcons`.
 */
export * from "./HublyIcons";
export {
  HublyCatAvatar as HenryCatIcon,
  HublyAvatarIcon as HenryAvatarIcon,
  RoughPaperSvgDefs as HenryRoughFilterDefs,
} from "./HublyIcons";
