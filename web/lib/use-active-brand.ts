"use client";

import { useMemo } from "react";
import { selectActiveBrand } from "./domain-selectors";
import { useHublyStore } from "./store";

export function useActiveBrand() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  return useMemo(() => selectActiveBrand(brands, activeBrandId), [brands, activeBrandId]);
}
