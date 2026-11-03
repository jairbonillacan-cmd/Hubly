"use client";

import { useMemo, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { MemberDrawer } from "@/components/app/dashboard/MemberDrawer";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  selectGreetingAndDate,
  selectTeamProductivity,
  type TeamProductivityPeriod,
  type EvaluatedTeamMember,
  type TeamAchievementItem,
} from "@/lib/domain-selectors";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { ACHIEVEMENTS_CATALOG, EFFORT_CATEGORIES, XP_LEVEL_TIERS } from "@/lib/team-gamification";
import {
  HublyAwardIcon,
  HublyAwardIcon as Award,
  HublyBoltIcon,
  HublyCheckIcon as Check,
  HublyChevronDownIcon as ChevronDown,
  HublyChevronRightIcon as ChevronRight,
  HublyCloseIcon as X,
  HublyCopyIcon as Copy,
  HublyMailIcon as Mail,
  HublyPencilIcon as Pencil,
  HublyPeopleIcon as Users,
  HublyPersonIcon as UserCheck,
  HublyPersonIcon as UserPlus,
  HublyPulseIcon as TrendingUp,
  HublySearchIcon as Search,
  HublySlidersIcon as SlidersHorizontal,
} from "@/components/app/icons/DuotoneIcons";

/* ==========================================================================
   ILLUSTRATED SVG STICKERS & ACHIEVEMENT BADGES (Módulos 98919, 22918, 51903)
   ========================================================================== */

