"use client";

import { useState } from "react";
import { SampleAdCard, SAMPLE_ADS, } from "./demoAnunciosPage-shared";

/** Estado y datos de DemoAnunciosPage. */
export function useDemoAnunciosPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table" | "funnels">("cards");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAd, setSelectedAd] = useState<SampleAdCard | null>(null);
  const visibleAds = SAMPLE_ADS.filter((ad) =>
    searchQuery.trim()
      ? ad.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  return { viewMode, setViewMode, searchOpen, setSearchOpen, searchQuery, setSearchQuery, selectedAd, setSelectedAd, visibleAds };
}

export type DemoAnunciosPageModel = ReturnType<typeof useDemoAnunciosPage>;
