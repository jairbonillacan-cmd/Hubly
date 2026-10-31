import type { SocialPost } from "./types";

export interface MonthlyReportData {
  month: string; // YYYY-MM
  planned: number;
  published: number;
  measured: number;
  reach: number;
  interactions: number;
  saves: number;
  engagementRate: number | null;
  byNetwork: { network: string; posts: number; reach: number }[];
  top: SocialPost[];
}

/** Resume lo publicado en un mes. Solo cuenta métricas que existen: nunca estima. */
export function buildMonthlyReport(posts: SocialPost[], month: string): MonthlyReportData {
  const inMonth = posts.filter((p) => p.scheduledDate.startsWith(month));
  const published = inMonth.filter((p) => p.status === "published");
  const measured = published.filter((p) => p.metrics);
  const sum = (pick: (m: NonNullable<SocialPost["metrics"]>) => number) =>
    measured.reduce((acc, p) => acc + pick(p.metrics!), 0);
  const reach = sum((m) => m.reach);
  const interactions = sum((m) => m.likes + m.comments + m.shares);

  const networks = new Map<string, { posts: number; reach: number }>();
  for (const p of published) {
    const key = p.network || p.networks[0] || "Sin red";
    const row = networks.get(key) || { posts: 0, reach: 0 };
    row.posts += 1;
    row.reach += p.metrics?.reach || 0;
    networks.set(key, row);
  }

  return {
    month,
    planned: inMonth.length,
    published: published.length,
    measured: measured.length,
    reach,
    interactions,
    saves: sum((m) => m.saves),
    engagementRate: reach > 0 ? (interactions / reach) * 100 : null,
    byNetwork: [...networks.entries()]
      .map(([network, row]) => ({ network, ...row }))
      .sort((a, b) => b.reach - a.reach),
    top: [...measured].sort((a, b) => b.metrics!.reach - a.metrics!.reach).slice(0, 5),
  };
}
