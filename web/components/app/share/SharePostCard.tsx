"use client";

import { useState } from "react";
import { Cover } from "@/components/Cover";
import {
  HublyCalendarIcon as Calendar,
  HublyChatIcon as MessageSquareWarning,
  HublyCheckCircleIcon as CheckCircle2,
  HublySendIcon as Send,
} from "@/components/app/icons/DuotoneIcons";
import { SocialPreview } from "@/components/previews/SocialPreview";
import {
  networkToPlatform,
  POST_PREVIEW_CONFIG,
  socialPostToPreview,
} from "@/components/previews/from-social-post";
import {
  resolveSharePostState,
  safeShareComments,
  safeShareNetworks,
  type SharePostState,
} from "@/lib/domain/share";
import { shareMediaFileUrl } from "@/lib/media";
import type { BrandWorkspace, SocialPost } from "@/lib/types";
import type { ShareDecision } from "./useSharePortal";

const ESTADO_LABEL: Record<SharePostState, string> = {
  approved: "Aprobado",
  changes: "Cambios solicitados",
  pending: "Pendiente de tu visto bueno",
};

interface SharePostCardProps {
  post: SocialPost;
  brand: BrandWorkspace;
  token: string;
  clientName: string;
  onDecide: (
    postId: string,
    decision: ShareDecision,
    comment: string | undefined,
    signer: string,
  ) => void | Promise<void>;
}

export function SharePostCard({ post, brand, token, clientName, onDecide }: SharePostCardProps) {
  const [comment, setComment] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);

  const state = resolveSharePostState(post);
  const isApproved = state === "approved";
  const networks = safeShareNetworks(post);
  const comments = safeShareComments(post);
  const platform = networkToPlatform(post.network || networks[0]);

  const sendChanges = () => {
    const text = comment.trim();
    if (!text) return;
    void onDecide(post.id, "changes", text, clientName);
    setComment("");
    setCommentOpen(false);
  };

  return (
    <div className={`hubly-share-card${isApproved ? " is-approved" : state === "changes" ? " is-changes" : ""}`}>
      <div className="hubly-share-card-media">
        <div className="hubly-share-card-badges">
          <span className={`hubly-share-badge hubly-share-badge--${state}`}>{ESTADO_LABEL[state]}</span>
          <span className="hubly-share-format">{post.format}</span>
        </div>
        {platform ? (
          <SocialPreview
            post={socialPostToPreview(post, brand, platform, (assetId) => shareMediaFileUrl(token, assetId))}
            config={POST_PREVIEW_CONFIG}
          />
        ) : (
          <div className="hubly-share-cover">
            <Cover kind={post.cover} />
          </div>
        )}
      </div>

      <div className="hubly-share-card-body">
        <div className="hubly-share-card-meta">
          <span className="hubly-share-card-date">
            <Calendar size={13} />
            {post.scheduledDate} · {post.scheduledTime}
          </span>
          <span>{networks.join(" · ")}</span>
        </div>

        <h3 className="hubly-share-card-title">{post.title}</h3>
        <p className="hubly-share-card-caption">{post.caption}</p>

        {comments.length > 0 && (
          <div className="hubly-share-comments">
            {comments.map((c) => (
              <div key={c.id}>
                <strong>{c.author}:</strong> {c.text}{" "}
                <span className="hubly-share-comment-date">({c.createdAt})</span>
              </div>
            ))}
          </div>
        )}

        {commentOpen && (
          <div className="hubly-share-comment-row">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe qué ajuste necesitas..."
              className="hubly-share-comment-input"
            />
            <button
              type="button"
              onClick={sendChanges}
              className="hubly-share-btn hubly-share-btn--primary hubly-share-btn--sm"
              aria-label="Enviar solicitud de cambios"
            >
              <Send size={13} />
            </button>
          </div>
        )}

        <div className="hubly-share-actions">
          <button
            type="button"
            onClick={() => void onDecide(post.id, "approved", "Aprobado desde el enlace de revisión.", clientName)}
            className="hubly-share-btn hubly-share-btn--primary hubly-share-btn--grow"
          >
            <CheckCircle2 size={15} />
            {isApproved ? "Aprobado" : "Aprobar post"}
          </button>
          <button
            type="button"
            onClick={() => setCommentOpen((open) => !open)}
            className="hubly-share-btn"
          >
            <MessageSquareWarning size={15} />
            Pedir cambios
          </button>
        </div>
      </div>
    </div>
  );
}
