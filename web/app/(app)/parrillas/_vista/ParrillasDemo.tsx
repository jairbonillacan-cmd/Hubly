"use client";

import Link from "next/link";
import { backendEnabled } from "@/lib/supabase/config";
import { SocialCalendar } from "@/components/app/social/SocialCalendar";
import { MonthlyReport } from "@/components/app/reports/MonthlyReport";
import {
  HublyPlusIcon as Plus,
} from "@/components/app/icons/DuotoneIcons";
import type { ParrillasPageModel } from "./useParrillasPage";

export function ParrillasDemo({ view }: { view: ParrillasPageModel }) {
  const { activeTab, showDemoData, activeBrand, brandPosts, handleCopyClientLink } = view;

  return (
    <>
      {activeTab === "calendario" && showDemoData && (
        <div>
          <SocialCalendar brand={activeBrand} posts={brandPosts} onCopyLink={() => void handleCopyClientLink()} />
        </div>
      )}

      {/* TAB 6: REPORTES */}
      {activeTab === "reportes" && backendEnabled && <MonthlyReport brand={activeBrand} posts={brandPosts} />}
      {activeTab === "reportes" && !backendEnabled && (
        <div>
          {/* Secondary Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 14,
              borderBottom: "1px solid var(--ui-border)",
              marginBottom: 48,
            }}
          >
            

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              

              <div
                style={{
                  display: "inline-flex",
                  background: "var(--ui-muted)",
                  padding: 3,
                  borderRadius: 10,
                  gap: 2,
                }}
              >
                
                
              </div>

              <Link
                href="/reportes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--hb-accent)",
                  color: "#FFFFFF",
                  borderRadius: 10,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Plus size={15} />
                <span>Nuevo</span>
              </Link>
            </div>
          </div>

          {/* Center Empty State */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "64px 20px",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: "#DBEAFE",
                color: "var(--hb-accent-text)",
                display: "grid",
                placeItems: "center",
                marginBottom: 18,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--hb-accent)" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="17" x2="8" y2="13" />
                <line x1="12" y1="17" x2="12" y2="11" />
                <line x1="16" y1="17" x2="16" y2="15" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: "0 0 6px",
              }}
            >
              No hay reportes aún
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--ui-text-4)",
                margin: "0 0 20px",
              }}
            >
              Crea tu primer reporte para empezar
            </p>

            <Link
              href="/reportes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--hb-accent)",
                color: "#FFFFFF",
                borderRadius: 12,
                padding: "11px 22px",
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Plus size={15} />
              <span>Nuevo reporte</span>
            </Link>
          </div>
        </div>
      )}

      {/* TAB 7: LINKS */}
    </>
  );
}
