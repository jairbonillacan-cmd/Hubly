"use client";

import { useState } from "react";
import type { PreviewPost, SocialPlatform, PreviewConfig, PostStatus } from "./types";
import { InstagramPreview } from "./InstagramPreview";
import { TikTokPreview } from "./TikTokPreview";
import { FacebookPreview } from "./FacebookPreview";
import { LinkedInPreview } from "./LinkedInPreview";
import { PlatformBadgeIcon } from "./SocialIcons";

type SocialPreviewProps = {
  post: PreviewPost;
  config?: PreviewConfig;
  allowPlatformSwitch?: boolean;
  onStatusChange?: (newStatus: PostStatus) => void;
  className?: string;
  style?: React.CSSProperties;
};

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
];

export function SocialPreview({
  post,
  config,
  allowPlatformSwitch = false,
  onStatusChange,
  className = "",
  style,
}: SocialPreviewProps) {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>(post.platform);

  const currentPost: PreviewPost = {
    ...post,
    platform: activePlatform,
  };

  const mergedConfig: PreviewConfig = {
    ...config,
    onStatusChange: onStatusChange || config?.onStatusChange,
  };

  function renderPreview() {
    switch (activePlatform) {
      case "instagram":
        return <InstagramPreview post={currentPost} config={mergedConfig} />;
      case "tiktok":
        return <TikTokPreview post={currentPost} config={mergedConfig} />;
      case "facebook":
        return <FacebookPreview post={currentPost} config={mergedConfig} />;
      case "linkedin":
        return <LinkedInPreview post={currentPost} config={mergedConfig} />;
      default:
        return <InstagramPreview post={currentPost} config={mergedConfig} />;
    }
  }

  return (
    <div
      className={`social-preview-wrapper ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        alignItems: "center",
        width: "100%",
        ...style,
      }}
    >
      {/* Platform Switcher Tabs */}
      {allowPlatformSwitch && (
        <nav
          aria-label="Seleccionar plataforma para previsualización"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            padding: "5px",
            borderRadius: "14px",
            border: "1px solid #dde5da",
            boxShadow: "0 2px 6px rgba(16, 41, 31, 0.05)",
          }}
        >
          {PLATFORMS.map((plat) => {
            const isSelected = plat.id === activePlatform;
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => setActivePlatform(plat.id)}
                aria-pressed={isSelected}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: isSelected ? "#10291f" : "transparent",
                  color: isSelected ? "#ffffff" : "#456256",
                  fontSize: "0.875rem",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <PlatformBadgeIcon platform={plat.id} size={16} />
                <span>{plat.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Render selected component */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        {renderPreview()}
      </div>
    </div>
  );
}
