"use client";

import "./anuncios.css";
import { useDemoAnunciosPage } from "./useDemoAnunciosPage";
import { AnunciosCabecera } from "./AnunciosCabecera";
import { AnunciosTarjetas } from "./AnunciosTarjetas";
import { AnunciosDiagnostico } from "./AnunciosDiagnostico";

export function DemoAnunciosPage() {
  const {
    viewMode,
    setViewMode,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    selectedAd,
    setSelectedAd,
    visibleAds,
  } = useDemoAnunciosPage();

  return (
    <div className="hubly-touch hubly-anuncios-page">
      <AnunciosCabecera
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
      <AnunciosTarjetas
        viewMode={viewMode}
        visibleAds={visibleAds}
        onSelectAd={setSelectedAd}
      />
      <AnunciosDiagnostico
        selectedAd={selectedAd}
        onClose={() => setSelectedAd(null)}
      />
    </div>
  );
}
