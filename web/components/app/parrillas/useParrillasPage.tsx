"use client";

import React, { useEffect, useState } from "react";
import { copyText } from "@/lib/clipboard";
import {
  filterPostsByBrand,
  parseParrillasTab,
  resolveBrandBioHandle,
  type SocialSubTab,
} from "@/lib/domain/posts";
import { clientShareUrl } from "@/lib/share-links";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { useActiveBrand } from "@/lib/use-active-brand";

/** Estado y controladores de la pantalla de parrillas. */
export function useParrillasPage() {
  const posts = useHublyStore((s) => s.posts);
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const [activeTab, setActiveTab] = useState<SocialSubTab>("calendario");
  const [showDemoData, setShowDemoData] = useState(backendEnabled);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [connectingNet, setConnectingNet] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextTab = parseParrillasTab(new URLSearchParams(window.location.search).get("tab"));
    if (nextTab) setActiveTab(nextTab); // eslint-disable-line react-hooks/set-state-in-effect -- URL o editor externos a React
  }, []);

  // Quien acaba de usar el editor debe ver su post en el calendario.
  useEffect(() => {
    if (composerOpen) setShowDemoData(true); // eslint-disable-line react-hooks/set-state-in-effect -- URL o editor externos a React
  }, [composerOpen]);

  const activeBrand = useActiveBrand();
  const brandName = activeBrand?.name || "";
  const brandHandle = resolveBrandBioHandle(activeBrand);
  const shareToken = activeBrand?.shareToken ?? "";
  const brandPosts = filterPostsByBrand(posts, activeBrand?.id);

  // Con cuentas reales cada enlace se genera al pedirlo: solo se guarda su hash.
  const handleOpenPortal = async (e: React.MouseEvent) => {
    if (!backendEnabled) return;
    e.preventDefault();
    const url = await clientShareUrl(activeBrand);
    if (url) window.open(url, "_blank", "noopener");
  };

  const handleCopyClientLink = async (e?: React.MouseEvent): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (backendEnabled) e?.preventDefault?.();
    const url = await clientShareUrl(activeBrand);
    if (!url) return false;
    return copyText(url);
  };

  const handleConnectNetwork = (netName: string) => {
    setConnectingNet(netName);
    setTimeout(() => {
      setConnectingNet(null);
      setShowDemoData(true);
    }, 900);
  };

  return {
    posts,
    activeTab,
    setActiveTab,
    showDemoData,
    setShowDemoData,
    importModalOpen,
    setImportModalOpen,
    accountsModalOpen,
    setAccountsModalOpen,
    connectingNet,
    activeBrand,
    brandName,
    brandHandle,
    shareToken,
    brandPosts,
    handleOpenPortal,
    handleCopyClientLink,
    handleConnectNetwork,
  };
}