export function AchievementBadgeSvg({
  variant,
  unlocked = false,
}: {
  variant: number;
  unlocked?: boolean;
}) {
  const palettes = [
    { bg: "rgb(var(--hb-accent-rgb) / 0.08)", ring: "var(--hb-accent)", fill: "var(--ui-sky-border)" },
    { bg: "var(--ui-sky-soft)", ring: "var(--hb-accent)", fill: "var(--ui-sky-border)" },
    { bg: "rgb(var(--hb-accent-rgb) / 0.12)", ring: "var(--hb-accent-text)", fill: "var(--ui-sky-border)" },
    { bg: "rgb(var(--hb-accent-rgb) / 0.08)", ring: "var(--ui-sky)", fill: "var(--ui-sky-soft)" },
    { bg: "var(--ui-sky-soft)", ring: "var(--hb-accent-hover)", fill: "rgb(var(--hb-accent-rgb) / 0.14)" },
    { bg: "rgb(var(--hb-accent-rgb) / 0.14)", ring: "var(--hb-accent)", fill: "var(--ui-sky-border)" },
  ];
  const p = palettes[variant % palettes.length];
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      style={{
        opacity: unlocked ? 1 : 0.72,
        filter: unlocked ? "drop-shadow(0 4px 10px rgb(var(--hb-accent-rgb) / 0.16))" : "none",
        transition: "opacity 180ms ease, transform 180ms ease",
      }}
      aria-hidden="true"
    >
      <circle
        cx="28"
        cy="28"
        r="24"
        fill={p.bg}
        stroke={p.ring}
        strokeWidth={unlocked ? "2" : "1.5"}
        strokeDasharray={unlocked ? undefined : "3 2"}
      />
      <circle
        cx="28"
        cy="26"
        r="11"
        fill={p.fill}
        stroke="var(--ui-text)"
        strokeWidth="1.5"
      />
      <circle cx="24.5" cy="24.5" r="1.5" fill="var(--ui-text)" />
      <circle cx="31.5" cy="24.5" r="1.5" fill="var(--ui-text)" />
      <path
        d="M25 28.5C26.2 30 29.8 30 31 28.5"
        stroke="var(--ui-text)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M19 42C20.5 37.5 23.8 35.5 28 35.5C32.2 35.5 35.5 37.5 37 42"
        stroke="var(--ui-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {unlocked && (
        <g>
          <circle cx="43" cy="13" r="7" fill="var(--hb-accent)" stroke="var(--ui-surface)" strokeWidth="1.5" />
          <path
            d="M39.8 13L42 15.2L46.4 10.8"
            stroke="var(--on-accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

/* ==========================================================================
   MAIN EQUIPO VIEW COMPONENT (/dashboard/equipo & /dashboard?tab=equipo)
   ========================================================================== */

export function EquipoView() {
  const team = useHublyStore((s) => s.team);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activityEvents = useHublyStore((s) => s.activityEvents);
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const invitations = useHublyStore((s) => s.invitations);
  const testClock = useHublyStore((s) => s.testClock);

  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const acceptTeamInvitation = useHublyStore((s) => s.acceptTeamInvitation);
  const cancelTeamInvitation = useHublyStore((s) => s.cancelTeamInvitation);
  const updateTeamMember = useHublyStore((s) => s.updateTeamMember);
  const recordActivityEvent = useHublyStore((s) => s.recordActivityEvent);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);

  // Filter & Period states
  const [teamPeriod, setTeamPeriod] = useState<TeamProductivityPeriod>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityRange, setActivityRange] = useState<"Semana" | "Mes">("Semana");
  const [rankingRange, setRankingRange] = useState<"Hoy" | "Semana" | "Mes">("Semana");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => useHublyStore.getState().team.find((m) => m.email === useHublyStore.getState().profile?.email)?.id ?? "tm-1");
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);
  const currentMemberId = useHublyStore((s) => s.team.find((m) => m.email === s.profile?.email)?.id ?? "tm-1");
  const [showAllTeamScope, setShowAllTeamScope] = useState<boolean>(false);

  // Interactive popovers / drawers / accordions
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPresence = useModalPresence(filtersOpen, 100);
  const [brandFilterId, setBrandFilterId] = useState<string>("all");
  const [editingBrandsOpen, setEditingBrandsOpen] = useState(false);
  const [hasCustomizedOwnerBrands, setHasCustomizedOwnerBrands] = useState(false);
  const [showAll39Achievements, setShowAll39Achievements] = useState(false);
  const [achievementCategoryFilter, setAchievementCategoryFilter] = useState<string>("Todos");
  const [pointsAccordionOpen, setPointsAccordionOpen] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // 1. Synchronize primary member (tm-1) with live `profile` from store
  const syncedTeam = useMemo(() => {
    return team.map((m, idx) =>
      m.id === "tm-1" || idx === 0
        ? {
            ...m,
            name: profile.name || m.name,
            avatarInitial: profile.avatarInitial || m.avatarInitial,
            role: profile.role || m.role,
          }
        : m
    );
  }, [team, profile.name, profile.avatarInitial, profile.role]);

  // 2. Filter tasks and posts if a specific brand filter is active
  const filteredTasks = useMemo(() => {
    if (brandFilterId === "all") return tasks;
    return tasks.filter((t) => t.brandId === brandFilterId);
  }, [tasks, brandFilterId]);

  const filteredPosts = useMemo(() => {
    if (brandFilterId === "all") return posts;
    return posts.filter((p) => p.brandId === brandFilterId);
  }, [posts, brandFilterId]);

  // 3. Compute Team Productivity from real store entities via `selectTeamProductivity`
  const productivity = useMemo(
    () =>
      selectTeamProductivity(
        syncedTeam,
        filteredTasks,
        filteredPosts,
        activityEvents,
        teamPeriod,
        searchQuery
      ),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, teamPeriod, searchQuery]
  );

  // 4. Compute Ranking for the selected Ranking tab (Hoy | Semana | Mes)
  const rankingPeriodKey: TeamProductivityPeriod =
    rankingRange === "Hoy" ? "hoy" : rankingRange === "Semana" ? "semana" : "mes";

  const rankingProductivity = useMemo(
    () =>
      selectTeamProductivity(
        syncedTeam,
        filteredTasks,
        filteredPosts,
        activityEvents,
        rankingPeriodKey,
        searchQuery
      ),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, rankingPeriodKey, searchQuery]
  );

  const rankingRows = useMemo(() => {
    return rankingProductivity.ranking.map((m: EvaluatedTeamMember) => ({
      ...m,
      displayPoints: m.xp,
    }));
  }, [rankingProductivity.ranking]);

  const leaderPoints = useMemo(
    () => Math.max(1, ...rankingRows.map((r) => r.displayPoints)),
    [rankingRows]
  );

  // 5. Greeting from `selectGreetingAndDate(profile, testClock?.fixedIsoNow)`
  const greetingData = useMemo(
    () => selectGreetingAndDate(profile, testClock?.fixedIsoNow),
    [profile, testClock?.fixedIsoNow]
  );

  // 6. Selected Member Metrics (defaults to primary operator Jair `tm-1`, or any clicked member)
  const activeMemberMetrics: EvaluatedTeamMember = useMemo(() => {
    const found = productivity.members.find((m) => m.id === selectedMemberId);
    return found ?? productivity.activeMember;
  }, [productivity.members, productivity.activeMember, selectedMemberId]);

  const selectedRawMember = useMemo(
    () =>
      syncedTeam.find((m) => m.id === activeMemberMetrics.id) ??
      syncedTeam[0],
    [syncedTeam, activeMemberMetrics.id]
  );

  const isPrimaryOwner = activeMemberMetrics.id === currentMemberId;

  // Assigned brands for the currently inspected member:
  // By default on initial load, Jair displays `1 marca` (`Min`) matching 03-dashboard-equipo-1440.png,
  // and reflects any brand toggles made in `Editar marcas`.
  const assignedBrands = useMemo(() => {
    if (isPrimaryOwner && !hasCustomizedOwnerBrands) {
      const minBrand = brands.find((b) => b.id === "brand-min") ?? brands[0];
      return minBrand ? [minBrand] : [];
    }
    const ids = selectedRawMember?.brandIds ?? ["brand-min"];
    const matched = brands.filter((b) => ids.includes(b.id));
    return matched.length > 0 ? matched : brands.slice(0, 1);
  }, [isPrimaryOwner, hasCustomizedOwnerBrands, selectedRawMember, brands]);

  // Dynamic person count in header:
  // Starts at 1 persona (owner focus matching 03-dashboard-equipo-1440.png),
  // and immediately increments if demo invitations are accepted (`team.length > 4`) or if `showAllTeamScope` is toggled.
  const acceptedExtraMembersCount = Math.max(0, syncedTeam.length - 4);
  const displayedPersonCount = showAllTeamScope
    ? productivity.ranking.length
    : 1 + acceptedExtraMembersCount;

  // Weekly / Monthly activity rows
  const activityRows = useMemo(() => {
    if (activityRange === "Semana") {
      const fiveDays = activeMemberMetrics.weeklyActivity.slice(0, 5);
      return fiveDays.map((d, idx) => {
        const isTodayRow = idx === fiveDays.length - 1;
        const pts = d.eventsCount * 20 + (d.minutes > 1 ? Math.round(d.minutes * 0.8) : 0);
        return {
          key: d.id,
          label: isTodayRow ? "Hoy" : d.label,
          points: pts,
          minutes: d.minutes,
          percent: d.percent,
          statusLabel:
            pts > 0
              ? `${pts} pts · ${d.minutes}m`
              : "Sin actividad",
        };
      });
    }
    // Monthly breakdown (4 weeks)
    const totalPts = activeMemberMetrics.xp;
    const totalMins = activeMemberMetrics.activeMinutes;
    return [
      {
        key: "sem-1",
        label: "Semana 1",
        points: Math.round(totalPts * 0.2),
        minutes: Math.round(totalMins * 0.2),
        percent: 25,
        statusLabel: `${Math.round(totalPts * 0.2)} pts · ${Math.round(totalMins * 0.2)}m`,
      },
      {
        key: "sem-2",
        label: "Semana 2",
        points: Math.round(totalPts * 0.25),
        minutes: Math.round(totalMins * 0.25),
        percent: 35,
        statusLabel: `${Math.round(totalPts * 0.25)} pts · ${Math.round(totalMins * 0.25)}m`,
      },
      {
        key: "sem-3",
        label: "Semana 3",
        points: Math.round(totalPts * 0.25),
        minutes: Math.round(totalMins * 0.25),
        percent: 35,
        statusLabel: `${Math.round(totalPts * 0.25)} pts · ${Math.round(totalMins * 0.25)}m`,
      },
      {
        key: "sem-4",
        label: "Semana actual",
        points: Math.max(0, totalPts - Math.round(totalPts * 0.7)),
        minutes: Math.max(0, totalMins - Math.round(totalMins * 0.7)),
        percent: 50,
        statusLabel: `${Math.max(0, totalPts - Math.round(totalPts * 0.7))} pts · ${Math.max(0, totalMins - Math.round(totalMins * 0.7))}m`,
      },
    ];
  }, [activityRange, activeMemberMetrics.weeklyActivity, activeMemberMetrics.xp, activeMemberMetrics.activeMinutes]);

  const maxActivityRowPoints = useMemo(
    () => Math.max(60, ...activityRows.map((r) => r.points)),
    [activityRows]
  );

  // Full 39 Achievements enriched with live progress
  const fullCatalogWithProgress = useMemo(() => {
    const coreMap = new Map<string, TeamAchievementItem>();
    activeMemberMetrics.achievements.forEach((a: TeamAchievementItem) =>
      coreMap.set(a.id, a)
    );

    return ACHIEVEMENTS_CATALOG.map((item, index) => {
      let progress = 0;
      if (item.id === "first_step") {
        progress = activityEvents.length > 0 ? 1 : 0;
      } else if (item.id.startsWith("streak_")) {
        progress = activeMemberMetrics.streakDays;
      } else if (item.id === "centenario" || item.id === "mil") {
        progress = activeMemberMetrics.xp;
      } else if (item.category === "Tareas") {
        progress = activeMemberMetrics.completedTasksCount;
      } else if (item.category === "Contenido" || item.category === "Social") {
        progress = activeMemberMetrics.publishedPostsCount;
      } else if (item.category === "Proyectos" || item.category === "Chat & Marca") {
        progress = brands.length;
      } else {
        progress = Math.min(
          item.target,
          Math.floor((activeMemberMetrics.xp / (120 + index * 15)) * item.target)
        );
      }
      const clampedProgress = Math.min(item.target, Math.max(0, progress));
      const unlocked = clampedProgress >= item.target;
      return {
        ...item,
        progress: clampedProgress,
        unlocked,
      };
    });
  }, [
    activeMemberMetrics.achievements,
    activityEvents.length,
    activeMemberMetrics.streakDays,
    activeMemberMetrics.xp,
    activeMemberMetrics.completedTasksCount,
    activeMemberMetrics.publishedPostsCount,
    brands.length,
  ]);

  const filteredCatalogAchievements = useMemo(() => {
    if (achievementCategoryFilter === "Todos") return fullCatalogWithProgress;
    return fullCatalogWithProgress.filter(
      (a) => a.category === achievementCategoryFilter
    );
  }, [fullCatalogWithProgress, achievementCategoryFilter]);

  // Handlers for live interactivity
  const handleToggleBrandForMember = (brandId: string) => {
    if (!selectedRawMember) return;
    const baseIds: string[] =
      isPrimaryOwner && !hasCustomizedOwnerBrands
        ? ["brand-min"]
        : selectedRawMember.brandIds ?? ["brand-min"];
    const exists = baseIds.includes(brandId);
    const nextIds = exists
      ? baseIds.filter((id) => id !== brandId)
      : [...baseIds, brandId];
    if (nextIds.length === 0) return;
    if (isPrimaryOwner) {
      setHasCustomizedOwnerBrands(true);
    }
    updateTeamMember(selectedRawMember.id, { brandIds: nextIds });
  };

  const handleQuickRecordActivity = () => {
    recordActivityEvent({
      memberId: activeMemberMetrics.id,
      type: "task_completed",
      brandId: assignedBrands[0]?.id ?? "brand-min",
      durationMinutes: 35,
      metadata: {
        source: "equipo_quick_action",
        points: 25,
      },
    });
  };

  const handleCompleteNextInProgressTask = () => {
    const candidate =
      tasks.find(
        (t) =>
          t.status !== "done" &&
          (t.assigneeId === activeMemberMetrics.id ||
            t.assignee.toLowerCase().includes(activeMemberMetrics.name.toLowerCase()))
      ) ?? tasks.find((t) => t.status !== "done");
    if (candidate) {
      toggleTaskStatus(candidate.id);
    } else {
      handleQuickRecordActivity();
    }
  };

  const handleCopyPendingLink = (inviteLink: string, id: string) => {
    const url =
      typeof window !== "undefined" && inviteLink.startsWith("/")
        ? `${window.location.origin}${inviteLink}`
        : inviteLink;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedInviteId(id);
    setTimeout(() => {
      setCopiedInviteId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const pendingInvitations = useMemo(
    () => invitations.filter((i) => i.status === "Pendiente"),
    [invitations]
  );

  return (
    <div className="hubly-touch" style={{ maxWidth: 1120, width: "100%", paddingBottom: 48 }}>
      {/* ====================================================================
          1. TOP HEADER ROW: Equipo · N persona(s) | 7d/30d/90d | Search | Invitar | Filtros
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ui-text)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Equipo · {displayedPersonCount}{" "}
            {displayedPersonCount === 1 ? "persona" : "personas"}
          </h2>

          {brandFilterId !== "all" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 9999,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <span>
                Marca: {brands.find((b) => b.id === brandFilterId)?.name ?? brandFilterId}
              </span>
              <button
                type="button"
                onClick={() => setBrandFilterId("all")}
                aria-label="Quitar filtro de marca"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--hb-accent-text)",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            position: "relative",
          }}
        >
          {/* Period Pill Selector: 7 días | 30 días | 90 días */}
          <div
            role="group"
            aria-label="Periodo de métricas de equipo"
            style={{
              display: "inline-flex",
              background: "var(--ui-muted)",
              padding: 3,
              borderRadius: 10,
              gap: 2,
            }}
          >
            {(
              [
                { id: "7d", label: "7 días" },
                { id: "30d", label: "30 días" },
                { id: "90d", label: "90 días" },
              ] as const
            ).map((p) => {
              const active = teamPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTeamPeriod(p.id)}
                  aria-pressed={active}
                  className="hubly-seg-pill"
                  style={{
                    border: "none",
                    background: active ? "var(--ui-surface)" : "transparent",
                    color: active ? "var(--ui-text)" : "var(--ui-text-3)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 12,
                    padding: "5px 11px",
                    borderRadius: 7,
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 1px 2px rgb(var(--hb-accent-rgb) / 0.08)"
                      : "none",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              flex: "1 1 180px",
              maxWidth: 220,
            }}
          >
            <Search
              size={13.5}
              style={{
                position: "absolute",
                left: 11,
                color: "var(--ui-text-4)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar miembro o marca..."
              aria-label="Buscar miembro o marca"
              style={{
                height: 34,
                width: "100%",
                padding: "0 28px 0 32px",
                borderRadius: 10,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                fontSize: 12.5,
                color: "var(--ui-text)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
                style={{
                  position: "absolute",
                  right: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--ui-text-4)",
                  cursor: "pointer",
                  padding: 2,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Invitar Button */}
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="hbtn-indigo"
            style={{
              height: 34,
              fontSize: 12.5,
              padding: "0 14px",
              borderRadius: 10,
            }}
          >
            <UserPlus size={13.5} />
            <span>Invitar</span>
            {pendingInvitations.length > 0 && (
              <span
                style={{
                  marginLeft: 2,
                  padding: "1px 6px",
                  borderRadius: 9999,
                  background: "var(--hb-accent-hover)",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {pendingInvitations.length}
              </span>
            )}
          </button>

          {/* Filtros Button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="hbtn-outline"
            aria-expanded={filtersOpen}
            style={{
              height: 34,
              fontSize: 12.5,
              padding: "0 12px",
              borderRadius: 10,
              color: filtersOpen ? "var(--hb-accent-text)" : "var(--ui-text-3)",
              borderColor: filtersOpen ? "var(--ui-sky-border)" : "var(--ui-border)",
              background: filtersOpen ? "var(--ui-accent-soft)" : "var(--ui-surface)",
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Filtros</span>
          </button>

          {/* Filtros Popover */}
          {filtersPresence.mounted && (
            <div
              className="hubly-dropdown hubly-pop"
              data-state={filtersPresence.state}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 290,
                maxWidth: "calc(100vw - 32px)",
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 14,
                padding: 14,
                zIndex: "var(--layer-dropdown)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--ui-text-3)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Alcance del equipo
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  aria-pressed={!showAllTeamScope}
                  onClick={() => {
                    setShowAllTeamScope(false);
                    setSelectedMemberId(currentMemberId);
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: !showAllTeamScope
                      ? "1px solid var(--hb-accent)"
                      : "1px solid var(--ui-border)",
                    background: !showAllTeamScope ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: !showAllTeamScope ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mi vista (1)
                </button>
                <button
                  type="button"
                  aria-pressed={showAllTeamScope}
                  onClick={() => setShowAllTeamScope(true)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: showAllTeamScope
                      ? "1px solid var(--hb-accent)"
                      : "1px solid var(--ui-border)",
                    background: showAllTeamScope ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: showAllTeamScope ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Todo el equipo ({syncedTeam.length})
                </button>
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--ui-text-3)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Filtrar por marca
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setBrandFilterId("all")}
                  aria-pressed={brandFilterId === "all"}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 7,
                    border:
                      brandFilterId === "all"
                        ? "1px solid var(--hb-accent)"
                        : "1px solid var(--ui-border)",
                    background: brandFilterId === "all" ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                    color: brandFilterId === "all" ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Todas
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBrandFilterId(b.id)}
                    aria-pressed={brandFilterId === b.id}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 7,
                      border:
                        brandFilterId === b.id
                          ? "1px solid var(--hb-accent)"
                          : "1px solid var(--ui-border)",
                      background: brandFilterId === b.id ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                      color: brandFilterId === b.id ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div
                style={{
                  paddingTop: 10,
                  borderTop: "1px solid var(--ui-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteNextInProgressTask();
                    setFiltersOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    color: "var(--ui-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Completar tarea en curso</span>
                  <span style={{ color: "var(--hb-accent-text)", fontWeight: 700 }}>+25 XP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRecordActivity();
                    setFiltersOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    color: "var(--ui-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Registrar entrega activa</span>
                  <span style={{ color: "var(--hb-accent-text)", fontWeight: 700 }}>+30 XP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Member Switcher Bar when viewing All Team or when extra members were invited */}
      {(showAllTeamScope || acceptedExtraMembersCount > 0) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            padding: "8px 12px",
            borderRadius: 12,
            background: "var(--ui-surface-2)",
            border: "1px solid var(--ui-border)",
          }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ui-text-4)" }}>
            Miembros activos:
          </span>
          {productivity.ranking.map((m: EvaluatedTeamMember) => {
            const isSelected = m.id === activeMemberMetrics.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: isSelected
                    ? "1px solid var(--hb-accent)"
                    : "1px solid var(--ui-border)",
                  background: isSelected ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                  color: isSelected ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>{m.name}</span>
                {m.id === currentMemberId && (
                  <span style={{ fontSize: 10.5, opacity: 0.75 }}>(tú)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pending Invitations Banner (visible when user has created invitations) */}
      {invitations.length > 0 && (
        <div
          style={{
            marginBottom: 22,
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid var(--ui-sky-border)",
            background: "var(--ui-accent-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={15} color="var(--hb-accent-text)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                Invitaciones del equipo ({invitations.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--hb-accent-text)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Nueva invitación
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invitations.map((inv) => {
              const isPending = inv.status === "Pendiente";
              const isCopied = copiedInviteId === inv.id;
              return (
                <div
                  key={inv.id}
                  style={{
                    background: "var(--ui-surface)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    border: "1px solid var(--ui-sky-border)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                        {inv.name}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
                        {inv.email}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: "var(--ui-muted)",
                          color: "var(--ui-text-3)",
                        }}
                      >
                        {inv.role}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: isPending ? "var(--ui-sky-soft)" : "rgb(var(--hb-accent-rgb) / 0.14)",
                          color: isPending ? "var(--hb-accent-text)" : "var(--ui-positive-text)",
                        }}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleCopyPendingLink(inv.inviteLink, inv.id)}
                      style={{
                        height: 28,
                        padding: "0 10px",
                        borderRadius: 7,
                        border: "1px solid var(--ui-border-strong)",
                        background: "var(--ui-surface)",
                        color: "var(--ui-text-2)",
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      {isCopied ? <Check size={12} color="var(--ui-positive-text)" /> : <Copy size={12} />}
                      <span>{isCopied ? "Enlace copiado" : "Copiar enlace"}</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => acceptTeamInvitation(inv.id)}
                          style={{
                            height: 28,
                            padding: "0 10px",
                            borderRadius: 7,
                            border: "none",
                            background: "var(--hb-accent)",
                            color: "var(--on-accent)",
                            fontSize: 11.5,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <UserCheck size={12} />
                          <span>Aceptar en modo demo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelTeamInvitation(inv.id)}
                          style={{
                            height: 28,
                            padding: "0 8px",
                            borderRadius: 7,
                            border: "1px solid var(--ui-border)",
                            background: "var(--ui-surface-2)",
                            color: "var(--ui-text-3)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. MEMBER PROFILE BLOCK (80x80 Squircle Avatar + Name + Role + Editar marcas)
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* 80x80 Squircle Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "var(--ui-accent-soft)",
              color: "var(--hb-accent-text)",
              fontSize: 28,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activeMemberMetrics.avatarInitial.slice(0, 1)}
          </div>

          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: 0,
                lineHeight: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{isPrimaryOwner ? profile.name : activeMemberMetrics.name}</span>
              {isPrimaryOwner && (
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ui-text-4)" }}>(tú)</span>
              )}
            </h3>
            <div
              style={{
                fontSize: 13,
                color: "var(--ui-text-4)",
                marginTop: 2,
              }}
            >
              {isPrimaryOwner ? profile.role : activeMemberMetrics.role}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ui-text-4)",
                marginTop: 2,
              }}
            >
              {assignedBrands.length}{" "}
              {assignedBrands.length === 1 ? "marca" : "marcas"}
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setEditingBrandsOpen((prev) => !prev)}
            className="hbtn-outline"
            aria-expanded={editingBrandsOpen}
            style={{
              fontSize: 12.5,
              padding: "6px 12px",
              borderRadius: 9,
              background: "transparent",
              color: "var(--ui-text-3)",
            }}
          >
            <Pencil size={12.5} />
            <span>Editar marcas</span>
          </button>

          {editingBrandsOpen && (
            <div
              className="hubly-pop"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 250,
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 12,
                padding: 12,
                zIndex: "var(--layer-dropdown)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                  marginBottom: 8,
                }}
              >
                Marcas asignadas a {activeMemberMetrics.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {brands.map((b) => {
                  const isAssigned = assignedBrands.some((ab) => ab.id === b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleToggleBrandForMember(b.id)}
                      aria-pressed={isAssigned}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "none",
                        background: isAssigned ? "var(--ui-accent-soft)" : "transparent",
                        color: isAssigned ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                        fontSize: 12.5,
                        fontWeight: isAssigned ? 600 : 500,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            background: b.id === "brand-min" ? "var(--hb-accent)" : b.color,
                            color: "var(--on-accent)",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {b.initials.slice(0, 1)}
                        </span>
                        <span>{b.name}</span>
                      </span>
                      {isAssigned && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          3. PASSIVE METRICS STRIP (TAREAS | POSTS | TIEMPO)
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface-2)",
          borderRadius: 14,
          padding: "18px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 28,
          marginBottom: 18,
        }}
      >
        {/* TAREAS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TAREAS
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 18,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.completedTasksCount > 0
                ? activeMemberMetrics.completedTasksCount
                : "—"}
            </strong>
            terminadas
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 15,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.inProgressTasksCount}
            </strong>
            en curso
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text-4)",
                fontWeight: 700,
                fontSize: 15,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.avgCycleFormatted}
            </strong>
            por tarea
          </span>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--ui-border)",
            flexShrink: 0,
          }}
        />

        {/* POSTS */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            POSTS
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 18,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.publishedPostsCount > 0
                ? activeMemberMetrics.publishedPostsCount
                : "—"}
            </strong>
            publicados
          </span>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--ui-border)",
            flexShrink: 0,
          }}
        />

        {/* TIEMPO */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TIEMPO
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong style={{ color: "var(--ui-text)", fontWeight: 700, fontSize: 14 }}>
              {activeMemberMetrics.activeTimeFormatted}
            </strong>{" "}
            activo
          </span>
        </div>
      </div>

      {/* ====================================================================
          4. ASSIGNED BRAND SQUIRCLE BADGES (e.g. "M" / "Min")
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {assignedBrands.map((b) => (
          <div
            key={b.id}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {b.initials.slice(0, 1)}
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ui-text-3)", fontWeight: 500 }}>
              {b.name}
            </span>
          </div>
        ))}
      </div>

      {/* ====================================================================
          5. EXPLANATORY PARAGRAPH (Ciclo típico & Tiempo activo)
          ==================================================================== */}
      <p
        style={{
          fontSize: 12.5,
          color: "var(--ui-text-4)",
          lineHeight: 1.6,
          maxWidth: 680,
          margin: "0 0 28px 0",
        }}
      >
        Los números salen solos del trabajo de cada quien: nadie prende un
        cronómetro. El{" "}
        <strong style={{ color: "var(--ui-text-2)" }}>ciclo típico</strong> es la
        mediana desde que nace la tarea hasta que se cierra, y el{" "}
        <strong style={{ color: "var(--ui-text-2)" }}>tiempo activo</strong> son las
        horas que pasó en curso o en revisión — es tiempo transcurrido, no
        horas trabajadas, y se registra desde el 10 de agosto.
      </p>

      {/* ====================================================================
          6. GAMIFICATION XP, LEVEL & STREAK BANNER
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 16,
          padding: "18px 22px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              background: "var(--ui-accent-soft)",
              color: "var(--hb-accent-text)",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activeMemberMetrics.avatarInitial.slice(0, 1)}
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ui-text)",
                lineHeight: 1.2,
              }}
            >
              {isPrimaryOwner
                ? greetingData.greeting
                : `Actividad de ${activeMemberMetrics.name}`}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ui-text-4)",
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <HublyBoltIcon size={15} />
              <span>
                {activeMemberMetrics.streakDays}{" "}
                {activeMemberMetrics.streakDays === 1 ? "día" : "días"} racha ·
                Mejor: {activeMemberMetrics.bestStreakDays}d
              </span>
            </div>
          </div>
        </div>

        {/* Right: XP & Level Progress */}
        <div style={{ textAlign: "right", minWidth: 165 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--hb-accent-text)",
              lineHeight: 1.1,
            }}
          >
            {activeMemberMetrics.xp}{" "}
            <span style={{ fontSize: 13, fontWeight: 600 }}>XP</span>
          </div>
          <div
            style={{
              width: 150,
              height: 6,
              borderRadius: 9999,
              background: "var(--ui-accent-soft)",
              marginTop: 6,
              marginLeft: "auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(4, activeMemberMetrics.levelProgressPercent)}%`,
                height: "100%",
                background: "var(--hb-accent)",
                borderRadius: 9999,
                transition: "width 240ms ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10.5,
              color: "var(--ui-text-4)",
              marginTop: 4,
            }}
          >
            <span>Nivel {activeMemberMetrics.level}</span>
            <span>
              {activeMemberMetrics.xpToNextLevel} para Nv.
              {activeMemberMetrics.level + 1}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          7. TU ACTIVIDAD CARD (Weekly / Monthly Breakdown with Stickers)
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 16,
          padding: "18px 22px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={15} style={{ color: "var(--hb-accent-text)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
              Tu actividad
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--ui-text-4)", fontWeight: 600 }}>
              {activeMemberMetrics.xp} pts
            </span>
            <div
              style={{
                display: "inline-flex",
                background: "var(--ui-muted)",
                padding: 2,
                borderRadius: 8,
              }}
            >
              {(["Semana", "Mes"] as const).map((r) => {
                const active = activityRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActivityRange(r)}
                    aria-pressed={active}
                    style={{
                      border: "none",
                      background: active ? "var(--hb-accent)" : "transparent",
                      color: active ? "var(--on-accent)" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rows with Character Stickers & Live Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activityRows.map((row, idx) => {
            const isToday = row.label === "Hoy" || row.label === "Semana actual";
            const pct = Math.min(
              100,
              Math.round((row.points / maxActivityRowPoints) * 100)
            );
            return (
              <div
                key={row.key}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "36px minmax(72px, 95px) 1fr minmax(84px, auto)",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <HublyCatAvatar size={32} />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                  }}
                >
                  {row.label}
                </span>
                <div
                  style={{
                    height: 24,
                    borderRadius: 7,
                    background: isToday ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    border: isToday ? "1px solid var(--ui-sky-border)" : "none",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {row.points > 0 && (
                    <div
                      style={{
                        width: `${Math.max(8, pct)}%`,
                        height: "100%",
                        background: isToday ? "var(--hb-accent)" : "var(--ui-border-strong)",
                        opacity: isToday ? 0.88 : 0.65,
                        borderRadius: 6,
                        transition: "width 240ms ease",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    color: row.points > 0 ? "var(--ui-text-3)" : "var(--ui-text-4)",
                    fontWeight: row.points > 0 ? 600 : 400,
                    textAlign: "right",
                  }}
                >
                  {row.statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          8. TWO-COLUMN BOTTOM GRID: Logros (Left) + Ranking del Equipo (Right)
          ==================================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Left Card: Logros */}
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={15} style={{ color: "var(--hb-accent-text)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                Logros
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontWeight: 600 }}>
              {activeMemberMetrics.unlockedAchievementsCount}/
              {activeMemberMetrics.achievements.length} activos
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {activeMemberMetrics.achievements.map(
              (ach: TeamAchievementItem, idx: number) => {
                const progressPct = Math.min(
                  100,
                  Math.round((ach.progress / Math.max(1, ach.target)) * 100)
                );
                return (
                  <div
                    key={ach.id}
                    className={`hubly-achievement ${ach.unlocked ? "is-unlocked" : ""}`}
                    style={{
                      background: ach.unlocked ? "var(--ui-sky-soft)" : "var(--ui-surface-2)",
                      border: ach.unlocked
                        ? "1px solid var(--ui-sky-border)"
                        : "1px solid var(--ui-border)",
                      borderRadius: 12,
                      padding: "14px 10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <AchievementBadgeSvg variant={idx} unlocked={ach.unlocked} />
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: ach.unlocked ? "var(--ui-text)" : "var(--ui-text-3)",
                        marginTop: 8,
                      }}
                    >
                      {ach.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: ach.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)",
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {ach.description}
                    </div>

                    {/* Progress Bar & XP Pill */}
                    <div
                      style={{
                        width: "100%",
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: 4,
                          borderRadius: 9999,
                          background: "var(--ui-border)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: "100%",
                            background: ach.unlocked ? "var(--hb-accent)" : "var(--ui-text-5)",
                            borderRadius: 9999,
                            transition: "width 220ms ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: ach.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {ach.progress}/{ach.target}
                        </span>
                        <span style={{ color: "var(--hb-accent-text)" }}>+{ach.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAll39Achievements((prev) => !prev)}
            style={{
              marginTop: "auto",
              width: "100%",
              padding: "8px",
              border: "none",
              background: "transparent",
              color: "var(--ui-text-4)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontFamily: "inherit",
            }}
          >
            <span>
              {showAll39Achievements
                ? `Ocultar catálogo completo (${productivity.totalAchievementsCatalog})`
                : `Ver todos los logros (${productivity.totalAchievementsCatalog})`}
            </span>
            <ChevronRight
              size={13}
              style={{
                transform: showAll39Achievements ? "rotate(90deg)" : "none",
                transition: "transform 160ms ease",
              }}
            />
          </button>
        </div>

        {/* Right Card: Ranking del Equipo */}
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={15} style={{ color: "var(--hb-accent-text)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                Ranking del Equipo
              </span>
            </div>

            <div
              style={{
                display: "inline-flex",
                background: "var(--ui-muted)",
                padding: 2,
                borderRadius: 8,
              }}
            >
              {(["Hoy", "Semana", "Mes"] as const).map((r) => {
                const active = rankingRange === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRankingRange(r)}
                    aria-pressed={active}
                    className="hubly-seg-pill"
                    style={{
                      border: "none",
                      background: active ? "var(--hb-accent)" : "transparent",
                      color: active ? "var(--on-accent)" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ranking Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rankingRows.map((member, index) => {
              const isCurrentUser = member.id === currentMemberId;
              const isSelected = member.id === activeMemberMetrics.id;
              const barWidthPct = Math.max(
                8,
                Math.round((member.displayPoints / leaderPoints) * 100)
              );
              const medal = `${index + 1}`;

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  aria-pressed={isSelected}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedMemberId(member.id);
                    }
                  }}
                  style={{
                    background: isCurrentUser || isSelected ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    border:
                      isCurrentUser || isSelected
                        ? "1px solid var(--ui-sky-border)"
                        : "1px solid var(--ui-muted)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "background 150ms ease, border-color 150ms ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawerMemberId(member.id);
                    }}
                    style={{ order: 1, alignSelf: "flex-end", border: 0, background: "transparent", color: "var(--ui-accent-text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                  >
                    Ver perfil
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: index < 3 ? 14 : 12,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color: index < 3 ? "var(--hb-accent-text)" : isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)",
                          width: 18,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {medal}
                      </span>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9999,
                          background: isCurrentUser ? "var(--ui-sky-border)" : "var(--ui-border)",
                          color: isCurrentUser ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {member.avatarInitial.slice(0, 1)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--ui-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {member.name}{" "}
                          {isCurrentUser && (
                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: 500,
                                color: "var(--hb-accent-text)",
                              }}
                            >
                              (tú)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)" }}>
                          {member.role} · {member.completedTasksCount} tareas ·{" "}
                          {member.publishedPostsCount} posts
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isCurrentUser ? "var(--hb-accent-text)" : "var(--ui-text)",
                        }}
                      >
                        {member.displayPoints} pts
                      </span>
                      <div style={{ fontSize: 10.5, color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)" }}>
                        Nv.{member.level} · {member.efficiencyScore} efic.
                      </div>
                    </div>
                  </div>

                  {/* Proportional Leaderboard Bar (Módulo 98919) */}
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      borderRadius: 9999,
                      background: isCurrentUser ? "var(--ui-sky-soft)" : "var(--ui-border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidthPct}%`,
                        height: "100%",
                        borderRadius: 9999,
                        background: isCurrentUser ? "var(--hb-accent)" : "var(--ui-text-4)",
                        opacity:
                          0.2 + 0.8 * (member.displayPoints / leaderPoints),
                        transition: "width 240ms ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
          8B. EXPANDABLE FULL 39 ACHIEVEMENTS CATALOG (Módulo 22918)
          ==================================================================== */}
      {showAll39Achievements && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "20px 22px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ui-text)" }}>
                Catálogo completo de logros (39)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ui-text-4)" }}>
                Desbloqueados por actividad real en tareas, contenido, proyectos, CRM y Hubly AI
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAll39Achievements(false)}
              className="hbtn-outline"
              style={{ height: 30, fontSize: 12, padding: "0 10px" }}
            >
              Cerrar catálogo
            </button>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {[
              "Todos",
              "Generales",
              "Tareas",
              "Proyectos",
              "CRM",
              "Contenido",
              "Social",
              "Analytics",
              "Inteligencia",
              "Hubly AI",
              "Chat & Marca",
            ].map((cat) => {
              const active = achievementCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAchievementCategoryFilter(cat)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    border: active ? "1px solid var(--hb-accent)" : "1px solid var(--ui-border)",
                    background: active ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: active ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 210px), 1fr))",
              gap: 10,
            }}
          >
            {filteredCatalogAchievements.map((item) => {
              const pct = Math.min(
                100,
                Math.round((item.progress / Math.max(1, item.target)) * 100)
              );
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: item.unlocked
                      ? "1px solid var(--ui-sky-border)"
                      : "1px solid var(--ui-border)",
                    background: item.unlocked ? "var(--ui-sky-soft)" : "var(--ui-surface-2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <HublyAwardIcon size={18} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 9999,
                        background: item.unlocked ? "rgb(var(--hb-accent-rgb) / 0.14)" : "var(--ui-border)",
                        color: item.unlocked ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                      }}
                    >
                      +{item.xpReward} XP
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ui-text)" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: item.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)", lineHeight: 1.35 }}>
                    {item.description}
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 10.5,
                      color: item.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)",
                      fontWeight: 600,
                    }}
                  >
                    <span>{item.category}</span>
                    <span>
                      {item.progress}/{item.target} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          9. BOTTOM ACCORDION: Cómo funcionan los puntos
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setPointsAccordionOpen((prev) => !prev)}
          aria-expanded={pointsAccordionOpen}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-2)" }}>
              Cómo funcionan los puntos
            </span>
            <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
              · Se miden por esfuerzo, no por clicks
            </span>
          </div>
          <ChevronDown
            size={15}
            style={{
              color: "var(--ui-text-4)",
              transform: pointsAccordionOpen ? "rotate(180deg)" : "none",
              transition: "transform 180ms ease",
              flexShrink: 0,
            }}
          />
        </button>

        {pointsAccordionOpen && (
          <div
            style={{
              padding: "0 20px 20px",
              borderTop: "1px solid var(--ui-muted)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* 4 Effort Categories */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: 10,
                marginTop: 14,
              }}
            >
              {EFFORT_CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "var(--ui-surface-2)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--ui-text)",
                      }}
                    >
                      {cat.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--hb-accent-text)",
                      }}
                    >
                      {cat.points}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      color: "var(--ui-text-3)",
                      lineHeight: 1.45,
                    }}
                  >
                    {cat.examples}
                  </p>
                </div>
              ))}
            </div>

            {/* 5 XP Level Tiers */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ui-text-3)" }}>
                Niveles de progresión:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {XP_LEVEL_TIERS.map((tier) => (
                  <span
                    key={tier.level}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: "var(--ui-text-2)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: `rgb(var(--hb-accent-rgb) / ${tier.strength})`,
                      }}
                    />
                    <span>
                      Nv.{tier.level} {tier.name} ({tier.minXp} XP)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {drawerMemberId && (<MemberDrawer memberId={drawerMemberId} onClose={() => setDrawerMemberId(null)} />)}
    </div>
  );
}

export default EquipoView;
