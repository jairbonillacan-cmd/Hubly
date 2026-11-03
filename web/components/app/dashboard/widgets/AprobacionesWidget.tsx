"use client";

import { HublyCheckCircleIcon } from "@/components/app/icons/DuotoneIcons";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import type { selectTodayPostsAndApprovals } from "@/lib/domain-selectors";

type TodayAndApprovals = ReturnType<typeof selectTodayPostsAndApprovals>;

/** Posts que esperan la aprobación del cliente. */
export function AprobacionesWidget({ todayAndApprovals }: { todayAndApprovals: TodayAndApprovals }) {
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);

    return (
      <section
        key="aprobaciones"
        className="hb-widget"
      >
        <div className="hb-widget-head">
          <div className="hb-widget-title">
            <span className="hb-widget-icon-box">
              <HublyCheckCircleIcon size={18} />
            </span>
            <span>Aprobaciones</span>
            {todayAndApprovals.approvalsCount > 0 && (
              <span className="hb-widget-badge">{todayAndApprovals.approvalsCount}</span>
            )}
          </div>
          <Link href="/parrillas" className="hb-widget-link">
            Ver todas →
          </Link>
        </div>

        {todayAndApprovals.isEmptyApprovals ? (
          <div className="hb-widget-body hb-widget-empty">
            <div className="hb-empty-illus">
              <HublyCheckCircleIcon size={26} />
            </div>
            <div className="hb-empty-title">Sin aprobaciones pendientes</div>
            <p className="hb-empty-desc">Nada esperando aprobación ✓</p>
          </div>
        ) : (
          <div className="hb-widget-body" style={{ padding: "14px 20px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayAndApprovals.approvalPosts.map((post) => {
                const postBrand = brands.find((b) => b.id === post.brandId);
                return (
                  <div
                    key={post.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--ui-muted)",
                      background: "var(--ui-surface-2)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ui-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ui-text-4)", marginTop: 2 }}>
                        {postBrand?.name || "Marca"} · {post.scheduledDate} ({post.scheduledTime})
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() =>
                          updatePostStatus(
                            post.id,
                            "approved",
                            "Aprobado desde Inicio.",
                            profile?.name || "Jair",
                            "agency"
                          )
                        }
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 9px",
                          borderRadius: 999,
                          border: "none",
                          background: "var(--hb-accent)",
                          color: "var(--on-accent)",
                          cursor: "pointer",
                        }}
                      >
                        Aprobar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
}
