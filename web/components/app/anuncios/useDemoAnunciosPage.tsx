"use client";

import { useState } from "react";
import {
  filterSampleAds,
  SAMPLE_ADS,
  type AnunciosViewMode,
  type SampleAdCard,
} from "@/lib/domain/ads";

/** Estado y datos de DemoAnunciosPage. */
export function useDemoAnunciosPage() {
  const [viewMode, setViewMode] = useState<AnunciosViewMode>("cards");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAd, setSelectedAd] = useState<SampleAdCard | null>(null);
  const visibleAds = filterSampleAds(SAMPLE_ADS, searchQuery);

  return {
    viewMode,
    setViewMode,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    selectedAd,
    setSelectedAd,
    visibleAds,
  };
}
