"use client";

import { useMemo } from "react";
import { selectActiveBrand } from "./active-brand";
import { useHublyStore } from "./store";

/** La marca activa del sidebar. Usa `selectActiveBrand`: no la derives por tu cuenta. */
export function useActiveBrand() {
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  return useMemo(() => selectActiveBrand(brands, activeBrandId), [brands, activeBrandId]);
}
