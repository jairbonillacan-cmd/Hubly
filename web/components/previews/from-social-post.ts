import { mediaItemUrl } from "@/lib/post-draft";
import type { BrandWorkspace, SocialNetwork, SocialPost } from "@/lib/types";
import type { PreviewConfig, PreviewPost, SocialPlatform } from "./types";

export function networkToPlatform(network: SocialNetwork | undefined): SocialPlatform | null {
  switch (network) {
    case "Instagram":
      return "instagram";
    case "TikTok":
      return "tiktok";
    case "Facebook":
      return "facebook";
    case "LinkedIn":
      return "linkedin";
    default:
      return null;
  }
}

function formatFor(platform: SocialPlatform, format: SocialPost["format"]) {
  if (platform === "tiktok") return "video";
  if (format === "Reel / Video") return "reel";
  if (format === "Carrusel") return "carousel";
  return "feed";
}

/** Sin métricas: una vista previa no debe mostrar cifras que no existen. */
export const POST_PREVIEW_CONFIG: PreviewConfig = {
  showMetrics: false,
  showStatusBadge: false,
  interactive: false,
};

export function socialPostToPreview(
  post: Pick<SocialPost, "id" | "caption" | "format" | "cover" | "mediaUrl" | "media" | "scheduledDate">,
  brand: Pick<BrandWorkspace, "name" | "handle" | "initials"> | undefined,
  platform: SocialPlatform,
  resolveAsset?: (assetId: string) => string
): PreviewPost {
  const media = (post.media ?? []).flatMap((item) => {
    const url = mediaItemUrl(item, resolveAsset);
    return url ? [{ id: item.id, type: item.kind, url, alt: item.name }] : [];
  });
  return {
    id: post.id,
    platform,
    format: formatFor(platform, post.format),
    author: {
      name: brand?.name || "Tu marca",
      handle: (brand?.handle || "tu_marca").replace("@", ""),
      initials: brand?.initials,
    },
    content: post.caption,
    media: media.length
      ? media
      : post.mediaUrl
      ? [{ type: "image", url: post.mediaUrl, alt: "Imagen del post" }]
      : [{ type: "cover", coverKind: post.cover }],
    metrics: { likes: 0, comments: 0 },
    publishedAt: post.scheduledDate || "Sin fecha",
  };
}
