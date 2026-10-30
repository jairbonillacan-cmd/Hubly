"use client";

import { useCallback, useSyncExternalStore } from "react";

export type HublyTheme = "light" | "dark";

const STORAGE_KEY = "hubly-theme";
const listeners = new Set<() => void>();

const readTheme = (): HublyTheme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

function applyTheme(theme: HublyTheme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.classList.toggle("dark", theme === "dark");
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove("theme-switching"));
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* El tema sigue aplicado durante esta sesión. */
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useHublyTheme() {
  const theme = useSyncExternalStore<HublyTheme>(subscribe, readTheme, () => "light");
  const setTheme = useCallback((next: HublyTheme) => applyTheme(next), []);
  const toggleTheme = useCallback(() => applyTheme(readTheme() === "dark" ? "light" : "dark"), []);
  return { theme, setTheme, toggleTheme };
}
