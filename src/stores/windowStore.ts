import { createStore } from "./createStore";
import type { WindowState } from "../types/window";

const initialState: WindowState = {
  isVisible: true,
  isFocused: true,
  theme: "dark",
};

export const windowStore = createStore<WindowState>(initialState);

export function initTheme(): void {
  const saved = localStorage.getItem("kai_theme");
  if (saved === "light") {
    document.documentElement.classList.remove("dark");
    windowStore.set({ theme: "light" });
  } else {
    document.documentElement.classList.add("dark");
    windowStore.set({ theme: "dark" });
  }
}

export function toggleTheme(): "light" | "dark" {
  const isDark = document.documentElement.classList.contains("dark");
  if (isDark) {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("kai_theme", "light");
    windowStore.set({ theme: "light" });
    return "light";
  } else {
    document.documentElement.classList.add("dark");
    localStorage.setItem("kai_theme", "dark");
    windowStore.set({ theme: "dark" });
    return "dark";
  }
}

export function isDarkMode(): boolean {
  return windowStore.get().theme === "dark";
}
