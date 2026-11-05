import type { BrandWorkspace, PostComment, SocialNetwork, SocialPost } from "../types";

export type SharePostState = "approved" | "changes" | "pending";

const APPROVED = new Set<SocialPost["status"]>(["approved", "scheduled", "published"]);

export interface ShareCounts {
  approved: number;
  pending: number;
}

/** Cómo ve el cliente un post en el portal: listo, con cambios pedidos o por revisar. */
export function resolveSharePostState(post: Pick<SocialPost, "status">): SharePostState {
  if (APPROVED.has(post.status)) return "approved";
  if (post.status === "changes") return "changes";
  return "pending";
}

/** Lo que ya está listo frente a lo que sigue en manos del cliente (los cambios también cuentan). */
export function countSharePosts(posts: Pick<SocialPost, "status">[]): ShareCounts {
  let approved = 0;
  let pending = 0;
  for (const post of posts) {
    if (APPROVED.has(post.status)) approved += 1;
    else pending += 1;
  }
  return { approved, pending };
}

/** El documento compartido puede traer formas inesperadas: nunca se recorre lo que no es lista. */
export function safeShareNetworks(post: Pick<SocialPost, "networks">): SocialNetwork[] {
  return Array.isArray(post.networks) ? post.networks : [];
}

/** Solo comentarios con la forma mínima; en tiempo de ejecución el documento no está tipado. */
export function safeShareComments(post: Pick<SocialPost, "comments">): PostComment[] {
  const list: unknown = post.comments;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (comment): comment is PostComment =>
      typeof comment === "object" &&
      comment !== null &&
      typeof (comment as { id?: unknown }).id === "string",
  );
}

/** La marca del portal: la que llega del servidor con cuentas; si no, la del token en la demo. */
export function selectShareBrand(input: {
  hasBackend: boolean;
  liveBrand: BrandWorkspace | null | undefined;
  demoBrands: BrandWorkspace[];
  token: string;
}): BrandWorkspace | null {
  if (input.hasBackend) return input.liveBrand ?? null;
  return input.demoBrands.find((brand) => brand.shareToken === input.token) ?? null;
}

/** Posts de la marca que se enseñan en el portal. */
export function selectSharePosts(posts: SocialPost[], brandId: string): SocialPost[] {
  return posts.filter((post) => post.brandId === brandId);
}
