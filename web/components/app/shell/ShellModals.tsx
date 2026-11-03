"use client";

import dynamic from "next/dynamic";
import { useHublyStore } from "@/lib/store";
import { AppDialogHost } from "@/components/app/AppDialogHost";
import { DescubreHublyWidget } from "@/components/app/DescubreHublyWidget";
import { FloatingAIDrawer } from "@/components/app/FloatingAIDrawer";
import { SaveStatus } from "@/components/app/SaveStatus";

// Las ventanas viven montadas pero cerradas: se cargan aparte para no engordar el armazón.
const PostComposerModal = dynamic(() => import("@/components/app/PostComposerModal").then((m) => m.PostComposerModal), { ssr: false });
const NewBrandModal = dynamic(() => import("@/components/app/NewBrandModal").then((m) => m.NewBrandModal), { ssr: false });
const CommandPaletteModal = dynamic(() => import("@/components/app/CommandPaletteModal").then((m) => m.CommandPaletteModal), { ssr: false });
const InviteTeamModal = dynamic(() => import("@/components/app/InviteTeamModal").then((m) => m.InviteTeamModal), { ssr: false });
const NotebookReaderModal = dynamic(() => import("@/components/app/NotebookReaderModal").then((m) => m.NotebookReaderModal), { ssr: false });
const WidgetConfigModal = dynamic(() => import("@/components/app/WidgetConfigModal").then((m) => m.WidgetConfigModal), { ssr: false });
const AutoSuggestionsModal = dynamic(() => import("@/components/app/AutoSuggestionsModal").then((m) => m.AutoSuggestionsModal), { ssr: false });

/** Superficies compartidas por todas las pantallas: avisos, Hubi, editor y ventanas. */
export function ShellModals() {
  const inviteModalOpen = useHublyStore((s) => s.inviteModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
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
      <SaveStatus />
      <FloatingAIDrawer />
      <PostComposerModal />
      <NewBrandModal />
      <CommandPaletteModal />
      <InviteTeamModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
      <NotebookReaderModal
        open={Boolean(activeNotebookId)}
        notebookId={activeNotebookId}
        onClose={() => setActiveNotebookId(null)}
      />
      <WidgetConfigModal open={widgetConfigModalOpen} onClose={() => setWidgetConfigModalOpen(false)} />
      <AutoSuggestionsModal open={autoSuggestionsModalOpen} onClose={() => setAutoSuggestionsModalOpen(false)} />
    </>
  );
}
