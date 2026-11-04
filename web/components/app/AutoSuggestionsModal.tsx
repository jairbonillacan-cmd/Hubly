"use client";

import "./sugerencias/sugerencias.css";
import { Modal } from "@/components/app/ui/Modal";
import {
  useAutoSuggestionsModal,
  type AutoSuggestionsModalProps,
} from "./sugerencias/useAutoSuggestionsModal";
import { SugerenciasCabecera } from "./sugerencias/SugerenciasCabecera";
import { SugerenciasCuerpo } from "./sugerencias/SugerenciasCuerpo";
import { SugerenciasMetricas } from "./sugerencias/SugerenciasMetricas";
import { SugerenciasPie } from "./sugerencias/SugerenciasPie";

export function AutoSuggestionsModal(props: AutoSuggestionsModalProps = {}) {
  const {
    titleId,
    brandsCount,
    isOpen,
    activeView,
    setActiveView,
    customValues,
    metrics,
    feedbackBanner,
    pendingRecommendations,
    handleClose,
    handleAdjustValue,
    handleApplySingle,
    handleDismissSingle,
    handleApplyAll,
    toggleMetricChecked,
    updateMetricTarget,
  } = useAutoSuggestionsModal(props);

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      labelledBy={titleId}
      className="hubly-sheet hubly-sugerencias-modal"
    >
      <SugerenciasCabecera
        titleId={titleId}
        brandsCount={brandsCount}
        activeView={activeView}
        pendingCount={pendingRecommendations.length}
        onSelectView={setActiveView}
        onClose={handleClose}
      />

      <div className="hubly-sugerencias-body">
        {feedbackBanner && (
          <div role="status" className="hubly-sugerencias-feedback">
            {feedbackBanner}
          </div>
        )}

        {activeView === "reglas" ? (
          <SugerenciasCuerpo
            recommendations={pendingRecommendations}
            customValues={customValues}
            onAdjustValue={handleAdjustValue}
            onApplySingle={handleApplySingle}
            onDismissSingle={handleDismissSingle}
            onSwitchToMetrics={() => setActiveView("metricas")}
          />
        ) : (
          <SugerenciasMetricas
            metrics={metrics}
            onToggleChecked={toggleMetricChecked}
            onUpdateTarget={updateMetricTarget}
          />
        )}
      </div>

      <SugerenciasPie
        pendingCount={pendingRecommendations.length}
        onClose={handleClose}
        onApplyAll={handleApplyAll}
      />
    </Modal>
  );
}
