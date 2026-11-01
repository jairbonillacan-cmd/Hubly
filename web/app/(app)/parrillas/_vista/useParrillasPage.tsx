"use client";

import { copyText } from "@/lib/clipboard";
import React, { useEffect, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { currentAgencyId } from "@/lib/live-workspace";
import {
  HublyBentoIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyChatIcon,
  HublyLinkIcon,
  HublyPresentationIcon,
  HublySparkIcon,
} from "@/components/app/icons/DuotoneIcons";
import { SocialSubTab, } from "./parrillasPage-shared";

/** Estado y datos de ParrillasPage. */
export function useParrillasPage() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const posts = useHublyStore((s) => s.posts);
  const [activeTab, setActiveTab] = useState<SocialSubTab>("calendario");
  const [showDemoData, setShowDemoData] = useState(backendEnabled);
  const composerOpen = useHublyStore((s) => s.composerOpen);
  const [moreNetworksOpen, setMoreNetworksOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [linksSubTab, setLinksSubTab] = useState<"contenido" | "diseno" | "numeros">("contenido");
  const [siguenosEnabled, setSiguenosEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [connectingNet, setConnectingNet] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "liga" || t === "links") setActiveTab("links");
    else if (t === "reportes") setActiveTab("reportes");
    else if (t === "ideas") setActiveTab("ideas");
    else if (t === "mensajes") setActiveTab("mensajes");
    else if (t === "analytics") setActiveTab("analytics");
    else if (t === "tableros") setActiveTab("tableros");
    else if (t === "calendario") setActiveTab("calendario");
  }, []);
  const activeBrand =
    brands.find((b) => b.id === activeBrandId) ||
    brands.find((b) => b.id === "brand-min") ||
    brands[0];
  const brandName =
    activeBrand?.name || "";
  const brandHandle =
    activeBrand?.bioLink?.handle || activeBrand?.slug || "";
  const shareToken = activeBrand?.shareToken || "min-nov";
  const brandPosts = posts.filter((p) => p.brandId === activeBrand?.id);
  // Quien acaba de usar el editor debe ver su post en el calendario.
  useEffect(() => {
    if (composerOpen) setShowDemoData(true);
  }, [composerOpen]);
  const liveShareUrl = async () => {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: activeBrand?.id, agencyId: currentAgencyId() }),
    });
    if (!res.ok) return null;
    const { token } = (await res.json()) as { token: string };
    return `${window.location.origin}/share/${token}`;
  };
  // Con cuentas reales cada enlace se genera al pedirlo: solo se guarda su hash.
  const handleOpenPortal = async (e: React.MouseEvent) => {
    if (!backendEnabled) return;
    e.preventDefault();
    const url = await liveShareUrl();
    if (url) window.open(url, "_blank", "noopener");
  };
  const handleCopyClientLink = async (e?: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    if (backendEnabled) e?.preventDefault?.();
    const url = backendEnabled ? await liveShareUrl() : `${window.location.origin}/share/${shareToken}`;
    if (!url) return;
    void copyText(url).then((ok) => {
      if (!ok) return;
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    });
  };
  const handleCopyBioLink = () => {
    if (typeof window === "undefined") return;
    void copyText(`https://hubly.app/@${brandHandle}`).then((ok) => {
      if (!ok) return;
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2000);
    });
  };
  const handleConnectNetwork = (netName: string) => {
    setConnectingNet(netName);
    setTimeout(() => {
      setConnectingNet(null);
      setShowDemoData(true);
    }, 900);
  };
  const navItems: { id: SocialSubTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "calendario",
      label: "Calendario",
      icon: <HublyCalendarIcon size={18} />,
    },
    { id: "ideas", label: "Ideas", icon: <HublySparkIcon size={18} /> },
    { id: "mensajes", label: "Mensajes", icon: <HublyChatIcon size={18} /> },
    { id: "analytics", label: "Analytics", icon: <HublyChartIcon size={18} /> },
    { id: "tableros", label: "Tableros", icon: <HublyBentoIcon size={18} /> },
    { id: "reportes", label: "Reportes", icon: <HublyPresentationIcon size={18} /> },
    { id: "links", label: "Links", icon: <HublyLinkIcon size={18} /> },
  ];

  return { brands, activeBrandId, posts, activeTab, setActiveTab, showDemoData, setShowDemoData, composerOpen, moreNetworksOpen, setMoreNetworksOpen, importModalOpen, setImportModalOpen, accountsModalOpen, setAccountsModalOpen, copiedLink, setCopiedLink, copiedBio, setCopiedBio, linksSubTab, setLinksSubTab, siguenosEnabled, setSiguenosEnabled, whatsappEnabled, setWhatsappEnabled, whatsappNumber, setWhatsappNumber, editingWhatsapp, setEditingWhatsapp, connectingNet, setConnectingNet, activeBrand, brandName, brandHandle, shareToken, brandPosts, liveShareUrl, handleOpenPortal, handleCopyClientLink, handleCopyBioLink, handleConnectNetwork, navItems };
}

export type ParrillasPageModel = ReturnType<typeof useParrillasPage>;
