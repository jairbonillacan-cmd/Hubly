"use client";

import { ImportMonthModal } from "@/components/app/social/CalendarModals";
import { Modal } from "@/components/app/ui/Modal";
import { Button } from "@/components/app/ui/Button";
import { IdeasBoard } from "@/components/app/social/IdeasBoard";
import { ProductionBoard } from "@/components/app/social/ProductionBoard";
import { PostInbox } from "@/components/app/social/PostInbox";
import { OrganicAnalytics } from "@/components/app/social/OrganicAnalytics";
import {
  HublyCloseIcon as X,
} from "@/components/app/icons/DuotoneIcons";
import type { ParrillasPageModel } from "./useParrillasPage";

export function ParrillasIdeas({ view }: { view: ParrillasPageModel }) {
  const { posts, activeTab, importModalOpen, setImportModalOpen, accountsModalOpen, setAccountsModalOpen, activeBrand, brandName, brandPosts, handleConnectNetwork } = view;

  return (
    <>
      {activeTab === "ideas" && <IdeasBoard brandId={activeBrand?.id || ""} brandName={brandName} />}
      {activeTab === "mensajes" && <PostInbox key={activeBrand?.id} posts={brandPosts} />}
      {activeTab === "analytics" && <OrganicAnalytics posts={brandPosts} />}
      {activeTab === "tableros" && <ProductionBoard posts={brandPosts} />}

      {importModalOpen && activeBrand && (
        <ImportMonthModal brand={activeBrand} posts={posts} onClose={() => setImportModalOpen(false)} />
      )}

      {/* Modal: Cuentas conectadas */}
      <Modal open={accountsModalOpen} onClose={() => setAccountsModalOpen(false)} label={`Cuentas de ${brandName}`}>
        <div className="hubly-cal-modal-head">
          <h2>Cuentas de {brandName}</h2>
          <button type="button" className="hubly-cal-modal-close" aria-label="Cerrar" onClick={() => setAccountsModalOpen(false)}>
            <X size={14} />
          </button>
        </div>
        <div className="hubly-cal-modal-scroll">
          <p style={{ fontSize: 13, color: "var(--ui-text-4)", marginBottom: 14 }}>
            Conecta o administra los perfiles oficiales de tu cliente.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Instagram", "Facebook", "TikTok", "LinkedIn"].map((net) => (
              <div
                key={net}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--ui-border)",
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{net}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAccountsModalOpen(false);
                    handleConnectNetwork(net);
                  }}
                >
                  Conectar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
