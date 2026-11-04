"use client";

import "./social.css";
import { CalendarioActividadModal } from "./CalendarioActividadModal";
import { CalendarioCabecera } from "./CalendarioCabecera";
import { CalendarioFiltros } from "./CalendarioFiltros";
import { CalendarioLista } from "./CalendarioLista";
import { CalendarioMarcas } from "./CalendarioMarcas";
import { CalendarioMes } from "./CalendarioMes";
import { useCalendarioView } from "./useCalendarioView";

export function CalendarioView() {
  const {
    todayIso,
    activeMode,
    setActiveMode,
    anchorIso,
    brandFilter,
    networkFilter,
    formatFilter,
    showPosts,
    showActivities,
    newActivityDate,
    setNewActivityDate,
    lastOpenDate,
    activeEntryId,
    entries,
    monthKey,
    weekDays,
    monthCells,
    entriesByDay,
    listDays,
    periodLabel,
    handleNavigate,
    handleOpenEntry,
    handleOpenNewActivity,
    handleSaveActivity,
    handleToggleFilter,
  } = useCalendarioView();

  return (
    <div className="hubly-cal">
      <CalendarioCabecera
        periodLabel={periodLabel}
        isTodayAnchor={anchorIso === todayIso}
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onNavigate={handleNavigate}
        onNewActivity={() => handleOpenNewActivity(todayIso)}
      >
        <CalendarioFiltros
          brandFilter={brandFilter}
          networkFilter={networkFilter}
          formatFilter={formatFilter}
          showPosts={showPosts}
          showActivities={showActivities}
          onToggleFilter={handleToggleFilter}
        />
      </CalendarioCabecera>

      <div key={activeMode} className="hubly-cal-body tablero-aparece">
        {activeMode === "lista" && (
          <CalendarioLista
            listDays={listDays}
            entriesByDay={entriesByDay}
            todayIso={todayIso}
            activeEntryId={activeEntryId}
            onOpenEntry={handleOpenEntry}
          />
        )}

        {activeMode === "mes" && (
          <CalendarioMes
            monthCells={monthCells}
            monthKey={monthKey}
            todayIso={todayIso}
            entriesByDay={entriesByDay}
            onOpenEntry={handleOpenEntry}
            onNewActivity={handleOpenNewActivity}
          />
        )}

        {activeMode === "marca" && (
          <CalendarioMarcas
            weekDays={weekDays}
            todayIso={todayIso}
            entries={entries}
            entriesByDay={entriesByDay}
            onOpenEntry={handleOpenEntry}
            onNewActivity={handleOpenNewActivity}
          />
        )}
      </div>

      <CalendarioActividadModal
        openDate={newActivityDate}
        lastOpenDate={lastOpenDate}
        onChangeDate={setNewActivityDate}
        onClose={() => setNewActivityDate(null)}
        onSave={handleSaveActivity}
      />
    </div>
  );
}
