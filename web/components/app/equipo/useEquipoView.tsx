"use client";

import { copyText } from "@/lib/clipboard";
import { useMemo, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { useActiveBrand } from "@/lib/use-active-brand";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  selectTeamProductivity,
  type TeamProductivityPeriod,
  type EvaluatedTeamMember,
} from "@/lib/domain-selectors";

/** Estado y datos de EquipoView. */
export function useEquipoView() {
  const team = useHublyStore((s) => s.team);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activityEvents = useHublyStore((s) => s.activityEvents);
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const activeBrand = useActiveBrand();
  const invitations = useHublyStore((s) => s.invitations);
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
  // Interactive popovers / drawers
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPresence = useModalPresence(filtersOpen, 100);
  const [brandFilterId, setBrandFilterId] = useState<string>("all");
  const [editingBrandsOpen, setEditingBrandsOpen] = useState(false);
  const [hasCustomizedOwnerBrands, setHasCustomizedOwnerBrands] = useState(false);
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
        searchQuery,
        backendEnabled
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
        searchQuery,
        backendEnabled
      ),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, rankingPeriodKey, searchQuery]
  );
  const rankingRows = useMemo(() => {
    return rankingProductivity.ranking.map((m: EvaluatedTeamMember) => ({
      ...m,
      deliverablesCount: m.completedTasksCount + m.publishedPostsCount,
    }));
  }, [rankingProductivity.ranking]);
  const leaderDeliverables = useMemo(
    () => Math.max(1, ...rankingRows.map((r) => r.deliverablesCount)),
    [rankingRows]
  );
  // 5. Selected Member Metrics (defaults to primary operator Jair `tm-1`, or any clicked member)
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
  // On initial load the owner sees the active brand (the one in the sidebar),
  // and any toggle in `Editar marcas` replaces that.
  const assignedBrands = useMemo(() => {
    if (isPrimaryOwner && !hasCustomizedOwnerBrands) {
      return activeBrand ? [activeBrand] : [];
    }
    const ids = selectedRawMember?.brandIds ?? (activeBrand ? [activeBrand.id] : []);
    const matched = brands.filter((b) => ids.includes(b.id));
    return matched.length > 0 ? matched : brands.slice(0, 1);
  }, [isPrimaryOwner, hasCustomizedOwnerBrands, selectedRawMember, brands, activeBrand]);
  // Dynamic person count in header:
  // Starts at 1 persona (owner focus),
  // and immediately increments if demo invitations are accepted (`team.length > 4`) or if `showAllTeamScope` is toggled.
  const acceptedExtraMembersCount = Math.max(0, syncedTeam.length - 4);
  const displayedPersonCount = showAllTeamScope
    ? productivity.ranking.length
    : 1 + acceptedExtraMembersCount;
  // Weekly / Monthly activity rows with real active minutes
  const activityRows = useMemo(() => {
    if (activityRange === "Semana") {
      const fiveDays = activeMemberMetrics.weeklyActivity.slice(0, 5);
      return fiveDays.map((d, idx) => {
        const isTodayRow = idx === fiveDays.length - 1;
        return {
          key: d.id,
          label: isTodayRow ? "Hoy" : d.label,
          minutes: d.minutes,
          percent: d.percent,
          statusLabel:
            d.minutes > 0
              ? `${d.minutes}m`
              : "Sin actividad",
        };
      });
    }
    // Monthly breakdown (4 weeks)
    const totalMins = activeMemberMetrics.activeMinutes;
    const weeks = [
      {
        key: "sem-1",
        label: "Semana 1",
        minutes: Math.round(totalMins * 0.2),
        percent: 25,
      },
      {
        key: "sem-2",
        label: "Semana 2",
        minutes: Math.round(totalMins * 0.25),
        percent: 35,
      },
      {
        key: "sem-3",
        label: "Semana 3",
        minutes: Math.round(totalMins * 0.25),
        percent: 35,
      },
      {
        key: "sem-4",
        label: "Semana actual",
        minutes: Math.max(0, totalMins - Math.round(totalMins * 0.7)),
        percent: 50,
      },
    ];
    return weeks.map((w) => ({
      ...w,
      statusLabel: w.minutes > 0 ? `${w.minutes}m` : "Sin actividad",
    }));
  }, [activityRange, activeMemberMetrics.weeklyActivity, activeMemberMetrics.activeMinutes]);
  const maxActivityRowMinutes = useMemo(
    () => Math.max(60, ...activityRows.map((r) => r.minutes)),
    [activityRows]
  );
  // Handlers for live interactivity
  const handleToggleBrandForMember = (brandId: string) => {
    if (!selectedRawMember) return;
    const baseIds: string[] =
      isPrimaryOwner && !hasCustomizedOwnerBrands
        ? (activeBrand ? [activeBrand.id] : [])
        : selectedRawMember.brandIds ?? (activeBrand ? [activeBrand.id] : []);
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
      brandId: assignedBrands[0]?.id ?? activeBrand?.id ?? "",
      durationMinutes: 35,
      metadata: {
        source: "equipo_quick_action",
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
    void copyText(url).then((ok) => {
      if (!ok) return;
      setCopiedInviteId(id);
      setTimeout(() => {
        setCopiedInviteId((curr) => (curr === id ? null : curr));
      }, 2000);
    });
  };
  const pendingInvitations = useMemo(
    () => invitations.filter((i) => i.status === "Pendiente"),
    [invitations]
  );

  return { team, tasks, posts, activityEvents, profile, brands, invitations, setInviteModalOpen, acceptTeamInvitation, cancelTeamInvitation, updateTeamMember, recordActivityEvent, toggleTaskStatus, teamPeriod, setTeamPeriod, searchQuery, setSearchQuery, activityRange, setActivityRange, rankingRange, setRankingRange, selectedMemberId, setSelectedMemberId, drawerMemberId, setDrawerMemberId, currentMemberId, showAllTeamScope, setShowAllTeamScope, filtersOpen, setFiltersOpen, filtersPresence, brandFilterId, setBrandFilterId, editingBrandsOpen, setEditingBrandsOpen, hasCustomizedOwnerBrands, setHasCustomizedOwnerBrands, copiedInviteId, setCopiedInviteId, syncedTeam, filteredTasks, filteredPosts, productivity, rankingPeriodKey, rankingProductivity, rankingRows, leaderDeliverables, activeMemberMetrics, selectedRawMember, isPrimaryOwner, assignedBrands, acceptedExtraMembersCount, displayedPersonCount, activityRows, maxActivityRowMinutes, handleToggleBrandForMember, handleQuickRecordActivity, handleCompleteNextInProgressTask, handleCopyPendingLink, pendingInvitations };
}

export type EquipoViewModel = ReturnType<typeof useEquipoView>;
