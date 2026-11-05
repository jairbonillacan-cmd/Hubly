"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { countSharePosts, selectShareBrand, selectSharePosts } from "@/lib/domain/share";
import { backendEnabled } from "@/lib/supabase/config";
import { useHublyStore } from "@/lib/store";
import type { BrandWorkspace, SocialPost } from "@/lib/types";

interface ShareLivePayload {
  brand: BrandWorkspace;
  posts: SocialPost[];
}

export type ShareDecision = "approved" | "changes";

async function fetchLive(token: string): Promise<ShareLivePayload | null> {
  const res = await fetch(`/api/share/${encodeURIComponent(token)}`, { cache: "no-store" });
  return res.ok ? ((await res.json()) as ShareLivePayload) : null;
}

/** Datos y acciones del portal: carga la marca compartida y firma las decisiones del cliente. */
export function useSharePortal() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const syncFromServer = useHublyStore((s) => s.syncFromServer);
  const demoBrands = useHublyStore((s) => s.brands);
  const demoPosts = useHublyStore((s) => s.posts);
  const demoUpdateStatus = useHublyStore((s) => s.updatePostStatus);
  const demoApproveAll = useHublyStore((s) => s.approveAllBrandPosts);

  const [live, setLive] = useState<ShareLivePayload | null>(null);
  const [liveLoading, setLiveLoading] = useState(backendEnabled);
  const [clientName, setClientName] = useState("Dirección de Marca (Cliente)");

  const loadLive = useCallback(async () => {
    setLive(await fetchLive(token));
    setLiveLoading(false);
  }, [token]);

  const sendDecision = useCallback(
    async (postId: string, decision: ShareDecision, comment: string | undefined, signer: string) => {
      await fetch(`/api/share/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, decision, comment, signer }),
      });
    },
    [token],
  );

  const decide = useCallback(
    async (postId: string, decision: ShareDecision, comment: string | undefined, signer: string) => {
      if (!backendEnabled) {
        demoUpdateStatus(postId, decision, comment, signer, "client");
        return;
      }
      await sendDecision(postId, decision, comment, signer);
      await loadLive();
    },
    [demoUpdateStatus, loadLive, sendDecision],
  );

  const approveAll = useCallback(
    async (brandId: string, signer: string) => {
      if (!backendEnabled) {
        demoApproveAll(brandId, signer, "client");
        return;
      }
      for (const post of live?.posts ?? []) {
        if (post.status === "pending" || post.status === "changes") {
          await sendDecision(post.id, "approved", undefined, signer);
        }
      }
      await loadLive();
    },
    [demoApproveAll, live, loadLive, sendDecision],
  );

  useEffect(() => {
    if (!backendEnabled) {
      syncFromServer();
      return;
    }
    let alive = true;
    void fetchLive(token).then((payload) => {
      if (!alive) return;
      setLive(payload);
      setLiveLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [token, syncFromServer]);

  const brand = selectShareBrand({
    hasBackend: backendEnabled,
    liveBrand: live?.brand,
    demoBrands,
    token,
  });
  const posts = brand ? selectSharePosts(backendEnabled ? (live?.posts ?? []) : demoPosts, brand.id) : [];
  const counts = countSharePosts(posts);

  return {
    token,
    brand,
    posts,
    counts,
    liveLoading,
    clientName,
    setClientName,
    decide,
    approveAll,
  };
}
