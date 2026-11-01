import type { SVGProps } from "react";
import type { SocialPlatform, ReactionType } from "./types";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Platform Logos
export function InstagramIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function TikTokIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.33a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.1 15.6a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.58a8.28 8.28 0 0 0 4.81 1.54V6.69h-1z" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function LinkedInIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

export function PlatformBadgeIcon({
  platform,
  size = 18,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  switch (platform) {
    case "instagram":
      return <InstagramIcon size={size} />;
    case "tiktok":
      return <TikTokIcon size={size} />;
    case "facebook":
      return <FacebookIcon size={size} />;
    case "linkedin":
      return <LinkedInIcon size={size} />;
    default:
      return null;
  }
}

// Verified Badges
export function VerifiedBadge({
  size = 16,
  platform = "instagram",
}: {
  size?: number;
  platform?: SocialPlatform;
}) {
  if (platform === "linkedin") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Cuenta verificada"
      >
        <title>Cuenta verificada</title>
        <circle cx="8" cy="8" r="7.5" fill="#0a66c2" />
        <path
          d="M4.5 8.2L6.8 10.5L11.5 5.5"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Instagram / Facebook / TikTok official scalloped verified badge
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Verificado"
    >
      <title>Verificado</title>
      <path
        d="M12 2l2.4 2.1 3.2-.4 1.2 2.9 3 1.1-.3 3.2 2.1 2.4-1.1 3 .4 3.2-2.9 1.2-1.1 3-3.2-.3-2.4 2.1-2.4-2.1-3.2.3-1.2-3-2.9-1.2.4-3.2-1.1-3 2.1-2.4-.3-3.2 3-1.1 1.2-2.9 3.2.4L12 2z"
        fill="#0095f6"
      />
      <path
        d="M7.5 12l3.2 3.2 6.3-6.4"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Interaction Icons
export function HeartIcon({
  size = 24,
  filled = false,
  color = "#ff3040",
  className,
  ...props
}: IconProps & { filled?: boolean; color?: string }) {
  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function CommentIcon({
  size = 24,
  variant = "instagram",
  className,
  ...props
}: IconProps & { variant?: SocialPlatform }) {
  if (variant === "tiktok") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12 3C6.477 3 2 6.806 2 11.5c0 2.26 1.048 4.316 2.784 5.827L4 21l4.24-1.212c1.17.45 2.443.712 3.76.712 5.523 0 10-3.806 10-8.5S17.523 3 12 3zm-4 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
      </svg>
    );
  }

  // Instagram / Facebook / General style
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function ShareIcon({
  size = 24,
  variant = "instagram",
  className,
  ...props
}: IconProps & { variant?: SocialPlatform }) {
  if (variant === "tiktok" || variant === "facebook") {
    // Curved share arrow
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M14 5v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V19l8-7-8-7z" />
      </svg>
    );
  }

  // Paper airplane (Instagram style)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function BookmarkIcon({
  size = 24,
  filled = false,
  className,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function RepostIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function ThumbsUpIcon({
  size = 20,
  filled = false,
  color = "#0a66c2",
  className,
  ...props
}: IconProps & { filled?: boolean; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={filled ? color : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function MoreDotsIcon({
  size = 20,
  vertical = false,
  className,
  ...props
}: IconProps & { vertical?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {vertical ? (
        <>
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </>
      ) : (
        <>
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </>
      )}
    </svg>
  );
}

export function MusicNoteIcon({ size = 16, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function GlobeIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function PlayIcon({ size = 32, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function VolumeIcon({
  size = 18,
  muted = false,
  className,
  ...props
}: IconProps & { muted?: boolean }) {
  if (muted) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

// Reactions Stack Badge for Facebook & LinkedIn
export function ReactionBadgeIcon({
  type,
  size = 18,
}: {
  type: ReactionType;
  size?: number;
}) {
  switch (type) {
    case "like":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#1877f2",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Me gusta"
        >
          👍
        </span>
      );
    case "love":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#f02849",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Me encanta"
        >
          ❤️
        </span>
      );
    case "care":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#f7b125",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Me importa"
        >
          🤗
        </span>
      );
    case "celebrate":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#44712e",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Celebrar"
        >
          👏
        </span>
      );
    case "support":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#8d4ce7",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Apoyo"
        >
          🤝
        </span>
      );
    case "insightful":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#e7a33e",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Interesante"
        >
          💡
        </span>
      );
    case "haha":
    case "funny":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#f7b125",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Me divierte"
        >
          😂
        </span>
      );
    default:
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#1877f2",
            color: "#fff",
            fontSize: size * 0.58,
            boxShadow: "0 0 0 1.5px #fff",
          }}
          aria-label="Reacción"
        >
          👍
        </span>
      );
  }
}
