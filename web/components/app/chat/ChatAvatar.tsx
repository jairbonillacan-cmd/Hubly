import React from "react";

interface ChatAvatarProps {
  initials: string;
  photo?: string;
  size?: "sm" | "md" | "lg";
  /** Solo se enciende para la propia cuenta: no hay presencia real de los demás. */
  online?: boolean;
}

export function ChatAvatar({ initials, photo, size = "md", online }: ChatAvatarProps) {
  return (
    <span className={`hubly-chat-avatar is-${size}`} aria-hidden="true">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" />
      ) : (
        initials
      )}
      {online ? <span className="hubly-chat-online" /> : null}
    </span>
  );
}
