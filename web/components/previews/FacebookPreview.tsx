"use client";

import { useState } from "react";
import type { PlatformPreviewProps, PostStatus } from "./types";
import {
  ThumbsUpIcon,
  CommentIcon,
  ShareIcon,
  MoreDotsIcon,
  VerifiedBadge,
  GlobeIcon,
  ReactionBadgeIcon,
  FacebookIcon,
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
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + " mil";
  return num.toString();
}

export function FacebookPreview({
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

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.metrics?.likes ?? 482);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");

  function handleLike() {
    if (!interactive) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    onAction?.("like", post);
  }

  const commentsCount = post.metrics?.comments ?? 42;
  const sharesCount = post.metrics?.shares ?? 18;

  return (
    <article
      className={`facebook-preview ${className}`}
      style={{
        width: "100%",
        maxWidth: "500px",
        margin: "0 auto",
        background: "#ffffff",
        color: "#10291f",
        borderRadius: "18px",
        border: "1px solid #dde5da",
        boxShadow:
          "0 14px 34px -14px rgba(16, 41, 31, 0.16), 0 2px 6px rgba(16, 41, 31, 0.05)",
        overflow: "hidden",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Header */}
      {showHeader && (
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "14px 16px 10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Avatar */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#0a7a55",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.875rem",
                overflow: "hidden",
                border: "1px solid #dde5da",
                flexShrink: 0,
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

            {/* Name, Verified, Subtitle */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#050505",
                    lineHeight: 1.25,
                  }}
                >
                  {post.author.name}
                </span>
                {post.author.verified && <VerifiedBadge size={15} platform="facebook" />}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.75rem",
                  color: "#65676b",
                  marginTop: "2px",
                }}
              >
                <span>{post.publishedAt || "Hace 3 h"}</span>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  <GlobeIcon size={12} />
                </span>
                <FacebookIcon size={12} style={{ color: "#1877f2", marginLeft: "2px" }} />
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
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
                color: "#65676b",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <MoreDotsIcon size={18} />
            </button>
          </div>
        </header>
      )}

      {/* Post Text Content */}
      <div style={{ padding: "2px 16px 12px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            lineHeight: 1.45,
            color: "#050505",
            whiteSpace: "pre-line",
          }}
        >
          {captionExpanded
            ? post.content
            : post.content.length > 180
            ? `${post.content.slice(0, 180)}... `
            : post.content}

          {post.content.length > 180 && (
            <button
              type="button"
              onClick={() => setCaptionExpanded(!captionExpanded)}
              style={{
                background: "none",
                border: "none",
                color: "#1877f2",
                fontWeight: 600,
                fontSize: "0.9375rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {captionExpanded ? " Ver menos" : "Ver más"}
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
              marginTop: "6px",
            }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  color: "#1877f2",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media or Link Preview Area */}
      {post.media && post.media.length > 0 ? (
        <div style={{ width: "100%", position: "relative" }}>
          <MediaPlaceholder
            media={post.media}
            aspectRatio="16:9"
            altText={post.content}
            interactive={interactive}
            onDoubleTap={handleLike}
          />
        </div>
      ) : post.linkPreview ? (
        <div
          style={{
            borderTop: "1px solid #dde5da",
            borderBottom: "1px solid #dde5da",
            background: "#f0f2f5",
          }}
        >
          {post.linkPreview.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.linkPreview.imageUrl}
              alt={post.linkPreview.title}
              style={{ width: "100%", height: "220px", objectFit: "cover" }}
            />
          )}
          <div style={{ padding: "10px 14px" }}>
            <span
              style={{
                fontSize: "0.6875rem",
                color: "#65676b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {post.linkPreview.domain}
            </span>
            <h4
              style={{
                margin: "2px 0 0",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#050505",
                lineHeight: 1.25,
              }}
            >
              {post.linkPreview.title}
            </h4>
            {post.linkPreview.description && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.8125rem",
                  color: "#65676b",
                }}
              >
                {post.linkPreview.description}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Social Metrics Bar */}
      {showMetrics && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px 8px",
            fontSize: "0.8125rem",
            color: "#65676b",
          }}
        >
          {/* Reaction icons stack */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <ReactionBadgeIcon type="like" size={18} />
              <span style={{ marginLeft: "-4px" }}>
                <ReactionBadgeIcon type="love" size={18} />
              </span>
              <span style={{ marginLeft: "-4px" }}>
                <ReactionBadgeIcon type="care" size={18} />
              </span>
            </div>
            <span style={{ fontWeight: 500, marginLeft: "2px" }}>
              {formatCompactNumber(likesCount)}
            </span>
          </div>

          {/* Comments & Shares count */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {commentsCount > 0 && (
              <span>{formatCompactNumber(commentsCount)} comentarios</span>
            )}
            {sharesCount > 0 && (
              <span>{formatCompactNumber(sharesCount)} veces compartido</span>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ margin: "0 16px", height: "1px", background: "#e4e6eb" }} />

      {/* Action Buttons Bar */}
      {showActions && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            padding: "4px 8px",
          }}
        >
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "8px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: isLiked ? "#1877f2" : "#65676b",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            <ThumbsUpIcon size={18} filled={isLiked} color="#1877f2" />
            <span>Me gusta</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => onAction?.("comment", post)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "8px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: "#65676b",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <CommentIcon size={18} variant="facebook" />
            <span>Comentar</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => onAction?.("share", post)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "8px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: "#65676b",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <ShareIcon size={18} variant="facebook" />
            <span>Compartir</span>
          </button>
        </div>
      )}

      {/* Comment Input Box */}
      {interactive && (
        <div
          style={{
            padding: "8px 16px 12px",
            borderTop: "1px solid #f0f2f5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#0a7a55",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Tú
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              background: "#f0f2f5",
              borderRadius: "20px",
              padding: "6px 12px",
            }}
          >
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.8125rem",
                color: "#050505",
              }}
            />
            {commentText.trim() && (
              <button
                type="button"
                onClick={() => {
                  onAction?.("comment", post);
                  setCommentText("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1877f2",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Enviar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Render optional comments */}
      {showComments && post.comments && post.comments.length > 0 && (
        <div
          style={{
            padding: "0 16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {post.comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#456256",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {comment.initials || comment.author.slice(0, 2).toUpperCase()}
              </div>
              <div
                style={{
                  background: "#f0f2f5",
                  borderRadius: "14px",
                  padding: "6px 12px",
                  fontSize: "0.8125rem",
                }}
              >
                <strong style={{ display: "block", color: "#050505" }}>
                  {comment.author}
                </strong>
                <p style={{ margin: "2px 0 0", color: "#050505" }}>
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {footerSlot}
    </article>
  );
}
