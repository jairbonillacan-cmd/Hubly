export type CoverKind = "cup" | "beans" | "sun" | "steam" | "leaf";

// Portadas de ejemplo dibujadas a mano: la demo no usa fotos reales.
export function Cover({ kind }: { kind: CoverKind }) {
  return (
    <svg className="cover" viewBox="0 0 120 120" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {kind === "cup" && (
        <>
          <rect width="120" height="120" fill="#7cc8ee" />
          <circle cx="60" cy="64" r="36" fill="#bfe2f4" />
          <circle cx="60" cy="64" r="25" fill="#0f2539" />
          <path d="M50 66c7-8 13 6 20-3" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {kind === "beans" && (
        <>
          <rect width="120" height="120" fill="#111c27" />
          {[
            [32, 34, -30],
            [84, 30, 25],
            [58, 66, 50],
            [26, 92, 15],
            [92, 86, -40],
          ].map(([x, y, r]) => (
            <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="20" ry="13" fill="#7cc8ee" />
              <path d={`M${x - 18} ${y}c10-6 24 6 36 0`} fill="none" stroke="#111c27" strokeWidth="3" />
            </g>
          ))}
        </>
      )}
      {kind === "sun" && (
        <>
          <rect width="120" height="120" fill="#bfe2f4" />
          <circle cx="60" cy="120" r="56" fill="#7cc8ee" />
          <circle cx="60" cy="120" r="36" fill="#fff" />
          <path d="M0 42h120M0 22h120" stroke="#111c27" strokeWidth="3" />
        </>
      )}
      {kind === "steam" && (
        <>
          <rect width="120" height="120" fill="#dceff9" />
          <path d="M40 96V74h40v22a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8Z" fill="#111c27" />
          <path d="M80 80h6a7 7 0 0 1 0 14h-6" fill="none" stroke="#111c27" strokeWidth="5" />
          <path d="M50 62c-7-9 7-13 0-24M70 62c-7-9 7-13 0-24" fill="none" stroke="var(--hb-accent-text)" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {kind === "leaf" && (
        <>
          <rect width="120" height="120" fill="var(--hb-accent-text)" />
          <path d="M26 96C24 50 58 22 98 24c2 42-26 76-72 72Z" fill="#eaf6fc" />
          <path d="M26 96 72 48" stroke="var(--hb-accent-text)" strokeWidth="4" />
        </>
      )}
    </svg>
  );
}
