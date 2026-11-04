"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { selectTodayPostsAndApprovals } from "@/lib/domain-selectors";
import { HublyCheckCircleIcon } from "@/components/app/icons/DuotoneIcons";

export function WidgetAprobaciones({ filterByBrand }: { filterByBrand: boolean }) {
  const profileName = useHublyStore((s) => s.profile?.name);
  const timezone = useHublyStore((s) => s.profile?.timezone);
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const brands = useHublyStore((s) => s.brands);
  const posts = useHublyStore((s) => s.posts);
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);

  const todayAndApprovals = useMemo(
    () => selectTodayPostsAndApprovals(posts, activeBrandId, fixedIsoNow, filterByBrand, timezone),
    [posts, activeBrandId, fixedIsoNow, filterByBrand, timezone]
  );

  return (
    <section key="aprobaciones" className="hb-widget">
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
        <div className="hb-widget-body hubly-dashboard-body-compact">
          <div className="hubly-dashboard-stack-10">
            {todayAndApprovals.approvalPosts.map((post) => {
              const postBrand = brands.find((b) => b.id === post.brandId);
              return (
                <div key={post.id} className="hubly-dashboard-post-row">
                  <div className="hubly-dashboard-item-main">
                    <div className="hubly-dashboard-item-title">{post.title}</div>
                    <div className="hubly-dashboard-item-meta">
                      {postBrand?.name || "Marca"} · {post.scheduledDate} ({post.scheduledTime})
                    </div>
                  </div>
                  <div className="hubly-dashboard-item-actions">
                    <button
                      type="button"
                      className="hubly-dashboard-approve-btn"
                      onClick={() =>
                        updatePostStatus(
                          post.id,
                          "approved",
                          "Aprobado desde Inicio.",
                          profileName || "Jair",
                          "agency"
                        )
                      }
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
