"use client";

import { ImportMonthModal } from "@/components/app/social/CalendarModals";
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
      {accountsModalOpen && (
        <div
          onClick={() => setAccountsModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "var(--ui-surface)",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 24px 48px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                Cuentas de {brandName}
              </h3>
              <button
                type="button"
                onClick={() => setAccountsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-4)" }}
              >
                <X size={18} />
              </button>
            </div>
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
                  <button
                    type="button"
                    onClick={() => {
                      setAccountsModalOpen(false);
                      handleConnectNetwork(net);
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--hb-accent)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Conectar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
