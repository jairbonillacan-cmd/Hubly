"use client";

import { useState } from "react";
import type { PlatformPreviewProps, PostStatus } from "./types";
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  MoreDotsIcon,
  VerifiedBadge,
  MusicNoteIcon,
  InstagramIcon,
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

export function InstagramPreview({
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
    showComments = false,
    headerRightSlot,
    footerSlot,
    onAction,
  } = config;

  const mode = config.mode || (post.format === "reel" ? "reel" : "feed");

  // State for interactive toggles
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.metrics?.likes ?? 1240);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");

  function handleLike() {
    if (!interactive) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    onAction?.("like", post);
  }

  function handleSave() {
    if (!interactive) return;
    setIsSaved(!isSaved);
    onAction?.("save", post);
  }

  // Format large numbers (e.g. 1420 -> 1,420 or 14.2K)
  const formattedLikes = new Intl.NumberFormat("es-MX").format(likesCount);
  const commentsCount = post.metrics?.comments ?? 38;

  // --- REEL VIEW ---
  if (mode === "reel") {
    return (
      <div
        className={`instagram-preview-reel ${className}`}
        style={{
          width: "100%",
          maxWidth: "380px",
          margin: "0 auto",
          borderRadius: "26px",
          overflow: "hidden",
          background: "#000000",
          color: "#ffffff",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          boxShadow:
            "0 24px 60px -24px rgba(16, 41, 31, 0.4), 0 2px 8px rgba(16, 41, 31, 0.1)",
          position: "relative",
          aspectRatio: "9 / 16",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          ...style,
        }}
      >
        {/* Fullscreen Background Media */}
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
          {/* Subtle gradient vignette for legibility */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.85) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Top Header Overlay */}
        <div
          style={{
            position: "relative",
            zIndex: 3,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>Reels</span>
            <InstagramIcon size={18} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            {headerRightSlot}
          </div>
        </div>

        {/* Right Action Rail */}
        <div
          style={{
            position: "absolute",
            right: "12px",
            bottom: "76px",
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
          }}
        >
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
            <HeartIcon size={28} filled={isLiked} color="#ff3040" />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {formattedLikes}
            </span>
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
            <CommentIcon size={26} variant="instagram" />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {commentsCount}
            </span>
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
            <ShareIcon size={26} variant="instagram" />
          </button>

          {/* Save / Bookmark */}
          <button
            type="button"
            onClick={handleSave}
            aria-label="Guardar"
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
            <BookmarkIcon size={26} filled={isSaved} />
          </button>

          {/* 3 Dots */}
          <button
            type="button"
            onClick={() => onAction?.("more", post)}
            aria-label="Más opciones"
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <MoreDotsIcon size={24} vertical />
          </button>

          {/* Vinyl Disc / Audio Art */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "2px solid #ffffff",
              overflow: "hidden",
              background: "#10291f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MusicNoteIcon size={16} />
          </div>
        </div>

        {/* Bottom Metadata Overlay */}
        <div
          style={{
            position: "relative",
            zIndex: 3,
            padding: "16px 70px 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Author Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background:
                  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#10291f",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  overflow: "hidden",
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
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                {post.author.handle.replace(/^@/, "")}
              </span>
              {post.author.verified && <VerifiedBadge size={14} />}
            </div>

            <button
              type="button"
              style={{
                background: "transparent",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                borderRadius: "8px",
                padding: "3px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Seguir
            </button>
          </div>

          {/* Caption */}
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.35,
              margin: 0,
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
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
              }}
            >
              {captionExpanded ? "menos" : "... más"}
            </button>
          )}

          {/* Audio Ticker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.9)",
              marginTop: "2px",
            }}
          >
            <MusicNoteIcon size={14} />
            <span>
              {post.audioTrack
                ? `${post.audioTrack.title} · ${post.audioTrack.artist || post.author.name}`
                : `Audio original · ${post.author.name}`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- FEED VIEW ---
  return (
    <article
      className={`instagram-preview-feed ${className}`}
      style={{
        width: "100%",
        maxWidth: "470px",
        margin: "0 auto",
        background: "#ffffff",
        color: "#10291f",
        borderRadius: "18px",
        boxShadow:
          "0 14px 34px -14px rgba(16, 41, 31, 0.16), 0 2px 6px rgba(16, 41, 31, 0.05)",
        border: "1px solid #dde5da",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Post Header */}
      {showHeader && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid #f2f5f1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Story Gradient Ring */}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background:
                  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#ffffff",
                  padding: "1.5px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "#0a7a55",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    overflow: "hidden",
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
              </div>
            </div>

            {/* Handle & Subtitle */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#10291f",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {post.author.handle.replace(/^@/, "")}
                </span>
                {post.author.verified && <VerifiedBadge size={14} />}
              </div>

              {post.location && (
                <span style={{ fontSize: "0.75rem", color: "#456256" }}>
                  {post.location}
                </span>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {showStatusBadge && post.status && STATUS_STYLE[post.status] && (
              <span
                style={{
                  padding: "3px 9px",
                  borderRadius: "7px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: STATUS_STYLE[post.status].bg,
                  color: STATUS_STYLE[post.status].color,
                }}
              >
                {STATUS_STYLE[post.status].label}
              </span>
            )}
            {headerRightSlot}
            <button
              type="button"
              onClick={() => onAction?.("more", post)}
              aria-label="Más opciones"
              style={{
                background: "none",
                border: "none",
                color: "#456256",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <MoreDotsIcon size={18} />
            </button>
          </div>
        </header>
      )}

      {/* Media Viewport */}
      <div style={{ width: "100%", position: "relative" }}>
        <MediaPlaceholder
          media={post.media}
          aspectRatio="1:1"
          altText={post.content}
          interactive={interactive}
          onDoubleTap={handleLike}
        />
      </div>

      {/* Action Buttons Bar */}
      {showActions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px 6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              aria-label={isLiked ? "Ya no me gusta" : "Me gusta"}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: isLiked ? "#ff3040" : "#10291f",
                display: "flex",
                alignItems: "center",
                transition: "transform 0.15s ease",
              }}
            >
              <HeartIcon size={24} filled={isLiked} color="#ff3040" />
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={() => onAction?.("comment", post)}
              aria-label="Comentar"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#10291f",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CommentIcon size={24} variant="instagram" />
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => onAction?.("share", post)}
              aria-label="Compartir"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#10291f",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ShareIcon size={24} variant="instagram" />
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? "Guardado" : "Guardar"}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "#10291f",
              display: "flex",
              alignItems: "center",
            }}
          >
            <BookmarkIcon size={24} filled={isSaved} />
          </button>
        </div>
      )}

      {/* Social Metrics */}
      {showMetrics && (
        <div style={{ padding: "0 14px", marginTop: "2px" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700 }}>
            {formattedLikes} Me gusta
          </p>
        </div>
      )}

      {/* Caption & Hashtags */}
      <div style={{ padding: "6px 14px 4px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: 1.45,
            color: "#10291f",
          }}
        >
          <strong style={{ fontWeight: 700, marginRight: "6px" }}>
            {post.author.handle.replace(/^@/, "")}
          </strong>
          {captionExpanded
            ? post.content
            : post.content.length > 110
            ? `${post.content.slice(0, 110)}... `
            : post.content}

          {post.content.length > 110 && (
            <button
              type="button"
              onClick={() => setCaptionExpanded(!captionExpanded)}
              style={{
                background: "none",
                border: "none",
                color: "#456256",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                padding: 0,
              }}
            >
              {captionExpanded ? " menos" : "más"}
            </button>
          )}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "4px",
            }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  color: "#0a7a55",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Preview */}
      {commentsCount > 0 && (
        <div style={{ padding: "2px 14px 4px" }}>
          <button
            type="button"
            onClick={() => onAction?.("comment", post)}
            style={{
              background: "none",
              border: "none",
              color: "#456256",
              fontSize: "0.8125rem",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Ver los {commentsCount} comentarios
          </button>

          {showComments && post.comments && (
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{ fontSize: "0.8125rem", lineHeight: 1.35 }}
                >
                  <strong style={{ marginRight: "6px" }}>
                    {comment.handle || comment.author}
                  </strong>
                  <span>{comment.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publication Timestamp */}
      <div style={{ padding: "2px 14px 10px" }}>
        <time
          style={{
            fontSize: "0.6875rem",
            color: "#6b8277",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {post.publishedAt || "Hace 2 horas"}
        </time>
      </div>

      {/* Add Comment Input Bar */}
      {interactive && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            borderTop: "1px solid #f2f5f1",
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Añadir un comentario..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.8125rem",
              color: "#10291f",
              background: "transparent",
            }}
          />
          {newCommentText.trim() && (
            <button
              type="button"
              onClick={() => {
                onAction?.("comment", post);
                setNewCommentText("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#0a7a55",
                fontWeight: 700,
                fontSize: "0.8125rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Publicar
            </button>
          )}
        </div>
      )}

      {footerSlot}
    </article>
  );
}
