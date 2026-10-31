"use client";

import { useHublyStore } from "@/lib/store";
import { MonthDragCalendar } from "@/components/app/MonthDragCalendar";
import type { BrandWorkspace, SocialPost } from "@/lib/types";
import { MonthlyQuota } from "./MonthlyQuota";
import { STATUS_META } from "./status-meta";

export function PostMonthCalendar({ posts, brand }: { posts: SocialPost[]; brand?: BrandWorkspace }) {
  const movePost = useHublyStore((s) => s.movePost);
  const openComposer = useHublyStore((s) => s.openComposer);

  return (
    <MonthDragCalendar
      entries={posts.map((post) => ({
        id: post.id,
        date: post.scheduledDate,
        label: `${post.scheduledTime} ${post.title}`,
        title: `${post.title} · ${STATUS_META[post.status].label}`,
        bg: STATUS_META[post.status].bg,
        color: STATUS_META[post.status].color,
        sortKey: post.scheduledTime,
      }))}
      hint="Arrastra un post para cambiarlo de día"
      addLabel="Nuevo post"
      renderTop={brand ? (year, month) => <MonthlyQuota brand={brand} posts={posts} year={year} month={month} /> : undefined}
      onMove={movePost}
      onOpen={(id) => openComposer(id)}
      onAdd={(date) => openComposer(null, date)}
    />
  );
}
