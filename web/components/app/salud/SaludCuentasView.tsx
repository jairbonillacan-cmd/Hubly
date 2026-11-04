"use client";

import React from "react";
import { Button } from "@/components/app/ui/Button";
import { HublyPlusIcon } from "@/components/app/icons/DuotoneIcons";
import { SaludBarraPeriodo, SaludCabecera, SaludPastillasFiltro } from "./SaludCabecera";
import { SaludCompromisos } from "./SaludCompromisos";
import { SaludSugerencias } from "./SaludSugerencias";
import { SaludTarjetaMarca } from "./SaludTarjetaMarca";
import { useSaludCuentasView } from "./useSaludCuentasView";

export function SaludCuentasView() {
  const {
    accounts,
    summary,
    recommendations,
    activeBrandId,
    period,
    setPeriod,
    periodLabel,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    hasActiveFilters,
    editingBrandId,
    draftCommitments,
    setDraftCommitments,
    feedbackBanner,
    onOpenNewBrand,
    onOpenSuggestionsModal,
    handleStartEditCommitments,
    handleCancelEdit,
    handleSaveCommitments,
    handleApplySingleRecommendation,
    handleDismissSingleRecommendation,
    handleApplyAllRecommendations,
    handleClearFilters,
  } = useSaludCuentasView();

  return (
    <div className="hubly-salud hubly-touch" data-testid="salud-cuentas-view">
      <SaludCabecera
        summary={summary}
        accountsCount={accounts.length}
        periodLabel={periodLabel}
        hasActiveFilters={hasActiveFilters}
        onNewBrand={onOpenNewBrand}
        onOpenSuggestions={onOpenSuggestionsModal}
      />

      <SaludBarraPeriodo
        period={period}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onPeriodChange={setPeriod}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
      />

      <SaludPastillasFiltro
        summary={summary}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <SaludSugerencias
        recommendations={recommendations}
        onApplySingle={handleApplySingleRecommendation}
        onDismissSingle={handleDismissSingleRecommendation}
        onApplyAll={handleApplyAllRecommendations}
        onOpenConfig={onOpenSuggestionsModal}
      />

      {accounts.length === 0 ? (
        <div className="hubly-cal-empty" data-testid="accounts-empty-state">
          {summary.totalAccounts === 0 ? (
            <>
              <strong>Sin cuentas</strong>
              <span>Crea una marca para medir su cumplimiento.</span>
              <Button variant="secondary" onClick={onOpenNewBrand}>
                <HublyPlusIcon size={17} /> Nueva marca
              </Button>
            </>
          ) : (
            <>
              <strong>Sin resultados con estos filtros</strong>
              <span>
                {hasActiveFilters
                  ? "Ninguna cuenta coincide con lo que buscas."
                  : "No hay cuentas en este periodo."}
              </span>
              <Button
                variant="secondary"
                size="sm"
                data-testid="clear-accounts-filters-btn"
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </Button>
            </>
          )}
        </div>
      ) : (
        <section className="hubly-salud-list" aria-label="Salud por cuenta">
          {accounts.map((account) => {
            const isEditing = editingBrandId === account.brand.id;
            const isActive = activeBrandId === account.brand.id;

            return (
              <SaludTarjetaMarca
                key={account.brand.id}
                account={account}
                periodLabel={periodLabel}
                isActive={isActive}
                isEditing={isEditing}
                onToggleEdit={handleStartEditCommitments}
              >
                {isEditing && draftCommitments && (
                  <SaludCompromisos
                    brandId={account.brand.id}
                    brandName={account.brand.name}
                    periodLabel={periodLabel}
                    draft={draftCommitments}
                    onChangeDraft={setDraftCommitments}
                    onSave={handleSaveCommitments}
                    onCancel={handleCancelEdit}
                  />
                )}
              </SaludTarjetaMarca>
            );
          })}
        </section>
      )}

      {feedbackBanner && (
        <div className="hubly-undo-toast" role="status" aria-live="polite">
          {feedbackBanner}
        </div>
      )}
    </div>
  );
}
