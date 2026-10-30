"use client";

import { useState } from "react";
import type { PlatformPreviewProps, PostStatus } from "./types";
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  VerifiedBadge,
  MusicNoteIcon,
  TikTokIcon,
} from "./SocialIcons";
import { MediaPlaceholder } from "./MediaPlaceholder";

const STATUS_STYLE: Record<PostStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: "#fff2c2", color: "#6b5200", label: "Por aprobar" },
  approved: { bg: "#dcf5e6", color: "#075a3f", label: "Aprobada" },
  changes: { bg: "#ffe2db", color: "#96290f", label: "Con cambios" },
  draft: { bg: "#eef2ed", color: "#456256", label: "Borrador" },
  scheduled: { bg: "#e0f2fe", color: "#0369a1", label: "Programado" },
  published: { bg: "#f3e8ff", color: "#6b21a8", label: "Publicado" },
};

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

export function TikTokPreview({
  post,
  config = {},
  className = "",
  style,
}: PlatformPreviewProps) {
  const {
    interactive = true,
    showStatusBadge = true,
    showMetrics = true,
    showActions = true,
    showHeader = true,
    headerRightSlot,
    footerSlot,
    onAction,
  } = config;

  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [likesCount, setLikesCount] = useState(post.metrics?.likes ?? 34200);
  const [savesCount, setSavesCount] = useState(post.metrics?.saves ?? 1840);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  function handleLike() {
    if (!interactive) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    onAction?.("like", post);
  }

  function handleSave() {
    if (!interactive) return;
    const next = !isSaved;
    setIsSaved(next);
    setSavesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    onAction?.("save", post);
  }

  function handleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    setIsFollowed(true);
  }

  const commentsCount = post.metrics?.comments ?? 840;
  const sharesCount = post.metrics?.shares ?? 260;

  return (
    <div
      className={`tiktok-preview ${className}`}
      style={{
        width: "100%",
        maxWidth: "380px",
        margin: "0 auto",
        aspectRatio: "9 / 16",
        borderRadius: "26px",
        overflow: "hidden",
        background: "#010101",
        color: "#ffffff",
        position: "relative",
        boxShadow:
          "0 24px 60px -24px rgba(16, 41, 31, 0.4), 0 2px 8px rgba(16, 41, 31, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        userSelect: "none",
        ...style,
      }}
    >
      {/* Background Media */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <MediaPlaceholder
          media={post.media}
          aspectRatio="9:16"
          altText={post.content}
          interactive={interactive}
          onDoubleTap={handleLike}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Subtle Dark Vignette Gradients */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 18%, transparent 62%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Top Bar Header */}
      {showHeader && (
        <header
          style={{
            position: "relative",
            zIndex: 3,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Status Badge or Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TikTokIcon size={20} />
            {showStatusBadge && post.status && STATUS_STYLE[post.status] && (
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "99px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: STATUS_STYLE[post.status].bg,
                  color: STATUS_STYLE[post.status].color,
                }}
              >
                {STATUS_STYLE[post.status].label}
              </span>
            )}
          </div>

          {/* Center Tabs: Siguiendo | Para ti */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "0.9375rem",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Siguiendo</span>
            <span
              style={{
                color: "#ffffff",
                fontWeight: 700,
                position: "relative",
                paddingBottom: "4px",
              }}
            >
              Para ti
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "25%",
                  width: "50%",
                  height: "2px",
                  background: "#ffffff",
                  borderRadius: "2px",
                }}
              />
            </span>
          </div>

          {/* Search Icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {headerRightSlot}
            <button
              type="button"
              aria-label="Buscar"
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                padding: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* Right Action Rail (Vertical Buttons) */}
      {showActions && (
        <aside
          aria-label="Acciones de TikTok"
          style={{
            position: "absolute",
            right: "10px",
            bottom: "76px",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
          }}
        >
          {/* Avatar with Follow '+' Badge */}
          <div style={{ position: "relative", marginBottom: "4px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "2px solid #ffffff",
                overflow: "hidden",
                background: "#0a7a55",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.875rem",
              }}
            >
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                post.author.initials || post.author.name.slice(0, 2).toUpperCase()
              )}
            </div>

            {/* Follow red button */}
            {!isFollowed && (
              <button
                type="button"
                onClick={handleFollow}
                aria-label="Seguir cuenta"
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#ff2c55",
                  color: "#ffffff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                +
              </button>
            )}
          </div>

          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            aria-label={isLiked ? "Ya no me gusta" : "Me gusta"}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: 0,
            }}
          >
            <div
              style={{
                filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.4))",
                transition: "transform 0.15s ease",
                transform: isLiked ? "scale(1.1)" : "scale(1)",
              }}
            >
              <HeartIcon size={32} filled={isLiked} color="#ff2c55" />
            </div>
            {showMetrics && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {formatCompactNumber(likesCount)}
              </span>
            )}
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => onAction?.("comment", post)}
            aria-label="Comentarios"
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: 0,
            }}
          >
            <div style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.4))" }}>
              <CommentIcon size={30} variant="tiktok" />
            </div>
            {showMetrics && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {formatCompactNumber(commentsCount)}
              </span>
            )}
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? "Guardado" : "Guardar"}
            style={{
              background: "none",
              border: "none",
              color: isSaved ? "#facd3d" : "#ffffff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: 0,
            }}
          >
            <div style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.4))" }}>
              <BookmarkIcon size={30} filled={isSaved} />
            </div>
            {showMetrics && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {formatCompactNumber(savesCount)}
              </span>
            )}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => onAction?.("share", post)}
            aria-label="Compartir"
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: 0,
            }}
          >
            <div style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.4))" }}>
              <ShareIcon size={30} variant="tiktok" />
            </div>
            {showMetrics && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {formatCompactNumber(sharesCount)}
              </span>
            )}
          </button>

          {/* Spinning Vinyl Record Disc */}
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1b1b1b 0%, #000000 100%)",
              border: "6px solid #242424",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#ff2c55",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MusicNoteIcon size={9} />
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Content Area */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "16px 72px 20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Handle & Verified Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <strong
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {post.author.handle.startsWith("@")
              ? post.author.handle
              : `@${post.author.handle}`}
          </strong>
          {post.author.verified && <VerifiedBadge size={15} platform="tiktok" />}
        </div>

        {/* Caption */}
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: 1.4,
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            display: "-webkit-box",
            WebkitLineClamp: captionExpanded ? "none" : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.content}
        </p>

        {post.content.length > 80 && (
          <button
            type="button"
            onClick={() => setCaptionExpanded(!captionExpanded)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
            }}
          >
            {captionExpanded ? "menos" : "... más"}
          </button>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {/* Audio Track Marquee */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.8125rem",
            color: "rgba(255, 255, 255, 0.9)",
            marginTop: "2px",
          }}
        >
          <MusicNoteIcon size={14} />
          <span style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {post.audioTrack
              ? `${post.audioTrack.title} · ${post.audioTrack.artist || post.author.name}`
              : `Sonido original · ${post.author.name}`}
          </span>
        </div>
      </div>

      {footerSlot}
    </div>
  );
}
