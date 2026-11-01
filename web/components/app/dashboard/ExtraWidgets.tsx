"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { addDaysToIsoDate, resolveDateInTimezone } from "@/lib/domain-selectors";
import { buildMonthlyReport } from "@/lib/reporting";
import { backendEnabled } from "@/lib/supabase/config";
import { STATUS_META } from "@/components/app/social/status-meta";
import {
  HublyBoltIcon,
  HublyCalendarIcon,
  HublyChartIcon,
  HublyChatIcon,
  HublyHashIcon,
  HublyImageIcon,
  HublyPeopleIcon,
} from "@/components/app/icons/DuotoneIcons";
import type {
  ActivityEventType,
  BrandProject,
  DashboardMetricId,
  DashboardWidgetId,
} from "@/lib/types";

const FILAS_MAX = 5;

export const METRIC_LABELS: Record<DashboardMetricId, string> = {
  publicados: "Posts publicados",
  programados: "Posts programados",
  aprobaciones: "Aprobaciones pendientes",
  gasto: "Gasto en ads",
  resultados: "Resultados de ads",
  ctr: "CTR promedio",
};

const ACTIVIDAD_VERBO: Partial<Record<ActivityEventType, string>> = {
  task_completed: "completó una tarea",
  task_started: "empezó una tarea",
  post_published: "publicó un post",
  post_submitted: "mandó un post a aprobación",
  post_approved: "aprobó un post",
  notebook_updated: "actualizó una libreta",
  commitment_updated: "actualizó un compromiso",
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function fechaCorta(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
}

export function selectCriticalProjects(projects: BrandProject[]) {
  const statusWeight = { Revisión: 0, "En curso": 1, Completado: 2 } as const;
  return projects
    .filter((p) => p.status !== "Completado")
    .sort(
      (a, b) =>
        statusWeight[a.status] - statusWeight[b.status] ||
        a.dueDate.localeCompare(b.dueDate) ||
        a.progress - b.progress
    )
    .slice(0, 5);
}

export function useHoyIso() {
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const timezone = useHublyStore((s) => s.profile?.timezone);
  return resolveDateInTimezone(fixedIsoNow, timezone).isoDate;
}

export function WidgetShell({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="hb-widget">
      <div className="hb-widget-head">
        <div className="hb-widget-title">
          <span className="hb-widget-icon-box">{icon}</span>
          <span>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function WidgetVacio({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="hb-widget-body hb-widget-empty">
      <div className="hb-empty-illus">{icon}</div>
      <div className="hb-empty-title">{title}</div>
      <p className="hb-empty-desc">{text}</p>
    </div>
  );
}

export function WidgetFila({ title, meta, side }: { title: string; meta?: string; side?: React.ReactNode }) {
  return (
    <div className="hubly-wfila">
      <div className="hubly-wfila-texto">
        <div className="hubly-wfila-titulo" title={title}>{title}</div>
        {meta && <div className="hubly-wfila-meta" title={meta}>{meta}</div>}
      </div>
      {side}
    </div>
  );
}

function MetricaWidget() {
  const metric = useHublyStore((s) => s.widgets.find((w) => w.id === "metrica")?.metric) ?? "publicados";
  const setWidgetMetric = useHublyStore((s) => s.setWidgetMetric);
  const posts = useHublyStore((s) => s.posts);
  const ads = useHublyStore((s) => s.ads);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const brandName = useHublyStore((s) => s.brands.find((b) => b.id === s.activeBrandId)?.name);
  const currency = useHublyStore((s) => s.agency?.currency);
  const hoy = useHoyIso();

  const valor = useMemo(() => {
    const mes = hoy.slice(0, 7);
    const brandPosts = posts.filter((p) => p.brandId === activeBrandId);
    const brandAds = ads.filter((a) => a.brandId === activeBrandId);
    if (metric === "publicados") {
      return String(brandPosts.filter((p) => p.status === "published" && p.scheduledDate.startsWith(mes)).length);
    }
    if (metric === "programados") {
      return String(brandPosts.filter((p) => p.status === "scheduled" && p.scheduledDate >= hoy).length);
    }
    if (metric === "aprobaciones") {
      return String(brandPosts.filter((p) => p.status === "pending").length);
    }
    if (backendEnabled || brandAds.length === 0) return null;
    if (metric === "gasto") {
      return `${brandAds.reduce((acc, a) => acc + (a.spend || 0), 0).toLocaleString("es-MX")} ${currency || "MXN"}`;
    }
    if (metric === "resultados") {
      return brandAds.reduce((acc, a) => acc + (a.results || 0), 0).toLocaleString("es-MX");
    }
    return `${(brandAds.reduce((acc, a) => acc + a.ctr, 0) / brandAds.length).toFixed(2)}%`;
  }, [activeBrandId, ads, currency, hoy, metric, posts]);

  return (
    <WidgetShell
      icon={<HublyBoltIcon size={18} />}
      title="Métrica"
      action={
        <select
          className="hubly-wselect"
          aria-label="Número a mostrar"
          value={metric}
          onChange={(e) => setWidgetMetric("metrica", e.target.value as DashboardMetricId)}
        >
          {(Object.keys(METRIC_LABELS) as DashboardMetricId[]).map((id) => (
            <option key={id} value={id}>{METRIC_LABELS[id]}</option>
          ))}
        </select>
      }
    >
      <div className="hb-widget-body hubly-wmetrica">
        {valor === null ? (
          <p className="hb-empty-desc">Conecta las cuentas publicitarias de esta marca para ver este número.</p>
        ) : (
          <>
            <div className="hubly-wnumero">{valor}</div>
            <div className="hubly-wnumero-rotulo">{METRIC_LABELS[metric]}{brandName ? ` · ${brandName}` : ""}</div>
          </>
        )}
      </div>
    </WidgetShell>
  );
}

function PostsWidget() {
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const hoy = useHoyIso();
  const proximos = useMemo(
    () =>
      posts
        .filter(
          (p) =>
            p.brandId === activeBrandId &&
            p.scheduledDate >= hoy &&
            p.status !== "published" &&
            p.status !== "draft"
        )
        .sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`)),
    [activeBrandId, hoy, posts]
  );

  return (
    <WidgetShell
      icon={<HublyHashIcon size={18} />}
      title="Posts"
      action={<Link href="/calendario" className="hb-widget-link">Calendario →</Link>}
    >
      {proximos.length === 0 ? (
        <WidgetVacio
          icon={<HublyHashIcon size={26} />}
          title="Sin posts próximos"
          text="Aquí verás lo que salga después en esta marca."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {proximos.slice(0, FILAS_MAX).map((post) => {
            const status = STATUS_META[post.status];
            return (
              <WidgetFila
                key={post.id}
                title={post.title}
                meta={`${fechaCorta(post.scheduledDate)} · ${post.scheduledTime}`}
                side={
                  <span className="hubly-wpill" style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                }
              />
            );
          })}
          {proximos.length > FILAS_MAX && (
            <div className="hubly-wfilas-mas">+{proximos.length - FILAS_MAX} más</div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}

function FeedWidget() {
  const posts = useHublyStore((s) => s.posts);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const publicados = useMemo(
    () =>
      posts
        .filter((p) => p.brandId === activeBrandId && p.status === "published")
        .sort((a, b) => `${b.scheduledDate}${b.scheduledTime}`.localeCompare(`${a.scheduledDate}${a.scheduledTime}`)),
    [activeBrandId, posts]
  );

  return (
    <WidgetShell
      icon={<HublyImageIcon size={18} />}
      title="Feed"
      action={<Link href="/calendario" className="hb-widget-link">Calendario →</Link>}
    >
      {publicados.length === 0 ? (
        <WidgetVacio
          icon={<HublyImageIcon size={26} />}
          title="Sin posts publicados"
          text="Aquí verás lo último que salió de esta marca."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {publicados.slice(0, FILAS_MAX).map((post) => (
            <WidgetFila
              key={post.id}
              title={post.title}
              meta={`${fechaCorta(post.scheduledDate)} · ${post.networks.join(", ")}`}
              side={
                post.metrics ? (
                  <span className="hubly-wfila-lado">{post.metrics.reach.toLocaleString("es-MX")} de alcance</span>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function SemanaWidget() {
  const posts = useHublyStore((s) => s.posts);
  const hoy = useHoyIso();
  const dias = useMemo(() => {
    const desdeLunes = (new Date(`${hoy}T12:00:00`).getDay() + 6) % 7;
    return DIAS.map((nombre, i) => {
      const iso = addDaysToIsoDate(hoy, i - desdeLunes);
      return {
        iso,
        nombre,
        total: posts.filter((p) => p.scheduledDate === iso && p.status !== "draft").length,
      };
    });
  }, [hoy, posts]);
  const total = dias.reduce((acc, d) => acc + d.total, 0);

  return (
    <WidgetShell
      icon={<HublyCalendarIcon size={18} />}
      title="Semana"
      action={<Link href="/calendario" className="hb-widget-link">Calendario →</Link>}
    >
      {total === 0 ? (
        <WidgetVacio
          icon={<HublyCalendarIcon size={26} />}
          title="Sin posts esta semana"
          text="Cuando programes, aquí ves la semana de todas tus marcas."
        />
      ) : (
        <div className="hb-widget-body hubly-wsemana">
          <div className="hubly-wsemana-dias">
            {dias.map((dia) => (
              <div key={dia.iso} className={`hubly-wsemana-dia ${dia.iso === hoy ? "is-today" : ""}`}>
                <span>{dia.nombre}</span>
                <strong>{Number(dia.iso.slice(8))}</strong>
                <span>{dia.total}</span>
              </div>
            ))}
          </div>
          <p className="hubly-wnumero-rotulo">{total} {total === 1 ? "post" : "posts"} esta semana</p>
        </div>
      )}
    </WidgetShell>
  );
}

function MensajesWidget() {
  const channels = useHublyStore((s) => s.channels);
  const messages = useHublyStore((s) => s.messages);
  const filas = useMemo(
    () =>
      [...channels]
        .sort((a, b) => b.unread - a.unread)
        .slice(0, FILAS_MAX)
        .map((channel) => ({
          channel,
          last: messages.filter((m) => m.channelId === channel.id).at(-1),
        })),
    [channels, messages]
  );

  return (
    <WidgetShell
      icon={<HublyChatIcon size={18} />}
      title="Mensajes"
      action={<Link href="/chat" className="hb-widget-link">Chat →</Link>}
    >
      {filas.length === 0 ? (
        <WidgetVacio
          icon={<HublyChatIcon size={26} />}
          title="Sin chats"
          text="Aquí verás las conversaciones de tu equipo."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {filas.map(({ channel, last }) => (
            <WidgetFila
              key={channel.id}
              title={channel.name}
              meta={last ? `${last.sender}: ${last.text}` : "Sin mensajes todavía"}
              side={channel.unread > 0 ? <span className="hubly-wfila-lado">{channel.unread} sin leer</span> : undefined}
            />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function ActividadWidget() {
  const events = useHublyStore((s) => s.activityEvents);
  const team = useHublyStore((s) => s.team);
  const brands = useHublyStore((s) => s.brands);
  const recientes = useMemo(
    () =>
      events
        .filter((e) => ACTIVIDAD_VERBO[e.type])
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, FILAS_MAX),
    [events]
  );

  return (
    <WidgetShell
      icon={<HublyPeopleIcon size={18} />}
      title="Actividad"
      action={<Link href="/equipo" className="hb-widget-link">Equipo →</Link>}
    >
      {recientes.length === 0 ? (
        <WidgetVacio
          icon={<HublyPeopleIcon size={26} />}
          title="Sin actividad reciente"
          text="Aquí verás lo que vaya haciendo tu equipo."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {recientes.map((event) => {
            const member = team.find((m) => m.id === event.memberId);
            const brand = brands.find((b) => b.id === event.brandId);
            return (
              <WidgetFila
                key={event.id}
                title={`${member?.name || "Alguien del equipo"} ${ACTIVIDAD_VERBO[event.type]}`}
                meta={[fechaCorta(event.timestamp), brand?.name].filter(Boolean).join(" · ")}
              />
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}

function EquipoWidget() {
  const team = useHublyStore((s) => s.team);
  const ranking = useMemo(
    () => team.filter((m) => m.status === "Activo").sort((a, b) => b.points - a.points).slice(0, FILAS_MAX),
    [team]
  );

  return (
    <WidgetShell
      icon={<HublyChartIcon size={18} />}
      title="Equipo"
      action={<Link href="/equipo" className="hb-widget-link">Ver equipo →</Link>}
    >
      {ranking.length === 0 ? (
        <WidgetVacio
          icon={<HublyPeopleIcon size={26} />}
          title="Sin miembros activos"
          text="Aquí verás quién lleva más puntos."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {ranking.map((member) => (
            <WidgetFila
              key={member.id}
              title={member.name}
              meta={member.role}
              side={<span className="hubly-wfila-lado">{member.points.toLocaleString("es-MX")} pts</span>}
            />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function ReportesWidget() {
  const brands = useHublyStore((s) => s.brands);
  const posts = useHublyStore((s) => s.posts);
  const hoy = useHoyIso();
  const mes = hoy.slice(0, 7);
  const filas = useMemo(
    () =>
      brands
        .filter((b) => !b.archived)
        .slice(0, FILAS_MAX)
        .map((brand) => ({
          brand,
          report: buildMonthlyReport(
            posts.filter((p) => p.brandId === brand.id),
            mes
          ),
        })),
    [brands, mes, posts]
  );

  return (
    <WidgetShell
      icon={<HublyChartIcon size={18} />}
      title="Reportes"
      action={<Link href="/reportes" className="hb-widget-link">Ver reportes →</Link>}
    >
      {filas.length === 0 ? (
        <WidgetVacio
          icon={<HublyChartIcon size={26} />}
          title="Sin reportes aún"
          text="Aquí verás los últimos reportes de tus marcas."
        />
      ) : (
        <div className="hb-widget-body hubly-wfilas">
          {filas.map(({ brand, report }) => (
            <WidgetFila
              key={brand.id}
              title={brand.name}
              meta={`${report.published} ${report.published === 1 ? "publicado" : "publicados"} · ${mes}`}
              side={<span className="hubly-wfila-lado">{report.reach.toLocaleString("es-MX")} de alcance</span>}
            />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

export function ExtraWidget({ id }: { id: DashboardWidgetId }) {
  switch (id) {
    case "metrica":
      return <MetricaWidget />;
    case "posts":
      return <PostsWidget />;
    case "feed":
      return <FeedWidget />;
    case "semana":
      return <SemanaWidget />;
    case "mensajes":
      return <MensajesWidget />;
    case "actividad":
      return <ActividadWidget />;
    case "equipo":
      return <EquipoWidget />;
    case "reportes":
      return <ReportesWidget />;
    default:
      return null;
  }
}
