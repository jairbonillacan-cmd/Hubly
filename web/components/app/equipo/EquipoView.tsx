"use client";

import "./equipo.css";
import { useEquipoView } from "./useEquipoView";
import { EquipoCabecera } from "./EquipoCabecera";
import { EquipoFiltros } from "./EquipoFiltros";
import { EquipoMiembros } from "./EquipoMiembros";
import { EquipoResumen } from "./EquipoResumen";
import { EquipoTarjetasResumen } from "./EquipoTarjetasResumen";
import { EquipoProgreso } from "./EquipoProgreso";
import { EquipoLogrosRanking } from "./EquipoLogrosRanking";

export function EquipoView() {
  const {
    brands,
    teamPeriod,
    setTeamPeriod,
    searchQuery,
    setSearchQuery,
    activityRange,
    setActivityRange,
    rankingRange,
    setRankingRange,
    setSelectedMemberId,
    currentMemberId,
    showAllTeamScope,
    setShowAllTeamScope,
    brandFilterId,
    setBrandFilterId,
    syncedTeam,
    productivity,
    rankingRows,
    leaderDeliverables,
    activeMemberMetrics,
    isPrimaryOwner,
    assignedBrands,
    acceptedExtraMembersCount,
    displayedPersonCount,
    activityRows,
    maxActivityRowMinutes,
    handleToggleBrandForMember,
    handleQuickRecordActivity,
    handleCompleteNextInProgressTask,
  } = useEquipoView();

  const brandFilter =
    brandFilterId !== "all"
      ? {
          label: brands.find((b) => b.id === brandFilterId)?.name ?? brandFilterId,
          onClear: () => setBrandFilterId("all"),
        }
      : null;

  return (
    <div className="hubly-touch hubly-equipo-view">
      <EquipoCabecera
        displayedPersonCount={displayedPersonCount}
        teamPeriod={teamPeriod}
        onTeamPeriodChange={setTeamPeriod}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        brandFilter={brandFilter}
      >
        <EquipoFiltros
          showAllTeamScope={showAllTeamScope}
          teamCount={syncedTeam.length}
          brandFilterId={brandFilterId}
          onSelectMyScope={() => {
            setShowAllTeamScope(false);
            setSelectedMemberId(currentMemberId);
          }}
          onSelectAllTeamScope={() => setShowAllTeamScope(true)}
          onBrandFilterChange={setBrandFilterId}
          onQuickAction={(action) => {
            if (action === "complete_task") handleCompleteNextInProgressTask();
            else handleQuickRecordActivity();
          }}
        />
      </EquipoCabecera>
      <EquipoMiembros
        members={productivity.ranking}
        activeMemberId={activeMemberMetrics.id}
        currentMemberId={currentMemberId}
        showMemberSwitcher={showAllTeamScope || acceptedExtraMembersCount > 0}
        onSelectMember={setSelectedMemberId}
      />
      <EquipoResumen
        member={activeMemberMetrics}
        isPrimaryOwner={isPrimaryOwner}
        assignedBrands={assignedBrands}
        onToggleBrand={handleToggleBrandForMember}
      />
      <EquipoTarjetasResumen
        member={activeMemberMetrics}
        teamPeriod={teamPeriod}
        assignedBrands={assignedBrands}
      />
      <EquipoProgreso
        activeTimeFormatted={activeMemberMetrics.activeTimeFormatted}
        activityRange={activityRange}
        onActivityRangeChange={setActivityRange}
        activityRows={activityRows}
        maxActivityRowMinutes={maxActivityRowMinutes}
      />
      <EquipoLogrosRanking
        rankingRange={rankingRange}
        onRankingRangeChange={setRankingRange}
        rankingRows={rankingRows}
        leaderDeliverables={leaderDeliverables}
        activeMemberId={activeMemberMetrics.id}
        currentMemberId={currentMemberId}
        onSelectMember={setSelectedMemberId}
      />
    </div>
  );
}
