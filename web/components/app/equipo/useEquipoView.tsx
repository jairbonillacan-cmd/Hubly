"use client";

import { useMemo, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { backendEnabled } from "@/lib/supabase/config";
import { useActiveBrand } from "@/lib/use-active-brand";
import {
  buildTeamActivityRows,
  buildTeamRankingRows,
  computeToggledMemberBrandIds,
  findNextPendingMemberTask,
  resolveMemberAssignedBrands,
  selectTeamProductivity,
  syncTeamWithProfile,
  type EvaluatedTeamMember,
  type TeamProductivityPeriod,
} from "@/lib/domain/team";

/** Estado de pantalla y datos derivados para EquipoView. */
export function useEquipoView() {
  const team = useHublyStore((s) => s.team);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const activityEvents = useHublyStore((s) => s.activityEvents);
  const profile = useHublyStore((s) => s.profile);
  const brands = useHublyStore((s) => s.brands);
  const activeBrand = useActiveBrand();
  const updateTeamMember = useHublyStore((s) => s.updateTeamMember);
  const recordActivityEvent = useHublyStore((s) => s.recordActivityEvent);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);

  const currentMemberId = useMemo(
    () => team.find((m) => m.email === profile?.email)?.id ?? "tm-1",
    [team, profile?.email]
  );
  const [teamPeriod, setTeamPeriod] = useState<TeamProductivityPeriod>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityRange, setActivityRange] = useState<"Semana" | "Mes">("Semana");
  const [rankingRange, setRankingRange] = useState<"Hoy" | "Semana" | "Mes">("Semana");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentMemberId);
  const [showAllTeamScope, setShowAllTeamScope] = useState(false);
  const [brandFilterId, setBrandFilterId] = useState("all");
  const [hasCustomizedOwnerBrands, setHasCustomizedOwnerBrands] = useState(false);

  const syncedTeam = useMemo(() => syncTeamWithProfile(team, profile), [team, profile]);
  const filteredTasks = useMemo(
    () => (brandFilterId === "all" ? tasks : tasks.filter((t) => t.brandId === brandFilterId)),
    [tasks, brandFilterId]
  );
  const filteredPosts = useMemo(
    () => (brandFilterId === "all" ? posts : posts.filter((p) => p.brandId === brandFilterId)),
    [posts, brandFilterId]
  );
  const productivity = useMemo(
    () => selectTeamProductivity(syncedTeam, filteredTasks, filteredPosts, activityEvents, teamPeriod, searchQuery, backendEnabled),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, teamPeriod, searchQuery]
  );
  const rankingPeriodKey: TeamProductivityPeriod =
    rankingRange === "Hoy" ? "hoy" : rankingRange === "Semana" ? "semana" : "mes";
  const rankingProductivity = useMemo(
    () => selectTeamProductivity(syncedTeam, filteredTasks, filteredPosts, activityEvents, rankingPeriodKey, searchQuery, backendEnabled),
    [syncedTeam, filteredTasks, filteredPosts, activityEvents, rankingPeriodKey, searchQuery]
  );
  const rankingRows = useMemo(() => buildTeamRankingRows(rankingProductivity.ranking), [rankingProductivity.ranking]);
  const leaderDeliverables = useMemo(() => Math.max(1, ...rankingRows.map((r) => r.deliverablesCount)), [rankingRows]);
  const activeMemberMetrics: EvaluatedTeamMember = useMemo(
    () => productivity.members.find((m) => m.id === selectedMemberId) ?? productivity.activeMember,
    [productivity.members, productivity.activeMember, selectedMemberId]
  );
  const selectedRawMember = useMemo(
    () => syncedTeam.find((m) => m.id === activeMemberMetrics.id) ?? syncedTeam[0],
    [syncedTeam, activeMemberMetrics.id]
  );
  const isPrimaryOwner = activeMemberMetrics.id === currentMemberId;
  const assignedBrands = useMemo(
    () => resolveMemberAssignedBrands({ isPrimaryOwner, hasCustomizedOwnerBrands, memberBrandIds: selectedRawMember?.brandIds, brands, activeBrand }),
    [isPrimaryOwner, hasCustomizedOwnerBrands, selectedRawMember?.brandIds, brands, activeBrand]
  );
  const acceptedExtraMembersCount = Math.max(0, syncedTeam.length - 4);
  const displayedPersonCount = showAllTeamScope ? productivity.ranking.length : 1 + acceptedExtraMembersCount;
  const activityRows = useMemo(
    () => buildTeamActivityRows(activityRange, activeMemberMetrics.weeklyActivity, activeMemberMetrics.activeMinutes),
    [activityRange, activeMemberMetrics.weeklyActivity, activeMemberMetrics.activeMinutes]
  );
  const maxActivityRowMinutes = useMemo(() => Math.max(60, ...activityRows.map((r) => r.minutes)), [activityRows]);

  const handleToggleBrandForMember = (brandId: string) => {
    if (!selectedRawMember) return;
    const nextIds = computeToggledMemberBrandIds({
      isPrimaryOwner, hasCustomizedOwnerBrands, memberBrandIds: selectedRawMember.brandIds, activeBrandId: activeBrand?.id, brandId,
    });
    if (!nextIds) return;
    if (isPrimaryOwner) setHasCustomizedOwnerBrands(true);
    updateTeamMember(selectedRawMember.id, { brandIds: nextIds });
  };
  const handleQuickRecordActivity = () => {
    recordActivityEvent({
      memberId: activeMemberMetrics.id, type: "task_completed",
      brandId: assignedBrands[0]?.id ?? activeBrand?.id ?? "", durationMinutes: 35,
      metadata: { source: "equipo_quick_action" },
    });
  };
  const handleCompleteNextInProgressTask = () => {
    const candidate = findNextPendingMemberTask(tasks, activeMemberMetrics.id, activeMemberMetrics.name);
    if (candidate) toggleTaskStatus(candidate.id);
    else handleQuickRecordActivity();
  };

  return {
    brands, teamPeriod, setTeamPeriod, searchQuery, setSearchQuery,
    activityRange, setActivityRange, rankingRange, setRankingRange,
    setSelectedMemberId, currentMemberId, showAllTeamScope, setShowAllTeamScope,
    brandFilterId, setBrandFilterId, syncedTeam, productivity,
    rankingRows, leaderDeliverables, activeMemberMetrics, isPrimaryOwner,
    assignedBrands, acceptedExtraMembersCount, displayedPersonCount,
    activityRows, maxActivityRowMinutes, handleToggleBrandForMember,
    handleQuickRecordActivity, handleCompleteNextInProgressTask,
  };
}
