"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AppDialogHost } from "@/components/app/AppDialogHost";
import { ChatQueueRunner } from "@/components/app/chat/ChatQueueRunner";
import { DescubreHublyWidget } from "@/components/app/DescubreHublyWidget";
import { SaveStatus } from "@/components/app/SaveStatus";
import { useHublyStore } from "@/lib/store";
import "@/lib/live-merge-bridge";

// Pesan mucho y casi nunca se abren al entrar: no van en el paquete inicial.
const FloatingAIDrawer = dynamic(() => import("@/components/app/FloatingAIDrawer").then((m) => m.FloatingAIDrawer), { ssr: false });
const PostComposerModal = dynamic(() => import("@/components/app/PostComposerModal").then((m) => m.PostComposerModal), { ssr: false });
const NewBrandModal = dynamic(() => import("@/components/app/NewBrandModal").then((m) => m.NewBrandModal), { ssr: false });
const CommandPaletteModal = dynamic(() => import("@/components/app/CommandPaletteModal").then((m) => m.CommandPaletteModal), { ssr: false });
const InviteTeamModal = dynamic(() => import("@/components/app/InviteTeamModal").then((m) => m.InviteTeamModal), { ssr: false });
const NotebookReaderModal = dynamic(() => import("@/components/app/NotebookReaderModal").then((m) => m.NotebookReaderModal), { ssr: false });
const WidgetConfigModal = dynamic(() => import("@/components/app/WidgetConfigModal").then((m) => m.WidgetConfigModal), { ssr: false });
const AutoSuggestionsModal = dynamic(() => import("@/components/app/AutoSuggestionsModal").then((m) => m.AutoSuggestionsModal), { ssr: false });

/** Lo que flota sobre cualquier pantalla: ventanas, cajones y avisos. */
export function AppSurfaces() {
  // Solo existen en el navegador: montarlas tras hidratar evita que el servidor intente validarlas.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []); // eslint-disable-line react-hooks/set-state-in-effect -- marca el fin de la hidratación
  const activeNotebookId = useHublyStore((s) => s.activeNotebookId);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);
  const widgetConfigModalOpen = useHublyStore((s) => s.widgetConfigModalOpen);
  const setWidgetConfigModalOpen = useHublyStore((s) => s.setWidgetConfigModalOpen);
  const autoSuggestionsModalOpen = useHublyStore((s) => s.autoSuggestionsModalOpen);
  const setAutoSuggestionsModalOpen = useHublyStore((s) => s.setAutoSuggestionsModalOpen);

  return (
    <>
      <DescubreHublyWidget />
      <AppDialogHost />
      <ChatQueueRunner />
      <SaveStatus />
      {hydrated && (
        <>
          <FloatingAIDrawer />
        <PostComposerModal />
        <NewBrandModal />
        <CommandPaletteModal />
        <InviteTeamModal />
        <NotebookReaderModal open={Boolean(activeNotebookId)} notebookId={activeNotebookId} onClose={() => setActiveNotebookId(null)} />
        <WidgetConfigModal open={widgetConfigModalOpen} onClose={() => setWidgetConfigModalOpen(false)} />
        <AutoSuggestionsModal open={autoSuggestionsModalOpen} onClose={() => setAutoSuggestionsModalOpen(false)} />
        </>
      )}
    </>
  );
}
