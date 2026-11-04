"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { selectTodayPostsAndApprovals } from "@/lib/domain-selectors";
import { HublyCalendarIcon } from "@/components/app/icons/HublyIcons";
import { HublyCalendarIcon as DuoCalendarIcon } from "@/components/app/icons/DuotoneIcons";

export function WidgetHoy({ filterByBrand }: { filterByBrand: boolean }) {
  const timezone = useHublyStore((s) => s.profile?.timezone);
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const brands = useHublyStore((s) => s.brands);
  const posts = useHublyStore((s) => s.posts);
  const openComposer = useHublyStore((s) => s.openComposer);

  const todayAndApprovals = useMemo(
    () => selectTodayPostsAndApprovals(posts, activeBrandId, fixedIsoNow, filterByBrand, timezone),
    [posts, activeBrandId, fixedIsoNow, filterByBrand, timezone]
  );

  return (
    <section key="hoy" data-widget-id="hoy" className="hb-widget">
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">
            <HublyCalendarIcon size={18} />
          </span>
          <span>Hoy</span>
          {todayAndApprovals.todayCount > 0 && (
            <span className="hb-widget-badge">{todayAndApprovals.todayCount}</span>
          )}
        </div>
        <Link href="/calendario" className="hb-widget-link">
          Calendario →
        </Link>
      </div>

      {todayAndApprovals.isEmptyToday ? (
        <div className="hb-widget-body hb-widget-empty">
          <div className="hb-empty-illus">
            <DuoCalendarIcon size={26} />
          </div>
          <div className="hb-empty-title">Sin eventos para hoy</div>
          <p className="hb-empty-desc">Hoy no sale nada programado.</p>
        </div>
      ) : (
        <div className="hb-widget-body hubly-dashboard-body-compact">
          <div className="hubly-dashboard-stack-10">
            {todayAndApprovals.todayPosts.map((post) => {
              const postBrand = brands.find((b) => b.id === post.brandId);
              return (
                <div
                  key={post.id}
                  onClick={() => openComposer(post.id)}
                  className="hubly-dashboard-post-row is-clickable"
                >
                  <div className="hubly-dashboard-item-main">
                    <div className="hubly-dashboard-item-title">{post.title}</div>
                    <div className="hubly-dashboard-item-meta">
                      {post.scheduledTime} · {post.networks.join(", ")}
                      {postBrand ? ` · ${postBrand.name}` : ""}
                    </div>
                  </div>
                  <span className="hubly-dashboard-format-pill">{post.format}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
