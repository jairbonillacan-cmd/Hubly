"use client";

import { useState } from "react";
import type { PlatformPreviewProps, PostStatus } from "./types";
import {
  ThumbsUpIcon,
  CommentIcon,
  RepostIcon,
  ShareIcon,
  MoreDotsIcon,
  VerifiedBadge,
  GlobeIcon,
  ReactionBadgeIcon,
  LinkedInIcon,
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

export function LinkedInPreview({
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
  const [likesCount, setLikesCount] = useState(post.metrics?.likes ?? 614);
  const [isFollowed, setIsFollowed] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");

  function handleLike() {
    if (!interactive) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    onAction?.("like", post);
  }

  function handleFollow() {
    if (!interactive) return;
    setIsFollowed(!isFollowed);
  }

  const commentsCount = post.metrics?.comments ?? 58;
  const repostsCount = post.metrics?.reposts ?? 14;

  return (
    <article
      className={`linkedin-preview ${className}`}
      style={{
        width: "100%",
        maxWidth: "520px",
        margin: "0 auto",
        background: "#ffffff",
        color: "#10291f",
        borderRadius: "18px",
        border: "1px solid #dde5da",
        boxShadow:
          "0 14px 34px -14px rgba(16, 41, 31, 0.16), 0 2px 6px rgba(16, 41, 31, 0.05)",
        overflow: "hidden",
        fontFamily:
          '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Header */}
      {showHeader && (
        <header
          style={{
            padding: "14px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Top Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "#666666",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <LinkedInIcon size={14} style={{ color: "#0a66c2" }} />
              <span>Publicación sugerida</span>
            </div>

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
                  color: "#666666",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <MoreDotsIcon size={18} />
              </button>
            </div>
          </div>

          {/* Author Details Row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              {/* Avatar */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  background: "#10291f",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
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

              {/* Title & Info */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "#191919",
                      lineHeight: 1.25,
                    }}
                  >
                    {post.author.name}
                  </span>
                  {post.author.verified && <VerifiedBadge size={14} platform="linkedin" />}
                </div>

                {post.author.role && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#666666",
                      lineHeight: 1.3,
                      marginTop: "2px",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {post.author.role}
                  </span>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.75rem",
                    color: "#666666",
                    marginTop: "2px",
                  }}
                >
                  <span>{post.publishedAt || "1 h"}</span>
                  <span>• Editado •</span>
                  <GlobeIcon size={12} />
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <button
              type="button"
              onClick={handleFollow}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: isFollowed ? "transparent" : "transparent",
                color: isFollowed ? "#666666" : "#0a66c2",
                border: isFollowed ? "1px solid #666666" : "none",
                borderRadius: "16px",
                padding: "4px 10px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {!isFollowed && <span style={{ fontSize: "1.125rem" }}>+</span>}
              <span>{isFollowed ? "Siguiendo" : "Seguir"}</span>
            </button>
          </div>
        </header>
      )}

      {/* Post Text Body */}
      <div style={{ padding: "4px 16px 12px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            lineHeight: 1.5,
            color: "#191919",
            whiteSpace: "pre-line",
          }}
        >
          {captionExpanded
            ? post.content
            : post.content.length > 200
            ? `${post.content.slice(0, 200)}... `
            : post.content}

          {post.content.length > 200 && (
            <button
              type="button"
              onClick={() => setCaptionExpanded(!captionExpanded)}
              style={{
                background: "none",
                border: "none",
                color: "#666666",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {captionExpanded ? " ver menos" : "...ver más"}
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
              marginTop: "8px",
            }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  color: "#0a66c2",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
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
            aspectRatio="1.91:1"
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
            background: "#f3f2ef",
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
          <div style={{ padding: "12px 16px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#666666",
                textTransform: "uppercase",
              }}
            >
              {post.linkPreview.domain}
            </span>
            <h4
              style={{
                margin: "4px 0 0",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#191919",
              }}
            >
              {post.linkPreview.title}
            </h4>
          </div>
        </div>
      ) : null}

      {/* Social Metrics Proof Bar */}
      {showMetrics && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px 8px",
            fontSize: "0.75rem",
            color: "#666666",
          }}
        >
          {/* Reaction icons stack */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <ReactionBadgeIcon type="like" size={17} />
              <span style={{ marginLeft: "-4px" }}>
                <ReactionBadgeIcon type="celebrate" size={17} />
              </span>
              <span style={{ marginLeft: "-4px" }}>
                <ReactionBadgeIcon type="insightful" size={17} />
              </span>
            </div>
            <span style={{ fontWeight: 500, marginLeft: "2px" }}>
              {formatCompactNumber(likesCount)}
            </span>
          </div>

          {/* Comments & Reposts count */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {commentsCount > 0 && (
              <span>{formatCompactNumber(commentsCount)} comentarios</span>
            )}
            {repostsCount > 0 && (
              <>
                <span>•</span>
                <span>{formatCompactNumber(repostsCount)} veces compartido</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ margin: "0 16px", height: "1px", background: "#e8ebe6" }} />

      {/* Action Buttons Bar */}
      {showActions && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            padding: "4px 8px",
          }}
        >
          {/* Like / Recomendar */}
          <button
            type="button"
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: isLiked ? "#0a66c2" : "#666666",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            <ThumbsUpIcon size={18} filled={isLiked} color="#0a66c2" />
            <span>Recomendar</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => onAction?.("comment", post)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: "#666666",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            <CommentIcon size={18} />
            <span>Comentar</span>
          </button>

          {/* Repost */}
          <button
            type="button"
            onClick={() => onAction?.("repost", post)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: "#666666",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            <RepostIcon size={18} />
            <span>Compartir</span>
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={() => onAction?.("share", post)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 0",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              color: "#666666",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            <ShareIcon size={18} />
            <span>Enviar</span>
          </button>
        </div>
      )}

      {/* Comment Input Box */}
      {interactive && (
        <div
          style={{
            padding: "8px 16px 12px",
            borderTop: "1px solid #f2f5f1",
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
              border: "1px solid #dde5da",
              borderRadius: "20px",
              padding: "6px 14px",
              background: "#ffffff",
            }}
          >
            <input
              type="text"
              placeholder="Añade un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.8125rem",
                color: "#191919",
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
                  color: "#0a66c2",
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
        </div>
      )}

      {/* Comments List */}
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
                  background: "#f2f5f1",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "0.8125rem",
                }}
              >
                <strong style={{ display: "block", color: "#191919" }}>
                  {comment.author}
                </strong>
                <p style={{ margin: "2px 0 0", color: "#191919" }}>
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
