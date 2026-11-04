"use client";

import "@/components/app/parrillas/parrillas.css";
import { backendEnabled } from "@/lib/supabase/config";
import { ParrillasCalendario } from "@/components/app/parrillas/ParrillasCalendario";
import { ParrillasCuentasModal } from "@/components/app/parrillas/ParrillasCuentasModal";
import { ParrillasLinks } from "@/components/app/parrillas/ParrillasLinks";
import { ParrillasNav } from "@/components/app/parrillas/ParrillasNav";
import { ParrillasReportesVacio } from "@/components/app/parrillas/ParrillasReportesVacio";
import { useParrillasPage } from "@/components/app/parrillas/useParrillasPage";
import { MonthlyReport } from "@/components/app/reports/MonthlyReport";
import { ImportMonthModal } from "@/components/app/social/CalendarModals";
import { IdeasBoard } from "@/components/app/social/IdeasBoard";
import { OrganicAnalytics } from "@/components/app/social/OrganicAnalytics";
import { PostInbox } from "@/components/app/social/PostInbox";
import { ProductionBoard } from "@/components/app/social/ProductionBoard";
import { SocialCalendar } from "@/components/app/social/SocialCalendar";

export default function ParrillasPage() {
  const {
    posts, activeTab, setActiveTab, showDemoData, setShowDemoData,
    importModalOpen, setImportModalOpen, accountsModalOpen, setAccountsModalOpen,
    connectingNet, activeBrand, brandName, brandHandle, shareToken, brandPosts,
    handleOpenPortal, handleCopyClientLink, handleConnectNetwork,
  } = useParrillasPage();

  return (
    <div className="hubly-touch hubly-parrillas-page">
      <ParrillasNav activeTab={activeTab} onSelectTab={setActiveTab} onOpenAccounts={() => setAccountsModalOpen(true)} />
      {activeTab === "calendario" && !showDemoData && (
        <ParrillasCalendario
          brandName={brandName}
          shareToken={shareToken}
          connectingNet={connectingNet}
          onConnectNetwork={handleConnectNetwork}
          onCopyClientLink={handleCopyClientLink}
          onShowDemo={() => setShowDemoData(true)}
          onOpenImport={() => setImportModalOpen(true)}
        />
      )}
      {activeTab === "calendario" && showDemoData && activeBrand && (
        <SocialCalendar brand={activeBrand} posts={brandPosts} onCopyLink={() => void handleCopyClientLink()} />
      )}
      {activeTab === "ideas" && <IdeasBoard brandId={activeBrand?.id || ""} brandName={brandName} />}
      {activeTab === "mensajes" && <PostInbox key={activeBrand?.id} posts={brandPosts} />}
      {activeTab === "analytics" && <OrganicAnalytics posts={brandPosts} />}
      {activeTab === "tableros" && <ProductionBoard posts={brandPosts} />}
      {activeTab === "reportes" && backendEnabled && activeBrand && <MonthlyReport brand={activeBrand} posts={brandPosts} />}
      {activeTab === "reportes" && !backendEnabled && <ParrillasReportesVacio />}
      {activeTab === "links" && (
        <ParrillasLinks
          brandName={brandName}
          brandHandle={brandHandle}
          brandDescription={activeBrand?.core?.whatTheySell}
          shareToken={shareToken}
          onBack={() => setActiveTab("calendario")}
          onOpenPortal={handleOpenPortal}
        />
      )}
      {importModalOpen && activeBrand && (
        <ImportMonthModal brand={activeBrand} posts={posts} onClose={() => setImportModalOpen(false)} />
      )}
      <ParrillasCuentasModal
        open={accountsModalOpen}
        brandName={brandName}
        onClose={() => setAccountsModalOpen(false)}
        onConnectNetwork={handleConnectNetwork}
      />
    </div>
  );
}
