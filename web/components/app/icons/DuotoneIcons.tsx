import React from "react";

/*
 * Iconos propios de Hubly: dos capas rellenas, sin trazo.
 * Heredan el color del texto; --hi-soft y --hi-strong lo fijan donde hace falta, como en el sidebar.
 */
interface DuotoneIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  title?: string;
  active?: boolean;
  rough?: boolean;
}

const SOFT = "var(--hi-soft, color-mix(in srgb, currentColor 30%, transparent))";
const STRONG = "var(--hi-strong, currentColor)";

function createDuotoneIcon(displayName: string, renderLayers: () => React.ReactNode) {
  const Component = ({
    size = 22,
    className = "",
    title,
    active: _active,
    rough: _rough,
    ...rest
  }: DuotoneIconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`.trim()}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {renderLayers()}
    </svg>
  );
  Component.displayName = displayName;
  return Component;
}

export const HublyHomeIcon = createDuotoneIcon("HublyHomeIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M11.36 3.45a1 1 0 0 1 1.28 0l8.1 6.87a1 1 0 0 1-.64 1.76H18.8V19a2 2 0 0 1-2 2H7.2a2 2 0 0 1-2-2v-6.92H3.9a1 1 0 0 1-.64-1.76l8.1-6.87Z"
    />
    <rect x="9.6" y="13.6" width="4.8" height="7.4" rx="1.3" fill={STRONG} />
  </>
));

export const HublyBentoIcon = createDuotoneIcon("HublyBentoIcon", () => (
  <>
    <rect x="3" y="3" width="8.2" height="18" rx="2.6" fill={SOFT} />
    <rect x="12.8" y="3" width="8.2" height="8.2" rx="2.6" fill={STRONG} />
    <rect x="12.8" y="12.8" width="8.2" height="8.2" rx="2.6" fill={SOFT} />
  </>
));

export const HublyChatIcon = createDuotoneIcon("HublyChatIcon", () => (
  <>
    <rect x="8" y="3" width="13.5" height="11" rx="3.2" fill={SOFT} />
    <path
      fill={STRONG}
      d="M6 8.5h9a3 3 0 0 1 3 3V16a3 3 0 0 1-3 3H9.6l-3.4 2.5a.7.7 0 0 1-1.1-.57V19A3 3 0 0 1 3 16v-4.5a3 3 0 0 1 3-3Z"
    />
    <circle cx="7.4" cy="13.8" r="1.05" fill={SOFT} />
    <circle cx="10.5" cy="13.8" r="1.05" fill={SOFT} />
    <circle cx="13.6" cy="13.8" r="1.05" fill={SOFT} />
  </>
));

export const HublyNotebookIcon = createDuotoneIcon("HublyNotebookIcon", () => (
  <>
    <rect x="4.5" y="2.8" width="15.5" height="18.4" rx="2.8" fill={SOFT} />
    <path fill={STRONG} d="M7.3 2.8h2v18.4h-2a2.8 2.8 0 0 1-2.8-2.8V5.6a2.8 2.8 0 0 1 2.8-2.8Z" />
    <rect x="11.6" y="7.2" width="5.8" height="2.1" rx="1.05" fill={STRONG} />
  </>
));

export const HublyCalendarIcon = createDuotoneIcon("HublyCalendarIcon", () => (
  <>
    <rect x="3" y="4.6" width="18" height="16.6" rx="3.2" fill={SOFT} />
    <path fill={STRONG} d="M6.2 4.6h11.6A3.2 3.2 0 0 1 21 7.8v2.4H3V7.8a3.2 3.2 0 0 1 3.2-3.2Z" />
    <rect x="7" y="2.6" width="2.2" height="4.6" rx="1.1" fill={STRONG} />
    <rect x="14.8" y="2.6" width="2.2" height="4.6" rx="1.1" fill={STRONG} />
    <circle cx="8" cy="14" r="1.2" fill={STRONG} />
    <circle cx="12" cy="14" r="1.2" fill={STRONG} />
    <circle cx="16" cy="14" r="1.2" fill={STRONG} />
    <circle cx="8" cy="17.6" r="1.2" fill={STRONG} />
    <circle cx="12" cy="17.6" r="1.2" fill={STRONG} />
  </>
));

/* Núcleo de marca: un hexágono con el centro encendido */
export const HublyBrainIcon = createDuotoneIcon("HublyBrainIcon", () => (
  <>
    <path
      fill={SOFT}
      stroke={SOFT}
      strokeWidth="1.8"
      strokeLinejoin="round"
      d="M12 3.2 19.6 7.6v8.8L12 20.8l-7.6-4.4V7.6L12 3.2Z"
    />
    <circle cx="12" cy="12" r="4.1" fill={STRONG} />
  </>
));

export const HublyFolderIcon = createDuotoneIcon("HublyFolderIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M3 7a3 3 0 0 1 3-3h3.5a2 2 0 0 1 1.5.67L12.3 6H18a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z"
    />
    <path fill={STRONG} d="M3 11.2h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6.8Z" />
  </>
));

export const HublyLayersIcon = createDuotoneIcon("HublyLayersIcon", () => (
  <>
    <path
      fill={SOFT}
      stroke={SOFT}
      strokeWidth="1.6"
      strokeLinejoin="round"
      d="m12 12.4 8.2 3.9L12 20.4l-8.2-4.1L12 12.4Z"
    />
    <path
      fill={STRONG}
      stroke={STRONG}
      strokeWidth="1.6"
      strokeLinejoin="round"
      d="m12 3.6 8.2 4.3-8.2 4.3-8.2-4.3L12 3.6Z"
    />
  </>
));

export const HublyHashIcon = createDuotoneIcon("HublyHashIcon", () => (
  <g strokeWidth="3" strokeLinecap="round">
    <path stroke={SOFT} d="M9.8 3.6 7.6 20.4M16.4 3.6l-2.2 16.8" />
    <path stroke={STRONG} d="M4.2 9h16.2M3.4 15h16.2" />
  </g>
));

export const HublyTargetIcon = createDuotoneIcon("HublyTargetIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.2" fill={SOFT} />
    <circle cx="12" cy="12" r="5.4" fill={STRONG} />
    <circle cx="12" cy="12" r="1.9" fill={SOFT} />
  </>
));

export const HublyClipboardIcon = createDuotoneIcon("HublyClipboardIcon", () => (
  <>
    <rect x="4.4" y="4" width="15.2" height="18" rx="3" fill={SOFT} />
    <rect x="8.4" y="2.2" width="7.2" height="4.6" rx="1.7" fill={STRONG} />
    <rect x="8" y="11" width="8" height="1.9" rx="0.95" fill={STRONG} />
    <rect x="8" y="15.2" width="5.2" height="1.9" rx="0.95" fill={STRONG} />
  </>
));

export const HublyMemoIcon = createDuotoneIcon("HublyMemoIcon", () => (
  <>
    <rect x="3.6" y="3" width="14.4" height="18" rx="3" fill={SOFT} />
    <path
      fill={STRONG}
      d="M20.6 8.3a1.7 1.7 0 0 0-2.4 0l-7 7a1 1 0 0 0-.26.45l-.84 3.02a.5.5 0 0 0 .62.61l3.02-.84a1 1 0 0 0 .44-.26l7-7a1.7 1.7 0 0 0 0-2.4l-.58-.58Z"
    />
  </>
));

export const HublyBellIcon = createDuotoneIcon("HublyBellIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M12 2.8a6.6 6.6 0 0 0-6.6 6.6c0 4.2-1.3 5.7-2 6.7a.9.9 0 0 0 .74 1.4h15.72a.9.9 0 0 0 .74-1.4c-.7-1-2-2.5-2-6.7A6.6 6.6 0 0 0 12 2.8Z"
    />
    <path fill={STRONG} d="M9.3 19.1a2.8 2.8 0 0 0 5.4 0H9.3Z" />
  </>
));

export const HublySunWeatherIcon = createDuotoneIcon("HublySunWeatherIcon", () => (
  <>
    <circle cx="9.2" cy="9.2" r="4.6" fill={STRONG} />
    <path
      fill={SOFT}
      d="M8.6 20.2a4.3 4.3 0 0 1-.4-8.58 5.5 5.5 0 0 1 10.5 1.14 3.8 3.8 0 0 1-.8 7.44H8.6Z"
    />
  </>
));

export const HublyPeopleIcon = createDuotoneIcon("HublyPeopleIcon", () => (
  <>
    <circle cx="16.6" cy="8.6" r="3.1" fill={SOFT} />
    <path
      fill={SOFT}
      d="M13.6 14.7c.9-.5 1.9-.8 3-.8 2.7 0 4.6 2 4.9 4.9.05.6-.4 1-.95 1h-4.2c-.2-2-1.2-3.8-2.75-5.1Z"
    />
    <circle cx="9" cy="8" r="3.8" fill={STRONG} />
    <path
      fill={STRONG}
      d="M2.6 19.9c.3-3.9 2.8-6.6 6.4-6.6s6.1 2.7 6.4 6.6c.05.6-.4 1.1-1 1.1H3.6c-.6 0-1.05-.5-1-1.1Z"
    />
  </>
));

export const HublyTagIcon = createDuotoneIcon("HublyTagIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M3 5a2 2 0 0 1 2-2h6.2a2 2 0 0 1 1.42.59l8 8a2 2 0 0 1 0 2.82l-6.2 6.2a2 2 0 0 1-2.82 0l-8-8A2 2 0 0 1 3 11.2V5Z"
    />
    <circle cx="8.1" cy="8.1" r="2.1" fill={STRONG} />
  </>
));

export const HublyBoltIcon = createDuotoneIcon("HublyBoltIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <path
      fill={STRONG}
      d="M12.9 5.1 7.4 12.7a.7.7 0 0 0 .57 1.1h2.9l-.6 4.5c-.08.55.62.85.95.4l5.4-7.5a.7.7 0 0 0-.57-1.1h-2.8l.6-4.6c.08-.55-.62-.85-.95-.4Z"
    />
  </>
));

export const HublyImageIcon = createDuotoneIcon("HublyImageIcon", () => (
  <>
    <rect x="2.8" y="4" width="18.4" height="16" rx="3.4" fill={SOFT} />
    <circle cx="8.4" cy="9.4" r="1.9" fill={STRONG} />
    <path
      fill={STRONG}
      d="M5.2 18.4h13.6c.8 0 1.3-.9.8-1.6l-3.1-4.1a1.2 1.2 0 0 0-1.9 0l-2 2.5-1.5-1.8a1.2 1.2 0 0 0-1.9 0l-4.7 3.4c-.6.5-.3 1.6.7 1.6Z"
    />
  </>
));

export const HublyChartIcon = createDuotoneIcon("HublyChartIcon", () => (
  <>
    <rect x="3.2" y="12" width="4.8" height="9" rx="1.7" fill={SOFT} />
    <rect x="9.6" y="7" width="4.8" height="14" rx="1.7" fill={STRONG} />
    <rect x="16" y="3" width="4.8" height="18" rx="1.7" fill={SOFT} />
  </>
));

export const HublyDocumentIcon = createDuotoneIcon("HublyDocumentIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M7 2.6h6.6c.5 0 1 .2 1.4.6l4.2 4.2c.4.4.6.9.6 1.4v9.8a2.8 2.8 0 0 1-2.8 2.8H7a2.8 2.8 0 0 1-2.8-2.8V5.4A2.8 2.8 0 0 1 7 2.6Z"
    />
    <path fill={STRONG} d="M13.6 2.6c.5 0 1 .2 1.4.6l4.2 4.2c.4.4.6.9.6 1.4h-4.6a1.6 1.6 0 0 1-1.6-1.6V2.6Z" />
    <rect x="7.6" y="12.2" width="8.8" height="1.8" rx="0.9" fill={STRONG} />
    <rect x="7.6" y="15.6" width="5.6" height="1.8" rx="0.9" fill={STRONG} />
  </>
));

export const HublyPulseIcon = createDuotoneIcon("HublyPulseIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <path
      stroke={STRONG}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12.6h2.8l2-5.2 3.8 9.4 1.9-4.2H19"
    />
  </>
));

export const HublyPersonIcon = createDuotoneIcon("HublyPersonIcon", () => (
  <>
    <circle cx="12" cy="7.6" r="4.4" fill={SOFT} />
    <path
      fill={STRONG}
      d="M4 20c.4-4 3.7-6.7 8-6.7s7.6 2.7 8 6.7c.06.6-.4 1.1-1 1.1H5c-.6 0-1.06-.5-1-1.1Z"
    />
  </>
));


export const HublyUploadIcon = createDuotoneIcon("HublyUploadIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M3.4 14.8a1.6 1.6 0 0 1 3.2 0v2c0 .6.4 1 1 1h8.8c.6 0 1-.4 1-1v-2a1.6 1.6 0 0 1 3.2 0v2.2a4 4 0 0 1-4 4H7.4a4 4 0 0 1-4-4v-2.2Z"
    />
    <path
      stroke={STRONG}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 14.6V4.6M7.8 8.6 12 4.4l4.2 4.2"
    />
  </>
));

export const HublyLibraryIcon = createDuotoneIcon("HublyLibraryIcon", () => (
  <>
    <rect x="3" y="3.6" width="5" height="16.8" rx="1.8" fill={SOFT} />
    <rect x="9.6" y="3.6" width="5" height="16.8" rx="1.8" fill={STRONG} />
    <rect x="16.2" y="4.2" width="4.8" height="16.4" rx="1.8" fill={SOFT} transform="rotate(-9 18.6 12.4)" />
  </>
));


export const HublySparkIcon = createDuotoneIcon("HublySparkIcon", () => (
  <>
    <path
      fill={STRONG}
      d="M10 3.6c.2-.7 1.2-.7 1.4 0l1 3.7a4 4 0 0 0 2.8 2.8l3.7 1c.7.2.7 1.2 0 1.4l-3.7 1a4 4 0 0 0-2.8 2.8l-1 3.7c-.2.7-1.2.7-1.4 0l-1-3.7A4 4 0 0 0 6.2 14l-3.7-1c-.7-.2-.7-1.2 0-1.4l3.7-1A4 4 0 0 0 9 7.8l1-4.2Z"
    />
    <path
      fill={SOFT}
      d="M18.4 2.8c.1-.4.7-.4.8 0l.4 1.5c.1.5.5.9 1 1l1.5.4c.4.1.4.7 0 .8l-1.5.4c-.5.1-.9.5-1 1l-.4 1.5c-.1.4-.7.4-.8 0L18 8.9c-.1-.5-.5-.9-1-1l-1.5-.4c-.4-.1-.4-.7 0-.8l1.5-.4c.5-.1.9-.5 1-1l.4-1.5Z"
    />
  </>
));

export const HublyPresentationIcon = createDuotoneIcon("HublyPresentationIcon", () => (
  <>
    <rect x="2.8" y="3.4" width="18.4" height="13.4" rx="2.8" fill={SOFT} />
    <rect x="6.4" y="10.4" width="2.6" height="3.4" rx="1" fill={STRONG} />
    <rect x="10.7" y="7.6" width="2.6" height="6.2" rx="1" fill={STRONG} />
    <rect x="15" y="9.2" width="2.6" height="4.6" rx="1" fill={STRONG} />
    <path stroke={STRONG} strokeWidth="2.2" strokeLinecap="round" d="M12 17v3.6M8.4 21h7.2" />
  </>
));

export const HublyLinkIcon = createDuotoneIcon("HublyLinkIcon", () => (
  <g strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path stroke={STRONG} d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </g>
));

export const HublySearchIcon = createDuotoneIcon("HublySearchIcon", () => (
  <>
    <circle cx="10.6" cy="10.6" r="7.6" fill={SOFT} />
    <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" d="M16.4 16.4 21 21" />
  </>
));

export const HublyBuildingIcon = createDuotoneIcon("HublyBuildingIcon", () => (
  <>
    <rect x="4" y="2.8" width="16" height="18.4" rx="3" fill={SOFT} />
    <rect x="8" y="7" width="2.8" height="2.8" rx="0.9" fill={STRONG} />
    <rect x="13.2" y="7" width="2.8" height="2.8" rx="0.9" fill={STRONG} />
    <rect x="8" y="11.6" width="2.8" height="2.8" rx="0.9" fill={STRONG} />
    <rect x="13.2" y="11.6" width="2.8" height="2.8" rx="0.9" fill={STRONG} />
    <rect x="9.8" y="16.4" width="4.4" height="4.8" rx="1.1" fill={STRONG} />
  </>
));

export const HublyMailIcon = createDuotoneIcon("HublyMailIcon", () => (
  <>
    <rect x="2.6" y="4.6" width="18.8" height="14.8" rx="3.4" fill={SOFT} />
    <path stroke={STRONG} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="m4.4 8 6.4 4.6a2 2 0 0 0 2.4 0L19.6 8" />
  </>
));

export const HublyGlobeIcon = createDuotoneIcon("HublyGlobeIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <path stroke={STRONG} strokeWidth="2" strokeLinecap="round" d="M3.4 12h17.2M12 3c-5 5.6-5 12.4 0 18M12 3c5 5.6 5 12.4 0 18" />
  </>
));

export const HublyMegaphoneIcon = createDuotoneIcon("HublyMegaphoneIcon", () => (
  <>
    <path fill={SOFT} d="M3 10.2c0-.9.7-1.6 1.6-1.6h3.2l8.6-4.7c1-.6 2.3.2 2.3 1.4v13.4c0 1.2-1.3 2-2.3 1.4l-8.6-4.7H4.6c-.9 0-1.6-.7-1.6-1.6v-3.6Z" />
    <path fill={STRONG} d="M7.4 15.4h3.2l1 4.2a1.3 1.3 0 0 1-1.3 1.6H9.5c-.6 0-1.1-.4-1.3-1l-.8-4.8Z" />
    <path stroke={STRONG} strokeWidth="2.2" strokeLinecap="round" d="M21.4 10v4" />
  </>
));

export const HublySettingsIcon = createDuotoneIcon("HublySettingsIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M10.2 2.8h3.6l.5 2.5c.5.2 1 .5 1.5.8l2.4-.8 1.8 3.1-1.9 1.7c.1.6.1 1.2 0 1.8l1.9 1.7-1.8 3.1-2.4-.8c-.5.3-1 .6-1.5.8l-.5 2.5h-3.6l-.5-2.5c-.5-.2-1-.5-1.5-.8l-2.4.8-1.8-3.1 1.9-1.7a6 6 0 0 1 0-1.8L4 8.4l1.8-3.1 2.4.8c.5-.3 1-.6 1.5-.8l.5-2.5Z"
    />
    <circle cx="12" cy="12" r="3.3" fill={STRONG} />
  </>
));

export const HublyShieldIcon = createDuotoneIcon("HublyShieldIcon", () => (
  <>
    <path fill={SOFT} d="M12 2.6 19.8 5.4c.5.2.8.6.8 1.1V12c0 4.6-3.3 7.9-8.1 9.3-.3.1-.7.1-1 0C6.7 19.9 3.4 16.6 3.4 12V6.500c0-.5.3-.9.8-1.100L12 2.600Z" />
    <path stroke={STRONG} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" d="m8.6 11.8 2.4 2.4 4.4-4.4" />
  </>
));

export const HublyCameraIcon = createDuotoneIcon("HublyCameraIcon", () => (
  <>
    <path fill={SOFT} d="M9.2 3.800h5.600c.7 0 1.3.4 1.6 1l.8 1.600h2a2.8 2.8 0 0 1 2.8 2.800v8.400a2.8 2.8 0 0 1-2.8 2.800H4.800A2.8 2.8 0 0 1 2 17.600V9.200a2.8 2.8 0 0 1 2.8-2.800h2l.8-1.600c.3-.6.9-1 1.6-1Z" />
    <circle cx="12" cy="13" r="3.8" fill={STRONG} />
  </>
));

export const HublyPlugIcon = createDuotoneIcon("HublyPlugIcon", () => (
  <>
    <rect x="7.8" y="2.6" width="2.6" height="6" rx="1.3" fill={STRONG} />
    <rect x="13.6" y="2.6" width="2.6" height="6" rx="1.3" fill={STRONG} />
    <path fill={SOFT} d="M5.4 7.800h13.200c.6 0 1 .4 1 1v2.400a7 7 0 0 1-6.2 7V21.400h-2.800v-3.200a7 7 0 0 1-6.2-7V8.800c0-.6.4-1 1-1Z" />
  </>
));

export const HublySunIcon = createDuotoneIcon("HublySunIcon", () => (
  <>
    <circle cx="12" cy="12" r="5.2" fill={STRONG} />
    <path stroke={SOFT} strokeWidth="2.4" strokeLinecap="round" d="M12 2.800v1.800M12 19.400v1.800M2.8 12h1.800M19.4 12h1.800M5.5 5.500l1.3 1.300M17.2 17.200l1.3 1.300M5.5 18.500l1.3-1.300M17.2 6.800l1.3-1.3" />
  </>
));

export const HublyMoonIcon = createDuotoneIcon("HublyMoonIcon", () => (
  <>
    <path fill={STRONG} d="M20.2 14.200A8.6 8.6 0 0 1 9.8 3.800c.2-.7-.5-1.3-1.2-1a9.8 9.8 0 1 0 12.8 12.600c.3-.7-.5-1.4-1.2-1.200Z" />
    <circle cx="16.8" cy="6.4" r="1.6" fill={SOFT} />
  </>
));

export const HublyCardIcon = createDuotoneIcon("HublyCardIcon", () => (
  <>
    <rect x="2.4" y="4.8" width="19.2" height="14.4" rx="3.2" fill={SOFT} />
    <rect x="2.4" y="8.4" width="19.2" height="3.2" fill={STRONG} />
    <rect x="5.6" y="14.6" width="5" height="1.9" rx="0.950" fill={STRONG} />
  </>
));

export const HublyGiftIcon = createDuotoneIcon("HublyGiftIcon", () => (
  <>
    <rect x="3.8" y="11" width="16.4" height="10" rx="2.4" fill={SOFT} />
    <rect x="2.8" y="7" width="18.4" height="4.6" rx="1.8" fill={STRONG} />
    <rect x="10.7" y="7" width="2.6" height="14" fill={STRONG} />
    <path stroke={STRONG} strokeWidth="2" strokeLinecap="round" d="M12 7C10 3 6.4 3 7 5.4 7.3 6.6 9 7 12 7Zm0 0c2-4 5.6-4 5 -1.6-.3 1.2-2 1.6-5 1.600Z" />
  </>
));

export const HublyLockIcon = createDuotoneIcon("HublyLockIcon", () => (
  <>
    <path stroke={STRONG} strokeWidth="2.4" strokeLinecap="round" d="M7.8 11V7.600a4.2 4.2 0 0 1 8.4 0V11" />
    <rect x="4.2" y="10.2" width="15.6" height="11" rx="3" fill={SOFT} />
    <circle cx="12" cy="15.6" r="2" fill={STRONG} />
  </>
));

export const HublyArchiveIcon = createDuotoneIcon("HublyArchiveIcon", () => (
  <>
    <rect x="4" y="9" width="16" height="12" rx="2.4" fill={SOFT} />
    <rect x="2.6" y="3.6" width="18.8" height="5.6" rx="1.8" fill={STRONG} />
    <rect x="9" y="12.4" width="6" height="2" rx="1" fill={STRONG} />
  </>
));

export const HublyClockIcon = createDuotoneIcon("HublyClockIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <path stroke={STRONG} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" d="M12 6.800V12l3.4 2" />
  </>
));

export const HublyAwardIcon = createDuotoneIcon("HublyAwardIcon", () => (
  <>
    <path fill={STRONG} d="m7.4 13.4-1.6 6.800c-.1.6.5 1 1 .8l5.2-2.6 5.2 2.600c.5.2 1.1-.2 1-.8l-1.6-6.800H7.400Z" />
    <circle cx="12" cy="9.4" r="6.8" fill={SOFT} />
    <circle cx="12" cy="9.4" r="2.8" fill={STRONG} />
  </>
));

export const HublyHeadsetIcon = createDuotoneIcon("HublyHeadsetIcon", () => (
  <>
    <path stroke={SOFT} strokeWidth="2.4" strokeLinecap="round" d="M4.2 14v-2a7.8 7.8 0 0 1 15.6 0v2" />
    <rect x="2.8" y="12.6" width="4.8" height="7.4" rx="2.2" fill={STRONG} />
    <rect x="16.4" y="12.6" width="4.8" height="7.4" rx="2.2" fill={STRONG} />
  </>
));

export const HublyRowsIcon = createDuotoneIcon("HublyRowsIcon", () => (
  <>
    <rect x="3" y="3.6" width="18" height="4.8" rx="1.9" fill={STRONG} />
    <rect x="3" y="9.6" width="18" height="4.8" rx="1.9" fill={SOFT} />
    <rect x="3" y="15.6" width="18" height="4.8" rx="1.9" fill={SOFT} />
  </>
));

export const HublyKanbanIcon = createDuotoneIcon("HublyKanbanIcon", () => (
  <>
    <rect x="3" y="3" width="5.2" height="18" rx="2" fill={SOFT} />
    <rect x="9.4" y="3" width="5.2" height="12" rx="2" fill={STRONG} />
    <rect x="15.8" y="3" width="5.2" height="15" rx="2" fill={SOFT} />
  </>
));

export const HublyTableIcon = createDuotoneIcon("HublyTableIcon", () => (
  <>
    <rect x="3" y="3.6" width="18" height="16.8" rx="3" fill={SOFT} />
    <path fill={STRONG} d="M6 3.6h12a3 3 0 0 1 3 3v2.2H3V6.6a3 3 0 0 1 3-3Z" />
    <rect x="11.1" y="8.8" width="1.8" height="11.6" fill={STRONG} />
  </>
));

export const HublyTimelineIcon = createDuotoneIcon("HublyTimelineIcon", () => (
  <>
    <rect x="3" y="4" width="11" height="4.4" rx="2.2" fill={STRONG} />
    <rect x="7.4" y="9.8" width="13.6" height="4.4" rx="2.2" fill={SOFT} />
    <rect x="5" y="15.6" width="9" height="4.4" rx="2.2" fill={STRONG} />
  </>
));

export const HublyPinIcon = createDuotoneIcon("HublyPinIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M8.4 3h7.2c.7 0 1.1.7.8 1.3l-1.2 2.1.8 5.2 2.5 2.2c.6.5.2 1.4-.6 1.4H6.1c-.8 0-1.2-.9-.6-1.4L8 11.6l.8-5.2-1.2-2.1C7.3 3.7 7.7 3 8.4 3Z"
    />
    <path stroke={STRONG} strokeWidth="2.4" strokeLinecap="round" d="M12 15.8v5.4" />
  </>
));

export const HublyInfoIcon = createDuotoneIcon("HublyInfoIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <circle cx="12" cy="7.8" r="1.5" fill={STRONG} />
    <rect x="10.8" y="10.6" width="2.4" height="7" rx="1.2" fill={STRONG} />
  </>
));

export const HublyCheckCircleIcon = createDuotoneIcon("HublyCheckCircleIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <path stroke={STRONG} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" d="m7.6 12.2 3 3 5.8-6" />
  </>
));

export const HublyPlusIcon = createDuotoneIcon("HublyPlusIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
));

export const HublyMinusIcon = createDuotoneIcon("HublyMinusIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
));

export const HublyCloseIcon = createDuotoneIcon("HublyCloseIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
));

export const HublyCheckIcon = createDuotoneIcon("HublyCheckIcon", () => (
  <path stroke={STRONG} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="m5 12.8 4.6 4.6L19 7.6" />
));

export const HublyChevronRightIcon = createDuotoneIcon("HublyChevronRightIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="m9.5 5.5 6.5 6.5-6.5 6.5" />
));

export const HublyChevronLeftIcon = createDuotoneIcon("HublyChevronLeftIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5 8 12l6.5 6.5" />
));

export const HublyChevronDownIcon = createDuotoneIcon("HublyChevronDownIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="m5.5 9.5 6.5 6.5 6.5-6.5" />
));

export const HublyChevronUpIcon = createDuotoneIcon("HublyChevronUpIcon", () => (
  <path stroke={STRONG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="m5.5 14.5 6.5-6.5 6.5 6.5" />
));

export const HublyArrowRightIcon = createDuotoneIcon("HublyArrowRightIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M4.5 12h13" />
    <path stroke={STRONG} d="m13 6 6 6-6 6" />
  </g>
));

export const HublyArrowLeftIcon = createDuotoneIcon("HublyArrowLeftIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M19.5 12h-13" />
    <path stroke={STRONG} d="M11 6l-6 6 6 6" />
  </g>
));

export const HublyArrowUpIcon = createDuotoneIcon("HublyArrowUpIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M12 19.5v-13" />
    <path stroke={STRONG} d="M6 11l6-6 6 6" />
  </g>
));

export const HublyArrowDownIcon = createDuotoneIcon("HublyArrowDownIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M12 4.5v13" />
    <path stroke={STRONG} d="m6 13 6 6 6-6" />
  </g>
));

export const HublySortIcon = createDuotoneIcon("HublySortIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M8 5v14M16 19V5" />
    <path stroke={STRONG} d="m4.5 15.5 3.5 3.5 3.5-3.5M12.5 8.5 16 5l3.5 3.5" />
  </g>
));

export const HublyUndoIcon = createDuotoneIcon("HublyUndoIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M4.5 9.5H15a4.8 4.8 0 0 1 0 9.6h-3" />
    <path stroke={STRONG} d="M9 5 4.5 9.5 9 14" />
  </g>
));

export const HublyRedoIcon = createDuotoneIcon("HublyRedoIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M19.5 9.5H9a4.8 4.8 0 0 0 0 9.6h3" />
    <path stroke={STRONG} d="m15 5 4.5 4.5L15 14" />
  </g>
));

export const HublyEnterIcon = createDuotoneIcon("HublyEnterIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M19 5v5.5a3.5 3.5 0 0 1-3.5 3.5H6" />
    <path stroke={STRONG} d="m9.5 9.5-4.5 4.5 4.5 4.5" />
  </g>
));

export const HublyRefreshIcon = createDuotoneIcon("HublyRefreshIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M19.7 12a7.7 7.7 0 1 1-2.4-5.6" />
    <path stroke={STRONG} d="M19.8 3.2v4.5h-4.5" />
  </g>
));

export const HublyExpandIcon = createDuotoneIcon("HublyExpandIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M5 19 19 5" />
    <path stroke={STRONG} d="M13 5h6v6M11 19H5v-6" />
  </g>
));

export const HublyMenuIcon = createDuotoneIcon("HublyMenuIcon", () => (
  <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path stroke={SOFT} d="M4 12h16M4 18h16" />
    <path stroke={STRONG} d="M4 6h16" />
  </g>
));


export const HublyMoreIcon = createDuotoneIcon("HublyMoreIcon", () => (
  <>
    <circle cx="5" cy="12" r="2.3" fill={STRONG} />
    <circle cx="12" cy="12" r="2.3" fill={STRONG} />
    <circle cx="19" cy="12" r="2.3" fill={STRONG} />
  </>
));

export const HublyCopyIcon = createDuotoneIcon("HublyCopyIcon", () => (
  <>
    <rect x="3" y="3" width="13.4" height="13.4" rx="3" fill={SOFT} />
    <rect x="7.6" y="7.6" width="13.4" height="13.4" rx="3" fill={STRONG} />
  </>
));

export const HublyPencilIcon = createDuotoneIcon("HublyPencilIcon", () => (
  <>
    <path fill={STRONG} d="M15.9 3.9a2.6 2.6 0 0 1 3.7 0l.5.5a2.6 2.6 0 0 1 0 3.7L18.4 9.8 14.2 5.6l1.7-1.7Z" />
    <path fill={SOFT} d="M12.9 6.9 17.1 11.1 8.3 19.9a2 2 0 0 1-.9.5l-3.7 1a.9.9 0 0 1-1.1-1.1l1-3.7a2 2 0 0 1 .5-.9l8.8-8.9Z" />
  </>
));

export const HublyTrashIcon = createDuotoneIcon("HublyTrashIcon", () => (
  <>
    <path fill={SOFT} d="M5.2 7.8h13.6l-.9 11.2a2.4 2.4 0 0 1-2.4 2.2H8.5a2.4 2.4 0 0 1-2.4-2.2l-.9-11.2Z" />
    <rect x="3" y="4.8" width="18" height="3" rx="1.5" fill={STRONG} />
    <rect x="9" y="2.8" width="6" height="3" rx="1.5" fill={STRONG} />
    <path stroke={STRONG} strokeWidth="2" strokeLinecap="round" d="M10 11.4v5.8M14 11.4v5.8" />
  </>
));

export const HublySendIcon = createDuotoneIcon("HublySendIcon", () => (
  <>
    <path fill={SOFT} d="M20.3 3.1 3.5 9.6c-.9.3-.9 1.6 0 2l6.2 2.7 2.7 6.2c.4.9 1.7.9 2 0l6.5-16.8c.3-.8-.5-1.5-1.2-1.2Z" />
    <path stroke={STRONG} strokeWidth="2.4" strokeLinecap="round" d="m10 14 5-5" />
  </>
));

export const HublyPaperclipIcon = createDuotoneIcon("HublyPaperclipIcon", () => (
  <path
    stroke={STRONG}
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    d="m20 11.5-8 8a5.2 5.2 0 0 1-7.4-7.4l8.5-8.5a3.5 3.5 0 0 1 4.9 4.9l-8 8a1.7 1.7 0 0 1-2.5-2.5l7.4-7.3"
  />
));

export const HublyEyeIcon = createDuotoneIcon("HublyEyeIcon", () => (
  <>
    <path fill={SOFT} d="M12 5C6.8 5 3.2 9.1 2 11.3c-.2.4-.2 1 0 1.4C3.2 14.9 6.8 19 12 19s8.8-4.1 10-6.3c.2-.4.2-1 0-1.4C20.8 9.1 17.2 5 12 5Z" />
    <circle cx="12" cy="12" r="3.6" fill={STRONG} />
  </>
));

export const HublyEyeOffIcon = createDuotoneIcon("HublyEyeOffIcon", () => (
  <>
    <path fill={SOFT} d="M12 5C6.8 5 3.2 9.1 2 11.3c-.2.4-.2 1 0 1.4C3.2 14.9 6.8 19 12 19s8.8-4.1 10-6.3c.2-.4.2-1 0-1.4C20.8 9.1 17.2 5 12 5Z" />
    <path stroke={STRONG} strokeWidth="2.8" strokeLinecap="round" d="M4.5 4.5l15 15" />
  </>
));

export const HublySlidersIcon = createDuotoneIcon("HublySlidersIcon", () => (
  <>
    <path stroke={SOFT} strokeWidth="2.6" strokeLinecap="round" d="M3.5 7.5h17M3.5 16.5h17" />
    <circle cx="9" cy="7.5" r="3.2" fill={STRONG} />
    <circle cx="15.5" cy="16.5" r="3.2" fill={STRONG} />
  </>
));

export const HublyFilterIcon = createDuotoneIcon("HublyFilterIcon", () => (
  <>
    <path fill={SOFT} d="M4.3 3.8h15.4c.9 0 1.4 1 .8 1.7L14.8 12H9.2L3.5 5.5c-.6-.7-.1-1.7.8-1.7Z" />
    <path fill={STRONG} d="M9.2 12h5.6v6.4c0 .4-.2.7-.5.9l-3.4 2c-.7.4-1.7-.1-1.7-.900V12Z" />
  </>
));

export const HublyExternalIcon = createDuotoneIcon("HublyExternalIcon", () => (
  <>
    <rect x="3" y="5" width="16" height="16" rx="3.4" fill={SOFT} />
    <path stroke={STRONG} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" d="M12 12 20.5 3.5M14.5 3.5h6v6" />
  </>
));

export const HublyPrinterIcon = createDuotoneIcon("HublyPrinterIcon", () => (
  <>
    <rect x="7" y="2.8" width="10" height="6.4" rx="1.6" fill={STRONG} />
    <rect x="2.8" y="8" width="18.4" height="9.6" rx="3" fill={SOFT} />
    <rect x="7" y="14" width="10" height="7.2" rx="1.6" fill={STRONG} />
  </>
));


export const HublySmileIcon = createDuotoneIcon("HublySmileIcon", () => (
  <>
    <circle cx="12" cy="12" r="9.4" fill={SOFT} />
    <circle cx="8.8" cy="10" r="1.5" fill={STRONG} />
    <circle cx="15.2" cy="10" r="1.5" fill={STRONG} />
    <path stroke={STRONG} strokeWidth="2.3" strokeLinecap="round" d="M8 14.4a4.8 4.8 0 0 0 8 0" />
  </>
));

export const HublySaveIcon = createDuotoneIcon("HublySaveIcon", () => (
  <>
    <path fill={SOFT} d="M5.8 3h10.3c.5 0 1 .2 1.3.5l3.1 3.1c.3.3.5.8.5 1.3v10.3a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 18.2V5.8A2.8 2.8 0 0 1 5.8 3Z" />
    <rect x="7" y="13" width="10" height="8" rx="1.4" fill={STRONG} />
    <rect x="7.6" y="3" width="7" height="4.8" rx="1" fill={STRONG} />
  </>
));

export const HublyLogOutIcon = createDuotoneIcon("HublyLogOutIcon", () => (
  <>
    <path fill={SOFT} d="M6 3h7a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
    <path stroke={STRONG} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" d="M10 12h11M17 8l4 4-4 4" />
  </>
));

export const HublyDownloadIcon = createDuotoneIcon("HublyDownloadIcon", () => (
  <>
    <path fill={SOFT} d="M3 15.4a1.4 1.4 0 0 1 2.8 0v2a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1v-2a1.400 1.400 0 0 1 2.800 0v2a3.800 3.800 0 0 1-3.800 3.800H6.800A3.800 3.800 0 0 1 3 17.400v-2Z" />
    <path stroke={STRONG} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" d="M12 3.400v11M7.800 10.600 12 14.800l4.200-4.200" />
  </>
));

export const HublyMusicIcon = createDuotoneIcon("HublyMusicIcon", () => (
  <>
    <path fill={SOFT} d="M9 6.400 19.400 3.600A1.300 1.300 0 0 1 21 4.900v3L9 11V6.400Z" />
    <path fill={STRONG} d="M9 8v8.200a3.400 3.400 0 1 1-2.400-3.200V6.900A1.300 1.300 0 0 1 7.600 5.600L9 5.300V8Zm12-2.800v9a3.400 3.400 0 1 1-2.400-3.200V5.200H21Z" />
  </>
));

export const HublyPlayIcon = createDuotoneIcon("HublyPlayIcon", () => (
  <path fill={STRONG} d="M7 4.6c0-1.3 1.4-2.1 2.5-1.4l11 7.4c1 .7 1 2.1 0 2.8l-11 7.4c-1.1.7-2.5-.1-2.5-1.4V4.6Z" />
));

export const HublyBellOffIcon = createDuotoneIcon("HublyBellOffIcon", () => (
  <>
    <path
      fill={SOFT}
      d="M12 2.8a6.6 6.6 0 0 0-6.6 6.6c0 4.2-1.3 5.7-2 6.7a.9.9 0 0 0 .74 1.4h15.72a.9.9 0 0 0 .74-1.4c-.7-1-2-2.5-2-6.7A6.6 6.6 0 0 0 12 2.8Z"
    />
    <path fill={STRONG} d="M9.3 19.1a2.8 2.8 0 0 0 5.4 0H9.3Z" />
    <path stroke={STRONG} strokeWidth="2.6" strokeLinecap="round" d="M4.2 4.2l15.6 15.6" />
  </>
));

export const HublyMicIcon = createDuotoneIcon("HublyMicIcon", () => (
  <>
    <rect x="8.2" y="2.8" width="7.6" height="12.6" rx="3.8" fill={STRONG} />
    <path fill={SOFT} d="M4.6 11.2a1.2 1.2 0 0 1 2.4 0 5 5 0 0 0 10 0 1.2 1.2 0 0 1 2.4 0 7.4 7.4 0 0 1-6.2 7.3V20.6a1.2 1.2 0 0 1-2.4 0v-2.1a7.4 7.4 0 0 1-6.2-7.3Z" />
  </>
));

export const HublyReplyIcon = createDuotoneIcon("HublyReplyIcon", () => (
  <>
    <path fill={SOFT} d="M9.6 4.2v3.6c5.4 0 10.4 2.6 10.4 9.2 0 .8-.1 1.5-.3 2.2-1.6-3.5-4.8-5-10.1-5v3.6a.8.8 0 0 1-1.3.6L2.5 12.6a.8.8 0 0 1 0-1.2L8.3 3.6a.8.8 0 0 1 1.3.6Z" />
    <path fill={STRONG} d="M8.3 3.6 2.5 11.4a.8.8 0 0 0 0 1.2l5.8 7.8a.8.8 0 0 0 1.3-.6v-3.6L5.5 12l4.1-4.2V4.2a.8.8 0 0 0-1.3-.6Z" />
  </>
));
